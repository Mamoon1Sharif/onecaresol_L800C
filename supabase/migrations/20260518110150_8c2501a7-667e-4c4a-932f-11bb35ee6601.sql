ALTER TABLE public.care_givers
  ADD COLUMN IF NOT EXISTS login_pin text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

ALTER TABLE public.care_givers
  ADD CONSTRAINT care_givers_login_pin_format CHECK (login_pin IS NULL OR login_pin ~ '^[0-9]{4}$');

ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS qr_code_value text;

CREATE INDEX IF NOT EXISTS idx_care_givers_login_pin ON public.care_givers(login_pin) WHERE login_pin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_care_receivers_qr_code_value ON public.care_receivers(qr_code_value) WHERE qr_code_value IS NOT NULL;