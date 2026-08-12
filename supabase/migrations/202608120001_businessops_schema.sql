-- BusinessOps Demo: isolated English schema for fictional portfolio data.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Demo Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'admin' constraint company_members_role_check
    check (role in ('admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_members_company_user_key unique (company_id, user_id),
  constraint company_members_user_key unique (user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null constraint customers_name_check check (length(trim(name)) > 1),
  phone text,
  email text,
  notes text,
  total_spent numeric(12, 2) not null default 0,
  total_orders integer not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_totals_check check (total_spent >= 0 and total_orders >= 0)
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  unit text not null constraint ingredients_unit_check
    check (unit in ('g', 'kg', 'ml', 'l', 'unit')),
  current_stock numeric(14, 4) not null default 0,
  minimum_stock numeric(14, 4) not null default 0,
  average_cost numeric(14, 6) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_values_check
    check (current_stock >= 0 and minimum_stock >= 0 and average_cost >= 0)
);

create table public.ingredient_purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric(14, 4) not null,
  unit_cost numeric(14, 6) not null,
  total_cost numeric(14, 2) not null,
  supplier text,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_purchases_values_check
    check (quantity > 0 and unit_cost >= 0 and total_cost >= 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text,
  description text,
  price numeric(12, 2) not null,
  estimated_cost numeric(12, 2) not null default 0,
  gross_profit numeric(12, 2) not null default 0,
  gross_margin_percent numeric(7, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_values_check
    check (price > 0 and estimated_cost >= 0 and gross_margin_percent between -10000 and 100)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  yield_quantity numeric(12, 4) not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_product_key unique (product_id),
  constraint recipes_yield_check check (yield_quantity > 0)
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(14, 4) not null,
  unit text not null constraint recipe_items_unit_check
    check (unit in ('g', 'kg', 'ml', 'l', 'unit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_items_quantity_check check (quantity > 0),
  constraint recipe_items_recipe_ingredient_key unique (recipe_id, ingredient_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'pending' constraint orders_status_check
    check (status in ('pending', 'completed', 'cancelled')),
  payment_method text not null constraint orders_payment_method_check
    check (payment_method in ('credit_card', 'debit_card', 'cash', 'digital_wallet')),
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  estimated_cost numeric(12, 2) not null default 0,
  gross_profit numeric(12, 2) not null default 0,
  gross_margin_percent numeric(7, 2) not null default 0,
  stock_deducted boolean not null default false,
  notes text,
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_values_check check (
    subtotal >= 0 and discount >= 0 and discount <= subtotal and total >= 0
    and estimated_cost >= 0 and gross_margin_percent between -10000 and 100
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12, 4) not null,
  courtesy_quantity numeric(12, 4) not null default 0,
  unit_price numeric(12, 2) not null,
  unit_cost numeric(12, 2) not null,
  line_total numeric(12, 2) generated always as (round(quantity * unit_price, 2)) stored,
  line_cost numeric(12, 2) generated always as (
    round((quantity + courtesy_quantity) * unit_cost, 2)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_values_check check (
    quantity > 0 and courtesy_quantity >= 0 and unit_price >= 0 and unit_cost >= 0
  )
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  direction text not null constraint stock_movements_direction_check
    check (direction in ('in', 'out')),
  reason text not null constraint stock_movements_reason_check
    check (reason in ('purchase', 'order', 'restoration', 'adjustment')),
  quantity numeric(14, 4) not null,
  cost_at_time numeric(14, 6) not null default 0,
  reference_id uuid,
  created_at timestamptz not null default now(),
  constraint stock_movements_values_check check (quantity > 0 and cost_at_time >= 0)
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  adjustment_type text not null constraint stock_adjustments_type_check
    check (adjustment_type in ('add', 'remove', 'loss', 'correction')),
  quantity numeric(14, 4) not null,
  reason text not null,
  estimated_cost numeric(12, 2) not null default 0,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint stock_adjustments_values_check check (quantity > 0 and estimated_cost >= 0)
);

create unique index customers_company_phone_key
  on public.customers (company_id, regexp_replace(phone, '\D', '', 'g'))
  where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) > 0;
create unique index customers_company_email_key
  on public.customers (company_id, lower(email)) where email is not null;
create index customers_company_name_idx on public.customers (company_id, lower(name));
create unique index ingredients_company_name_key on public.ingredients (company_id, lower(name));
create unique index products_company_name_key on public.products (company_id, lower(name));

create index company_members_company_id_idx on public.company_members (company_id);
create index customers_company_id_idx on public.customers (company_id);
create index ingredients_company_id_idx on public.ingredients (company_id);
create index ingredient_purchases_company_date_idx
  on public.ingredient_purchases (company_id, purchased_at desc);
create index ingredient_purchases_ingredient_id_idx
  on public.ingredient_purchases (ingredient_id);
create index products_company_active_idx on public.products (company_id, is_active);
create index recipes_company_id_idx on public.recipes (company_id);
create index recipe_items_recipe_id_idx on public.recipe_items (recipe_id);
create index recipe_items_ingredient_id_idx on public.recipe_items (ingredient_id);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_company_status_date_idx on public.orders (company_id, status, ordered_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index stock_movements_company_date_idx
  on public.stock_movements (company_id, created_at desc);
create index stock_movements_ingredient_id_idx on public.stock_movements (ingredient_id);
create index stock_movements_reference_idx on public.stock_movements (reason, reference_id);
create index stock_adjustments_company_date_idx
  on public.stock_adjustments (company_id, occurred_at desc);
create index stock_adjustments_ingredient_id_idx on public.stock_adjustments (ingredient_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger company_members_set_updated_at before update on public.company_members
  for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger ingredients_set_updated_at before update on public.ingredients
  for each row execute function public.set_updated_at();
create trigger ingredient_purchases_set_updated_at before update on public.ingredient_purchases
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger recipes_set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();
create trigger recipe_items_set_updated_at before update on public.recipe_items
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger order_items_set_updated_at before update on public.order_items
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, 'Demo Admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select member.company_id
  from public.company_members member
  where member.user_id = (select auth.uid())
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.customers enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_purchases enable row level security;
alter table public.products enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_adjustments enable row level security;

create policy profiles_own_policy on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy companies_member_policy on public.companies
  for all to authenticated
  using (id = (select public.get_my_company_id()))
  with check (id = (select public.get_my_company_id()));
create policy company_members_own_policy on public.company_members
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy customers_tenant_policy on public.customers
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy ingredients_tenant_policy on public.ingredients
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy ingredient_purchases_tenant_policy on public.ingredient_purchases
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy products_tenant_policy on public.products
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy recipes_tenant_policy on public.recipes
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy recipe_items_tenant_policy on public.recipe_items
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy orders_tenant_policy on public.orders
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy order_items_tenant_policy on public.order_items
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy stock_movements_tenant_policy on public.stock_movements
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));
create policy stock_adjustments_tenant_policy on public.stock_adjustments
  for all to authenticated
  using (company_id = (select public.get_my_company_id()))
  with check (company_id = (select public.get_my_company_id()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on function public.get_my_company_id() from public;
grant execute on function public.get_my_company_id() to authenticated;

revoke all on all tables in schema public from anon;
