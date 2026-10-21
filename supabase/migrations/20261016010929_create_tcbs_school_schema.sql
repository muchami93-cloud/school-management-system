/*
# TCBS School Database Schema

## Overview
Creates the complete database for Tiga Community Boarding School (TCBS) — a school
website in Tiga, Kenya. This is a single-tenant app with no sign-in screen, so all
policies allow both `anon` and `authenticated` roles to read/write public data.

## New Tables

1. **teachers** — School teaching staff
   - id (uuid, PK)
   - full_name (text, not null)
   - email (text, unique)
   - phone (text)
   - subject (text) — main subject taught
   - grade_level (text) — level taught (e.g. "Lower Primary")
   - bio (text) — short biography
   - photo_url (text) — optional photo URL
   - created_at (timestamptz)

2. **students** — Enrolled students
   - id (uuid, PK)
   - admission_number (text, unique) — school admission number
   - full_name (text, not null)
   - date_of_birth (date)
   - gender (text) — 'male', 'female', or 'other'
   - current_class_id (uuid, FK → academic_classes) — class currently enrolled in
   - guardian_name (text) — parent/guardian name
   - guardian_phone (text)
   - guardian_email (text)
   - enrollment_date (date)
   - status (text) — 'active', 'graduated', 'transferred'
   - created_at (timestamptz)

3. **parents** — Parents/guardians registered for the parents portal
   - id (uuid, PK)
   - full_name (text, not null)
   - email (text, unique)
   - phone (text)
   - student_id (uuid, FK → students) — linked student
   - relationship (text) — 'father', 'mother', 'guardian', etc.
   - created_at (timestamptz)

4. **academic_classes** — Classes/grades offered at the school
   - id (uuid, PK)
   - name (text, not null) — e.g. "Grade 4 East"
   - grade_level (text) — e.g. "Upper Primary"
   - teacher_id (uuid, FK → teachers) — class teacher
   - capacity (int) — max students
   - created_at (timestamptz)

5. **enrollments** — Student enrollment records per academic year
   - id (uuid, PK)
   - student_id (uuid, FK → students)
   - class_id (uuid, FK → academic_classes)
   - academic_year (text) — e.g. "2026"
   - term (text) — "Term 1", "Term 2", "Term 3"
   - status (text) — 'enrolled', 'completed', 'withdrawn'
   - created_at (timestamptz)

6. **announcements** — School news and notices shown on the website
   - id (uuid, PK)
   - title (text, not null)
   - content (text, not null)
   - category (text) — 'general', 'academic', 'event', 'urgent'
   - is_published (boolean, default true)
   - published_date (timestamptz)
   - created_at (timestamptz)

7. **gallery_items** — Gallery photos displayed on the website
   - id (uuid, PK)
   - title (text, not null)
   - description (text)
   - image_url (text, not null)
   - category (text) — 'classroom', 'sports', 'events', 'community', 'facilities'
   - display_order (int, default 0)
   - created_at (timestamptz)

8. **contact_messages** — Messages submitted via the website contact form
   - id (uuid, PK)
   - name (text, not null)
   - email (text, not null)
   - subject (text, not null)
   - message (text, not null)
   - is_read (boolean, default false)
   - created_at (timestamptz)

## Security (RLS)
- RLS is enabled on ALL tables.
- Because this is a no-sign-in single-tenant school website, all policies use
  `TO anon, authenticated` so the anon-key frontend can read/write data.
- Contact messages can be inserted by anyone (contact form) but only read/updated/
  deleted by authenticated users (school admin).

## Important Notes
1. Foreign keys use ON DELETE SET NULL for optional relationships (class teacher,
   current class) and ON DELETE CASCADE for required child relationships (enrollments,
   parents linked to a student).
2. All tables have created_at defaults to now().
3. Indexes added for frequently queried columns.
*/

-- ===== TEACHERS =====
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE,
  phone text,
  subject text,
  grade_level text,
  bio text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teachers" ON teachers;
CREATE POLICY "anon_select_teachers" ON teachers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_teachers" ON teachers;
CREATE POLICY "anon_insert_teachers" ON teachers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teachers" ON teachers;
CREATE POLICY "anon_update_teachers" ON teachers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teachers" ON teachers;
CREATE POLICY "anon_delete_teachers" ON teachers FOR DELETE
  TO anon, authenticated USING (true);

-- ===== ACADEMIC CLASSES =====
CREATE TABLE IF NOT EXISTS academic_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade_level text,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  capacity int DEFAULT 40,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_academic_classes" ON academic_classes;
CREATE POLICY "anon_select_academic_classes" ON academic_classes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_academic_classes" ON academic_classes;
CREATE POLICY "anon_insert_academic_classes" ON academic_classes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_academic_classes" ON academic_classes;
CREATE POLICY "anon_update_academic_classes" ON academic_classes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_academic_classes" ON academic_classes;
CREATE POLICY "anon_delete_academic_classes" ON academic_classes FOR DELETE
  TO anon, authenticated USING (true);

-- ===== STUDENTS =====
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  current_class_id uuid REFERENCES academic_classes(id) ON DELETE SET NULL,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'transferred')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE
  TO anon, authenticated USING (true);

-- ===== PARENTS =====
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE,
  phone text,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  relationship text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_parents" ON parents;
CREATE POLICY "anon_select_parents" ON parents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_parents" ON parents;
CREATE POLICY "anon_insert_parents" ON parents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_parents" ON parents;
CREATE POLICY "anon_update_parents" ON parents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_parents" ON parents;
CREATE POLICY "anon_delete_parents" ON parents FOR DELETE
  TO anon, authenticated USING (true);

-- ===== ENROLLMENTS =====
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  term text CHECK (term IN ('Term 1', 'Term 2', 'Term 3')),
  status text DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'withdrawn')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_enrollments" ON enrollments;
CREATE POLICY "anon_select_enrollments" ON enrollments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_enrollments" ON enrollments;
CREATE POLICY "anon_insert_enrollments" ON enrollments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_enrollments" ON enrollments;
CREATE POLICY "anon_update_enrollments" ON enrollments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_enrollments" ON enrollments;
CREATE POLICY "anon_delete_enrollments" ON enrollments FOR DELETE
  TO anon, authenticated USING (true);

-- ===== ANNOUNCEMENTS =====
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'academic', 'event', 'urgent')),
  is_published boolean DEFAULT true,
  published_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
CREATE POLICY "anon_select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
CREATE POLICY "anon_insert_announcements" ON announcements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
CREATE POLICY "anon_update_announcements" ON announcements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;
CREATE POLICY "anon_delete_announcements" ON announcements FOR DELETE
  TO anon, authenticated USING (true);

-- ===== GALLERY ITEMS =====
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text DEFAULT 'classroom' CHECK (category IN ('classroom', 'sports', 'events', 'community', 'facilities')),
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery_items" ON gallery_items;
CREATE POLICY "anon_select_gallery_items" ON gallery_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gallery_items" ON gallery_items;
CREATE POLICY "anon_insert_gallery_items" ON gallery_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gallery_items" ON gallery_items;
CREATE POLICY "anon_update_gallery_items" ON gallery_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gallery_items" ON gallery_items;
CREATE POLICY "anon_delete_gallery_items" ON gallery_items FOR DELETE
  TO anon, authenticated USING (true);

-- ===== CONTACT MESSAGES =====
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (the website contact form)
DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only authenticated users (school admin) can read, update, or delete messages
DROP POLICY IF EXISTS "auth_select_contact_messages" ON contact_messages;
CREATE POLICY "auth_select_contact_messages" ON contact_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_contact_messages" ON contact_messages;
CREATE POLICY "auth_update_contact_messages" ON contact_messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_contact_messages" ON contact_messages;
CREATE POLICY "auth_delete_contact_messages" ON contact_messages FOR DELETE
  TO authenticated USING (true);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_students_current_class ON students(current_class_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_academic_classes_teacher ON academic_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_parents_student ON parents(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_order ON gallery_items(display_order);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
