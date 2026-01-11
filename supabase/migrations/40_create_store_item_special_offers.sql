-- Create a dedicated table for multiple special offers per store item
-- Requirements:
-- - Multiple offers per item (array-like)
-- - No duplicate price per item
-- - No duplicate exact range per item
-- - No overlapping ranges per item

create extension if not exists btree_gist;

create table if not exists public.store_item_special_offers (
  id uuid primary key default gen_random_uuid(),
  store_item_id uuid not null references public.store_items(id) on delete cascade,
  price integer not null check (price >= 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_item_special_offers_valid_range check (end_at > start_at),
  constraint store_item_special_offers_unique_price unique (store_item_id, price),
  constraint store_item_special_offers_unique_range unique (store_item_id, start_at, end_at),
  constraint store_item_special_offers_no_overlap exclude using gist (
    store_item_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
);

create index if not exists store_item_special_offers_store_item_id_idx
  on public.store_item_special_offers (store_item_id);

create index if not exists store_item_special_offers_range_gist
  on public.store_item_special_offers
  using gist (store_item_id, tstzrange(start_at, end_at, '[)'));

-- Basic RLS: students/admins need to read offers for item pricing display.
alter table public.store_item_special_offers enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'store_item_special_offers'
      and policyname = 'store_item_special_offers_select_authenticated'
  ) then
    create policy store_item_special_offers_select_authenticated
      on public.store_item_special_offers
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Migrate existing single-offer columns (if present) into the new table
insert into public.store_item_special_offers (store_item_id, price, start_at, end_at)
select
  id as store_item_id,
  special_price as price,
  special_price_start_at as start_at,
  special_price_end_at as end_at
from public.store_items
where
  special_price is not null
  and special_price_start_at is not null
  and special_price_end_at is not null
on conflict do nothing;

