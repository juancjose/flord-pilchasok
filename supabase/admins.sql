-- ============================================================
-- FLOR DE PILCHAS · Dar permiso de administrador
-- Se carga por EMAIL: puede hacerse antes o después de invitar a la persona
-- en Authentication > Users > Invite user. Cambiá el email y tocá "Run".
-- ============================================================
insert into public.admins (email)
values (lower(btrim('EMAIL@EJEMPLO.COM')))
on conflict (email) do nothing;

-- Ver quiénes son administradores:
select email, created_at from public.admins order by created_at;

-- Para QUITAR el permiso a alguien (sacá los dos guiones del principio y cambiá el email):
-- delete from public.admins where email = lower('email@ejemplo.com');
