-- Explicitly deny all client access to otp_codes (service role bypasses RLS)
CREATE POLICY "Deny all access to otp_codes"
ON public.otp_codes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);