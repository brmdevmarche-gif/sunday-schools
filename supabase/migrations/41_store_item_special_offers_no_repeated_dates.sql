-- Tighten constraints: disallow repeated start/end timestamps per item.
-- User requirement: "repeated dates not allowed at all" + no repeated price.

alter table public.store_item_special_offers
  add constraint store_item_special_offers_unique_start unique (store_item_id, start_at);

alter table public.store_item_special_offers
  add constraint store_item_special_offers_unique_end unique (store_item_id, end_at);

