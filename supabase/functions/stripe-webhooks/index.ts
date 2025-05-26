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
      {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer;
        const status = subscription.status;
        const periodEnd = subscription.current_period_end;
        const price = subscription.items.data[0]?.price;
        const priceId = price?.id ?? null;
        const planName = price?.lookup_key ?? null;
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          console.warn("⚠️ Lipsă user_id în metadata pentru subscription:", subscriptionId);
          break;
        }
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          plan_name: planName,
          status: status,
          current_period_end: new Date(periodEnd * 1000).toISOString()
        }, {
          onConflict: "stripe_subscription_id"
        });
        if (error) {
          console.error("❌ Eroare la upsert în subscriptions:", error.message);
        } else {
          console.log("✅ Subscription sincronizat:", subscriptionId);
        }
        break;
      }
    case "invoice.paid":
      {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        const line = invoice.lines?.data?.[0];
        const periodEnd = line?.period?.end;
        const periodEndDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
        const priceId = line?.price?.id ?? null;
        const planName = line?.price?.lookup_key ?? null;
        const userId = invoice.lines?.data?.[0]?.metadata?.user_id ?? invoice.metadata?.user_id;
        if (!userId) {
          console.warn("⚠️ Lipsă user_id în metadata pentru invoice:", invoice.id);
          break;
        }
        const { data, error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          plan_name: planName,
          status: "active",
          current_period_end: periodEndDate
        }, {
          onConflict: "stripe_subscription_id"
        }).select();
        if (error) {
          console.error("❌ Eroare la upsert în subscriptions (invoice):", error.message);
        } else {
          console.log("✅ Subscription actualizat din invoice.paid:", subscriptionId);
        }
        break;
      }
  }
  return new Response("ok", {
    status: 200
  });
});
