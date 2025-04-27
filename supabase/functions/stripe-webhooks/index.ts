import { serve } from "https://deno.land/std/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
      apiVersion: "2023-08-16",
    })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const sig = req.headers.get("stripe-signature")!
    const body = await req.text()

    if (!sig) {
      console.error("❌ Lipsește header-ul stripe-signature")
      return new Response("Missing stripe-signature header", { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      )
    } catch (err) {
      console.error("❌ Verificarea semnăturii webhook-ului a eșuat:", err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`📣 Webhook primit: ${event.type}`)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        console.log("✅ Checkout completat:", session.id)
        
        // Extract customer from the session
        const customerId = session.customer
        const subscriptionId = session.subscription
        
        if (customerId && subscriptionId) {
          // Get customer data to find user_id
          const customer = await stripe.customers.retrieve(customerId.toString())
          
          if (customer && !customer.deleted) {
            const supabaseUserId = customer.metadata?.supabase_user_id
            
            if (supabaseUserId) {
              // Update user's subscription status
              const { error } = await supabase
                .from('subscriptions')
                .upsert({
                  user_id: supabaseUserId,
                  stripe_subscription_id: subscriptionId.toString(),
                  status: 'active',
                  created_at: new Date().toISOString()
                })
              
              if (error) {
                console.error("❌ Eroare la actualizarea abonamentului în baza de date:", error)
              } else {
                console.log("✅ Status abonament actualizat pentru utilizator:", supabaseUserId)
              }
            }
          }
        }
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object
        console.log("📦 Subscriere actualizată:", subscription.id)
        
        // Update subscription status in database
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error("❌ Eroare la actualizarea statusului abonamentului:", error)
        }
        break
      }
      case "invoice.paid":
        console.log("💰 Factură plătită:", event.data.object.id)
        break
      default:
        console.log(`🔔 Eveniment neacoperit: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    console.error("❌ Eroare neașteptată webhook:", err)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
