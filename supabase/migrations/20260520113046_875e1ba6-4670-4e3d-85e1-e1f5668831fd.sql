ALTER TABLE public.daily_visits
  ADD COLUMN IF NOT EXISTS entry_code text,
  ADD COLUMN IF NOT EXISTS entry_code_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS alarm_code text,
  ADD COLUMN IF NOT EXISTS entry_instructions text,
  ADD COLUMN IF NOT EXISTS alarm_instructions text;