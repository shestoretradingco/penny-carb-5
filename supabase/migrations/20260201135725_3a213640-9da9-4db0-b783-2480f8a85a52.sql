-- Remove the RLS policy that allows cooks to view customer profiles
DROP POLICY IF EXISTS "Cooks can view customer profiles for assigned orders" ON public.profiles;