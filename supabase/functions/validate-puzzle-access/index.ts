import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json().catch(() => ({}));
    const requestedDifficulty = body.difficulty || "beginner";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Anonymous users can only access beginner
      const allowed = requestedDifficulty === "beginner";
      return new Response(JSON.stringify({ allowed, isPremium: false, anonymous: true, reason: allowed ? null : "premium_required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      const allowed = requestedDifficulty === "beginner";
      return new Response(JSON.stringify({ allowed, isPremium: false, anonymous: true, reason: allowed ? null : "premium_required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, current_difficulty")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPremium = profile?.is_premium === true;

    // Premium users can access everything
    if (isPremium) {
      return new Response(JSON.stringify({ allowed: true, isPremium: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free users can only access beginner
    const allowed = requestedDifficulty === "beginner";
    return new Response(JSON.stringify({
      allowed,
      isPremium: false,
      reason: allowed ? null : "premium_required",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[VALIDATE-PUZZLE-ACCESS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
