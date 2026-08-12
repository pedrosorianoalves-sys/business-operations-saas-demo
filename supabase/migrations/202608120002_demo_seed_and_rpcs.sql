-- BusinessOps Demo: transactional behavior, fictional seed, import, and reset.

create or replace function public._convert_quantity(
  p_quantity numeric,
  p_source_unit text,
  p_target_unit text
)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.';
  end if;
  if p_source_unit = p_target_unit then return p_quantity; end if;
  if p_source_unit = 'g' and p_target_unit = 'kg' then return p_quantity / 1000; end if;
  if p_source_unit = 'kg' and p_target_unit = 'g' then return p_quantity * 1000; end if;
  if p_source_unit = 'ml' and p_target_unit = 'l' then return p_quantity / 1000; end if;
  if p_source_unit = 'l' and p_target_unit = 'ml' then return p_quantity * 1000; end if;
  raise exception 'Recipe unit % is incompatible with ingredient unit %.', p_source_unit, p_target_unit;
end;
$$;

create or replace function public._refresh_product_metrics(
  p_company_id uuid,
  p_product_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost numeric := 0;
begin
  select coalesce(sum(
    public._convert_quantity(item.quantity, item.unit, ingredient.unit)
      * ingredient.average_cost
  ), 0)
  into v_cost
  from public.recipes recipe
  join public.recipe_items item on item.recipe_id = recipe.id
  join public.ingredients ingredient on ingredient.id = item.ingredient_id
  where recipe.company_id = p_company_id
    and recipe.product_id = p_product_id;

  update public.products product
  set estimated_cost = round(v_cost, 2),
      gross_profit = round(product.price - v_cost, 2),
      gross_margin_percent = case
        when product.price > 0 then round(((product.price - v_cost) / product.price) * 100, 2)
        else 0
      end
  where product.id = p_product_id
    and product.company_id = p_company_id;
end;
$$;

create or replace function public._complete_order(
  p_company_id uuid,
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_required record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id and company_id = p_company_id
  for update;

  if not found then raise exception 'Order was not found.'; end if;
  if v_order.status = 'completed' then return; end if;
  if v_order.status = 'cancelled' then raise exception 'Cancelled orders cannot be completed.'; end if;

  if not exists (
    select 1 from public.order_items
    where order_id = p_order_id and company_id = p_company_id
  ) then
    raise exception 'Order must include at least one item.';
  end if;

  if exists (
    select 1
    from public.order_items order_item
    left join public.recipes recipe
      on recipe.product_id = order_item.product_id
     and recipe.company_id = p_company_id
    where order_item.order_id = p_order_id
      and order_item.company_id = p_company_id
      and recipe.id is null
  ) then
    raise exception 'Every completed order product must have a recipe.';
  end if;

  perform ingredient.id
  from public.ingredients ingredient
  where ingredient.id in (
    select recipe_item.ingredient_id
    from public.order_items order_item
    join public.recipes recipe
      on recipe.product_id = order_item.product_id
     and recipe.company_id = p_company_id
    join public.recipe_items recipe_item on recipe_item.recipe_id = recipe.id
    where order_item.order_id = p_order_id
      and order_item.company_id = p_company_id
  )
  order by ingredient.id
  for update;

  for v_required in
    select
      ingredient.id as ingredient_id,
      ingredient.name,
      ingredient.current_stock,
      ingredient.average_cost,
      round(sum(
        public._convert_quantity(recipe_item.quantity, recipe_item.unit, ingredient.unit)
          * (order_item.quantity + order_item.courtesy_quantity)
      ), 4) as quantity
    from public.order_items order_item
    join public.recipes recipe
      on recipe.product_id = order_item.product_id
     and recipe.company_id = p_company_id
    join public.recipe_items recipe_item on recipe_item.recipe_id = recipe.id
    join public.ingredients ingredient on ingredient.id = recipe_item.ingredient_id
    where order_item.order_id = p_order_id
      and order_item.company_id = p_company_id
    group by ingredient.id, ingredient.name, ingredient.current_stock, ingredient.average_cost
    order by ingredient.id
  loop
    if v_required.current_stock < v_required.quantity then
      raise exception 'Insufficient stock for %.', v_required.name;
    end if;

    update public.ingredients
    set current_stock = round(current_stock - v_required.quantity, 4)
    where id = v_required.ingredient_id and company_id = p_company_id;

    insert into public.stock_movements (
      company_id, ingredient_id, direction, reason, quantity, cost_at_time, reference_id
    ) values (
      p_company_id, v_required.ingredient_id, 'out', 'order',
      v_required.quantity, v_required.average_cost, p_order_id
    );
  end loop;

  update public.orders
  set status = 'completed', stock_deducted = true
  where id = p_order_id and company_id = p_company_id;

  if v_order.customer_id is not null then
    update public.customers
    set total_spent = round(total_spent + v_order.total, 2),
        total_orders = total_orders + 1,
        last_order_at = greatest(coalesce(last_order_at, v_order.ordered_at), v_order.ordered_at)
    where id = v_order.customer_id and company_id = p_company_id;
  end if;
end;
$$;

create or replace function public.mark_order_paid(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  perform public._complete_order(v_company_id, p_order_id);
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_order public.orders%rowtype;
  v_movement record;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;

  select * into v_order
  from public.orders
  where id = p_order_id and company_id = v_company_id
  for update;

  if not found then raise exception 'Order was not found.'; end if;
  if v_order.status = 'cancelled' then return; end if;

  if v_order.stock_deducted then
    for v_movement in
      select * from public.stock_movements
      where company_id = v_company_id
        and reference_id = p_order_id
        and reason = 'order'
        and direction = 'out'
      order by ingredient_id
    loop
      update public.ingredients
      set current_stock = round(current_stock + v_movement.quantity, 4)
      where id = v_movement.ingredient_id and company_id = v_company_id;

      insert into public.stock_movements (
        company_id, ingredient_id, direction, reason, quantity, cost_at_time, reference_id
      ) values (
        v_company_id, v_movement.ingredient_id, 'in', 'restoration',
        v_movement.quantity, v_movement.cost_at_time, p_order_id
      );
    end loop;

    if v_order.customer_id is not null then
      update public.customers
      set total_spent = round(greatest(0, total_spent - v_order.total), 2),
          total_orders = greatest(0, total_orders - 1),
          last_order_at = (
            select max(other_order.ordered_at)
            from public.orders other_order
            where other_order.company_id = v_company_id
              and other_order.customer_id = v_order.customer_id
              and other_order.id <> p_order_id
              and other_order.status = 'completed'
          )
      where id = v_order.customer_id and company_id = v_company_id;
    end if;
  end if;

  update public.orders
  set status = 'cancelled', stock_deducted = false
  where id = p_order_id and company_id = v_company_id;
end;
$$;

create or replace function public._resolve_or_create_customer(
  p_company_id uuid,
  p_customer jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(trim(p_customer->>'name'), '');
  v_phone text := nullif(regexp_replace(coalesce(p_customer->>'phone', ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_customer->>'email', ''))), '');
  v_phone_ids uuid[] := array[]::uuid[];
  v_email_ids uuid[] := array[]::uuid[];
  v_name_ids uuid[] := array[]::uuid[];
  v_customer_id uuid;
begin
  if v_name is null then raise exception 'Customer name is required.'; end if;

  if v_phone is not null then
    select coalesce(array_agg(id order by id), array[]::uuid[]) into v_phone_ids
    from public.customers
    where company_id = p_company_id
      and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone;
  end if;
  if v_email is not null then
    select coalesce(array_agg(id order by id), array[]::uuid[]) into v_email_ids
    from public.customers
    where company_id = p_company_id and lower(email) = v_email;
  end if;

  if cardinality(v_phone_ids) > 1 then
    raise exception 'More than one customer has this phone number.';
  end if;
  if cardinality(v_email_ids) > 1 then
    raise exception 'More than one customer has this email address.';
  end if;
  if cardinality(v_phone_ids) = 1 and cardinality(v_email_ids) = 1
     and v_phone_ids[1] <> v_email_ids[1] then
    raise exception 'Phone and email match different customers.';
  end if;

  v_customer_id := coalesce(v_phone_ids[1], v_email_ids[1]);

  if v_customer_id is null and v_phone is null and v_email is null then
    select coalesce(array_agg(id order by id), array[]::uuid[]) into v_name_ids
    from public.customers
    where company_id = p_company_id
      and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) =
          lower(regexp_replace(v_name, '\s+', ' ', 'g'));
    if cardinality(v_name_ids) > 1 then
      raise exception 'More than one customer has this full name.';
    end if;
    v_customer_id := v_name_ids[1];
  end if;

  if v_customer_id is null then
    insert into public.customers (company_id, name, phone, email)
    values (p_company_id, v_name, v_phone, v_email)
    returning id into v_customer_id;
  else
    update public.customers
    set name = v_name,
        phone = coalesce(v_phone, phone),
        email = coalesce(v_email, email)
    where id = v_customer_id and company_id = p_company_id;
  end if;

  return v_customer_id;
end;
$$;

create or replace function public._seed_demo_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_customer_id uuid;
  v_product public.products%rowtype;
  v_status text;
  v_primary_name text;
  v_shake_name text;
  v_subtotal numeric;
  v_cost numeric;
  v_index integer;
begin
  insert into public.customers (company_id, name, phone, email)
  values
    (p_company_id, 'Emma Collins', '15550101001', 'emma.collins@example.com'),
    (p_company_id, 'Daniel Brooks', '15550101002', 'daniel.brooks@example.com'),
    (p_company_id, 'Olivia Turner', '15550101003', 'olivia.turner@example.com'),
    (p_company_id, 'Ethan Parker', '15550101004', 'ethan.parker@example.com'),
    (p_company_id, 'Sophia Bennett', '15550101005', 'sophia.bennett@example.com'),
    (p_company_id, 'Noah Reed', '15550101006', 'noah.reed@example.com'),
    (p_company_id, 'Ava Mitchell', '15550101007', 'ava.mitchell@example.com'),
    (p_company_id, 'Liam Foster', '15550101008', 'liam.foster@example.com'),
    (p_company_id, 'Mia Harper', '15550101009', 'mia.harper@example.com'),
    (p_company_id, 'Lucas Grant', '15550101010', 'lucas.grant@example.com'),
    (p_company_id, 'Isabella Ward', '15550101011', 'isabella.ward@example.com'),
    (p_company_id, 'Henry Cooper', '15550101012', 'henry.cooper@example.com'),
    (p_company_id, 'Amelia Ross', '15550101013', 'amelia.ross@example.com'),
    (p_company_id, 'James Wilson', '15550101014', 'james.wilson@example.com'),
    (p_company_id, 'Charlotte Hayes', '15550101015', 'charlotte.hayes@example.com'),
    (p_company_id, 'Benjamin Price', '15550101016', 'benjamin.price@example.com'),
    (p_company_id, 'Harper Stone', '15550101017', 'harper.stone@example.com'),
    (p_company_id, 'Alexander King', '15550101018', 'alexander.king@example.com'),
    (p_company_id, 'Evelyn Scott', '15550101019', 'evelyn.scott@example.com'),
    (p_company_id, 'Michael Lane', '15550101020', 'michael.lane@example.com'),
    (p_company_id, 'Abigail Moore', '15550101021', 'abigail.moore@example.com'),
    (p_company_id, 'Samuel Clark', '15550101022', 'samuel.clark@example.com'),
    (p_company_id, 'Ella Adams', '15550101023', 'ella.adams@example.com'),
    (p_company_id, 'Jack Morris', '15550101024', 'jack.morris@example.com'),
    (p_company_id, 'Grace Bell', '15550101025', 'grace.bell@example.com');

  insert into public.ingredients (
    company_id, name, unit, current_stock, minimum_stock, average_cost, supplier
  ) values
    (p_company_id, 'Burger Bun', 'unit', 500, 80, 0.72, 'Demo Bakery Co.'),
    (p_company_id, 'Beef Patty', 'unit', 420, 60, 1.85, 'Demo Protein Co.'),
    (p_company_id, 'Chicken Fillet', 'unit', 300, 45, 1.62, 'Demo Protein Co.'),
    (p_company_id, 'Veggie Patty', 'unit', 220, 35, 1.48, 'Demo Plant Foods'),
    (p_company_id, 'Cheddar Cheese', 'unit', 760, 100, 0.38, 'Demo Dairy Co.'),
    (p_company_id, 'Lettuce', 'g', 60000, 8000, 0.0041, 'Demo Produce Co.'),
    (p_company_id, 'Tomato', 'g', 75000, 9000, 0.0048, 'Demo Produce Co.'),
    (p_company_id, 'Red Onion', 'g', 50000, 6000, 0.0036, 'Demo Produce Co.'),
    (p_company_id, 'Pickles', 'g', 42000, 5500, 0.0062, 'Demo Pantry Co.'),
    (p_company_id, 'Burger Sauce', 'ml', 70000, 8000, 0.0075, 'Demo Pantry Co.'),
    (p_company_id, 'Potato', 'kg', 320, 45, 1.15, 'Demo Produce Co.'),
    (p_company_id, 'Vegetable Oil', 'l', 90, 14, 2.25, 'Demo Pantry Co.'),
    (p_company_id, 'Salt', 'g', 30000, 3500, 0.0012, 'Demo Pantry Co.'),
    (p_company_id, 'Milk', 'l', 130, 18, 1.10, 'Demo Dairy Co.'),
    (p_company_id, 'Vanilla Ice Cream', 'l', 120, 18, 3.15, 'Demo Dairy Co.'),
    (p_company_id, 'Chocolate Syrup', 'ml', 60000, 7000, 0.0088, 'Demo Pantry Co.'),
    (p_company_id, 'Lemonade Base', 'l', 90, 12, 2.05, 'Demo Beverage Co.'),
    (p_company_id, 'Soft Drink Can', 'unit', 420, 60, 0.68, 'Demo Beverage Co.');

  insert into public.ingredient_purchases (
    company_id, ingredient_id, quantity, unit_cost, total_cost, supplier, purchased_at
  )
  select p_company_id, ingredient.id, ingredient.current_stock, ingredient.average_cost,
         round(ingredient.current_stock * ingredient.average_cost, 2),
         ingredient.supplier, now() - interval '35 days'
  from public.ingredients ingredient
  where ingredient.company_id = p_company_id;

  insert into public.stock_movements (
    company_id, ingredient_id, direction, reason, quantity, cost_at_time, reference_id, created_at
  )
  select purchase.company_id, purchase.ingredient_id, 'in', 'purchase', purchase.quantity,
         purchase.unit_cost, purchase.id, purchase.purchased_at
  from public.ingredient_purchases purchase
  where purchase.company_id = p_company_id;

  insert into public.products (company_id, name, category, description, price)
  values
    (p_company_id, 'Classic Cheeseburger', 'Burgers', 'Single beef patty with cheddar and crisp vegetables.', 12.90),
    (p_company_id, 'Double Smash Burger', 'Burgers', 'Two seared patties, double cheddar, pickles, and house sauce.', 16.90),
    (p_company_id, 'Crispy Chicken Sandwich', 'Sandwiches', 'Crispy chicken fillet with lettuce, tomato, and house sauce.', 13.50),
    (p_company_id, 'Veggie Burger', 'Burgers', 'Plant-based patty with fresh vegetables and house sauce.', 11.90),
    (p_company_id, 'French Fries', 'Sides', 'Golden fries finished with fine salt.', 4.50),
    (p_company_id, 'Loaded Fries', 'Sides', 'Fries topped with cheddar and house sauce.', 7.90),
    (p_company_id, 'Chocolate Shake', 'Beverages', 'Vanilla ice cream, milk, and chocolate syrup.', 6.90),
    (p_company_id, 'Vanilla Shake', 'Beverages', 'Classic vanilla ice cream blended with milk.', 6.50),
    (p_company_id, 'Soft Drink', 'Beverages', 'Chilled canned soft drink.', 3.50),
    (p_company_id, 'House Lemonade', 'Beverages', 'House lemonade served over ice.', 4.90);

  insert into public.recipes (company_id, product_id)
  select p_company_id, product.id
  from public.products product
  where product.company_id = p_company_id;

  insert into public.recipe_items (
    company_id, recipe_id, ingredient_id, quantity, unit
  )
  select p_company_id, recipe.id, ingredient.id, recipe_data.quantity, recipe_data.unit
  from (values
    ('Classic Cheeseburger', 'Burger Bun', 1::numeric, 'unit'),
    ('Classic Cheeseburger', 'Beef Patty', 1, 'unit'),
    ('Classic Cheeseburger', 'Cheddar Cheese', 1, 'unit'),
    ('Classic Cheeseburger', 'Lettuce', 15, 'g'),
    ('Classic Cheeseburger', 'Tomato', 20, 'g'),
    ('Classic Cheeseburger', 'Red Onion', 10, 'g'),
    ('Classic Cheeseburger', 'Pickles', 8, 'g'),
    ('Classic Cheeseburger', 'Burger Sauce', 15, 'ml'),
    ('Double Smash Burger', 'Burger Bun', 1, 'unit'),
    ('Double Smash Burger', 'Beef Patty', 2, 'unit'),
    ('Double Smash Burger', 'Cheddar Cheese', 2, 'unit'),
    ('Double Smash Burger', 'Red Onion', 12, 'g'),
    ('Double Smash Burger', 'Pickles', 10, 'g'),
    ('Double Smash Burger', 'Burger Sauce', 20, 'ml'),
    ('Crispy Chicken Sandwich', 'Burger Bun', 1, 'unit'),
    ('Crispy Chicken Sandwich', 'Chicken Fillet', 1, 'unit'),
    ('Crispy Chicken Sandwich', 'Lettuce', 18, 'g'),
    ('Crispy Chicken Sandwich', 'Tomato', 20, 'g'),
    ('Crispy Chicken Sandwich', 'Burger Sauce', 15, 'ml'),
    ('Veggie Burger', 'Burger Bun', 1, 'unit'),
    ('Veggie Burger', 'Veggie Patty', 1, 'unit'),
    ('Veggie Burger', 'Lettuce', 15, 'g'),
    ('Veggie Burger', 'Tomato', 20, 'g'),
    ('Veggie Burger', 'Red Onion', 10, 'g'),
    ('Veggie Burger', 'Burger Sauce', 12, 'ml'),
    ('French Fries', 'Potato', 0.18, 'kg'),
    ('French Fries', 'Vegetable Oil', 0.025, 'l'),
    ('French Fries', 'Salt', 2, 'g'),
    ('Loaded Fries', 'Potato', 0.22, 'kg'),
    ('Loaded Fries', 'Vegetable Oil', 0.03, 'l'),
    ('Loaded Fries', 'Salt', 2.5, 'g'),
    ('Loaded Fries', 'Cheddar Cheese', 2, 'unit'),
    ('Loaded Fries', 'Burger Sauce', 15, 'ml'),
    ('Chocolate Shake', 'Milk', 0.25, 'l'),
    ('Chocolate Shake', 'Vanilla Ice Cream', 0.30, 'l'),
    ('Chocolate Shake', 'Chocolate Syrup', 30, 'ml'),
    ('Vanilla Shake', 'Milk', 0.25, 'l'),
    ('Vanilla Shake', 'Vanilla Ice Cream', 0.32, 'l'),
    ('Soft Drink', 'Soft Drink Can', 1, 'unit'),
    ('House Lemonade', 'Lemonade Base', 0.08, 'l')
  ) as recipe_data(product_name, ingredient_name, quantity, unit)
  join public.products product
    on product.company_id = p_company_id and product.name = recipe_data.product_name
  join public.recipes recipe on recipe.product_id = product.id
  join public.ingredients ingredient
    on ingredient.company_id = p_company_id and ingredient.name = recipe_data.ingredient_name;

  for v_product in
    select * from public.products where company_id = p_company_id order by id
  loop
    perform public._refresh_product_metrics(p_company_id, v_product.id);
  end loop;

  for v_index in 1..72 loop
    select customer.id into v_customer_id
    from public.customers customer
    where customer.company_id = p_company_id
    order by customer.name
    limit 1 offset ((v_index - 1) % 25);

    v_status := case
      when v_index % 11 = 0 then 'cancelled'
      when v_index % 7 = 0 then 'pending'
      else 'completed'
    end;
    v_primary_name := (array[
      'Classic Cheeseburger', 'Double Smash Burger',
      'Crispy Chicken Sandwich', 'Veggie Burger'
    ]::text[])[((v_index - 1) % 4) + 1];

    insert into public.orders (
      company_id, customer_id, status, payment_method, ordered_at
    ) values (
      p_company_id,
      v_customer_id,
      case when v_status = 'cancelled' then 'cancelled' else 'pending' end,
      (array['credit_card', 'debit_card', 'cash', 'digital_wallet']::text[])
        [((v_index - 1) % 4) + 1],
      now() - (((72 - v_index) % 28) * interval '1 day') - ((v_index % 8) * interval '1 hour')
    ) returning id into v_order_id;

    select * into v_product from public.products
    where company_id = p_company_id and name = v_primary_name;
    insert into public.order_items (
      company_id, order_id, product_id, quantity, unit_price, unit_cost
    ) values (
      p_company_id, v_order_id, v_product.id, 1 + (v_index % 2),
      v_product.price, v_product.estimated_cost
    );

    if v_index % 2 = 0 then
      select * into v_product from public.products
      where company_id = p_company_id and name = 'French Fries';
      insert into public.order_items (
        company_id, order_id, product_id, quantity, unit_price, unit_cost
      ) values (
        p_company_id, v_order_id, v_product.id, 1, v_product.price, v_product.estimated_cost
      );
    end if;

    if v_index % 3 = 0 then
      v_shake_name := case when v_index % 2 = 0 then 'Chocolate Shake' else 'Vanilla Shake' end;
      select * into v_product from public.products
      where company_id = p_company_id and name = v_shake_name;
      insert into public.order_items (
        company_id, order_id, product_id, quantity, unit_price, unit_cost
      ) values (
        p_company_id, v_order_id, v_product.id, 1, v_product.price, v_product.estimated_cost
      );
    end if;

    select round(sum(line_total), 2), round(sum(line_cost), 2)
    into v_subtotal, v_cost
    from public.order_items where order_id = v_order_id;

    update public.orders
    set subtotal = v_subtotal,
        total = v_subtotal,
        estimated_cost = v_cost,
        gross_profit = round(v_subtotal - v_cost, 2),
        gross_margin_percent = round(((v_subtotal - v_cost) / v_subtotal) * 100, 2)
    where id = v_order_id;

    if v_status = 'completed' then
      perform public._complete_order(p_company_id, v_order_id);
    end if;
  end loop;

  update public.ingredients
  set minimum_stock = case
    when name in ('Lettuce', 'Pickles', 'Chocolate Syrup', 'Lemonade Base')
      then current_stock + case when unit in ('g', 'ml') then 500 else 5 end
    else least(minimum_stock, greatest(0, current_stock * 0.2))
  end
  where company_id = p_company_id;
end;
$$;

create or replace function public.bootstrap_demo_workspace()
returns table (company_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
begin
  if v_user_id is null then raise exception 'Anonymous session is required.'; end if;

  insert into public.profiles (id, full_name)
  values (v_user_id, 'Demo Admin')
  on conflict (id) do nothing;

  select member.company_id into v_company_id
  from public.company_members member
  where member.user_id = v_user_id;

  if v_company_id is null then
    insert into public.companies (name, slug)
    values (
      'BusinessOps Demo',
      'businessops-' || left(replace(v_user_id::text, '-', ''), 16)
    ) returning id into v_company_id;

    insert into public.company_members (company_id, user_id, role)
    values (v_company_id, v_user_id, 'admin');

    perform public._seed_demo_company(v_company_id);
  end if;

  return query select v_company_id;
end;
$$;

create or replace function public.reset_demo_workspace()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;

  delete from public.stock_movements where company_id = v_company_id;
  delete from public.stock_adjustments where company_id = v_company_id;
  delete from public.orders where company_id = v_company_id;
  delete from public.customers where company_id = v_company_id;
  delete from public.products where company_id = v_company_id;
  delete from public.ingredient_purchases where company_id = v_company_id;
  delete from public.ingredients where company_id = v_company_id;

  perform public._seed_demo_company(v_company_id);

  return jsonb_build_object(
    'customers', 25,
    'ingredients', 18,
    'products', 10,
    'recipes', 10,
    'purchases', 18,
    'orders', 72
  );
end;
$$;

create or replace function public.import_demo_payload(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_row jsonb;
  v_item jsonb;
  v_entity_id uuid;
  v_product_id uuid;
  v_recipe_id uuid;
  v_customer_id uuid;
  v_order_id uuid;
  v_product public.products%rowtype;
  v_name text;
  v_unit text;
  v_existing_unit text;
  v_status text;
  v_subtotal numeric;
  v_cost numeric;
  v_before_customers integer;
  v_before_products integer;
  v_before_ingredients integer;
  v_created_customers integer;
  v_created_products integer;
  v_created_ingredients integer;
  v_orders_created integer := 0;
  v_recipe_count integer := 0;
begin
  if v_company_id is null then raise exception 'Demo workspace was not found.'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Import payload must be an object.';
  end if;

  select count(*) into v_before_customers from public.customers where company_id = v_company_id;
  select count(*) into v_before_products from public.products where company_id = v_company_id;
  select count(*) into v_before_ingredients from public.ingredients where company_id = v_company_id;

  for v_row in select value from jsonb_array_elements(coalesce(p_payload->'ingredients', '[]'::jsonb))
  loop
    v_name := nullif(trim(v_row->>'name'), '');
    v_unit := v_row->>'unit';
    if v_name is null or v_unit not in ('g', 'kg', 'ml', 'l', 'unit') then
      raise exception 'Ingredient name or unit is invalid.';
    end if;
    select id, unit into v_entity_id, v_existing_unit from public.ingredients
    where company_id = v_company_id and lower(name) = lower(v_name);
    if v_entity_id is null then
      insert into public.ingredients (
        company_id, name, unit, current_stock, minimum_stock, average_cost
      ) values (
        v_company_id, v_name, v_unit,
        coalesce((v_row->>'currentStock')::numeric, 0),
        coalesce((v_row->>'minimumStock')::numeric, 0),
        coalesce((v_row->>'cost')::numeric, 0)
      ) returning id into v_entity_id;
    else
      if v_existing_unit <> v_unit then
        raise exception 'Existing ingredient unit cannot be changed from % to %.',
          v_existing_unit, v_unit;
      end if;
      update public.ingredients
      set current_stock = coalesce((v_row->>'currentStock')::numeric, current_stock),
          minimum_stock = coalesce((v_row->>'minimumStock')::numeric, minimum_stock),
          average_cost = coalesce((v_row->>'cost')::numeric, average_cost)
      where id = v_entity_id and company_id = v_company_id;
    end if;
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_payload->'products', '[]'::jsonb))
  loop
    v_name := nullif(trim(v_row->>'name'), '');
    if v_name is null or coalesce((v_row->>'price')::numeric, 0) <= 0 then
      raise exception 'Product name or price is invalid.';
    end if;
    select id into v_entity_id from public.products
    where company_id = v_company_id and lower(name) = lower(v_name);
    if v_entity_id is null then
      insert into public.products (company_id, name, category, price)
      values (v_company_id, v_name, nullif(v_row->>'category', ''), (v_row->>'price')::numeric)
      returning id into v_entity_id;
    else
      update public.products
      set category = nullif(v_row->>'category', ''), price = (v_row->>'price')::numeric
      where id = v_entity_id and company_id = v_company_id;
    end if;
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_payload->'customers', '[]'::jsonb))
  loop
    perform public._resolve_or_create_customer(v_company_id, v_row);
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_payload->'recipes', '[]'::jsonb))
  loop
    v_name := nullif(trim(v_row->>'product'), '');
    select id into v_product_id from public.products
    where company_id = v_company_id and lower(name) = lower(v_name);
    if v_product_id is null then raise exception 'Recipe product % was not found.', v_name; end if;

    insert into public.recipes (company_id, product_id)
    values (v_company_id, v_product_id)
    on conflict (product_id) do update set updated_at = now()
    returning id into v_recipe_id;

    delete from public.recipe_items
    where recipe_id = v_recipe_id and company_id = v_company_id;

    for v_item in select value from jsonb_array_elements(coalesce(v_row->'ingredients', '[]'::jsonb))
    loop
      v_name := nullif(trim(v_item->>'ingredient'), '');
      select id, unit into v_entity_id, v_unit from public.ingredients
      where company_id = v_company_id and lower(name) = lower(v_name);
      if v_entity_id is null then raise exception 'Recipe ingredient % was not found.', v_name; end if;
      perform public._convert_quantity(
        (v_item->>'quantity')::numeric,
        coalesce(nullif(v_item->>'unit', ''), v_unit),
        v_unit
      );
      insert into public.recipe_items (
        company_id, recipe_id, ingredient_id, quantity, unit
      ) values (
        v_company_id, v_recipe_id, v_entity_id, (v_item->>'quantity')::numeric,
        coalesce(nullif(v_item->>'unit', ''), v_unit)
      );
    end loop;
    perform public._refresh_product_metrics(v_company_id, v_product_id);
    v_recipe_count := v_recipe_count + 1;
  end loop;

  for v_product in
    select * from public.products where company_id = v_company_id order by id
  loop
    perform public._refresh_product_metrics(v_company_id, v_product.id);
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_payload->'orders', '[]'::jsonb))
  loop
    v_customer_id := public._resolve_or_create_customer(v_company_id, v_row->'customer');
    v_status := v_row->>'status';
    if v_status not in ('pending', 'completed', 'cancelled') then
      raise exception 'Order status is invalid.';
    end if;

    insert into public.orders (
      company_id, customer_id, status, payment_method, ordered_at
    ) values (
      v_company_id, v_customer_id,
      case when v_status = 'cancelled' then 'cancelled' else 'pending' end,
      v_row->>'paymentMethod',
      coalesce(nullif(v_row->>'orderedAt', '')::timestamptz, now())
    ) returning id into v_order_id;

    for v_item in select value from jsonb_array_elements(coalesce(v_row->'items', '[]'::jsonb))
    loop
      v_name := nullif(trim(v_item->>'product'), '');
      select * into v_product from public.products
      where company_id = v_company_id and lower(name) = lower(v_name);
      if not found then raise exception 'Order product % was not found.', v_name; end if;
      insert into public.order_items (
        company_id, order_id, product_id, quantity, unit_price, unit_cost
      ) values (
        v_company_id, v_order_id, v_product.id, (v_item->>'quantity')::numeric,
        coalesce((v_item->>'unitPrice')::numeric, v_product.price), v_product.estimated_cost
      );
    end loop;

    select round(sum(line_total), 2), round(sum(line_cost), 2)
    into v_subtotal, v_cost from public.order_items where order_id = v_order_id;
    if v_subtotal is null then raise exception 'Order must include at least one item.'; end if;
    update public.orders
    set subtotal = v_subtotal, total = v_subtotal, estimated_cost = v_cost,
        gross_profit = round(v_subtotal - v_cost, 2),
        gross_margin_percent = case when v_subtotal > 0
          then round(((v_subtotal - v_cost) / v_subtotal) * 100, 2) else 0 end
    where id = v_order_id;
    if v_status = 'completed' then perform public._complete_order(v_company_id, v_order_id); end if;
    v_orders_created := v_orders_created + 1;
  end loop;

  select count(*) - v_before_customers into v_created_customers
  from public.customers where company_id = v_company_id;
  select count(*) - v_before_products into v_created_products
  from public.products where company_id = v_company_id;
  select count(*) - v_before_ingredients into v_created_ingredients
  from public.ingredients where company_id = v_company_id;

  return jsonb_build_object(
    'customersCreated', v_created_customers,
    'customersMatched', greatest(0, jsonb_array_length(coalesce(p_payload->'customers', '[]'::jsonb)) - v_created_customers),
    'productsCreated', v_created_products,
    'productsUpdated', greatest(0, jsonb_array_length(coalesce(p_payload->'products', '[]'::jsonb)) - v_created_products),
    'ingredientsCreated', v_created_ingredients,
    'ingredientsUpdated', greatest(0, jsonb_array_length(coalesce(p_payload->'ingredients', '[]'::jsonb)) - v_created_ingredients),
    'recipesReplaced', v_recipe_count,
    'ordersCreated', v_orders_created,
    'failedRecords', 0
  );
end;
$$;

revoke all on function public._convert_quantity(numeric, text, text) from public;
revoke all on function public._refresh_product_metrics(uuid, uuid) from public;
revoke all on function public._complete_order(uuid, uuid) from public;
revoke all on function public._resolve_or_create_customer(uuid, jsonb) from public;
revoke all on function public._seed_demo_company(uuid) from public;
revoke all on function public.bootstrap_demo_workspace() from public;
revoke all on function public.reset_demo_workspace() from public;
revoke all on function public.import_demo_payload(jsonb) from public;
revoke all on function public.mark_order_paid(uuid) from public;
revoke all on function public.cancel_order(uuid) from public;

grant execute on function public.bootstrap_demo_workspace() to authenticated;
grant execute on function public.reset_demo_workspace() to authenticated;
grant execute on function public.import_demo_payload(jsonb) to authenticated;
grant execute on function public.mark_order_paid(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
