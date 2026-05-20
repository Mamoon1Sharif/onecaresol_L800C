-- Step 2: Backfill and finalize company_id on shift_notes
-- Run this AFTER step1 has successfully completed.

-- Backfill using the DEFAULT company
UPDATE public.shift_notes
SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT')
WHERE company_id IS NULL;

ALTER TABLE public.shift_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();

CREATE INDEX IF NOT EXISTS shift_notes_company_id_idx ON public.shift_notes(company_id);
