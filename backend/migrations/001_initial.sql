-- This file creates all our database tables.
-- Run this in Supabase SQL Editor.

-- TABLE: profiles
-- Stores extra user info (beyond what Supabase Auth gives us by default)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  -- id links to Supabase's built-in auth system. If user is deleted, profile is too.
  
  email TEXT UNIQUE NOT NULL,
  -- Every user must have a unique email
  
  full_name TEXT,
  -- Optional display name from Google
  
  avatar_url TEXT,
  -- Profile picture URL from Google account
  
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- Automatically records when the profile was created
);

-- TABLE: tasks
-- Stores all tasks in the app
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- gen_random_uuid() auto-generates a unique ID for each task
  
  title TEXT NOT NULL,
  -- Task title is required (NOT NULL means it cannot be empty)
  
  description TEXT,
  -- Optional longer description
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  -- status can only be one of these 3 values (CHECK constraint)
  -- Defaults to 'pending' when a task is first created
  
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  -- Priority level, defaults to medium
  
  due_date DATE,
  -- Optional deadline for the task
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Who created this task. If that user is deleted, set to NULL (don't delete the task)
  
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Who this task is assigned to
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTION: automatically update the updated_at column when a task changes
-- This is a PostgreSQL "trigger function"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();  -- Set updated_at to current time
  RETURN NEW;              -- Return the modified row
END;
$$ language 'plpgsql';

-- TRIGGER: call the function above whenever a task is updated
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS): controls who can read/write which rows
-- This is Supabase's built-in security feature
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- POLICY: any logged-in user can view all profiles (needed for task assignment)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- POLICY: users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- POLICY: any logged-in user can view all tasks
CREATE POLICY "Tasks are viewable by authenticated users"
  ON tasks FOR SELECT
  USING (auth.role() = 'authenticated');

-- POLICY: logged-in users can create tasks
CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- POLICY: only the creator or assigned person can update a task
CREATE POLICY "Task creator or assigned user can update"
  ON tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- FUNCTION: auto-create a profile when a new user signs up via Google OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,                                    -- The new user's ID from auth.users
    NEW.email,                                 -- Their email
    NEW.raw_user_meta_data->>'full_name',      -- Name from Google (stored in JSON)
    NEW.raw_user_meta_data->>'avatar_url'      -- Avatar from Google
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: call handle_new_user whenever someone new signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();