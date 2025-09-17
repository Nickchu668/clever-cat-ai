-- Add bcrypt extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a secure function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password_text, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a secure function to verify passwords  
CREATE OR REPLACE FUNCTION public.verify_password(password_text TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN password_hash = crypt(password_text, password_hash);
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

-- Update RLS policy for content_section_secrets with fail-safe approach
DROP POLICY IF EXISTS "Admins can manage section secrets" ON public.content_section_secrets;

-- Create new fail-safe RLS policies
CREATE POLICY "Only verified admins can view section secrets"
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

-- Update existing plain text passwords to hashed versions (if any exist)
-- This is safe to run multiple times
UPDATE public.content_section_secrets 
SET password = hash_password(password)
WHERE password NOT LIKE '$2%'; -- Only update if not already hashed (bcrypt hashes start with $2)

-- Add a comment to document the security measures
COMMENT ON TABLE public.content_section_secrets IS 'Stores hashed passwords for content sections. Uses bcrypt hashing with salt rounds=12. Protected by fail-safe RLS policies that deny access on any error.';
COMMENT ON COLUMN public.content_section_secrets.password IS 'Bcrypt hashed password. Never store plain text passwords.';