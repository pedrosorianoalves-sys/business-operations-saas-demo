-- The fictional dataset is seeded per anonymous visitor by
-- public.bootstrap_demo_workspace(). This file intentionally contains no
-- shared mutable tenant and no credentials.

do $$
begin
  if to_regprocedure('public.bootstrap_demo_workspace()') is null then
    raise exception 'BusinessOps demo bootstrap function is missing.';
  end if;
end;
$$;
