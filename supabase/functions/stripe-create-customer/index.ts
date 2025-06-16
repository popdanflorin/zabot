import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
serve(async (req)=>{
  const stripe = new Stripe(Deno.env.get("NEW_STRIPE_API_KEY"), {
    apiVersion: "2023-08-16"
  });
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { user } = await req.json();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      supabase_user_id: user.id
    }
  });
  return new Response(JSON.stringify({
    message: "Customer created",
    customer_id: customer.id
  }), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
});
