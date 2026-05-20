-- Step 1: Add company_id column to shift_notes only
-- Run this file BY ITSELF (single run) before any other migration that touches shift_notes.

ALTER TABLE public.shift_notes ADD COLUMN IF NOT EXISTS company_id uuid;
