-- =============================================================================
-- Migration: Catálogo de RBAC (roles, permissions, role_permissions)
-- Sistema CME Educacional
-- =============================================================================
-- Modelo: cada usuário tem UM papel (profiles.role). O papel concede um
-- conjunto de permissões via role_permissions. Não há tabela user_roles porque
-- o sistema usa papel único por usuário (mais simples e suficiente).
--
-- As permissões aqui são de nível de MÓDULO (read/manage). O escopo por linha
-- (ex.: professor só nas próprias turmas, aluno só nos próprios dados) é
-- aplicado via RLS nas tabelas de cada módulo (acadêmico/financeiro), à medida
-- que forem criados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Catálogo de papéis (espelha o enum user_role)
-- -----------------------------------------------------------------------------
create table public.roles (
  key         public.user_role primary key,
  label       text not null,
  description text not null default ''
);

insert into public.roles (key, label, description) values
  ('admin',       'Administrador',          'Acesso total ao sistema.'),
  ('diretor',     'Diretor',                'Relatórios e visão geral da instituição.'),
  ('coordenacao', 'Coordenação Pedagógica', 'Turmas, professores, notas e frequência.'),
  ('secretaria',  'Secretaria',             'Dados acadêmicos e documentos.'),
  ('financeiro',  'Financeiro',             'Dados e rotinas financeiras.'),
  ('professor',   'Professor',              'Suas turmas, notas e frequência.'),
  ('aluno',       'Aluno',                  'Seus próprios dados acadêmicos.'),
  ('responsavel', 'Responsável',            'Dados dos alunos vinculados.');

-- Agora que o catálogo existe, amarra profiles.role a ele.
alter table public.profiles
  add constraint profiles_role_fkey
  foreign key (role) references public.roles (key) on update cascade;

-- -----------------------------------------------------------------------------
-- 2. Catálogo de permissões (nível de módulo)
-- -----------------------------------------------------------------------------
create table public.permissions (
  key         text primary key,
  label       text not null,
  description text not null default ''
);

insert into public.permissions (key, label, description) values
  ('profile.self',     'Próprio perfil',        'Ver e editar o próprio perfil.'),
  ('users.read',       'Ver usuários',          'Listar e visualizar usuários.'),
  ('users.manage',     'Gerenciar usuários',    'Criar, editar e desativar usuários.'),
  ('academic.read',    'Ver acadêmico',         'Visualizar dados acadêmicos.'),
  ('academic.manage',  'Gerenciar acadêmico',   'Editar dados acadêmicos.'),
  ('classes.read',     'Ver turmas',            'Visualizar turmas.'),
  ('classes.manage',   'Gerenciar turmas',      'Criar e editar turmas.'),
  ('grades.read',      'Ver notas/frequência',  'Visualizar notas e frequência.'),
  ('grades.manage',    'Lançar notas/frequência','Lançar e editar notas e frequência.'),
  ('teachers.read',    'Ver professores',       'Visualizar professores.'),
  ('students.read',    'Ver alunos',            'Visualizar alunos.'),
  ('students.own',     'Ver próprios dados',    'Aluno acessa apenas seus próprios dados.'),
  ('students.linked',  'Ver alunos vinculados', 'Responsável acessa alunos vinculados.'),
  ('documents.read',   'Ver documentos',        'Visualizar documentos.'),
  ('documents.manage', 'Gerenciar documentos',  'Emitir e editar documentos.'),
  ('finance.read',     'Ver financeiro',        'Visualizar dados financeiros.'),
  ('finance.manage',   'Gerenciar financeiro',  'Editar cobranças e pagamentos.'),
  ('reports.read',     'Ver relatórios',        'Acessar relatórios e visão geral.');

-- -----------------------------------------------------------------------------
-- 3. Matriz papel x permissão (regras de negócio)
-- -----------------------------------------------------------------------------
create table public.role_permissions (
  role_key       public.user_role not null references public.roles (key) on delete cascade,
  permission_key text             not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

create index role_permissions_role_idx on public.role_permissions (role_key);

-- admin: todas as permissões.
insert into public.role_permissions (role_key, permission_key)
select 'admin', key from public.permissions;

-- diretor: relatórios + visão geral (leitura ampla).
insert into public.role_permissions (role_key, permission_key) values
  ('diretor', 'profile.self'),
  ('diretor', 'reports.read'),
  ('diretor', 'users.read'),
  ('diretor', 'academic.read'),
  ('diretor', 'classes.read'),
  ('diretor', 'grades.read'),
  ('diretor', 'teachers.read'),
  ('diretor', 'documents.read'),
  ('diretor', 'finance.read');

-- coordenação: turmas, professores, notas e frequência.
insert into public.role_permissions (role_key, permission_key) values
  ('coordenacao', 'profile.self'),
  ('coordenacao', 'academic.read'),
  ('coordenacao', 'classes.read'),
  ('coordenacao', 'classes.manage'),
  ('coordenacao', 'grades.read'),
  ('coordenacao', 'grades.manage'),
  ('coordenacao', 'teachers.read'),
  ('coordenacao', 'students.read');

-- secretaria: dados acadêmicos e documentos.
insert into public.role_permissions (role_key, permission_key) values
  ('secretaria', 'profile.self'),
  ('secretaria', 'academic.read'),
  ('secretaria', 'academic.manage'),
  ('secretaria', 'documents.read'),
  ('secretaria', 'documents.manage'),
  ('secretaria', 'students.read'),
  ('secretaria', 'classes.read');

-- financeiro: somente dados financeiros.
insert into public.role_permissions (role_key, permission_key) values
  ('financeiro', 'profile.self'),
  ('financeiro', 'finance.read'),
  ('financeiro', 'finance.manage');

-- professor: suas turmas, notas e frequência (escopo de linha via RLS depois).
insert into public.role_permissions (role_key, permission_key) values
  ('professor', 'profile.self'),
  ('professor', 'classes.read'),
  ('professor', 'grades.read'),
  ('professor', 'grades.manage'),
  ('professor', 'students.read');

-- aluno: apenas os próprios dados.
insert into public.role_permissions (role_key, permission_key) values
  ('aluno', 'profile.self'),
  ('aluno', 'students.own'),
  ('aluno', 'grades.read'),
  ('aluno', 'finance.read'),
  ('aluno', 'documents.read');

-- responsável: alunos vinculados.
insert into public.role_permissions (role_key, permission_key) values
  ('responsavel', 'profile.self'),
  ('responsavel', 'students.linked'),
  ('responsavel', 'grades.read'),
  ('responsavel', 'finance.read'),
  ('responsavel', 'documents.read');

-- -----------------------------------------------------------------------------
-- 4. Função de verificação de permissão (para uso em RLS e no app via RPC)
-- -----------------------------------------------------------------------------
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() = 'admin'
    or exists (
      select 1
        from public.role_permissions rp
       where rp.role_key = public.current_user_role()
         and rp.permission_key = p_permission
    );
$$;

comment on function public.has_permission(text) is
  'Verdadeiro se o usuário autenticado tem a permissão informada (admin tem todas).';

-- -----------------------------------------------------------------------------
-- 5. RLS dos catálogos (leitura para autenticados; escrita só admin)
-- -----------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "roles_read_authenticated"
  on public.roles for select to authenticated using (true);

create policy "permissions_read_authenticated"
  on public.permissions for select to authenticated using (true);

create policy "role_permissions_read_authenticated"
  on public.role_permissions for select to authenticated using (true);

create policy "roles_write_admin"
  on public.roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "permissions_write_admin"
  on public.permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "role_permissions_write_admin"
  on public.role_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
