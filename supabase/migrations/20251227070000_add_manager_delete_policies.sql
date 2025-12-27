-- Allow managers to delete requests
CREATE POLICY IF NOT EXISTS "managers can delete requests" ON public.requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);

-- Allow managers to delete equipment
CREATE POLICY IF NOT EXISTS "managers can delete equipment" ON public.equipment
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);
