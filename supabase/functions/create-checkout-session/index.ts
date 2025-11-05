import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
const stripe = new Stripe(Deno.env.get("NEW_STRIPE_API_KEY"), {
  apiVersion: "2022-11-15"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const priceIds = {
  pro: "price_1SQ27XRr5lNKMugr0YJOHKVr",
  team: "price_1SQ29ERr5lNKMugrOlsrabsA"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
  let body;
  try {
    body = await req.json();
    console.log("Received body:", body);
  } catch (err) {
    console.error("Invalid JSON body:", err);
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
  const { user_id, plan, email } = body;
  if (!user_id || !priceIds[plan]) {
    return new Response(JSON.stringify({
      error: "Invalid input"
    }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card"
      ],
      mode: "subscription",
      line_items: [
        {
          price: priceIds[plan],
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          user_id,
          plan
        }
      },
      customer_email: email,
      success_url: "https://verbo.ro/success",
      cancel_url: "https://verbo.ro/cancel"
    });
    const planAmounts = {
      pro: 2000,
      team: 10000
    };
    const amount = planAmounts[plan];
    const { error } = await supabase.from("payments").insert({
      user_id,
      amount,
      currency: "eur",
      status: "pending",
      stripe_session_id: session.id
    });
    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({
        error: "Database insert error"
      }), {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
      });
    }
    return new Response(JSON.stringify({
      url: session.url
    }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({
      error: err.message || "Stripe session error"
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
});
