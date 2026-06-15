import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const LEMONSQUEEZY_WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") || "";

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-signature");
    if (!signature) {
      console.error("[Webhook] Missing x-signature header");
      return new Response(JSON.stringify({ success: false, error: "Missing signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const rawBody = await req.text();

    // Verify cryptographic HMAC-SHA256 signature using webhook secret
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(LEMONSQUEEZY_WEBHOOK_SECRET),
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
      console.error("[Webhook] Signature verification failed.");
      return new Response(JSON.stringify({ success: false, error: "Invalid signature verification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id;
    const plan = customData.plan || "lifetime";

    console.log(`[Webhook] Lemon Squeezy event: ${eventName} for user: ${userId}, plan: ${plan}`);

    if (!userId) {
      console.warn("[Webhook] Missing user_id in custom_data. Unable to route payment.");
      return new Response(JSON.stringify({ success: true, warning: "Missing user_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const dataObj = payload.data;
    const attributes = dataObj?.attributes || {};
    const subscriptionId = dataObj?.id?.toString();

    // --- CASE 1: ONE-TIME PURCHASE (LIFETIME ORDER CREATED) ---
    if (eventName === "order_created") {
      const status = attributes.status; // 'pending', 'failed', 'paid', 'refunded'
      if (status === "paid") {
        console.log(`[Webhook] Processing successful order for user: ${userId}`);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            subscription_tier: "lifetime",
            subscription_provider: "lemonsqueezy",
            subscription_id: subscriptionId || attributes.order_number?.toString() || "order_" + Date.now().toString().slice(-6),
            subscription_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) throw error;
      }
    }

    // --- CASE 2: SUBSCRIPTION EVENTS ---
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const status = attributes.status; // 'active', 'cancelled', 'on_trial', 'expired', 'past_due', 'unpaid'
      const renewsAt = attributes.renews_at; // Timestamp
      const endsAt = attributes.ends_at; // Timestamp if cancelled

      const isActive = status === "active" || status === "on_trial";
      const isCancelled = status === "cancelled";

      console.log(`[Webhook] Subscription status: ${status} for sub ID: ${subscriptionId}`);

      if (isActive) {
        const expiresAt = renewsAt ? new Date(renewsAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            subscription_tier: plan,
            subscription_provider: "lemonsqueezy",
            subscription_id: subscriptionId,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) throw error;
      } else if (isCancelled && endsAt) {
        // Keeps user active until paid cycle ends
        const expiresAt = new Date(endsAt).toISOString();
        const isStillActive = new Date(expiresAt) > new Date();

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: isStillActive,
            subscription_tier: isStillActive ? plan : null,
            subscription_provider: isStillActive ? "lemonsqueezy_cancelled" : "lemonsqueezy",
            subscription_id: subscriptionId,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) throw error;
      } else {
        // expired, unpaid, past_due
        console.log(`[Webhook] Deactivating subscription for user: ${userId} due to status: ${status}`);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: false,
            subscription_tier: null,
            subscription_expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) throw error;
      }
    }

    if (eventName === "subscription_cancelled") {
      const endsAt = attributes.ends_at;
      const expiresAt = endsAt ? new Date(endsAt).toISOString() : new Date().toISOString();
      const isStillActive = new Date(expiresAt) > new Date();

      console.log(`[Webhook] Subscription cancelled. Deactivation scheduled at: ${expiresAt}`);

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: isStillActive,
          subscription_tier: isStillActive ? plan : null,
          subscription_provider: isStillActive ? "lemonsqueezy_cancelled" : "lemonsqueezy",
          subscription_id: subscriptionId,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Webhook Error]:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
