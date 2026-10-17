-- ============================================================
-- FLOR DE PILCHAS · Esquema de la base de datos (Supabase)
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede volver a ejecutar sin romper nada.
-- ============================================================

-- Administradores ------------------------------------------------------------
-- Administradores por EMAIL: se puede cargar antes de que la persona tenga usuario
-- (la invitás después desde Authentication > Users y el permiso ya está listo).
-- Si existía la versión vieja (por user_id), se reemplaza.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'admins' and column_name = 'user_id') then
    drop table public.admins cascade;
  end if;
end $$;
create table if not exists public.admins (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- SECURITY INVOKER: cada usuario solo ve su propia fila en "admins" (regla de abajo), así que alcanza.
-- El email sale del token de sesión, que Supabase solo entrega a usuarios con email confirmado.
create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.admins
                 where email = lower(coalesce((select auth.jwt()) ->> 'email', '')));
$$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins: ver propio registro" on public.admins;
create policy "admins: ver propio registro" on public.admins
  for select to authenticated using (email = lower(coalesce((select auth.jwt()) ->> 'email', '')));

-- Productos --------------------------------------------------------------------
-- colors: [{ "name": "Negro", "hex": "#111111", "images": ["https://..."] }]
-- images: fotos del producto cuando no tiene colores (o fotos generales)
create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  price integer not null default 0 check (price >= 0),
  category text not null default '',
  description text not null default '',
  sizes text[] not null default '{"Único"}',
  colors jsonb not null default '[]'::jsonb check (jsonb_typeof(colors) = 'array'),
  images text[] not null default '{}',
  active boolean not null default true,     -- visible en la tienda
  sold_out boolean not null default false,  -- agotado
  sort integer not null default 0,          -- orden en la tienda (menor = primero)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_sort_idx on public.products(sort);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
drop policy if exists "products: lectura pública" on public.products;
create policy "products: lectura pública" on public.products
  for select using (active or public.is_admin());
drop policy if exists "products: escritura admin" on public.products;
drop policy if exists "products: alta admin" on public.products;
create policy "products: alta admin" on public.products
  for insert to authenticated with check (public.is_admin());
drop policy if exists "products: edición admin" on public.products;
create policy "products: edición admin" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products: baja admin" on public.products;
create policy "products: baja admin" on public.products
  for delete to authenticated using (public.is_admin());

-- Fotos: bucket público "products" (solo administradores suben/borran) -----------
insert into storage.buckets (id, name, public) values ('products', 'products', true)
  on conflict (id) do update set public = true;
-- Las fotos se ven por su enlace público sin necesitar esta regla; listar/borrar archivos queda solo para administradores.
drop policy if exists "fdp fotos: lectura pública" on storage.objects;
drop policy if exists "fdp fotos: listar admin" on storage.objects;
create policy "fdp fotos: listar admin" on storage.objects
  for select to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "fdp fotos: subir admin" on storage.objects;
create policy "fdp fotos: subir admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "fdp fotos: editar admin" on storage.objects;
create policy "fdp fotos: editar admin" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "fdp fotos: borrar admin" on storage.objects;
create policy "fdp fotos: borrar admin" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());
