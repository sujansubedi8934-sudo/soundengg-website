import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const RZP_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "";

// Constant-time comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      console.error("Missing x-razorpay-signature header");
      return new Response(JSON.stringify({ success: false, error: "Missing signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const rawBody = await req.text();

    // Verify cryptographic HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RZP_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(rawBody)
    );
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (!safeCompare(generatedSignature, signature)) {
      console.error("Signature verification failed.");
      return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const { event, payload: eventPayload } = payload;
    
    console.log(`[Webhook] Verified event received: ${event}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    if (event.startsWith("subscription.")) {
      const subscription = eventPayload.subscription.entity;
      const subscriptionId = subscription.id;
      const userId = subscription.notes?.user_id;

      let profileId = userId;

      // Fallback: If notes don't contain user_id, search database by subscription_id
      if (!profileId) {
        console.log(`[Webhook] Missing user_id in notes. Searching profiles by subscription_id: ${subscriptionId}`);
        const { data: profile, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("subscription_id", subscriptionId)
          .maybeSingle();

        if (error) {
          console.error(`[Webhook] Database search error:`, error);
        } else if (profile) {
          profileId = profile.id;
        }
      }

      if (!profileId) {
        console.warn(`[Webhook] Unmappable subscription event. No user profile found for sub ID: ${subscriptionId}`);
        return new Response(JSON.stringify({ success: false, error: "Unmappable subscription" }), {
          status: 200, // Respond 200 to acknowledge receipt to Razorpay
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const planId = subscription.plan_id;
      let tier = "monthly";
      if (planId === Deno.env.get("RAZORPAY_PLAN_YEARLY") || planId === Deno.env.get("RAZORPAY_PLAN_YEARLY_USD")) {
        tier = "yearly";
      }

      if (event === "subscription.charged") {
        // Expiry timestamp
        const expiryUnix = subscription.current_end;
        const expiresAt = expiryUnix ? new Date(expiryUnix * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        console.log(`[Webhook] Processing subscription.charged for user: ${profileId}, tier: ${tier}, expiresAt: ${expiresAt}`);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            subscription_tier: tier,
            subscription_provider: "razorpay",
            subscription_id: subscriptionId,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", profileId);

        if (error) throw error;

      } else if (event === "subscription.halted" || event === "subscription.completed") {
        console.log(`[Webhook] Processing ${event} (Immediate cancellation) for user: ${profileId}`);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: false,
            subscription_tier: null,
            subscription_expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", profileId);

        if (error) throw error;

      } else if (event === "subscription.cancelled") {
        // Razorpay cancelation can occur immediately or at the end of the paid cycle.
        const expiryUnix = subscription.current_end;
        const expiresAt = expiryUnix ? new Date(expiryUnix * 1000).toISOString() : new Date().toISOString();
        
        console.log(`[Webhook] Processing subscription.cancelled for user: ${profileId}. Keeping active until current cycle ends: ${expiresAt}`);

        // Keep is_pro true until the cycle naturally expires
        const isStillActive = new Date(expiresAt) > new Date();

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: isStillActive,
            subscription_tier: isStillActive ? tier : null,
            subscription_provider: isStillActive ? "razorpay_cancelled" : "razorpay",
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", profileId);

        if (error) throw error;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(`[Webhook Error]:`, err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
