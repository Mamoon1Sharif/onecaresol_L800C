ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS service_type TEXT;
CREATE INDEX IF NOT EXISTS medications_service_type_idx ON public.medications (care_receiver_id, service_type);