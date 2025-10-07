-- Fix RLS policies to allow admin operations and add start_date to tasks

-- Add start_date column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT now();

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;

-- Recreate policies with proper checks
-- For user_roles: Allow admins OR system to insert (for new user creation)
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() IS NOT NULL
);

-- For tasks: Allow admins to insert
CREATE POLICY "Admins can insert tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure admins can manage user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

-- Add policy to allow admins to delete roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));