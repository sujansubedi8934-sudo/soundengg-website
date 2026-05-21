import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access: " + (authError?.message || "User not found") }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-account] Initiating secure account deletion for User ID: ${user.id}, Email: ${user.email}`);

    // Step 1: Wipe all synced database rows from user_configs associated with the active user.id
    const { error: configError } = await supabaseAdmin
      .from('user_configs')
      .delete()
      .eq('user_id', user.id);

    if (configError) {
      console.warn(`[delete-account] Note: Error while cleaning user_configs (could be table-empty or non-existent): ${configError.message}`);
    }

    // Step 2: Wipe the associated public.profiles row
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.warn(`[delete-account] Note: Error while cleaning public.profiles: ${profileError.message}`);
    }

    // Step 3: Delete user from Supabase auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new Error(`Failed to delete user from authentication base: ${deleteError.message}`);
    }

    console.log(`[delete-account] Successfully deleted all credentials and configurations for User ID: ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account successfully destroyed." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error(`[delete-account] Error occurred during process execution:`, err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred during account deletion" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
})
