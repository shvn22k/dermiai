-- DermiAI Initial Database Schema
-- Supabase Postgres + Row Level Security (RLS) + Storage policies

-- 1. Helper Functions
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 2. Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  first_name text,
  skin_type text check (skin_type in ('oily', 'dry', 'combination', 'normal', 'sensitive', 'unsure')),
  fitzpatrick_tone text check (fitzpatrick_tone in ('I', 'II', 'III', 'IV', 'V', 'VI')),
  allergies text[] not null default '{}',
  medications text[] not null default '{}',
  concerns text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatic trigger to create profile row on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Cases
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body_site text not null,
  status text not null default 'open' check (status in ('open', 'healing', 'resolved', 'see-dermatologist')),
  placeholder_angle integer not null default -45,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_cases_user_id on public.cases(user_id);
create index if not exists idx_cases_updated_at on public.cases(updated_at desc);

alter table public.cases enable row level security;

create policy "Users can view own cases"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "Users can insert own cases"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cases"
  on public.cases for update
  using (auth.uid() = user_id);

create policy "Users can delete own cases"
  on public.cases for delete
  using (auth.uid() = user_id);

create trigger handle_cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- 4. Case Images
create table if not exists public.case_images (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  cnn_output jsonb,
  model_version text,
  pain_level smallint check (pain_level between 0 and 10),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_case_images_case_id on public.case_images(case_id);
create index if not exists idx_case_images_user_id on public.case_images(user_id);

alter table public.case_images enable row level security;

create policy "Users can view own case images"
  on public.case_images for select
  using (auth.uid() = user_id);

create policy "Users can insert own case images"
  on public.case_images for insert
  with check (auth.uid() = user_id);

create policy "Users can update own case images"
  on public.case_images for update
  using (auth.uid() = user_id);

create policy "Users can delete own case images"
  on public.case_images for delete
  using (auth.uid() = user_id);

-- 5. Messages (Consultation Chat History)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  model_version text,
  escalate_to_clinician boolean not null default false,
  safety_flags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_messages_case_id on public.messages(case_id);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_messages_created_at on public.messages(case_id, created_at asc);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- 6. Case Events (Timeline & Pain Score Progress)
create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('Check-in', 'Status', 'Consultation', 'Ingredients', 'Reminder')),
  title text not null,
  detail text,
  pain_level smallint check (pain_level between 0 and 10),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_case_events_case_id on public.case_events(case_id);
create index if not exists idx_case_events_user_id on public.case_events(user_id);
create index if not exists idx_case_events_created_at on public.case_events(case_id, created_at desc);

alter table public.case_events enable row level security;

create policy "Users can view own case events"
  on public.case_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own case events"
  on public.case_events for insert
  with check (auth.uid() = user_id);

-- 7. Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  title text not null,
  reminder_type text not null default 'Medication',
  time text not null,
  repeat_pattern text not null default 'Every day',
  repeat_days smallint[] default '{0,1,2,3,4,5,6}',
  meta text,
  enabled boolean not null default true,
  channel text not null default 'email' check (channel in ('email', 'push')),
  due_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_reminders_due_at on public.reminders(due_at) where enabled = true;

alter table public.reminders enable row level security;

create policy "Users can view own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

create trigger handle_reminders_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- 8. Storage Configuration & Policies for 'skin-images' bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'skin-images',
  'skin-images',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Users can read their own uploaded skin images
create policy "Users can view own skin images"
  on storage.objects for select
  using (
    bucket_id = 'skin-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can insert/upload skin images under their user_id path prefix
create policy "Users can upload skin images"
  on storage.objects for insert
  with check (
    bucket_id = 'skin-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can update their own skin images
create policy "Users can update own skin images"
  on storage.objects for update
  using (
    bucket_id = 'skin-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can delete their own skin images
create policy "Users can delete own skin images"
  on storage.objects for delete
  using (
    bucket_id = 'skin-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
