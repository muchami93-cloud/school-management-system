/*
# Create user_profiles table and admin user-management function

## Overview
Adds role-based login support for teachers, students, and parents. The admin
creates records in the existing teachers/students/parents tables, then a
linked auth account is created so that person can log in. A SECURITY DEFINER
function lets the admin create auth accounts server-side (using the service
role), because the browser client cannot create auth users directly.

## New Tables
1. **user_profiles** — Links auth.users to school records
   - id (uuid, PK, references auth.users ON DELETE CASCADE)
   - role (text) — 'admin', 'teacher', 'student', or 'parent'
   - teacher_id (uuid, FK → teachers, nullable)
   - student_id (uuid, FK → students, nullable)
   - parent_id (uuid, FK → parents, nullable)
   - full_name (text) — denormalized for convenience
   - email (text) — denormalized for convenience
   - created_at (timestamptz)

## New Functions
1. **create_user_account** (SECURITY DEFINER) — Called by the admin to create
   a new auth user with a default password and link it to a teacher/student/
   parent record. Returns the new auth user id.
   - Parameters: p_email, p_password, p_role, p_teacher_id, p_student_id, p_parent_id, p_full_name
   - Only callable by authenticated users whose profile role is 'admin'
   - Creates auth.users row, auth.identities row, and user_profiles row

## Security
- user_profiles has RLS enabled
- SELECT: authenticated users can read their own profile; admin can read all
- INSERT/UPDATE/DELETE: admin only (via SECURITY DEFINER function or direct policy)
- The create_user_account function is SECURITY DEFINER and only callable by admin
- user_profiles.role is set by the server function, never by the client
*/

-- ===== USER_PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  full_name text,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admin can insert (direct inserts, not via function)
DROP POLICY IF EXISTS "admin_insert_profile" ON user_profiles;
CREATE POLICY "admin_insert_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admin can update
DROP POLICY IF EXISTS "admin_update_profile" ON user_profiles;
CREATE POLICY "admin_update_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admin can delete
DROP POLICY IF EXISTS "admin_delete_profile" ON user_profiles;
CREATE POLICY "admin_delete_profile" ON user_profiles FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ===== CREATE USER ACCOUNT FUNCTION =====
-- SECURITY DEFINER so it can insert into auth.users (which normal clients cannot)
-- Only callable by admin (checked via user_profiles)
CREATE OR REPLACE FUNCTION create_user_account(
  p_email text,
  p_password text,
  p_role text,
  p_teacher_id uuid DEFAULT NULL,
  p_student_id uuid DEFAULT NULL,
  p_parent_id uuid DEFAULT NULL,
  p_full_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id uuid;
  caller_role text;
  new_user_id uuid;
BEGIN
  -- Verify caller is an admin
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO caller_role FROM user_profiles WHERE id = caller_id;
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin can create user accounts';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'teacher', 'student', 'parent') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Check if email already exists in auth.users
  SELECT id INTO new_user_id FROM auth.users WHERE email = p_email;
  IF new_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  -- Create auth user
  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf', 6)),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    NULL
  );

  -- Create identity record (required for login)
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id::text,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Create user_profiles record
  INSERT INTO user_profiles (id, role, teacher_id, student_id, parent_id, full_name, email)
  VALUES (new_user_id, p_role, p_teacher_id, p_student_id, p_parent_id, p_full_name, p_email);

  RETURN new_user_id;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION create_user_account TO authenticated;

-- ===== CREATE ADMIN PROFILE =====
-- Link the existing admin auth user to a user_profiles record
INSERT INTO user_profiles (id, role, full_name, email)
VALUES ('dbe46b24-5ae7-486e-9270-04b53d8b6745', 'admin', 'School Admin', 'admin@tcbs-tiga.ac.ke')
ON CONFLICT (id) DO NOTHING;