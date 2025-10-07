-- Update RLS policy to allow all authenticated users to view tasks
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.tasks;

CREATE POLICY "All authenticated users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

-- Update RLS policy for task_screenshots to allow admins to view all screenshots
DROP POLICY IF EXISTS "Users and admins can view screenshots" ON public.task_screenshots;

CREATE POLICY "Users can view their own screenshots"
ON public.task_screenshots
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all screenshots"
ON public.task_screenshots
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Ensure task_screenshots bucket is not public for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'task-screenshots';