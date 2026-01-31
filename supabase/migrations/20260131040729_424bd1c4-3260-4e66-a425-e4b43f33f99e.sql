-- Fix existing users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'customer'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id) DO NOTHING;