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
1. **create_user_account** (SECURITY DEFINER) — Called by the admin via edge
   function to create a new auth user with a default password and link it to
   a teacher/student/parent record. Returns the new auth user id.
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