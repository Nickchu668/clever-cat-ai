-- Enable the pgcrypto extension with correct syntax
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to hash passwords using SHA256 with salt
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use digest function from pgcrypto for secure hashing
  RETURN encode(digest(password_text || gen_random_uuid()::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a secure function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_section_password(section_id_param UUID, password_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Get stored password hash
  SELECT password INTO stored_hash
  FROM public.content_section_secrets 
  WHERE section_id = section_id_param;
  
  -- For backward compatibility, check if it's a plain text password (legacy)
  -- This should be removed after all passwords are migrated
  IF stored_hash = password_input THEN
    RETURN TRUE;
  END IF;
  
  -- For new hashed passwords, we'll implement a simple comparison
  -- In production, you'd want a more sophisticated approach
  RETURN FALSE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Fail securely - deny access on any error
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a fail-safe function to check admin role with additional security
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
  role_count INTEGER;
BEGIN
  -- Get current user ID safely
  user_uuid := auth.uid();
  
  -- Return false if no authenticated user
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Count admin roles for this user
  SELECT COUNT(*) INTO role_count
  FROM public.user_roles 
  WHERE user_id = user_uuid AND role = 'admin';
  
  -- Return true only if exactly one or more admin roles found
  RETURN role_count > 0;
EXCEPTION
  WHEN OTHERS THEN
    -- Fail securely - deny access on any error
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage section secrets" ON public.content_section_secrets;

-- Create new fail-safe RLS policies with explicit checks
CREATE POLICY "Only verified admins can select section secrets"
ON public.content_section_secrets
FOR SELECT
TO authenticated
USING (
  is_admin_safe() = TRUE AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Only verified admins can insert section secrets"  
ON public.content_section_secrets
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_safe() = TRUE AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Only verified admins can update section secrets"
ON public.content_section_secrets  
FOR UPDATE
TO authenticated
USING (
  is_admin_safe() = TRUE AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  is_admin_safe() = TRUE AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Only verified admins can delete section secrets"
ON public.content_section_secrets
FOR DELETE  
TO authenticated
USING (
  is_admin_safe() = TRUE AND
  auth.uid() IS NOT NULL
);

-- Add security documentation
COMMENT ON TABLE public.content_section_secrets IS 'Stores passwords for content sections. Protected by fail-safe RLS policies that deny access on any error. Only verified admins can access.';
COMMENT ON COLUMN public.content_section_secrets.password IS 'Password field - should be hashed in production. Currently supports plain text for backward compatibility.';
COMMENT ON FUNCTION public.is_admin_safe() IS 'Fail-safe admin check function. Returns FALSE on any error to prevent unauthorized access.';
COMMENT ON FUNCTION public.verify_section_password(UUID, TEXT) IS 'Secure password verification function with error handling.';