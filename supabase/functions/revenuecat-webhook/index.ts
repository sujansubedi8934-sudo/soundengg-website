import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const REVENUECAT_WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") || "";

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify RevenueCat Authorization header if configured in Supabase secrets
    if (REVENUECAT_WEBHOOK_AUTH) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const expected = REVENUECAT_WEBHOOK_AUTH.replace(/^Bearer\s+/i, "").trim();
      if (!safeCompare(token, expected)) {
        console.error("[RevenueCat Webhook] Invalid Authorization header");
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const body = await req.json();
    const event = body?.event;
    if (!event) {
      return new Response(JSON.stringify({ success: false, error: "Missing event object" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const eventType: string = event.type || "";
    const appUserId: string = event.app_user_id || "";
    const productId: string = (event.product_id || "").toLowerCase();
    const periodType: string = (event.period_type || "").toUpperCase(); // TRIAL, INTRO, NORMAL
    const store: string = (event.store || "").toUpperCase(); // APP_STORE, PLAY_STORE
    const purchasedAtMs: number | null = event.purchased_at_ms || null;
    const expirationAtMs: number | null = event.expiration_at_ms || null;

    console.log(`[RevenueCat Webhook] Event: ${eventType}, User: ${appUserId}, Product: ${productId}, Period: ${periodType}`);

    if (!appUserId || appUserId.startsWith("$RCAnonymousID")) {
      console.warn(`[RevenueCat Webhook] Ignoring anonymous or empty app_user_id: ${appUserId}`);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const provider = store === "PLAY_STORE" ? "google_play" : "apple_iap";
    let tier = "monthly";
    if (productId.includes("lifetime")) {
      tier = "lifetime";
    } else if (productId.includes("yearly") || productId.includes("annual")) {
      tier = "yearly";
    }

    const nowIso = new Date().toISOString();
    const purchasedIso = purchasedAtMs ? new Date(purchasedAtMs).toISOString() : nowIso;
    const expiresIso = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
    const isTrial = periodType === "TRIAL" || periodType === "INTRO";

    if (
      eventType === "INITIAL_PURCHASE" ||
      eventType === "RENEWAL" ||
      eventType === "UNCANCELLATION" ||
      eventType === "NON_RENEWING_PURCHASE" ||
      eventType === "PRODUCT_CHANGE"
    ) {
      const updateData: Record<string, any> = {
        is_pro: true,
        subscription_tier: tier,
        subscription_provider: provider,
        subscription_id: event.product_id || productId,
        subscription_status: isTrial ? "trialing" : "active",
        subscription_expires_at: tier === "lifetime" ? null : expiresIso,
        updated_at: nowIso
      };

      if (isTrial) {
        updateData.trial_started_at = purchasedIso;
        updateData.trial_expires_at = expiresIso;
        updateData.trial_ends_at = expiresIso;
        updateData.has_used_trial = true;
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", appUserId);

      if (error) throw error;

    } else if (eventType === "CANCELLATION") {
      // User turned off auto-renew, or received a refund. Keep access active if expirationAtMs is in the future.
      const isStillActive = expirationAtMs ? expirationAtMs > Date.now() : false;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: isStillActive,
          subscription_tier: isStillActive ? tier : "free",
          subscription_status: isStillActive ? "canceled" : "expired",
          subscription_expires_at: expiresIso || nowIso,
          updated_at: nowIso
        })
        .eq("id", appUserId);

      if (error) throw error;

    } else if (eventType === "EXPIRATION") {
      // Trial or subscription period ended without renewal — drop smoothly back to Free tier
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: false,
          subscription_tier: "free",
          subscription_status: "expired",
          subscription_expires_at: expiresIso || nowIso,
          updated_at: nowIso
        })
        .eq("id", appUserId);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[RevenueCat Webhook Error]:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
