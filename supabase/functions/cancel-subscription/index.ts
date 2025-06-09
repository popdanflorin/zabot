import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"), {
  apiVersion: "2022-11-15"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
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
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  const { user_id } = body;
  if (!user_id) {
    return new Response(JSON.stringify({
      error: "User ID is required"
    }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  try {
    // Get the customer's subscription from the database
    const { data: subscription, error: subError } = await supabase.from("subscriptions").select("stripe_subscription_id").eq("user_id", user_id).single();
    if (subError || !subscription) {
      return new Response(JSON.stringify({
        error: "No active subscription found"
      }), {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    // Delete the subscription record from the database
    const { error: deleteTeamProError } = await supabase.from("subscriptions_teampro").delete().eq("subscription_id", subscription.stripe_subscription_id);
    const { error: deleteError } = await supabase.from("subscriptions").delete().eq("user_id", user_id);
    if (deleteError || deleteTeamProError) {
      console.error("Error deleting subscription record:", deleteError);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cancelled and deleted successfully"
    }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    return new Response(JSON.stringify({
      error: err.message || "Error cancelling subscription"
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
