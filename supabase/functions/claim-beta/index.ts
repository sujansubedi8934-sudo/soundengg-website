import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

function generateRandomPassword(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length]
  }
  return password
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
    const { name, company, email, whatsapp } = await req.json();

    if (!name || !company || !email || !whatsapp) {
      return new Response(
        JSON.stringify({ error: "Missing required signup parameters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lowerEmail = email.trim().toLowerCase();
    const generatedPassword = generateRandomPassword(8);

    console.log(`[claim-beta] Processing registration for ${lowerEmail} (${name}) at ${company}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // 1. Check if user already exists in auth.users by listing users
    let existingUser = null;
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (listErr) {
      console.warn(`[claim-beta] Error listing users: ${listErr.message}`);
    } else if (users) {
      existingUser = users.find((u: any) => u.email?.toLowerCase() === lowerEmail);
    }

    let userId: string;

    if (existingUser) {
      console.log(`[claim-beta] User already exists in auth.users with ID: ${existingUser.id}. Updating password...`);
      userId = existingUser.id;

      // Update password of existing auth user
      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: generatedPassword
      });

      if (updateAuthErr) {
        throw new Error(`Failed to update existing user's credentials: ${updateAuthErr.message}`);
      }
    } else {
      console.log(`[claim-beta] Creating new auth account...`);
      // Create new auth user
      const { data: newAuthUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: lowerEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: name, company }
      });

      if (createAuthErr || !newAuthUser.user) {
        throw new Error(`Failed to create authentication credentials: ${createAuthErr?.message || "Unknown error"}`);
      }

      userId = newAuthUser.user.id;
    }

    // 2. Insert into palm_expo_leads. 
    // This will trigger the PostgreSQL function "process_palm_lead_and_upgrade" 
    // which automatically configures the database profiles table and sets is_pro = true for 30 days.
    const { error: dbErr } = await supabaseAdmin
      .from("palm_expo_leads")
      .insert([{
        name,
        company,
        email: lowerEmail,
        whatsapp
      }]);

    if (dbErr) {
      console.warn(`[claim-beta] Lead insertion warning (could be duplicate lead row): ${dbErr.message}`);
    }

    // 3. Send credentials to user via Brevo Transactional Email API
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.warn("[claim-beta] Warning: BREVO_API_KEY is not configured in Supabase secrets. Email sending skipped.");
    } else {
      console.log(`[claim-beta] Dispatching credentials welcome email via Brevo...`);
      const welcomeEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #03070a;
              color: #e2e8f0;
              margin: 0;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 40px auto;
              background-color: #070e14;
              border: 1px solid rgba(20, 167, 181, 0.25);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            }
            .header-banner {
              background: linear-gradient(135deg, #14a7b5 0%, #0c6a73 100%);
              padding: 30px 40px;
              text-align: center;
              border-bottom: 1px solid rgba(20, 167, 181, 0.15);
            }
            .header-banner h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
              color: #ffffff;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .content-body {
              padding: 40px;
            }
            .welcome-msg {
              font-size: 16px;
              line-height: 1.6;
              color: #94a3b8;
              margin-bottom: 30px;
            }
            .cred-card {
              background-color: #03070a;
              border: 1px dashed rgba(20, 167, 181, 0.4);
              border-radius: 8px;
              padding: 24px;
              margin-bottom: 30px;
            }
            .cred-title {
              font-family: monospace;
              font-size: 11px;
              letter-spacing: 2px;
              color: #14a7b5;
              text-transform: uppercase;
              margin-bottom: 12px;
              font-weight: 700;
            }
            .cred-row {
              font-size: 15px;
              margin-bottom: 10px;
              color: #f1f5f9;
            }
            .cred-row strong {
              color: #94a3b8;
            }
            .badge {
              display: inline-block;
              background-color: rgba(255, 153, 0, 0.1);
              border: 1px solid #ff9900;
              color: #ff9900;
              padding: 6px 14px;
              border-radius: 4px;
              font-size: 13px;
              font-family: monospace;
              margin-top: 10px;
              letter-spacing: 1px;
            }
            .cta-button {
              display: block;
              text-align: center;
              background: #14a7b5;
              color: #ffffff;
              text-decoration: none;
              font-weight: 600;
              padding: 14px 28px;
              border-radius: 6px;
              margin: 30px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
              font-size: 14px;
              box-shadow: 0 4px 14px rgba(20, 167, 181, 0.4);
            }
            .footer {
              padding: 30px 40px;
              background-color: #03070a;
              border-top: 1px solid rgba(255, 255, 255, 0.03);
              font-size: 12px;
              color: #475569;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header-banner">
              <h1>SoundEngg Beta Guild</h1>
            </div>
            <div class="content-body">
              <p style="font-size: 18px; color: #ffffff; font-weight: 600; margin-top: 0;">Hi ${name},</p>
              <p class="welcome-msg">
                Welcome to the SoundEngg Closed Beta Guild program! We have pre-created your account and activated your <strong>1-Month Free Pro Upgrade</strong> to give you full, unrestricted access to the complete suite of live audio calculations and tools.
              </p>
              
              <div class="cred-card">
                <div class="cred-title">[SIGN-IN CREDENTIALS]</div>
                <div class="cred-row"><strong>Email:</strong> ${lowerEmail}</div>
                <div class="cred-row"><strong>Password:</strong> <span style="font-family: monospace; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 3px; font-weight: bold; color: #14a7b5;">${generatedPassword}</span></div>
                <div class="badge">1-MONTH PRO ACTIVE</div>
              </div>

              <p class="welcome-msg" style="margin-bottom: 10px;">
                You can use these credentials to log in on either our web console or the official Android/iOS apps:
              </p>

              <a href="https://soundengg.com/app" class="cta-button" target="_blank">Launch Web Console</a>

              <p class="welcome-msg" style="font-size: 13px; margin-top: 20px;">
                *Note: You can update this temporary password at any time from the "Security" section inside your user profile.
              </p>
            </div>
            <div class="footer">
              &copy; 2026 SoundEngg Console. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;

      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "SoundEngg", email: "noreply@soundengg.com" },
          to: [{ email: lowerEmail, name: name }],
          subject: "Welcome to SoundEngg Closed Beta - Pro Account Ready!",
          htmlContent: welcomeEmailHtml
        })
      });

      if (!brevoResponse.ok) {
        const brevoErrBody = await brevoResponse.text();
        console.error(`[claim-beta] Brevo API rejected email send: ${brevoErrBody}`);
        throw new Error(`Brevo API Error: ${brevoErrBody}`);
      } else {
        console.log(`[claim-beta] Welcome credentials email dispatched successfully to ${lowerEmail}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Beta access pre-created. Check your inbox!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error(`[claim-beta] Execution failed:`, err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred during account creation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
})
