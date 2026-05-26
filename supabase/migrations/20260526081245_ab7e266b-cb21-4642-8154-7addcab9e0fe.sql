
-- 1) Tenant-scope reminder_templates
ALTER TABLE public.reminder_templates ALTER COLUMN company_id SET DEFAULT current_company_id();
UPDATE public.reminder_templates SET company_id = current_company_id() WHERE company_id IS NULL AND current_company_id() IS NOT NULL;

DROP POLICY IF EXISTS "Authenticated can delete reminder templates" ON public.reminder_templates;
DROP POLICY IF EXISTS "Authenticated can insert reminder templates" ON public.reminder_templates;
DROP POLICY IF EXISTS "Authenticated can update reminder templates" ON public.reminder_templates;
DROP POLICY IF EXISTS "Authenticated can view reminder templates" ON public.reminder_templates;

CREATE POLICY "tenant_select" ON public.reminder_templates FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR company_id IS NULL OR is_super_admin());
CREATE POLICY "tenant_insert" ON public.reminder_templates FOR INSERT TO authenticated
  WITH CHECK ((company_id = current_company_id() AND current_company_id() IS NOT NULL) OR is_super_admin());
CREATE POLICY "tenant_update" ON public.reminder_templates FOR UPDATE TO authenticated
  USING (company_id = current_company_id() OR is_super_admin())
  WITH CHECK (company_id = current_company_id() OR is_super_admin());
CREATE POLICY "tenant_delete" ON public.reminder_templates FOR DELETE TO authenticated
  USING (company_id = current_company_id() OR is_super_admin());

-- 2) Storage INSERT ownership for private buckets
DROP POLICY IF EXISTS "caregiver_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "service_user_documents_insert" ON storage.objects;

CREATE POLICY "caregiver_documents_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'caregiver-documents'
    AND EXISTS (
      SELECT 1 FROM public.caregiver_documents d
      WHERE d.storage_path = storage.objects.name
        AND d.company_id = current_company_id()
    )
  );

CREATE POLICY "service_user_documents_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'service-user-documents'
    AND EXISTS (
      SELECT 1 FROM public.receiver_documents d
      WHERE d.storage_path = storage.objects.name
        AND d.company_id = current_company_id()
    )
  );

-- 3) Realtime channel authorization — restrict subscriptions to topics scoped to user's company
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_realtime_read" ON realtime.messages;
CREATE POLICY "tenant_realtime_read"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_visits v
      WHERE realtime.topic() = 'shift_tasks:' || v.id::text
        AND v.company_id = public.current_company_id()
    )
  );
