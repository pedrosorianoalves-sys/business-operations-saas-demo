begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_function('public', 'bootstrap_demo_workspace', array[]::text[], 'bootstrap RPC exists');
select has_function('public', 'reset_demo_workspace', array[]::text[], 'reset RPC exists');
select has_function('public', 'import_demo_payload', array['jsonb'], 'atomic import RPC exists');
select has_function('public', 'record_ingredient_purchase', array['uuid', 'numeric', 'numeric', 'text', 'timestamp with time zone'], 'purchase RPC exists');
select has_function('public', 'adjust_inventory', array['uuid', 'text', 'numeric', 'text'], 'inventory adjustment RPC exists');
select has_function('public', 'save_recipe', array['uuid', 'jsonb'], 'recipe RPC exists');
select has_function('public', 'create_demo_order', array['uuid', 'text', 'text', 'jsonb', 'numeric', 'text'], 'order RPC exists');
select has_function('public', 'delete_recipe', array['uuid'], 'recipe delete RPC exists');

select policies_are(
  'public',
  'customers',
  array['customers_tenant_policy'],
  'customers has one tenant policy'
);

select policies_are(
  'public',
  'orders',
  array['orders_tenant_policy'],
  'orders has one tenant policy'
);

select col_is_fk('public', 'orders', 'customer_id', 'orders.customer_id is a foreign key');
select has_index('public', 'orders', 'orders_company_status_date_idx', 'dashboard order filter is indexed');
select has_index('public', 'order_items', 'order_items_order_id_idx', 'order item join is indexed');
select has_index('public', 'recipe_items', 'recipe_items_ingredient_id_idx', 'recipe ingredient join is indexed');
select has_check('public', 'ingredients', 'ingredients has stock and cost checks');
select has_check('public', 'orders', 'orders has status and financial checks');

select * from finish();
rollback;
