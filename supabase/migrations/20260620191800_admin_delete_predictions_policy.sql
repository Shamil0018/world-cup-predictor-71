-- Create delete policy for predictions table to allow admins to delete predictions
drop policy if exists "Admins can delete any prediction" on public.predictions;

create policy "Admins can delete any prediction" on public.predictions
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));
