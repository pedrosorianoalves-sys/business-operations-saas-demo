-- BusinessOps Demo: short, tenant-scoped transactions for operational workflows.

create or replace function public.set_product_metrics()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.gross_profit = round(new.price - new.estimated_cost, 2);
  new.gross_margin_percent = case when new.price > 0
    then round(((new.price - new.estimated_cost) / new.price) * 100, 2) else 0 end;
  return new;
end;
$$;

create trigger products_calculate_metrics
  before insert or update of price, estimated_cost on public.products
  for each row execute function public.set_product_metrics();

create or replace function public.refresh_ingredient_products()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
begin
  if old.average_cost is not distinct from new.average_cost then return new; end if;
  for v_product_id in
    select product.id
    from public.products product
    join public.recipes recipe on recipe.product_id = product.id
    join public.recipe_items item on item.recipe_id = recipe.id
    where product.company_id = new.company_id and item.ingredient_id = new.id
  loop
    perform public._refresh_product_metrics(new.company_id, v_product_id);
  end loop;
  return new;
end;
$$;

create trigger ingredients_refresh_product_metrics
  after update of average_cost on public.ingredients
  for each row execute function public.refresh_ingredient_products();

create or replace function public.record_ingredient_purchase(
  p_ingredient_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_supplier text default null,
  p_purchased_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_ingredient public.ingredients%rowtype;
  v_purchase_id uuid;
  v_product_id uuid;
  v_average_cost numeric;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  if p_quantity <= 0 or p_unit_cost < 0 then
    raise exception 'Purchase quantity and cost are invalid.';
  end if;

  select * into v_ingredient from public.ingredients
  where id = p_ingredient_id and company_id = v_company_id
  for update;
  if not found then raise exception 'Ingredient was not found.'; end if;

  v_average_cost := case
    when v_ingredient.current_stock + p_quantity > 0 then
      ((v_ingredient.current_stock * v_ingredient.average_cost) + (p_quantity * p_unit_cost))
        / (v_ingredient.current_stock + p_quantity)
    else p_unit_cost
  end;

  insert into public.ingredient_purchases (
    company_id, ingredient_id, quantity, unit_cost, total_cost, supplier, purchased_at
  ) values (
    v_company_id, p_ingredient_id, p_quantity, p_unit_cost,
    round(p_quantity * p_unit_cost, 2), nullif(trim(p_supplier), ''), p_purchased_at
  ) returning id into v_purchase_id;

  update public.ingredients
  set current_stock = round(current_stock + p_quantity, 4),
      average_cost = round(v_average_cost, 6),
      supplier = coalesce(nullif(trim(p_supplier), ''), supplier)
  where id = p_ingredient_id and company_id = v_company_id;

  insert into public.stock_movements (
    company_id, ingredient_id, direction, reason, quantity, cost_at_time, reference_id
  ) values (
    v_company_id, p_ingredient_id, 'in', 'purchase', p_quantity, p_unit_cost, v_purchase_id
  );

  for v_product_id in
    select product.id
    from public.products product
    join public.recipes recipe on recipe.product_id = product.id
    join public.recipe_items item on item.recipe_id = recipe.id
    where product.company_id = v_company_id and item.ingredient_id = p_ingredient_id
  loop
    perform public._refresh_product_metrics(v_company_id, v_product_id);
  end loop;

  return v_purchase_id;
end;
$$;

create or replace function public.adjust_inventory(
  p_ingredient_id uuid,
  p_adjustment_type text,
  p_quantity numeric,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_ingredient public.ingredients%rowtype;
  v_adjustment_id uuid;
  v_direction text;
  v_new_stock numeric;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  if p_adjustment_type not in ('add', 'remove', 'loss', 'correction')
     or p_quantity <= 0 or length(trim(p_reason)) < 3 then
    raise exception 'Inventory adjustment is invalid.';
  end if;

  select * into v_ingredient from public.ingredients
  where id = p_ingredient_id and company_id = v_company_id
  for update;
  if not found then raise exception 'Ingredient was not found.'; end if;

  v_direction := case when p_adjustment_type = 'add' then 'in' else 'out' end;
  v_new_stock := case when v_direction = 'in'
    then v_ingredient.current_stock + p_quantity
    else v_ingredient.current_stock - p_quantity end;
  if v_new_stock < 0 then raise exception 'Adjustment would make stock negative.'; end if;

  insert into public.stock_adjustments (
    company_id, ingredient_id, adjustment_type, quantity, reason, estimated_cost
  ) values (
    v_company_id, p_ingredient_id, p_adjustment_type, p_quantity, trim(p_reason),
    round(p_quantity * v_ingredient.average_cost, 2)
  ) returning id into v_adjustment_id;

  update public.ingredients set current_stock = round(v_new_stock, 4)
  where id = p_ingredient_id and company_id = v_company_id;

  insert into public.stock_movements (
    company_id, ingredient_id, direction, reason, quantity, cost_at_time, reference_id
  ) values (
    v_company_id, p_ingredient_id, v_direction, 'adjustment', p_quantity,
    v_ingredient.average_cost, v_adjustment_id
  );

  return v_adjustment_id;
end;
$$;

create or replace function public.save_recipe(
  p_product_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_recipe_id uuid;
  v_item jsonb;
  v_ingredient public.ingredients%rowtype;
  v_unit text;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  if not exists (
    select 1 from public.products where id = p_product_id and company_id = v_company_id
  ) then raise exception 'Product was not found.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Recipe must include at least one ingredient.';
  end if;

  insert into public.recipes (company_id, product_id)
  values (v_company_id, p_product_id)
  on conflict (product_id) do update set updated_at = now()
  returning id into v_recipe_id;

  delete from public.recipe_items where recipe_id = v_recipe_id and company_id = v_company_id;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_ingredient from public.ingredients
    where id = (v_item->>'ingredientId')::uuid and company_id = v_company_id;
    if not found then raise exception 'Recipe ingredient was not found.'; end if;
    v_unit := coalesce(nullif(v_item->>'unit', ''), v_ingredient.unit);
    perform public._convert_quantity((v_item->>'quantity')::numeric, v_unit, v_ingredient.unit);
    insert into public.recipe_items (
      company_id, recipe_id, ingredient_id, quantity, unit
    ) values (
      v_company_id, v_recipe_id, v_ingredient.id,
      (v_item->>'quantity')::numeric, v_unit
    );
  end loop;

  perform public._refresh_product_metrics(v_company_id, p_product_id);
  return v_recipe_id;
end;
$$;

create or replace function public.create_demo_order(
  p_customer_id uuid,
  p_payment_method text,
  p_status text,
  p_items jsonb,
  p_discount numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_subtotal numeric;
  v_cost numeric;
  v_total numeric;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  if p_payment_method not in ('credit_card', 'debit_card', 'cash', 'digital_wallet')
     or p_status not in ('pending', 'completed')
     or p_discount < 0 then raise exception 'Order details are invalid.'; end if;
  if not exists (
    select 1 from public.customers where id = p_customer_id and company_id = v_company_id
  ) then raise exception 'Customer was not found.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must include at least one item.';
  end if;

  insert into public.orders (
    company_id, customer_id, status, payment_method, discount, notes
  ) values (
    v_company_id, p_customer_id, 'pending', p_payment_method, p_discount, nullif(trim(p_notes), '')
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products
    where id = (v_item->>'productId')::uuid and company_id = v_company_id and is_active;
    if not found then raise exception 'Order product was not found.'; end if;
    insert into public.order_items (
      company_id, order_id, product_id, quantity, courtesy_quantity, unit_price, unit_cost
    ) values (
      v_company_id, v_order_id, v_product.id, (v_item->>'quantity')::numeric,
      coalesce((v_item->>'courtesyQuantity')::numeric, 0), v_product.price, v_product.estimated_cost
    );
  end loop;

  select round(sum(line_total), 2), round(sum(line_cost), 2)
  into v_subtotal, v_cost from public.order_items where order_id = v_order_id;
  if p_discount > v_subtotal then raise exception 'Discount cannot exceed subtotal.'; end if;
  v_total := round(v_subtotal - p_discount, 2);
  update public.orders
  set subtotal = v_subtotal, total = v_total, estimated_cost = v_cost,
      gross_profit = round(v_total - v_cost, 2),
      gross_margin_percent = case when v_total > 0
        then round(((v_total - v_cost) / v_total) * 100, 2) else 0 end
  where id = v_order_id;

  if p_status = 'completed' then perform public._complete_order(v_company_id, v_order_id); end if;
  return v_order_id;
end;
$$;

create or replace function public.delete_recipe(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_product_id uuid;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  select product_id into v_product_id from public.recipes
  where id = p_recipe_id and company_id = v_company_id
  for update;
  if not found then raise exception 'Recipe was not found.'; end if;

  if exists (
    select 1 from public.order_items item
    join public.orders demo_order on demo_order.id = item.order_id
    where item.company_id = v_company_id
      and item.product_id = v_product_id
      and demo_order.status = 'pending'
  ) then raise exception 'Recipe is used by a pending order and cannot be deleted.'; end if;

  delete from public.recipes where id = p_recipe_id and company_id = v_company_id;
  update public.products set estimated_cost = 0
  where id = v_product_id and company_id = v_company_id;
end;
$$;

revoke all on function public.record_ingredient_purchase(uuid, numeric, numeric, text, timestamptz) from public;
revoke all on function public.adjust_inventory(uuid, text, numeric, text) from public;
revoke all on function public.save_recipe(uuid, jsonb) from public;
revoke all on function public.create_demo_order(uuid, text, text, jsonb, numeric, text) from public;
revoke all on function public.delete_recipe(uuid) from public;
revoke all on function public.refresh_ingredient_products() from public;

grant execute on function public.record_ingredient_purchase(uuid, numeric, numeric, text, timestamptz) to authenticated;
grant execute on function public.adjust_inventory(uuid, text, numeric, text) to authenticated;
grant execute on function public.save_recipe(uuid, jsonb) to authenticated;
grant execute on function public.create_demo_order(uuid, text, text, jsonb, numeric, text) to authenticated;
grant execute on function public.delete_recipe(uuid) to authenticated;
