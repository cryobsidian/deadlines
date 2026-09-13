create table if not exists public.commitments (
  id text primary key,
  user_id uuid not null default auth.uid(),
  title text not null,
  start_at timestamptz not null,
  due_at timestamptz not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  flexibility text check (flexibility in ('fixed', 'flexible', 'droppable')),
  category text check (category in ('university', 'work', 'health', 'personal', 'social')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commitments enable row level security;

create policy "Users can read own commitments"
on public.commitments
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own commitments"
on public.commitments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own commitments"
on public.commitments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own commitments"
on public.commitments
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists commitments_user_due_idx
on public.commitments(user_id, due_at);
