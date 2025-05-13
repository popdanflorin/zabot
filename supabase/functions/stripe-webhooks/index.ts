import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"), {
  apiVersion: "2023-08-16"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
serve(async (req)=>{
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400
    });
  }
  switch(event.type){
    case "checkout.session.completed":
      const session = event.data.object;
      console.log("Checkout completat:", session.id);
      const { error, data } = await supabase.from("payments").update({
        status: "paid",
        amount: session.amount_total ?? null
      }).eq("stripe_session_id", session.id).select();
      if (error) {
        console.error("Eroare la update:", error.message);
      } else if (data.length === 0) {
        console.warn("Nu s-a găsit nicio plată pentru:", session.id);
      } else {
        console.log("Status actualizat pentru:", data[0].id);
      }
      break;
    case "customer.subscription.updated":
      console.log("Subscriere actualizată");
      break;
    case "invoice.paid":
      console.log("Factură plătită");
      break;
    default:
      console.log(`Eveniment neacoperit: ${event.type}`);
  }
  return new Response("ok", {
    status: 200
  });
});
