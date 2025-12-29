import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  phone: string;
}

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendTwilioSms = async (to: string, body: string): Promise<boolean> => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Missing Twilio credentials");
    throw new Error("SMS service not configured. Please add Twilio credentials.");
  }

  console.log(`Sending SMS to ${to} from ${fromNumber}`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const credentials = btoa(`${accountSid}:${authToken}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Twilio error:", JSON.stringify(data));
    
    // Handle specific Twilio errors with user-friendly messages
    if (data.code === 21608 || data.message?.includes("unverified")) {
      throw new Error("This phone number needs to be verified in Twilio. For trial accounts, add your number at twilio.com/console/phone-numbers/verified");
    }
    if (data.code === 21211) {
      throw new Error("Invalid phone number format");
    }
    if (data.code === 21614) {
      throw new Error("This phone number cannot receive SMS");
    }
    
    throw new Error(data.message || "Failed to send SMS");
  }

  console.log("SMS sent successfully, SID:", data.sid);
  return true;
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: SendOtpRequest = await req.json();
    console.log("Received request to send OTP to:", phone);

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate phone format (should be E.164 format like +919876543210)
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use E.164 format (e.g., +919876543210)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry

    // Delete any existing unused OTPs for this phone
    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone", phone)
      .eq("is_used", false);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        phone,
        otp,
        expires_at: expiresAt,
        is_used: false,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to store OTP");
    }

    // Send SMS
    const message = `Your ServXpert verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    await sendTwilioSms(phone, message);

    console.log(`OTP sent successfully to ${phone}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        expiresIn: 300 // 5 minutes in seconds
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending OTP:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
