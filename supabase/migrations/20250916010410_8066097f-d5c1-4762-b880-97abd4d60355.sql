-- Add admin role to chufai668@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'chufai668@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;