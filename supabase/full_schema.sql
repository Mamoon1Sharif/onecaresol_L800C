-- Consolidated Supabase schema for onecaresol
-- Generated from supabase/migrations in timestamp order
-- Run this file in a fresh database to create all tables, indexes, functions, and RLS setup

-- migration: supabase/migrations/20260414112729_68eda815-566a-4cfe-8f80-c6031b9e9309.sql

-- Care Givers
CREATE TABLE public.care_givers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  skills TEXT[] DEFAULT '{}',
  last_check_in TEXT DEFAULT 'Never',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_givers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read care_givers" ON public.care_givers FOR SELECT USING (true);
CREATE POLICY "Public insert care_givers" ON public.care_givers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update care_givers" ON public.care_givers FOR UPDATE USING (true);
CREATE POLICY "Public delete care_givers" ON public.care_givers FOR DELETE USING (true);

-- Care Receivers
CREATE TABLE public.care_receivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  address TEXT,
  next_of_kin TEXT,
  next_of_kin_phone TEXT,
  care_status TEXT NOT NULL DEFAULT 'Active',
  care_plan TEXT DEFAULT '',
  dnacpr BOOLEAN NOT NULL DEFAULT false,
  care_type TEXT NOT NULL DEFAULT '8h-morning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_receivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read care_receivers" ON public.care_receivers FOR SELECT USING (true);
CREATE POLICY "Public insert care_receivers" ON public.care_receivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update care_receivers" ON public.care_receivers FOR UPDATE USING (true);
CREATE POLICY "Public delete care_receivers" ON public.care_receivers FOR DELETE USING (true);

-- Medications
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  administered_by TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read medications" ON public.medications FOR SELECT USING (true);
CREATE POLICY "Public insert medications" ON public.medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update medications" ON public.medications FOR UPDATE USING (true);
CREATE POLICY "Public delete medications" ON public.medications FOR DELETE USING (true);

-- Visit Notes
CREATE TABLE public.visit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  caregiver TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read visit_notes" ON public.visit_notes FOR SELECT USING (true);
CREATE POLICY "Public insert visit_notes" ON public.visit_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update visit_notes" ON public.visit_notes FOR UPDATE USING (true);
CREATE POLICY "Public delete visit_notes" ON public.visit_notes FOR DELETE USING (true);

-- Risk Assessments
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Low',
  mitigations TEXT DEFAULT '',
  last_reviewed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read risk_assessments" ON public.risk_assessments FOR SELECT USING (true);
CREATE POLICY "Public insert risk_assessments" ON public.risk_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update risk_assessments" ON public.risk_assessments FOR UPDATE USING (true);
CREATE POLICY "Public delete risk_assessments" ON public.risk_assessments FOR DELETE USING (true);

-- Health Goals
CREATE TABLE public.health_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read health_goals" ON public.health_goals FOR SELECT USING (true);
CREATE POLICY "Public insert health_goals" ON public.health_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update health_goals" ON public.health_goals FOR UPDATE USING (true);
CREATE POLICY "Public delete health_goals" ON public.health_goals FOR DELETE USING (true);

-- Shifts (Weekly Roster)
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID REFERENCES public.care_givers(id) ON DELETE SET NULL,
  care_receiver_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  day INTEGER NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL DEFAULT '07:00',
  end_time TEXT NOT NULL DEFAULT '14:00',
  shift_type TEXT NOT NULL DEFAULT 'Morning',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Public insert shifts" ON public.shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update shifts" ON public.shifts FOR UPDATE USING (true);
CREATE POLICY "Public delete shifts" ON public.shifts FOR DELETE USING (true);

-- Daily Visits (Daily Roster)
CREATE TABLE public.daily_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  care_giver_id UUID REFERENCES public.care_givers(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_hour INTEGER NOT NULL DEFAULT 8,
  duration INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read daily_visits" ON public.daily_visits FOR SELECT USING (true);
CREATE POLICY "Public insert daily_visits" ON public.daily_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update daily_visits" ON public.daily_visits FOR UPDATE USING (true);
CREATE POLICY "Public delete daily_visits" ON public.daily_visits FOR DELETE USING (true);

-- Dashboard Visits (Live Monitor)
CREATE TABLE public.dashboard_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver TEXT NOT NULL,
  assigned_member TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  check_in_status TEXT NOT NULL DEFAULT 'Not Arrived',
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dashboard_visits" ON public.dashboard_visits FOR SELECT USING (true);
CREATE POLICY "Public insert dashboard_visits" ON public.dashboard_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dashboard_visits" ON public.dashboard_visits FOR UPDATE USING (true);
CREATE POLICY "Public delete dashboard_visits" ON public.dashboard_visits FOR DELETE USING (true);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_care_givers_updated_at BEFORE UPDATE ON public.care_givers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_receivers_updated_at BEFORE UPDATE ON public.care_receivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_visits_updated_at BEFORE UPDATE ON public.daily_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dashboard_visits and daily_visits
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_visits;

-- migration: supabase/migrations/20260414113807_4459b403-b709-4f21-ac61-0475202bbd82.sql

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop all permissive public policies and replace with authenticated-only

-- care_givers
DROP POLICY IF EXISTS "Public read care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public insert care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public update care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public delete care_givers" ON public.care_givers;
CREATE POLICY "Auth read care_givers" ON public.care_givers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert care_givers" ON public.care_givers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update care_givers" ON public.care_givers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete care_givers" ON public.care_givers FOR DELETE TO authenticated USING (true);

-- care_receivers
DROP POLICY IF EXISTS "Public read care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public insert care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public update care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public delete care_receivers" ON public.care_receivers;
CREATE POLICY "Auth read care_receivers" ON public.care_receivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert care_receivers" ON public.care_receivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update care_receivers" ON public.care_receivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete care_receivers" ON public.care_receivers FOR DELETE TO authenticated USING (true);

-- medications
DROP POLICY IF EXISTS "Public read medications" ON public.medications;
DROP POLICY IF EXISTS "Public insert medications" ON public.medications;
DROP POLICY IF EXISTS "Public update medications" ON public.medications;
DROP POLICY IF EXISTS "Public delete medications" ON public.medications;
CREATE POLICY "Auth read medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update medications" ON public.medications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete medications" ON public.medications FOR DELETE TO authenticated USING (true);

-- visit_notes
DROP POLICY IF EXISTS "Public read visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public insert visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public update visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public delete visit_notes" ON public.visit_notes;
CREATE POLICY "Auth read visit_notes" ON public.visit_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert visit_notes" ON public.visit_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update visit_notes" ON public.visit_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete visit_notes" ON public.visit_notes FOR DELETE TO authenticated USING (true);

-- risk_assessments
DROP POLICY IF EXISTS "Public read risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public insert risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public update risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public delete risk_assessments" ON public.risk_assessments;
CREATE POLICY "Auth read risk_assessments" ON public.risk_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert risk_assessments" ON public.risk_assessments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update risk_assessments" ON public.risk_assessments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete risk_assessments" ON public.risk_assessments FOR DELETE TO authenticated USING (true);

-- health_goals
DROP POLICY IF EXISTS "Public read health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public insert health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public update health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public delete health_goals" ON public.health_goals;
CREATE POLICY "Auth read health_goals" ON public.health_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert health_goals" ON public.health_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update health_goals" ON public.health_goals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete health_goals" ON public.health_goals FOR DELETE TO authenticated USING (true);

-- shifts
DROP POLICY IF EXISTS "Public read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public delete shifts" ON public.shifts;
CREATE POLICY "Auth read shifts" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shifts" ON public.shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shifts" ON public.shifts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shifts" ON public.shifts FOR DELETE TO authenticated USING (true);

-- daily_visits
DROP POLICY IF EXISTS "Public read daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public insert daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public update daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public delete daily_visits" ON public.daily_visits;
CREATE POLICY "Auth read daily_visits" ON public.daily_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert daily_visits" ON public.daily_visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update daily_visits" ON public.daily_visits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete daily_visits" ON public.daily_visits FOR DELETE TO authenticated USING (true);

-- dashboard_visits
DROP POLICY IF EXISTS "Public read dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public insert dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public update dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public delete dashboard_visits" ON public.dashboard_visits;
CREATE POLICY "Auth read dashboard_visits" ON public.dashboard_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert dashboard_visits" ON public.dashboard_visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update dashboard_visits" ON public.dashboard_visits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete dashboard_visits" ON public.dashboard_visits FOR DELETE TO authenticated USING (true);

-- migration: supabase/migrations/20260414114250_ae31d2fc-1408-4759-ba25-89a8fcb4a3de.sql

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- RLS: only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- migration: supabase/migrations/20260414114611_d925dcce-3bc0-4621-8730-5bc5b35efe79.sql

-- Care Givers: add detailed profile fields
ALTER TABLE public.care_givers
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS login_code text,
  ADD COLUMN IF NOT EXISTS permission text DEFAULT 'Field User',
  ADD COLUMN IF NOT EXISTS role_title text DEFAULT 'Homecare Assistant',
  ADD COLUMN IF NOT EXISTS sage_num text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS is_driver boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dbs_ref text,
  ADD COLUMN IF NOT EXISTS ethnicity text,
  ADD COLUMN IF NOT EXISTS dbs_update_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dbs_type text DEFAULT 'Adult & Children',
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS next_of_kin_name text,
  ADD COLUMN IF NOT EXISTS next_of_kin_address text,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone text,
  ADD COLUMN IF NOT EXISTS care_giver_references jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requested_hours jsonb DEFAULT '{"week1":"00:00","week2":"00:00","week3":"00:00","week4":"00:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS templated_hours jsonb DEFAULT '{"week1":"00:00","week2":"00:00","week3":"00:00","week4":"00:00"}'::jsonb;

-- Care Receivers: add detailed profile fields
ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS ethnicity text,
  ADD COLUMN IF NOT EXISTS preferred_hours text,
  ADD COLUMN IF NOT EXISTS nfc_code text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS preference text DEFAULT 'Either',
  ADD COLUMN IF NOT EXISTS risk_rating text DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS nhs_number text,
  ADD COLUMN IF NOT EXISTS patient_number text,
  ADD COLUMN IF NOT EXISTS health_care_number text,
  ADD COLUMN IF NOT EXISTS community_health_index text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS diagnoses text,
  ADD COLUMN IF NOT EXISTS next_of_kin_email text,
  ADD COLUMN IF NOT EXISTS next_of_kin_address text,
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS doctor_contact text,
  ADD COLUMN IF NOT EXISTS doctor_address text,
  ADD COLUMN IF NOT EXISTS doctor_phone text,
  ADD COLUMN IF NOT EXISTS pharmacy_name text,
  ADD COLUMN IF NOT EXISTS pharmacy_address text,
  ADD COLUMN IF NOT EXISTS pharmacy_phone text,
  ADD COLUMN IF NOT EXISTS consent_flags jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS requested_hours jsonb DEFAULT '{"week1":"00:00","week2":"00:00","week3":"00:00","week4":"00:00"}'::jsonb;

-- migration: supabase/migrations/20260414120509_fe24ebc0-bc65-4c3b-ad1b-76552c51b422.sql

-- Add time tracking columns to daily_visits
ALTER TABLE public.daily_visits
  ADD COLUMN IF NOT EXISTS check_in_time timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS check_out_time timestamptz DEFAULT NULL;

-- Shift notes table
CREATE TABLE public.shift_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id uuid NOT NULL,
  note text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_notes
  ADD CONSTRAINT shift_notes_daily_visit_id_fkey FOREIGN KEY (daily_visit_id)
    REFERENCES public.daily_visits(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read shift_notes" ON public.shift_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shift_notes" ON public.shift_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shift_notes" ON public.shift_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shift_notes" ON public.shift_notes FOR DELETE TO authenticated USING (true);

-- Shift tasks table
CREATE TABLE public.shift_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id uuid NOT NULL,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by text DEFAULT NULL,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_tasks
  ADD CONSTRAINT shift_tasks_daily_visit_id_fkey FOREIGN KEY (daily_visit_id)
    REFERENCES public.daily_visits(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read shift_tasks" ON public.shift_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shift_tasks" ON public.shift_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shift_tasks" ON public.shift_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shift_tasks" ON public.shift_tasks FOR DELETE TO authenticated USING (true);

-- Enable realtime for both new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_tasks;

-- migration: supabase/migrations/20260415103124_31aa5989-2b04-443e-b9ad-cf55b2eb3314.sql
ALTER TABLE public.care_givers
  ADD COLUMN next_of_kin_relationship text,
  ADD COLUMN next_of_kin_email text,
  ADD COLUMN next_of_kin_secondary_phone text,
  ADD COLUMN next_of_kin_notes text;
-- migration: supabase/migrations/20260415105339_ed42f4a5-54b1-4c65-ad20-469f6020413f.sql
ALTER TABLE public.care_givers
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS forename text,
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS alias text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS sex_assigned_at_birth text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS sexual_orientation text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS ni_number text,
  ADD COLUMN IF NOT EXISTS house_street text,
  ADD COLUMN IF NOT EXISTS address_2 text,
  ADD COLUMN IF NOT EXISTS address_3 text,
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS home_phone text,
  ADD COLUMN IF NOT EXISTS work_number text,
  ADD COLUMN IF NOT EXISTS work_email text,
  ADD COLUMN IF NOT EXISTS personal_number text,
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS reference_no text,
  ADD COLUMN IF NOT EXISTS payroll_number text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS employment_status text,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS manager text,
  ADD COLUMN IF NOT EXISTS salary text;
-- migration: supabase/migrations/20260415113432_c122b6f7-e2e9-48e1-94ee-0e8655e942f0.sql
ALTER TABLE public.care_givers ADD COLUMN tags text[] DEFAULT '{}'::text[];
-- migration: supabase/migrations/20260416092207_6e9a86d8-ba5c-4cc9-8b2f-a507c599cdc6.sql

-- Update visit 1: on time (scheduled 08:00, checked in 07:55, out 14:05)
UPDATE daily_visits SET start_hour = 8, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '7 hours 55 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '14 hours 5 minutes')::timestamptz
WHERE id = '3a93d5ca-6d08-4454-821a-bac241cb0928';

-- Visit 2: late (scheduled 09:00, checked in 09:42, out 15:10)
UPDATE daily_visits SET start_hour = 9, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '9 hours 42 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '15 hours 10 minutes')::timestamptz
WHERE id = '5d58ce2d-7ab6-4256-a954-5d05369f7fb9';

-- Visit 3: on time (scheduled 07:00, checked in 06:58, out 13:02)
UPDATE daily_visits SET start_hour = 7, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '6 hours 58 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '13 hours 2 minutes')::timestamptz
WHERE id = 'c7b3b208-8a23-4cd1-944a-b2702de0d1ef';

-- Visit 4: late (scheduled 10:00, checked in 10:35, out 16:20)
UPDATE daily_visits SET start_hour = 10, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '10 hours 35 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '16 hours 20 minutes')::timestamptz
WHERE id = '4b052dab-377b-4553-91b1-6a853f7e6180';

-- Visit 5: on time (scheduled 08:00, checked in 08:02, out 14:00)
UPDATE daily_visits SET start_hour = 8, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '8 hours 2 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '14 hours')::timestamptz
WHERE id = 'e1e4ff5c-7967-475a-916c-01afe39b82c2';

-- Add shift notes
INSERT INTO shift_notes (daily_visit_id, note, author) VALUES
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Client was in good spirits today. Completed morning routine without issues.', 'Anna Garcia'),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Administered medication at 10am as prescribed.', 'Anna Garcia'),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Arrived late due to traffic. Client was understanding.', 'James Smith'),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Client had a good day. Went for a short walk in the garden.', 'Mamoon Sharif'),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Client was feeling unwell, monitored closely. Contacted GP.', 'Sarah Johnson'),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'All tasks completed. Client in stable condition.', 'Mike Patel');

-- Add shift tasks
INSERT INTO shift_tasks (daily_visit_id, title, is_completed, completed_by, completed_at) VALUES
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Morning medication', true, 'Anna Garcia', now()),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Prepare breakfast', true, 'Anna Garcia', now()),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Personal hygiene assistance', true, 'Anna Garcia', now()),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Lunch preparation', true, 'James Smith', now()),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Administer afternoon meds', false, null, null),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Morning walk', true, 'Mamoon Sharif', now()),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Prepare lunch', true, 'Mamoon Sharif', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Health check', true, 'Sarah Johnson', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Contact GP', true, 'Sarah Johnson', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Evening medication', false, null, null),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'Morning routine', true, 'Mike Patel', now()),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'Prepare meals', true, 'Mike Patel', now());

-- migration: supabase/migrations/20260416092851_956af737-5a88-4a75-9fab-db910b212923.sql

-- Visit 2: was 42m late, now 12m late (scheduled 09:00, in at 09:12)
UPDATE daily_visits SET
  check_in_time = (CURRENT_DATE + INTERVAL '9 hours 12 minutes')::timestamptz
WHERE id = '5d58ce2d-7ab6-4256-a954-5d05369f7fb9';

-- Visit 4: was 35m late, now 18m late (scheduled 10:00, in at 10:18)
UPDATE daily_visits SET
  check_in_time = (CURRENT_DATE + INTERVAL '10 hours 18 minutes')::timestamptz
WHERE id = '4b052dab-377b-4553-91b1-6a853f7e6180';

-- migration: supabase/migrations/20260418161750_3795a017-569e-4591-9fb5-0f68bc0ea7cf.sql

CREATE TABLE public.caregiver_private_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  service_user_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_private_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_private_notes" ON public.caregiver_private_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_private_notes" ON public.caregiver_private_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_private_notes" ON public.caregiver_private_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_private_notes" ON public.caregiver_private_notes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_private_notes_updated_at
BEFORE UPDATE ON public.caregiver_private_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.caregiver_rota_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  rota_ref TEXT,
  note_ref TEXT,
  staff_name TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  note_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_rota_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_rota_notes" ON public.caregiver_rota_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_rota_notes" ON public.caregiver_rota_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_rota_notes" ON public.caregiver_rota_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_rota_notes" ON public.caregiver_rota_notes FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_caregiver_private_notes_cg ON public.caregiver_private_notes(care_giver_id);
CREATE INDEX idx_caregiver_rota_notes_cg ON public.caregiver_rota_notes(care_giver_id);

-- migration: supabase/migrations/20260418162228_6daf356c-0e01-4877-8c14-d549d0080a0d.sql

CREATE TABLE public.caregiver_key_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  is_nok BOOLEAN NOT NULL DEFAULT false,
  lives_with BOOLEAN NOT NULL DEFAULT false,
  is_ice BOOLEAN NOT NULL DEFAULT false,
  show_on_app BOOLEAN NOT NULL DEFAULT false,
  contact_type TEXT,
  name TEXT NOT NULL,
  tel1 TEXT,
  tel2 TEXT,
  mobile TEXT,
  email TEXT,
  address1 TEXT,
  address2 TEXT,
  area TEXT,
  postcode TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_key_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_key_contacts" ON public.caregiver_key_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_key_contacts" ON public.caregiver_key_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_key_contacts" ON public.caregiver_key_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_key_contacts" ON public.caregiver_key_contacts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_key_contacts_updated_at
BEFORE UPDATE ON public.caregiver_key_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_key_contacts_cg ON public.caregiver_key_contacts(care_giver_id);

-- migration: supabase/migrations/20260418163050_6de96c95-9015-4168-b978-b91c8000d15d.sql
CREATE TABLE public.caregiver_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  reminder_name TEXT NOT NULL,
  account TEXT,
  first_due DATE,
  repeat_interval TEXT NOT NULL DEFAULT 'Never',
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  was_set_for DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_reminders" ON public.caregiver_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_reminders" ON public.caregiver_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_reminders" ON public.caregiver_reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_reminders" ON public.caregiver_reminders FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_reminders_updated_at
BEFORE UPDATE ON public.caregiver_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.caregiver_reminders (care_giver_id, reminder_name, account, first_due, repeat_interval, end_date, status)
SELECT id, 'DBS/PVG Reminder', name, '2026-11-27', 'Never', '2026-11-27', 'active'
FROM public.care_givers;

INSERT INTO public.caregiver_reminders (care_giver_id, reminder_name, account, was_set_for, status, completed_at, completed_by, completion_notes)
SELECT id, 'Right to Work', name, '2025-12-21', 'cancelled', '2026-04-14 09:10:00+00', 'Elizebeth Jordan', 'View Notes'
FROM public.care_givers;
-- migration: supabase/migrations/20260418163344_1181de7a-62b7-4fa5-8556-6ce3e347a1c3.sql
CREATE TABLE public.caregiver_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '17:00',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_availability" ON public.caregiver_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_availability" ON public.caregiver_availability FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_availability" ON public.caregiver_availability FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_availability" ON public.caregiver_availability FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_availability_updated_at
BEFORE UPDATE ON public.caregiver_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- migration: supabase/migrations/20260418163922_5990f1e0-d6e3-4081-9d42-e8d1e10652c6.sql
CREATE TABLE public.caregiver_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'holiday',
  start_date DATE NOT NULL,
  end_date DATE,
  hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_holidays" ON public.caregiver_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_holidays" ON public.caregiver_holidays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_holidays" ON public.caregiver_holidays FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_holidays" ON public.caregiver_holidays FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_holidays_updated_at
BEFORE UPDATE ON public.caregiver_holidays
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- migration: supabase/migrations/20260418164926_cc6fd2ef-1462-4bf4-bc4a-881e90d196cd.sql

CREATE TABLE public.caregiver_push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  created_by TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_push_notifications_cg ON public.caregiver_push_notifications(care_giver_id, created_at DESC);

ALTER TABLE public.caregiver_push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR DELETE TO authenticated USING (true);

-- migration: supabase/migrations/20260418165525_bf7255d8-59d6-48de-9d4d-5e0b7418cd0a.sql

CREATE TABLE public.caregiver_vaccinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose TEXT,
  date_administered DATE,
  expiry_date DATE,
  batch_number TEXT,
  administered_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_vaccinations_cg ON public.caregiver_vaccinations(care_giver_id, date_administered DESC);

ALTER TABLE public.caregiver_vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR DELETE TO authenticated USING (true);

-- migration: supabase/migrations/20260418165848_a52028b0-01b8-463f-a862-4df94455600a.sql

CREATE TABLE public.caregiver_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  start_date DATE,
  expiry_date DATE,
  never_expires BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'In Date',
  sub_status TEXT NOT NULL DEFAULT 'None',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_qualifications_cg ON public.caregiver_qualifications(care_giver_id, qualification);

ALTER TABLE public.caregiver_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_qualifications"
  ON public.caregiver_qualifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_qualifications"
  ON public.caregiver_qualifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_qualifications"
  ON public.caregiver_qualifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_qualifications"
  ON public.caregiver_qualifications FOR DELETE TO authenticated USING (true);

-- migration: supabase/migrations/20260418170728_8a7189f9-9209-42e0-8342-a9307a57f23c.sql
-- Create caregiver_incidents table
CREATE TABLE public.caregiver_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  incident_ref TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Low',
  status TEXT NOT NULL DEFAULT 'Open',
  created_by TEXT,
  created_for TEXT,
  description TEXT NOT NULL DEFAULT '',
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_incidents" ON public.caregiver_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_incidents" ON public.caregiver_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_incidents" ON public.caregiver_incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_incidents" ON public.caregiver_incidents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_incidents_updated_at
BEFORE UPDATE ON public.caregiver_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_incidents_care_giver_id ON public.caregiver_incidents(care_giver_id);
CREATE INDEX idx_caregiver_incidents_status ON public.caregiver_incidents(status);
-- migration: supabase/migrations/20260418171051_9db666e2-8b09-4eb2-b6ce-ddf8aa5ab3ad.sql
-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('caregiver-documents', 'caregiver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (authenticated users full access for now)
CREATE POLICY "Auth read caregiver-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth insert caregiver-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth update caregiver-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth delete caregiver-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'caregiver-documents');

-- Categories table
CREATE TABLE public.caregiver_document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_document_categories" ON public.caregiver_document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_document_categories" ON public.caregiver_document_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_document_categories" ON public.caregiver_document_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_document_categories" ON public.caregiver_document_categories FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_document_categories_updated_at
BEFORE UPDATE ON public.caregiver_document_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Documents table
CREATE TABLE public.caregiver_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  service_user_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.caregiver_document_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_documents" ON public.caregiver_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_documents" ON public.caregiver_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_documents" ON public.caregiver_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_documents" ON public.caregiver_documents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_documents_updated_at
BEFORE UPDATE ON public.caregiver_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_documents_care_giver_id ON public.caregiver_documents(care_giver_id);
CREATE INDEX idx_caregiver_documents_category_id ON public.caregiver_documents(category_id);
-- migration: supabase/migrations/20260418171551_fba21696-5b26-4618-a237-ce37e5d1b712.sql
-- Caregiver changelog (audit log) table
CREATE TABLE public.caregiver_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  made_by TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  for_name TEXT,
  log_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_changelog_cg_time ON public.caregiver_changelog(care_giver_id, log_time DESC);

ALTER TABLE public.caregiver_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view changelog"
ON public.caregiver_changelog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert changelog"
ON public.caregiver_changelog FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update changelog"
ON public.caregiver_changelog FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete changelog"
ON public.caregiver_changelog FOR DELETE TO authenticated USING (true);

-- Seed sample entries for the demo caregiver
INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '194038351', 'Emily Biggart', 'Updated Medication Rota Admin Status For Single Medication',
       'Medication administer status changed on 18/04/2026 at 11:41 by Emily Biggart', NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'medication signed for by staff member',
       'Medication result received for call 145958146 - Medication: Dermol Cream Admin Type: Not Required on 18/04/2026 at 11:41 by Emily Biggart', NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958083', 'Emily Biggart', 'Note Added By Staff Member',
       'Note added - Cancelled Call: Just wanted us to get jeff to get her some meds on 18/04/2026 at 11:41 by Emily Biggart',
       'Joan Marchant', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'staff member clocked out of shift',
       'clocked out of call 145958146 at 21:14 on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'staff member clocked into shift',
       'clocked in to call 145958146 at 20:45 on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958083', 'Emily Biggart', 'shift status changed',
       'Door step cancellation on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'Task Incomplete On Rota',
       'Task Status result 2 received for call 145958146 on 18/04/2026 at 11:41 by Emily Biggart',
       NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'Note Added By Staff Member',
       'Note added - Carol okay and in living room on arrival, used the standing sling and Walker to get her onto the commode and then wheeled through into bedroom. gave her time on the toilet and she had a small bowel movement. got her dressed into pyjamas with a fresh pull-up on and old one disposed in black bin outside. Assisted Carol to get into bed from off the commode. We made her comfortable and call done with consent and Carol also had some drink throughout the call and had a chat and then all okay on leaving. on 18/04/2026 at 11:41 by Emily Biggart',
       'Carol Stevens', now()
FROM public.care_givers LIMIT 1;
-- migration: supabase/migrations/20260419074804_44c0f0b4-4758-42b3-b0e3-13518e6945dd.sql

-- ===== Receiver Notes =====
CREATE TABLE public.receiver_private_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  care_giver_id uuid,
  note text NOT NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_private_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_private_notes" ON public.receiver_private_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_private_notes" ON public.receiver_private_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_private_notes" ON public.receiver_private_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_private_notes" ON public.receiver_private_notes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rpn_updated BEFORE UPDATE ON public.receiver_private_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Reminders =====
CREATE TABLE public.receiver_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  reminder_name text NOT NULL,
  account text,
  first_due date,
  repeat_interval text NOT NULL DEFAULT 'Never',
  end_date date,
  status text NOT NULL DEFAULT 'active',
  was_set_for date,
  completed_at timestamptz,
  completed_by text,
  completion_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_reminders" ON public.receiver_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_reminders" ON public.receiver_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_reminders" ON public.receiver_reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_reminders" ON public.receiver_reminders FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rr_updated BEFORE UPDATE ON public.receiver_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Holidays =====
CREATE TABLE public.receiver_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  entry_type text NOT NULL DEFAULT 'holiday',
  start_date date NOT NULL,
  end_date date,
  hours numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'approved',
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_holidays" ON public.receiver_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_holidays" ON public.receiver_holidays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_holidays" ON public.receiver_holidays FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_holidays" ON public.receiver_holidays FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rh_updated BEFORE UPDATE ON public.receiver_holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Key Contacts =====
CREATE TABLE public.receiver_key_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  name text NOT NULL,
  contact_type text,
  is_nok boolean NOT NULL DEFAULT false,
  is_ice boolean NOT NULL DEFAULT false,
  lives_with boolean NOT NULL DEFAULT false,
  show_on_app boolean NOT NULL DEFAULT false,
  mobile text,
  tel1 text,
  tel2 text,
  email text,
  address1 text,
  address2 text,
  area text,
  postcode text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_key_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_key_contacts" ON public.receiver_key_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_key_contacts" ON public.receiver_key_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_key_contacts" ON public.receiver_key_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_key_contacts" ON public.receiver_key_contacts FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rkc_updated BEFORE UPDATE ON public.receiver_key_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Availability =====
CREATE TABLE public.receiver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  week_number integer NOT NULL,
  day_of_week integer NOT NULL,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '17:00',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_availability" ON public.receiver_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_availability" ON public.receiver_availability FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_availability" ON public.receiver_availability FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_availability" ON public.receiver_availability FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_ra_updated BEFORE UPDATE ON public.receiver_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Incidents =====
CREATE TABLE public.receiver_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  incident_ref text NOT NULL,
  severity text NOT NULL DEFAULT 'Low',
  status text NOT NULL DEFAULT 'Open',
  created_by text,
  created_for text,
  description text NOT NULL DEFAULT '',
  incident_date timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_incidents" ON public.receiver_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_incidents" ON public.receiver_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_incidents" ON public.receiver_incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_incidents" ON public.receiver_incidents FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_ri_updated BEFORE UPDATE ON public.receiver_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Document Categories =====
CREATE TABLE public.receiver_document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_document_categories" ON public.receiver_document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_document_categories" ON public.receiver_document_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_document_categories" ON public.receiver_document_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_document_categories" ON public.receiver_document_categories FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rdc_updated BEFORE UPDATE ON public.receiver_document_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Documents =====
CREATE TABLE public.receiver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  category_id uuid REFERENCES public.receiver_document_categories(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_documents" ON public.receiver_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_documents" ON public.receiver_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_documents" ON public.receiver_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_documents" ON public.receiver_documents FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rd_updated BEFORE UPDATE ON public.receiver_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Changelog =====
CREATE TABLE public.receiver_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  record_id text NOT NULL,
  title text NOT NULL,
  made_by text NOT NULL,
  for_name text,
  description text NOT NULL DEFAULT '',
  log_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_changelog" ON public.receiver_changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_changelog" ON public.receiver_changelog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_changelog" ON public.receiver_changelog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_changelog" ON public.receiver_changelog FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_receiver_changelog_lookup ON public.receiver_changelog(care_receiver_id, log_time DESC);

-- ===== Receiver Push Notifications =====
CREATE TABLE public.receiver_push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  note text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_push_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_push_notifications" ON public.receiver_push_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_push_notifications" ON public.receiver_push_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_push_notifications" ON public.receiver_push_notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_push_notifications" ON public.receiver_push_notifications FOR DELETE TO authenticated USING (true);

-- ===== Receiver Qualifications =====
CREATE TABLE public.receiver_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  qualification text NOT NULL,
  start_date date,
  expiry_date date,
  never_expires boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'In Date',
  sub_status text NOT NULL DEFAULT 'None',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_qualifications" ON public.receiver_qualifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_qualifications" ON public.receiver_qualifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_qualifications" ON public.receiver_qualifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_qualifications" ON public.receiver_qualifications FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rq_updated BEFORE UPDATE ON public.receiver_qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Storage bucket for receiver documents =====
INSERT INTO storage.buckets (id, name, public) VALUES ('service-user-documents', 'service-user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth read service-user-documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'service-user-documents');
CREATE POLICY "Auth insert service-user-documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-user-documents');
CREATE POLICY "Auth update service-user-documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-user-documents');
CREATE POLICY "Auth delete service-user-documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-user-documents');

-- migration: supabase/migrations/20260419085114_3f269867-cabe-4720-b707-eb08de6b398d.sql

-- Extend care_receivers
ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS forename text,
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS alias text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS pref text,
  ADD COLUMN IF NOT EXISTS sub_status text,
  ADD COLUMN IF NOT EXISTS sex_assigned_at_birth text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS sexual_orientation text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS ni_number text,
  ADD COLUMN IF NOT EXISTS authority_ref text,
  ADD COLUMN IF NOT EXISTS social_services_id text,
  ADD COLUMN IF NOT EXISTS cm2000_link text,
  ADD COLUMN IF NOT EXISTS keysafe text,
  ADD COLUMN IF NOT EXISTS mediverify text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_appears_on_app boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mobile_num_1 text,
  ADD COLUMN IF NOT EXISTS mobile_num_2 text,
  ADD COLUMN IF NOT EXISTS email_1 text,
  ADD COLUMN IF NOT EXISTS email_2 text,
  ADD COLUMN IF NOT EXISTS reference_no text,
  ADD COLUMN IF NOT EXISTS carer_pref text,
  ADD COLUMN IF NOT EXISTS risk_rating_description text,
  ADD COLUMN IF NOT EXISTS under_regulated_activity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS npc_number text,
  ADD COLUMN IF NOT EXISTS contract_type text,
  ADD COLUMN IF NOT EXISTS area_name text,
  ADD COLUMN IF NOT EXISTS onboarding_status text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS medical_company_number text,
  ADD COLUMN IF NOT EXISTS medical_service_user_number text,
  ADD COLUMN IF NOT EXISTS medical_password text,
  ADD COLUMN IF NOT EXISTS service_start_date date,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'Active';

-- DNAR Settings
CREATE TABLE IF NOT EXISTS public.receiver_dnar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  applies_from date,
  applies_until date,
  document_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_dnar_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_dnar_settings" ON public.receiver_dnar_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_dnar_settings" ON public.receiver_dnar_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_dnar_settings" ON public.receiver_dnar_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_dnar_settings" ON public.receiver_dnar_settings FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_dnar_settings_updated BEFORE UPDATE ON public.receiver_dnar_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Qualification Requirements
CREATE TABLE IF NOT EXISTS public.receiver_qualification_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  qualification text NOT NULL,
  mandatory boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_qualification_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_qual_req" ON public.receiver_qualification_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_qual_req" ON public.receiver_qualification_requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_qual_req" ON public.receiver_qualification_requirements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_qual_req" ON public.receiver_qualification_requirements FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_qual_req_updated BEFORE UPDATE ON public.receiver_qualification_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Preferences
CREATE TABLE IF NOT EXISTS public.receiver_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  care_giver_id uuid NOT NULL,
  rating int NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (care_receiver_id, care_giver_id)
);
ALTER TABLE public.receiver_user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_user_prefs" ON public.receiver_user_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_user_prefs" ON public.receiver_user_preferences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_user_prefs" ON public.receiver_user_preferences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_user_prefs" ON public.receiver_user_preferences FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_user_prefs_updated BEFORE UPDATE ON public.receiver_user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- migration: supabase/migrations/20260420091520_fa4558b9-b924-44d3-9ba0-5752950aa638.sql

-- Communication Reasons (configurable list)
CREATE TABLE public.communication_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view reasons" ON public.communication_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert reasons" ON public.communication_reasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update reasons" ON public.communication_reasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete reasons" ON public.communication_reasons FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_reasons_updated_at
BEFORE UPDATE ON public.communication_reasons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Communication Logs
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'outgoing', -- outgoing | incoming
  comm_type TEXT NOT NULL DEFAULT 'call',     -- call | email
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  subject TEXT,
  notes TEXT,
  reason_id UUID REFERENCES public.communication_reasons(id) ON DELETE SET NULL,
  reason_label TEXT,
  logged_by TEXT,
  logged_for TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view comm logs" ON public.communication_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert comm logs" ON public.communication_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update comm logs" ON public.communication_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete comm logs" ON public.communication_logs FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_logs_updated_at
BEFORE UPDATE ON public.communication_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comm_logs_occurred_at ON public.communication_logs(occurred_at DESC);
CREATE INDEX idx_comm_logs_direction ON public.communication_logs(direction);

-- Communication Actions (follow-ups)
CREATE TABLE public.communication_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID REFERENCES public.communication_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view actions" ON public.communication_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert actions" ON public.communication_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update actions" ON public.communication_actions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete actions" ON public.communication_actions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_actions_updated_at
BEFORE UPDATE ON public.communication_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comm_actions_log_id ON public.communication_actions(log_id);

-- migration: supabase/migrations/20260420091947_a9775929-b631-4892-ab77-cc185dff0dd8.sql

ALTER TABLE public.communication_logs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT,
  ADD COLUMN IF NOT EXISTS waiting_on TEXT DEFAULT 'Call Back',
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

-- migration: supabase/migrations/20260424200225_98d65393-a009-47a7-9aa7-a4014e4462d9.sql
-- Add avatar_url columns
ALTER TABLE public.care_givers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.care_receivers ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create public avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-avatars (public read, authenticated write)
CREATE POLICY "Public can view profile avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can upload profile avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can update profile avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can delete profile avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-avatars');
-- migration: supabase/migrations/20260424201002_9c7aba70-99c2-4f90-a835-ab11a2ece277.sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company_member';
-- migration: supabase/migrations/20260424201057_c2f723f3-3bb0-49cc-9cf2-9a4534cb4f23.sql

-- =====================================================================
-- 1. COMPANIES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code text UNIQUE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

INSERT INTO public.companies (company_code, name)
VALUES ('DEFAULT', 'Default Company')
ON CONFLICT (company_code) DO NOTHING;

-- =====================================================================
-- 2. COMPANY_USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, username),
  UNIQUE (user_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. SECURITY DEFINER HELPERS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.company_users WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_email(_company_code text, _username text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.email
  FROM public.company_users cu
  JOIN public.companies c ON c.id = cu.company_id
  JOIN auth.users u ON u.id = cu.user_id
  WHERE lower(c.company_code) = lower(_company_code)
    AND lower(cu.username) = lower(_username)
    AND c.status = 'Active'
    AND cu.status = 'Active'
  LIMIT 1
$$;

-- First, add the `company_id` column to all tenant tables as separate statements
ALTER TABLE public.care_givers ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.care_receivers ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_availability ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_changelog ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_document_categories ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_documents ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_holidays ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_incidents ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_key_contacts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_private_notes ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_push_notifications ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_qualifications ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_reminders ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_rota_notes ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.caregiver_vaccinations ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.communication_actions ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.communication_reasons ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.daily_visits ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.dashboard_visits ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.health_goals ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_availability ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_changelog ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_dnar_settings ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_document_categories ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_documents ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_holidays ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_incidents ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_key_contacts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_private_notes ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_push_notifications ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_qualification_requirements ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_qualifications ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_reminders ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.receiver_user_preferences ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.shift_notes ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.shift_tasks ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.visit_notes ADD COLUMN IF NOT EXISTS company_id uuid;

-- Backfill `company_id` using the default company, then set NOT NULL, DEFAULT, and indexes
-- Use explicit statements (not a DO block) so each runs separately and avoids pending-trigger conflicts.
-- Get default company id once via subselect inside each UPDATE.

UPDATE public.care_givers SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.care_givers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.care_givers ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS care_givers_company_id_idx ON public.care_givers(company_id);

UPDATE public.care_receivers SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.care_receivers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.care_receivers ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS care_receivers_company_id_idx ON public.care_receivers(company_id);

UPDATE public.caregiver_availability SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_availability ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_availability ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_availability_company_id_idx ON public.caregiver_availability(company_id);

UPDATE public.caregiver_changelog SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_changelog ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_changelog ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_changelog_company_id_idx ON public.caregiver_changelog(company_id);

UPDATE public.caregiver_document_categories SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_document_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_document_categories ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_document_categories_company_id_idx ON public.caregiver_document_categories(company_id);

UPDATE public.caregiver_documents SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_documents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_documents ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_documents_company_id_idx ON public.caregiver_documents(company_id);

UPDATE public.caregiver_holidays SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_holidays ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_holidays ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_holidays_company_id_idx ON public.caregiver_holidays(company_id);

UPDATE public.caregiver_incidents SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_incidents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_incidents ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_incidents_company_id_idx ON public.caregiver_incidents(company_id);

UPDATE public.caregiver_key_contacts SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_key_contacts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_key_contacts ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_key_contacts_company_id_idx ON public.caregiver_key_contacts(company_id);

UPDATE public.caregiver_private_notes SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_private_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_private_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_private_notes_company_id_idx ON public.caregiver_private_notes(company_id);

UPDATE public.caregiver_push_notifications SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_push_notifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_push_notifications ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_push_notifications_company_id_idx ON public.caregiver_push_notifications(company_id);

UPDATE public.caregiver_qualifications SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_qualifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_qualifications ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_qualifications_company_id_idx ON public.caregiver_qualifications(company_id);

UPDATE public.caregiver_reminders SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_reminders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_reminders ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_reminders_company_id_idx ON public.caregiver_reminders(company_id);

UPDATE public.caregiver_rota_notes SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_rota_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_rota_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_rota_notes_company_id_idx ON public.caregiver_rota_notes(company_id);

UPDATE public.caregiver_vaccinations SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.caregiver_vaccinations ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.caregiver_vaccinations ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS caregiver_vaccinations_company_id_idx ON public.caregiver_vaccinations(company_id);

UPDATE public.communication_actions SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.communication_actions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.communication_actions ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS communication_actions_company_id_idx ON public.communication_actions(company_id);

UPDATE public.communication_logs SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.communication_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.communication_logs ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS communication_logs_company_id_idx ON public.communication_logs(company_id);

UPDATE public.communication_reasons SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.communication_reasons ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.communication_reasons ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS communication_reasons_company_id_idx ON public.communication_reasons(company_id);

UPDATE public.daily_visits SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.daily_visits ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.daily_visits ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS daily_visits_company_id_idx ON public.daily_visits(company_id);

UPDATE public.dashboard_visits SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.dashboard_visits ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.dashboard_visits ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS dashboard_visits_company_id_idx ON public.dashboard_visits(company_id);

UPDATE public.health_goals SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.health_goals ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.health_goals ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS health_goals_company_id_idx ON public.health_goals(company_id);

UPDATE public.medications SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.medications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.medications ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS medications_company_id_idx ON public.medications(company_id);

UPDATE public.receiver_availability SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_availability ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_availability ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_availability_company_id_idx ON public.receiver_availability(company_id);

UPDATE public.receiver_changelog SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_changelog ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_changelog ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_changelog_company_id_idx ON public.receiver_changelog(company_id);

UPDATE public.receiver_dnar_settings SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_dnar_settings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_dnar_settings ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_dnar_settings_company_id_idx ON public.receiver_dnar_settings(company_id);

UPDATE public.receiver_document_categories SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_document_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_document_categories ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_document_categories_company_id_idx ON public.receiver_document_categories(company_id);

UPDATE public.receiver_documents SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_documents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_documents ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_documents_company_id_idx ON public.receiver_documents(company_id);

UPDATE public.receiver_holidays SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_holidays ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_holidays ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_holidays_company_id_idx ON public.receiver_holidays(company_id);

UPDATE public.receiver_incidents SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_incidents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_incidents ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_incidents_company_id_idx ON public.receiver_incidents(company_id);

UPDATE public.receiver_key_contacts SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_key_contacts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_key_contacts ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_key_contacts_company_id_idx ON public.receiver_key_contacts(company_id);

UPDATE public.receiver_private_notes SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_private_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_private_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_private_notes_company_id_idx ON public.receiver_private_notes(company_id);

UPDATE public.receiver_push_notifications SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_push_notifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_push_notifications ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_push_notifications_company_id_idx ON public.receiver_push_notifications(company_id);

UPDATE public.receiver_qualification_requirements SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_qualification_requirements ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_qualification_requirements ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_qualification_requirements_company_id_idx ON public.receiver_qualification_requirements(company_id);

UPDATE public.receiver_qualifications SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_qualifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_qualifications ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_qualifications_company_id_idx ON public.receiver_qualifications(company_id);

UPDATE public.receiver_reminders SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_reminders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_reminders ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_reminders_company_id_idx ON public.receiver_reminders(company_id);

UPDATE public.receiver_user_preferences SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.receiver_user_preferences ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.receiver_user_preferences ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS receiver_user_preferences_company_id_idx ON public.receiver_user_preferences(company_id);

UPDATE public.risk_assessments SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.risk_assessments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.risk_assessments ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS risk_assessments_company_id_idx ON public.risk_assessments(company_id);

UPDATE public.shift_notes SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.shift_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS shift_notes_company_id_idx ON public.shift_notes(company_id);

UPDATE public.shift_tasks SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.shift_tasks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_tasks ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS shift_tasks_company_id_idx ON public.shift_tasks(company_id);

UPDATE public.shifts SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.shifts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shifts ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS shifts_company_id_idx ON public.shifts(company_id);

UPDATE public.visit_notes SET company_id = (SELECT id FROM public.companies WHERE company_code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE public.visit_notes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.visit_notes ALTER COLUMN company_id SET DEFAULT public.current_company_id();
CREATE INDEX IF NOT EXISTS visit_notes_company_id_idx ON public.visit_notes(company_id);

-- =====================================================================
-- 5. REPLACE PERMISSIVE RLS WITH COMPANY-SCOPED POLICIES
-- =====================================================================
DO $$
DECLARE
  t text;
  pol record;
  tenant_tables text[] := ARRAY[
    'care_givers','care_receivers',
    'caregiver_availability','caregiver_changelog','caregiver_document_categories',
    'caregiver_documents','caregiver_holidays','caregiver_incidents','caregiver_key_contacts',
    'caregiver_private_notes','caregiver_push_notifications','caregiver_qualifications',
    'caregiver_reminders','caregiver_rota_notes','caregiver_vaccinations',
    'communication_actions','communication_logs','communication_reasons',
    'daily_visits','dashboard_visits','health_goals','medications',
    'receiver_availability','receiver_changelog','receiver_dnar_settings',
    'receiver_document_categories','receiver_documents','receiver_holidays',
    'receiver_incidents','receiver_key_contacts','receiver_private_notes',
    'receiver_push_notifications','receiver_qualification_requirements',
    'receiver_qualifications','receiver_reminders','receiver_user_preferences',
    'risk_assessments','shift_notes','shift_tasks','shifts','visit_notes'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format($p$
      CREATE POLICY "tenant_select" ON public.%I FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_insert" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_update" ON public.%I FOR UPDATE TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
      WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_delete" ON public.%I FOR DELETE TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);
  END LOOP;
END$$;

-- =====================================================================
-- 6. RLS for companies + company_users
-- =====================================================================
DROP POLICY IF EXISTS "members_view_company" ON public.companies;
CREATE POLICY "members_view_company" ON public.companies
FOR SELECT TO authenticated
USING (id = public.current_company_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_insert_companies" ON public.companies;
CREATE POLICY "super_admin_insert_companies" ON public.companies
FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_update_companies" ON public.companies;
CREATE POLICY "super_admin_update_companies" ON public.companies
FOR UPDATE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_delete_companies" ON public.companies;
CREATE POLICY "super_admin_delete_companies" ON public.companies
FOR DELETE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "view_same_company_users" ON public.company_users;
CREATE POLICY "view_same_company_users" ON public.company_users
FOR SELECT TO authenticated
USING (company_id = public.current_company_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "company_admin_insert_users" ON public.company_users;
CREATE POLICY "company_admin_insert_users" ON public.company_users
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

DROP POLICY IF EXISTS "company_admin_update_users" ON public.company_users;
CREATE POLICY "company_admin_update_users" ON public.company_users
FOR UPDATE TO authenticated
USING (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

DROP POLICY IF EXISTS "company_admin_delete_users" ON public.company_users;
CREATE POLICY "company_admin_delete_users" ON public.company_users
FOR DELETE TO authenticated
USING (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

-- =====================================================================
-- 7. updated_at triggers
-- =====================================================================
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_users_updated_at ON public.company_users;
CREATE TRIGGER trg_company_users_updated_at BEFORE UPDATE ON public.company_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- migration: supabase/migrations/20260429122737_1ee585bc-c052-4f0e-843f-83cae44e9179.sql
ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS approved_tasks text[] NOT NULL DEFAULT ARRAY[
    'Personal hygiene / wash',
    'Assist with dressing',
    'Prepare breakfast',
    'Prepare lunch',
    'Prepare dinner',
    'Administer medication',
    'Toileting / continence care',
    'Mobility support',
    'Light housekeeping',
    'Laundry',
    'Companionship & conversation',
    'Record vital signs',
    'Repositioning',
    'Empty / change catheter bag'
  ]::text[];
-- migration: supabase/migrations/20260429124632_e32f1ee6-64b4-4a35-9740-8cb45a49a603.sql
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS time_of_day text, ADD COLUMN IF NOT EXISTS scheduled_time text;
-- migration: supabase/migrations/20260504071514_bec14d8c-ca40-428f-ab20-26f023a8d8f9.sql
CREATE TABLE public.care_management_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_ongoing BOOLEAN NOT NULL DEFAULT true,
  visits TEXT[] NOT NULL DEFAULT '{}',
  is_medication BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Active',
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cmt_receiver ON public.care_management_tasks(care_receiver_id);
CREATE INDEX idx_cmt_company ON public.care_management_tasks(company_id);

ALTER TABLE public.care_management_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view care tasks"
ON public.care_management_tasks FOR SELECT
TO authenticated
USING (company_id = public.current_company_id());

CREATE POLICY "Company members can insert care tasks"
ON public.care_management_tasks FOR INSERT
TO authenticated
WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Company members can update care tasks"
ON public.care_management_tasks FOR UPDATE
TO authenticated
USING (company_id = public.current_company_id());

CREATE POLICY "Company members can delete care tasks"
ON public.care_management_tasks FOR DELETE
TO authenticated
USING (company_id = public.current_company_id());

CREATE TRIGGER trg_cmt_updated_at
BEFORE UPDATE ON public.care_management_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- migration: supabase/migrations/20260504072857_0d91b655-844a-4f60-a9c7-4eabeab48222.sql
CREATE TABLE public.reminder_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  scope TEXT NOT NULL CHECK (scope IN ('client','team')),
  reminder_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reminder templates"
  ON public.reminder_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert reminder templates"
  ON public.reminder_templates FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update reminder templates"
  ON public.reminder_templates FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated can delete reminder templates"
  ON public.reminder_templates FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_reminder_templates_updated_at
  BEFORE UPDATE ON public.reminder_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults from screenshot
INSERT INTO public.reminder_templates (scope, reminder_name, description, status) VALUES
  ('client','6 Month Review','6 Month Review','Active'),
  ('client','6 month review due',NULL,'Active'),
  ('client','6 Week Review','6 Week review','Active'),
  ('client','6 week review due',NULL,'Active'),
  ('client','Annual Review',NULL,'Active'),
  ('client','Care Plan Review',NULL,'Active'),
  ('client','Catheter products to reorder',NULL,'Active'),
  ('client','Early call',NULL,'Active'),
  ('client','General Audit',NULL,'Active'),
  ('client','Hearing aids check','Arrange for aids to be cleaned at the hospital','Active'),
  ('client','Hoist Service Due','6 monthly service','Active'),
  ('client','Hospital Bed service',NULL,'Active'),
  ('client','Incontinence products','To activate order for inco pads','Active'),
  ('client','Medication Review',NULL,'Active'),
  ('client','Re-order medication',NULL,'Active'),
  ('team','1-2-1 Supervision due',NULL,'Active'),
  ('team','10 Year service reminder',NULL,'Active'),
  ('team','15 Year Service Reminder',NULL,'Active'),
  ('team','20 Year Service Reminder',NULL,'Active'),
  ('team','25 Year Service Reminder',NULL,'Active'),
  ('team','3 Month Probation Review',NULL,'Active'),
  ('team','6 Month Probation Review',NULL,'Active'),
  ('team','Appraisial',NULL,'Active'),
  ('team','Car Insurance Certificate',NULL,'Active'),
  ('team','Car Tax','Check car is taxed','Active'),
  ('team','Catheter Care Competency Check',NULL,'Active'),
  ('team','Competency check for Moving and Handling',NULL,'Active'),
  ('team','CoS Expiry Date',NULL,'Active'),
  ('team','DBS Refund due','To refund £65.20','Active');
-- migration: supabase/migrations/20260504072917_629960c3-9786-4278-8bce-6cece6c4d0e0.sql
ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;
-- migration: supabase/migrations/20260504073229_a954e39d-2c8d-46da-a1a8-2aa3dca33efb.sql
ALTER TABLE public.care_givers ADD COLUMN IF NOT EXISTS handset_logged_out_at TIMESTAMPTZ;
-- migration: supabase/migrations/20260504103231_26320990-24ce-48b4-8039-4e9234187ac8.sql
ALTER TABLE public.care_givers ADD COLUMN IF NOT EXISTS login_password text;
-- migration: supabase/migrations/20260506072917_b5669e6a-51bb-4d04-8078-36537ff65947.sql
ALTER TABLE public.care_management_tasks ADD COLUMN IF NOT EXISTS assigned_for_shift boolean NOT NULL DEFAULT false;
-- migration: supabase/migrations/20260506080900_8ff5c249-be1b-467c-907e-0d62318782eb.sql
ALTER TABLE public.daily_visits
  ADD COLUMN IF NOT EXISTS start_minute INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
-- migration: supabase/migrations/20260506102134_b81b5c35-9619-4375-9284-2efd5fd92ae4.sql
ALTER TABLE public.daily_visits 
ADD COLUMN IF NOT EXISTS check_in_lat double precision,
ADD COLUMN IF NOT EXISTS check_in_lng double precision;
-- migration: supabase/migrations/20260511000100_add_pin_to_communication_logs.sql
ALTER TABLE public.communication_logs
  ADD COLUMN IF NOT EXISTS pin TEXT;


  

-- migration: supabase/migrations/20260514120926_373b97d3-b474-463f-b4cf-bf3315f5f567.sql
CREATE TABLE public.shift_task_medician (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id UUID NOT NULL REFERENCES public.daily_visits(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  medication TEXT,
  dosage TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL DEFAULT current_company_id()
);

CREATE INDEX shift_task_medician_company_id_idx ON public.shift_task_medician(company_id);
CREATE INDEX shift_task_medician_daily_visit_id_idx ON public.shift_task_medician(daily_visit_id);

ALTER TABLE public.shift_task_medician ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.shift_task_medician FOR SELECT TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_insert" ON public.shift_task_medician FOR INSERT TO authenticated
  WITH CHECK ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_update" ON public.shift_task_medician FOR UPDATE TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin())
  WITH CHECK ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_delete" ON public.shift_task_medician FOR DELETE TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin());
-- migration: supabase/migrations/20260518110150_8c2501a7-667e-4c4a-932f-11bb35ee6601.sql
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
-- migration: supabase/migrations/20260518133739_43c3f9b5-a5da-4aee-8a69-e0d287235191.sql
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS service_type TEXT;
CREATE INDEX IF NOT EXISTS medications_service_type_idx ON public.medications (care_receiver_id, service_type);
-- migration: supabase/migrations/20260519103225_ce0a739c-ef1b-4acb-a3cd-68739169da74.sql
ALTER TABLE public.receiver_incidents ADD COLUMN IF NOT EXISTS incident_type text, ADD COLUMN IF NOT EXISTS witness text;
