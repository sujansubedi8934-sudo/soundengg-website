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
    const signature = (req.headers.get("x-signature") || req.headers.get("X-Signature") || "").trim();
    if (!signature) {
      console.error("[Webhook] Missing x-signature header");
      return new Response(JSON.stringify({ success: false, error: "Missing signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const rawBody = await req.text();
    const webhookSecret = (Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") || "").trim();

    console.log(`[Webhook] Incoming request. Secret loaded: ${!!webhookSecret} (len: ${webhookSecret.length}), Signature received (len: ${signature.length})`);

    if (!webhookSecret) {
      console.error("[Webhook] LEMONSQUEEZY_WEBHOOK_SECRET is empty in environment.");
      return new Response(JSON.stringify({ success: false, error: "Server configuration missing webhook secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify cryptographic HMAC-SHA256 signature using webhook secret
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
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

    const cleanSig = signature.toLowerCase();
    const cleanGen = generatedSignature.toLowerCase();

    if (!safeCompare(cleanGen, cleanSig)) {
      console.error(`[Webhook] Signature mismatch! Computed: ${cleanGen.slice(0, 10)}... Received: ${cleanSig.slice(0, 10)}...`);
      return new Response(JSON.stringify({ success: false, error: "Invalid signature verification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id;

    const dataObj = payload.data;
    const attributes = dataObj?.attributes || {};
    const subscriptionId = dataObj?.id?.toString();

    // Determine plan/tier accurately from metadata, product name, or event type
    const productName = (attributes.product_name || attributes.first_subscription_item?.product_name || "").toLowerCase();
    const variantName = (attributes.variant_name || "").toLowerCase();
    
    let resolvedTier = customData.plan;
    if (!resolvedTier) {
      if (productName.includes("month") || variantName.includes("month")) {
        resolvedTier = "monthly";
      } else if (productName.includes("year") || productName.includes("annual") || variantName.includes("year") || variantName.includes("annual")) {
        resolvedTier = "yearly";
      } else if (eventName.startsWith("subscription_")) {
        resolvedTier = "yearly";
      } else {
        resolvedTier = "lifetime";
      }
    }

    console.log(`[Webhook] Event: ${eventName}, user: ${userId}, resolvedTier: ${resolvedTier}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Fallback: If user_id wasn't in custom_data, resolve target user by customer email via auth.users & profiles
    let targetUserId = userId;
    const customerEmail = (attributes.user_email || attributes.customer_email || "").trim().toLowerCase();

    if (!targetUserId && customerEmail) {
      console.log(`[Webhook] Looking up user by email in auth.users: ${customerEmail}`);
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });
        if (authData?.users) {
          const userMatch = authData.users.find(u => u.email?.toLowerCase() === customerEmail);
          if (userMatch) {
            targetUserId = userMatch.id;
            console.log(`[Webhook] Successfully matched user ID ${targetUserId} in auth.users for email: ${customerEmail}`);
          }
        }
        if (authError) {
          console.warn("[Webhook] auth.admin.listUsers returned error:", authError.message);
        }
      } catch (authEx) {
        console.warn("[Webhook] Exception during auth.admin user lookup:", authEx);
      }

      if (!targetUserId) {
        try {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();
          if (profile?.id) {
            targetUserId = profile.id;
          }
        } catch (_) {}
      }
    }

    if (!targetUserId) {
      console.warn("[Webhook] Missing target user (no custom user_id or matching email). Unable to route payment.");
      return new Response(JSON.stringify({ success: true, warning: "Missing target user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const nowIso = new Date().toISOString();

    // --- CASE 1: ONE-TIME PURCHASE (LIFETIME ORDER CREATED) ---
    if (eventName === "order_created") {
      const status = attributes.status; // 'pending', 'failed', 'paid', 'refunded'
      if (status === "paid") {
        console.log(`[Webhook] Processing successful order for user: ${targetUserId}`);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            subscription_tier: "lifetime",
            subscription_provider: "lemonsqueezy",
            subscription_id: subscriptionId || attributes.order_number?.toString() || "order_" + Date.now().toString().slice(-6),
            subscription_status: "active",
            subscription_expires_at: null, // Lifetime must be null for check_subscription_expiry
            updated_at: nowIso
          })
          .eq("id", targetUserId);

        if (error) {
          console.error("[Webhook Order Error]:", error);
          throw error;
        }
      }
    }

    // --- CASE 2: SUBSCRIPTION EVENTS ---
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const status = attributes.status; // 'active', 'cancelled', 'on_trial', 'expired', 'past_due', 'unpaid'
      const renewsAt = attributes.renews_at; // Timestamp
      const endsAt = attributes.ends_at; // Timestamp if cancelled

      const isActive = status === "active" || status === "on_trial";
      const isCancelled = status === "cancelled";

      console.log(`[Webhook] Subscription status: ${status} for sub ID: ${subscriptionId}, user: ${targetUserId}, tier: ${resolvedTier}`);

      if (isActive) {
        // Fallback default: 365 days if yearly, 30 days if monthly
        const defaultDays = (resolvedTier === "monthly") ? 30 : 365;
        const expiresAt = renewsAt ? new Date(renewsAt).toISOString() : new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000).toISOString();
        
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            subscription_tier: resolvedTier,
            subscription_provider: "lemonsqueezy",
            subscription_id: subscriptionId,
            subscription_status: (status === "on_trial" || status === "trialing") ? "trialing" : "active",
            subscription_expires_at: expiresAt, // Subscription must have non-null expiry date
            updated_at: nowIso
          })
          .eq("id", targetUserId);

        if (error) {
          console.error("[Webhook Subscription Active Error]:", error);
          throw error;
        }
      } else if (isCancelled && endsAt) {
        // Keeps user active until paid cycle ends
        const expiresAt = new Date(endsAt).toISOString();
        const isStillActive = new Date(expiresAt) > new Date();

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: isStillActive,
            subscription_tier: isStillActive ? resolvedTier : "free",
            subscription_provider: isStillActive ? "lemonsqueezy_cancelled" : "lemonsqueezy",
            subscription_id: subscriptionId,
            subscription_status: isStillActive ? "active" : "cancelled",
            subscription_expires_at: expiresAt,
            updated_at: nowIso
          })
          .eq("id", targetUserId);

        if (error) {
          console.error("[Webhook Subscription Cancelled Error]:", error);
          throw error;
        }
      } else {
        // expired, unpaid, past_due
        console.log(`[Webhook] Deactivating subscription for user: ${targetUserId} due to status: ${status}`);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: false,
            subscription_tier: "free",
            subscription_status: "expired",
            subscription_expires_at: nowIso,
            updated_at: nowIso
          })
          .eq("id", targetUserId);

        if (error) {
          console.error("[Webhook Subscription Deactivate Error]:", error);
          throw error;
        }
      }
    }

    if (eventName === "subscription_cancelled") {
      const endsAt = attributes.ends_at;
      const expiresAt = endsAt ? new Date(endsAt).toISOString() : nowIso;
      const isStillActive = new Date(expiresAt) > new Date();

      console.log(`[Webhook] Subscription cancelled. Scheduled until: ${expiresAt} for user: ${targetUserId}`);

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: isStillActive,
          subscription_tier: isStillActive ? resolvedTier : "free",
          subscription_provider: isStillActive ? "lemonsqueezy_cancelled" : "lemonsqueezy",
          subscription_id: subscriptionId,
          subscription_status: isStillActive ? "active" : "cancelled",
          subscription_expires_at: expiresAt,
          updated_at: nowIso
        })
        .eq("id", targetUserId);

      if (error) {
        console.error("[Webhook Event Cancelled Error]:", error);
        throw error;
      }
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
