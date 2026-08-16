import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Razorpay config
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_live_SsjbdTD8vcr6Hp";
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

// Lemon Squeezy config
const LEMONSQUEEZY_API_KEY = Deno.env.get("LEMONSQUEEZY_API_KEY") || "";
const LEMONSQUEEZY_STORE_ID = Deno.env.get("LEMONSQUEEZY_STORE_ID") || "";
const LEMONSQUEEZY_VARIANT_MONTHLY = Deno.env.get("LEMONSQUEEZY_VARIANT_MONTHLY") || "";
const LEMONSQUEEZY_VARIANT_YEARLY = Deno.env.get("LEMONSQUEEZY_VARIANT_YEARLY") || "";
const LEMONSQUEEZY_VARIANT_LIFETIME = Deno.env.get("LEMONSQUEEZY_VARIANT_LIFETIME") || "";

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
    const { action, plan, payment_id, order_id, signature, subscription_id, user_currency, provider } = body;

    // ==========================================
    // ACTION 1: INITIALIZE CHECKOUT (GENERATE SECURE IDs/URL)
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

      // --- PATH A: LEMON SQUEEZY (USD / INTERNATIONAL) ---
      if (isUSD) {
        const variantId = plan === "monthly" 
          ? LEMONSQUEEZY_VARIANT_MONTHLY 
          : plan === "yearly" 
            ? LEMONSQUEEZY_VARIANT_YEARLY 
            : LEMONSQUEEZY_VARIANT_LIFETIME;

        if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID || !variantId) {
          throw new Error("Lemon Squeezy credentials or variant IDs are not configured in environment variables.");
        }

        const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
          method: "POST",
          headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": `Bearer ${LEMONSQUEEZY_API_KEY}`
          },
          body: JSON.stringify({
            data: {
              type: "checkouts",
              attributes: {
                checkout_data: {
                  custom: {
                    user_id: user.id,
                    plan: plan
                  },
                  email: user.email || ""
                }
              },
              relationships: {
                store: {
                  data: {
                    type: "stores",
                    id: LEMONSQUEEZY_STORE_ID
                  }
                },
                variant: {
                  data: {
                    type: "variants",
                    id: variantId
                  }
                }
              }
            }
          })
        });

        const checkoutData = await response.json();
        if (!response.ok) {
          throw new Error(checkoutData.errors?.[0]?.detail || "Failed to create Lemon Squeezy checkout session.");
        }

        const checkoutUrl = checkoutData.data?.attributes?.url;
        return new Response(JSON.stringify({ success: true, checkout_url: checkoutUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- PATH B: RAZORPAY (INR / DOMESTIC) ---
      const offerId = Deno.env.get("RAZORPAY_OFFER_ID") || "offer_Sso2cR2Vk1F8HU";
      const lifetimeOfferId = Deno.env.get("RAZORPAY_LIFETIME_OFFER_ID") || "offer_SsmdVnR1qZlgCq";

      if (plan === "lifetime") {
        const amount = 349900; // ₹3,499 in Paise
        const currency = "INR";

        const orderBody: any = {
          amount: amount,
          currency: currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            user_id: user.id
          }
        };

        if (lifetimeOfferId && lifetimeOfferId.trim() !== "") {
          orderBody.offers = [lifetimeOfferId.trim()];
        }

        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
          },
          body: JSON.stringify(orderBody)
        });
        
        const orderData = await response.json();
        if (!response.ok) {
          throw new Error(orderData.error ? orderData.error.description : "Failed to create Razorpay order");
        }

        return new Response(JSON.stringify({ success: true, order_id: orderData.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        const planId = plan === "monthly"
          ? "plan_SsjtsdD4GW4rR7" // SoundEngg Pro Monthly Pass
          : "plan_SsjusefppDE8Lb";  // SoundEngg Pro Yearly Pass

        const totalCount = plan === "monthly" ? 120 : 10;

        const subscriptionBody: any = {
          plan_id: planId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            user_id: user.id
          }
        };

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
              ? `${subData.error.description}`
              : "Failed to create Razorpay subscription"
          );
        }

        return new Response(JSON.stringify({ success: true, subscription_id: subData.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // ACTION 2: VERIFY PAYMENT (SECURE HANDSHAKE/SYNC)
    // ==========================================
    if (action === "verify_payment") {
      // --- PATH A: LEMON SQUEEZY VERIFICATION (POLLING DB FOR PRO STATUS) ---
      if (provider === "lemonsqueezy" || user_currency === "USD") {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");
        const token = authHeader.replace("Bearer ", "");
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user) throw new Error("Unauthorized Access");

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("is_pro, subscription_tier")
          .eq("id", user.id)
          .maybeSingle();

        const isSuccess = !!profile?.is_pro && 
          (profile?.subscription_tier === plan || 
           profile?.subscription_tier === "lifetime" || 
           profile?.subscription_tier === "yearly" || 
           profile?.subscription_tier === "monthly");

        return new Response(JSON.stringify({ success: isSuccess }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- PATH B: RAZORPAY VERIFICATION (HMAC SIGNATURE COMPUTATION) ---
      if (!payment_id || (!order_id && !subscription_id) || !signature) {
        throw new Error("Missing required verification parameters.");
      }

      const dataToSign = order_id
        ? `${order_id}|${payment_id}`
        : `${payment_id}|${subscription_id}`;
        
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

      if (generatedSignature !== signature) {
        return new Response(JSON.stringify({ success: false, error: "Invalid payment signature verification failed." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );
      
      const authHeader = req.headers.get("Authorization")!;
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (!user) throw new Error("Unauthorized Access");

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
    // ACTION 3: CANCEL SUBSCRIPTION (GATEWAY DEACTIVATION)
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

      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("subscription_id, subscription_provider, is_pro, subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        throw new Error("Unable to retrieve profile details.");
      }

      if (!profile.subscription_id) {
        throw new Error("No active auto-renewing subscription found for cancellation.");
      }

      // --- PATH A: LEMON SQUEEZY SUBSCRIPTION CANCELLATION ---
      if (profile.subscription_provider === "lemonsqueezy") {
        if (!LEMONSQUEEZY_API_KEY) throw new Error("Lemon Squeezy API key not configured.");
        
        const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${profile.subscription_id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${LEMONSQUEEZY_API_KEY}`
          }
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.errors?.[0]?.detail || "Failed to cancel Lemon Squeezy subscription");
        }

        const endsAt = responseData.data?.attributes?.ends_at;
        const expiresAt = endsAt ? new Date(endsAt).toISOString() : new Date().toISOString();
        const isStillActive = new Date(expiresAt) > new Date();

        await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: isStillActive,
            subscription_tier: isStillActive ? profile.subscription_tier : null,
            subscription_provider: isStillActive ? "lemonsqueezy_cancelled" : "lemonsqueezy",
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        return new Response(JSON.stringify({ success: true, message: "Subscription cancelled successfully at end of cycle.", expires_at: expiresAt }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- PATH B: RAZORPAY SUBSCRIPTION CANCELLATION ---
      if (profile.subscription_provider !== "razorpay") {
        throw new Error("No active auto-renewing Razorpay subscription found for cancellation.");
      }

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
        if (responseData.error && (responseData.error.description.includes("cancelled") || responseData.error.description.includes("completed"))) {
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

