
DO $$
DECLARE
  new_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
    'ted491_haroon@users.onecaresol.local',
    crypt('a11b22c33', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username','Haroon','company_code','ted491','display_name','Super Admin'),
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_uid,
    jsonb_build_object('sub', new_uid::text, 'email','ted491_haroon@users.onecaresol.local','email_verified',true),
    'email', new_uid::text, now(), now(), now());
  INSERT INTO public.company_users (user_id, company_id, username, display_name, role, status)
  VALUES (new_uid, 'a0609207-0871-4b56-a2d1-de566bc1f260', 'Haroon', 'Super Admin', 'admin', 'Active');
END $$;
