-- Garante que a tela administrativa liste perfis por permissao, sem depender
-- apenas da classificacao generica de staff.

drop policy if exists "profiles_select_users_permission" on public.profiles;
create policy "profiles_select_users_permission"
  on public.profiles for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_permission('users.read')
    or public.has_permission('users.manage')
  );
