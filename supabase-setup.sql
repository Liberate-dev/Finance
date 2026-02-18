-- =============================================
-- FinTrack - Supabase Database Setup
-- Copy & paste ini ke Supabase SQL Editor, lalu klik RUN
-- =============================================

-- 1. CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#6c5ce7',
  type text not null check (type in ('income', 'expense'))
);

alter table categories enable row level security;

create policy "Users can view own categories"
  on categories for select using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on categories for insert with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on categories for update using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on categories for delete using (auth.uid() = user_id);

-- 2. TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null default '',
  receipt_url text,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users can view own transactions"
  on transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on transactions for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on transactions for update using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on transactions for delete using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_transactions_user_date
  on transactions (user_id, date desc);

-- 3. BUDGETS
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  limit_amount numeric not null check (limit_amount > 0),
  period text not null default 'monthly' check (period in ('weekly', 'monthly', 'yearly')),
  created_at timestamptz not null default now()
);

alter table budgets enable row level security;

create policy "Users can view own budgets"
  on budgets for select using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on budgets for insert with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on budgets for update using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on budgets for delete using (auth.uid() = user_id);

-- 4. BILLS
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'yearly', 'custom')),
  custom_days integer,
  due_date date not null,
  next_due date not null,
  is_active boolean not null default true,
  remind_days_before integer not null default 3,
  auto_record boolean not null default true,
  created_at timestamptz not null default now()
);

alter table bills enable row level security;

create policy "Users can view own bills"
  on bills for select using (auth.uid() = user_id);

create policy "Users can insert own bills"
  on bills for insert with check (auth.uid() = user_id);

create policy "Users can update own bills"
  on bills for update using (auth.uid() = user_id);

create policy "Users can delete own bills"
  on bills for delete using (auth.uid() = user_id);

-- Index for bill reminders
create index if not exists idx_bills_user_due
  on bills (user_id, next_due);

-- 5. SAVINGS GOALS
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  icon text not null default '🎯',
  color text not null default '#6c5ce7',
  deadline date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table savings_goals enable row level security;

create policy "Users can view own savings_goals"
  on savings_goals for select using (auth.uid() = user_id);

create policy "Users can insert own savings_goals"
  on savings_goals for insert with check (auth.uid() = user_id);

create policy "Users can update own savings_goals"
  on savings_goals for update using (auth.uid() = user_id);

create policy "Users can delete own savings_goals"
  on savings_goals for delete using (auth.uid() = user_id);

create index if not exists idx_savings_goals_user
  on savings_goals (user_id, created_at desc);

-- =============================================
-- DONE! Semua tabel sudah dibuat dengan RLS.
-- Sekarang kamu bisa daftar akun di app.
-- =============================================
