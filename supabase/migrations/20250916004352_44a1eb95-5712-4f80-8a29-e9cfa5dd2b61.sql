-- Securely move section passwords to a separate table with strict RLS
-- and remove the password column from content_sections.

-- 1) Create secrets table (if not exists)
CREATE TABLE IF NOT EXISTS public.content_section_secrets (
  section_id uuid PRIMARY KEY REFERENCES public.content_sections(id) ON DELETE CASCADE,
  password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_section_secrets ENABLE ROW LEVEL SECURITY;

-- Clean up trigger if it existed from prior runs
DROP TRIGGER IF EXISTS update_content_section_secrets_updated_at ON public.content_section_secrets;

-- Timestamp trigger
CREATE TRIGGER update_content_section_secrets_updated_at
BEFORE UPDATE ON public.content_section_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policies: Only admins can access/modify secrets
DROP POLICY IF EXISTS "Admins can manage section secrets" ON public.content_section_secrets;
CREATE POLICY "Admins can manage section secrets"
ON public.content_section_secrets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Migrate existing data from content_sections.password
-- Insert or update into secrets from the current column if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_sections'
      AND column_name = 'password'
  ) THEN
    INSERT INTO public.content_section_secrets (section_id, password)
    SELECT id, password FROM public.content_sections
    ON CONFLICT (section_id) DO UPDATE SET password = EXCLUDED.password;
  END IF;
END $$;

-- 3) Remove the sensitive column from content_sections
ALTER TABLE public.content_sections DROP COLUMN IF EXISTS password;
