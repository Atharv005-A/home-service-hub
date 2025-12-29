-- Tighten otp_codes RLS: remove overly-permissive public policy
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.otp_codes;

-- Keep RLS enabled (service role bypasses RLS; clients should have no direct access)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;