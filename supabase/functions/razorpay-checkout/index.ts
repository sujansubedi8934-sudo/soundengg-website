import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

serve(async (req) => {
  // CORS Preflight headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, plan, payment_id, order_id, signature, subscription_id, user_currency } = body;

    // ==========================================
    // ACTION 1: INITIALIZE CHECKOUT (GENERATE SECURE IDs)
    // ==========================================
    if (action === "create_checkout") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing Authorization header");
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (!user) throw new Error("Unauthorized Access");

      const isUSD = user_currency === "USD";
      
      if (plan === "lifetime") {
        // Secure backend-calculated pricing matrix to prevent client price spoofing
        const amount = isUSD ? 4999 : 349900; // $49.99 in cents vs ₹3,499 in Paise
        const currency = isUSD ? "USD" : "INR";

        // One-time Order Creation
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            receipt: `rcpt_${Date.now()}`,
            notes: {
              user_id: user.id
            }
          })
        });
        
        const orderData = await response.json();
        if (!response.ok) {
          throw new Error(orderData.error ? orderData.error.description : "Failed to create Razorpay order");
        }

        return new Response(JSON.stringify({ success: true, order_id: orderData.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        // Subscription Creation (Monthly/Yearly)
        // Checks if custom Plan IDs are configured in environment variables, else falls back to default values
        const planId = plan === "monthly"
          ? (Deno.env.get("RAZORPAY_PLAN_MONTHLY") || "plan_MONTHLY_PLAN_ID")
          : (Deno.env.get("RAZORPAY_PLAN_YEARLY") || "plan_YEARLY_PLAN_ID");

        const totalCount = plan === "monthly" ? 120 : 10; // 10 years max duration (120 months or 10 years)
        const offerId = Deno.env.get("RAZORPAY_OFFER_ID") || "";

        const subscriptionBody: any = {
          plan_id: planId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            user_id: user.id
          }
        };

        // Dynamically apply launch offer if configured in Supabase secrets
        if (offerId && offerId.trim() !== "") {
          subscriptionBody.offer_id = offerId.trim();
        }

        const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
          },
          body: JSON.stringify(subscriptionBody)
        });

        const subData = await response.json();
        if (!response.ok) {
          throw new Error(
            subData.error 
              ? `${subData.error.description} (To fix this, ensure you have created this Plan ID in your Razorpay Dashboard and injected it into Supabase secrets as RAZORPAY_PLAN_${plan.toUpperCase()})`
              : "Failed to create Razorpay subscription"
          );
        }

        return new Response(JSON.stringify({ success: true, subscription_id: subData.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // ACTION 2: VERIFY PAYMENT SIGNATURE (SECURE DB SYNC)
    // ==========================================
    if (action === "verify_payment") {
      if (!payment_id || (!order_id && !subscription_id) || !signature) {
        throw new Error("Missing required verification parameters.");
      }

      // 1. Calculate secure HMAC-SHA256 signature
      const dataToSign = order_id
        ? `${order_id}|${payment_id}`
        : `${subscription_id}|${payment_id}`;
        
      const encoder = new TextEncoder();
      const secretKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(RZP_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        secretKey,
        encoder.encode(dataToSign)
      );
      const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // 2. Authenticate signature matching
      if (generatedSignature !== signature) {
        return new Response(JSON.stringify({ success: false, error: "Invalid payment signature verification failed." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Update User Status in Database
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "" // Admin key to bypass RLS policies securely
      );
      
      const authHeader = req.headers.get("Authorization")!;
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (!user) throw new Error("Unauthorized Access");

      // Save Pro access tier in user's profile table row
      const expiresAt = (plan === 'lifetime') ? null : new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: true, 
          subscription_tier: plan,
          subscription_provider: 'razorpay',
          subscription_id: subscription_id || payment_id,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Subscription upgraded successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ACTION 3: CANCEL SUBSCRIPTION (SECURE REQ VIA GATEWAY)
    // ==========================================
    if (action === "cancel_subscription") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing Authorization header");
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (!user) throw new Error("Unauthorized Access");

      // Fetch user profile to check subscription ID and provider
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("subscription_id, subscription_provider, is_pro, subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        throw new Error("Unable to retrieve profile details.");
      }

      if (!profile.subscription_id || profile.subscription_provider !== "razorpay") {
        throw new Error("No active auto-renewing Razorpay subscription found for cancellation.");
      }

      // Call Razorpay API to cancel subscription at the end of the current cycle
      // If we cancel with cancel_at_cycle_end: 1, Razorpay will keep it active until the end of the paid duration!
      const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${profile.subscription_id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
        },
        body: JSON.stringify({
          cancel_at_cycle_end: 1
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        // If subscription is already cancelled or has error, handle gracefully
        if (responseData.error && (responseData.error.description.includes("cancelled") || responseData.error.description.includes("completed"))) {
          // Already cancelled, let's update profile just in case
          await supabaseAdmin
            .from("profiles")
            .update({ 
              is_pro: false,
              subscription_tier: null,
              subscription_expires_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", user.id);
          return new Response(JSON.stringify({ success: true, message: "Subscription already cancelled." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        throw new Error(responseData.error ? responseData.error.description : "Failed to cancel subscription in Razorpay");
      }

      // Update database profile
      // Note: Razorpay webhook subscription.cancelled will also capture and sync this,
      // but doing it synchronously here guarantees instant UI response and superior user experience!
      const currentEnd = responseData.current_end;
      const expiresAt = currentEnd ? new Date(currentEnd * 1000).toISOString() : new Date().toISOString();
      const isStillActive = new Date(expiresAt) > new Date();

      await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: isStillActive,
          subscription_tier: isStillActive ? profile.subscription_tier : null,
          subscription_provider: isStillActive ? "razorpay_cancelled" : "razorpay",
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, message: "Subscription cancelled successfully at end of cycle.", expires_at: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
