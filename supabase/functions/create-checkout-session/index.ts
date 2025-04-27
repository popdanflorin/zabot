import { serve } from "https://deno.land/std/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const ALLOWED_ORIGIN = "*"
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
}

serve(async (req) => {
  try {
    // 🔁 Preflight OPTIONS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Verify environment variables
    const stripeApiKey = Deno.env.get("STRIPE_API_KEY")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if (!stripeApiKey) {
      console.error("❌ Missing STRIPE_API_KEY environment variable")
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Stripe API key" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables")
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    const stripe = new Stripe(stripeApiKey, {
      apiVersion: "2023-08-16",
    })

    // Check for auth header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      console.error("❌ No Authorization header present")
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })


    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("❌ Auth error:", userError)
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: userError }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    if (!user) {
      console.error("❌ No user found with provided token")
      return new Response(
        JSON.stringify({ error: "No user found" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    console.log("👤 Authenticated user:", user.email)

    try {
      // Parse request body
      const requestData = await req.json()
      const { priceId } = requestData
      
      if (!priceId) {
        console.error("❌ Missing priceId in request body")
        return new Response(
          JSON.stringify({ error: "Missing priceId parameter" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      }

      console.log(`🔍 Looking up customer for email: ${user.email}`)
      
      // Find existing Stripe customer
      const { data: customerData, error: customerError } = await supabase
        .from("stripe_customers")
        .select("attrs")
        .eq("attrs->>email", user.email)
        .single()

      if (customerError) {
        console.error("❌ Customer lookup error:", customerError)
        
        // Create customer if not found (PGRST116 = record not found)
        if (customerError.code === "PGRST116") {
          console.log("🆕 Customer not found, creating new one...")
          
          // Create customer in Stripe
          let customer
          try {
            customer = await stripe.customers.create({
              email: user.email,
              metadata: {
                supabase_user_id: user.id,
              },
            })
            console.log("✅ Stripe customer created:", customer.id)
          } catch (stripeError) {
            console.error("❌ Stripe customer creation error:", stripeError)
            return new Response(
              JSON.stringify({ error: "Failed to create Stripe customer", details: stripeError.message }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            )
          }
          
          // Store customer in database
          const { error: insertError } = await supabase
            .from("stripe_customers")
            .insert({ 
              user_id: user.id,
              attrs: { 
                id: customer.id, 
                email: user.email 
              }
            })
          
          if (insertError) {
            console.error("❌ Customer insert error:", insertError)
            return new Response(
              JSON.stringify({ error: "Failed to create customer record", details: insertError }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            )
          }
          
          // Create checkout session
          try {
            const session = await stripe.checkout.sessions.create({
              customer: customer.id,
              mode: "subscription",
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: "https://popdanflorin.github.io/zabot/success",
              cancel_url: "https://popdanflorin.github.io/zabot/cancel",
            })
            
            console.log("✅ Checkout session created:", session.id)
            return new Response(
              JSON.stringify({ url: session.url }),
              {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            )
          } catch (checkoutError) {
            console.error("❌ Checkout session creation error:", checkoutError)
            return new Response(
              JSON.stringify({ error: "Failed to create checkout session", details: checkoutError.message }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            )
          }
        }
        
        // Handle other customer lookup errors
        return new Response(
          JSON.stringify({ error: "Customer lookup failed", details: customerError }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      }

      if (!customerData || !customerData.attrs || !customerData.attrs.id) {
        console.error("❌ Invalid customer data:", customerData)
        return new Response(
          JSON.stringify({ error: "Invalid customer data" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      }

      const stripeCustomerId = customerData.attrs.id
      console.log("💳 Stripe customer ID:", stripeCustomerId)

      // Create checkout session for existing customer
      try {
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: "https://popdanflorin.github.io/zabot/success",
          cancel_url: "https://popdanflorin.github.io/zabot/cancel",
        })

        console.log("✅ Checkout session created:", session.id)
        return new Response(
          JSON.stringify({ url: session.url }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      } catch (checkoutError) {
        console.error("❌ Checkout session creation error:", checkoutError)
        return new Response(
          JSON.stringify({ error: "Failed to create checkout session", details: checkoutError.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      }
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError)
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
