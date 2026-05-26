
CREATE OR REPLACE FUNCTION public.get_company_user_sessions()
RETURNS TABLE (user_id uuid, last_sign_in_at timestamptz, is_logged_in boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    cu.user_id,
    u.last_sign_in_at,
    EXISTS (
      SELECT 1 FROM auth.sessions s
      WHERE s.user_id = cu.user_id
        AND (s.not_after IS NULL OR s.not_after > now())
    ) AS is_logged_in
  FROM public.company_users cu
  JOIN auth.users u ON u.id = cu.user_id
  WHERE cu.company_id = public.current_company_id()
     OR public.is_super_admin();
$$;

GRANT EXECUTE ON FUNCTION public.get_company_user_sessions() TO authenticated;
