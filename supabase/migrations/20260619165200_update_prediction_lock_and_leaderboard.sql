-- Drop existing policies
drop policy if exists "Users insert own predictions before lock" on public.predictions;
drop policy if exists "Users update own predictions before lock" on public.predictions;

-- Create updated policies locking exactly at kickoff
create policy "Users insert own predictions before lock" on public.predictions for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id and m.kickoff_at > now() and m.status = 'scheduled')
  );

create policy "Users update own predictions before lock" on public.predictions for update to authenticated
  using (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id and m.kickoff_at > now() and m.status = 'scheduled')
  );
