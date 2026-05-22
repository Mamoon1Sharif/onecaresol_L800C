ALTER TABLE public.care_givers
ADD COLUMN IF NOT EXISTS homead_lat double precision,
ADD COLUMN IF NOT EXISTS homead_long double precision,
ADD COLUMN IF NOT EXISTS homead_updated_at timestamp with time zone;

UPDATE public.care_givers
SET homead_lat = latitude,
    homead_long = longitude,
    homead_updated_at = location_updated_at
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;