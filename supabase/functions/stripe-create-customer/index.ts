import { serve } from "https://deno.land/std/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const ALLOWED_ORIGIN = "*"
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
      apiVersion: "2023-08-16",
    })

    const supabase = createClient(
        Deno.env.get("MY_SUPABASE_URL")!,
        Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { user } = await req.json()

    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    const { error } = await supabase
      .from("stripe_customers")
      .insert({
        user_id: user.id,
        attrs: customer,
      })

    if (error) {
      throw new Error(`Failed to store customer: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ message: "Customer created", customer_id: customer.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    )
  }
})
