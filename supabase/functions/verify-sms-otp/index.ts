import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp }: VerifyOtpRequest = await req.json();
    console.log("Verifying OTP for phone:", phone);

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the most recent unused OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "No OTP found. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      console.log("Invalid OTP provided");
      return new Response(
        JSON.stringify({ error: "Invalid OTP. Please try again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    // Check if user exists with this phone
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    const existingUser = users?.find(u => u.phone === phone);
    let userId: string;
    let isNewUser = false;
    let accessToken: string | null = null;

    if (existingUser) {
      console.log("Existing user found:", existingUser.id);
      userId = existingUser.id;
      
      // Generate a magic link to create session
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingUser.email || `phone_${phone.replace(/\+/g, "")}@servxpert.app`,
      });
      
      if (!linkError && linkData) {
        // Extract token from the link
        const url = new URL(linkData.properties.action_link);
        accessToken = url.searchParams.get("token");
      }
    } else {
      console.log("Creating new user for phone:", phone);
      
      // Create new user with phone
      const tempEmail = `phone_${phone.replace(/\+/g, "")}@servxpert.app`;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
        email: tempEmail,
        email_confirm: true,
        user_metadata: { 
          phone,
          phone_verified: true 
        }
      });
      
      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }
      
      userId = newUser.user.id;
      isNewUser = true;

      // Generate magic link for new user
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: tempEmail,
      });
      
      if (linkData?.properties?.action_link) {
        const url = new URL(linkData.properties.action_link);
        accessToken = url.searchParams.get("token");
      }
    }

    console.log(`OTP verified for ${phone}, userId: ${userId}, isNewUser: ${isNewUser}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        userId,
        isNewUser,
        accessToken,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error verifying OTP:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
