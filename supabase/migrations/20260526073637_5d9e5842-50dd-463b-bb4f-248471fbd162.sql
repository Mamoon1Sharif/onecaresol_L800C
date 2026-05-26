
-- 1. Enable RLS on tables that have policies but RLS off
ALTER TABLE public.care_givers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_management_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiver_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly permissive / public policies
DROP POLICY IF EXISTS "Caregiver Holiday Insert" ON public.caregiver_holidays;
DROP POLICY IF EXISTS "Caregiver Holiday Select" ON public.caregiver_holidays;

DROP POLICY IF EXISTS "Wide Open Insert" ON public.shift_notes;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.shift_notes;

DROP POLICY IF EXISTS "Allow insert for all" ON public.shift_task_medician;
DROP POLICY IF EXISTS "Allow select for all" ON public.shift_task_medician;
DROP POLICY IF EXISTS "Allow update for all" ON public.shift_task_medician;

DROP POLICY IF EXISTS "Allow anonymous inserts with company_id" ON public.shift_tasks;

DROP POLICY IF EXISTS "Allow caregivers to insert visit notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Allow caregivers to view visit notes" ON public.visit_notes;

-- 3. Make current_company_id deterministic
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC, company_id ASC
  LIMIT 1
$$;

-- 4. Set search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 5. Tenant-scope private storage buckets
DROP POLICY IF EXISTS "Auth delete caregiver-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert caregiver-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth read caregiver-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth update caregiver-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete service-user-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert service-user-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth read service-user-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth update service-user-documents" ON storage.objects;

-- caregiver-documents: only same-company users can access
CREATE POLICY "Tenant read caregiver-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'caregiver-documents'
  AND (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.caregiver_documents d
      WHERE d.storage_path = storage.objects.name
        AND d.company_id = public.current_company_id()
    )
  )
);

CREATE POLICY "Tenant insert caregiver-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'caregiver-documents'
  AND public.current_company_id() IS NOT NULL
);

CREATE POLICY "Tenant update caregiver-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'caregiver-documents'
  AND EXISTS (
    SELECT 1 FROM public.caregiver_documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.current_company_id()
  )
);

CREATE POLICY "Tenant delete caregiver-documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'caregiver-documents'
  AND EXISTS (
    SELECT 1 FROM public.caregiver_documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.current_company_id()
  )
);

-- service-user-documents
CREATE POLICY "Tenant read service-user-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-user-documents'
  AND (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.receiver_documents d
      WHERE d.storage_path = storage.objects.name
        AND d.company_id = public.current_company_id()
    )
  )
);

CREATE POLICY "Tenant insert service-user-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-user-documents'
  AND public.current_company_id() IS NOT NULL
);

CREATE POLICY "Tenant update service-user-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'service-user-documents'
  AND EXISTS (
    SELECT 1 FROM public.receiver_documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.current_company_id()
  )
);

CREATE POLICY "Tenant delete service-user-documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'service-user-documents'
  AND EXISTS (
    SELECT 1 FROM public.receiver_documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.current_company_id()
  )
);
