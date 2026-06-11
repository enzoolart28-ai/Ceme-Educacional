# Sistema CME Educacional

Sistema web de gestão para rede particular de ensino.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, Auth, Storage) — local via Docker
- **react-hook-form** + **zod** (validação)
- **lucide-react** (ícones)

## Perfis de usuário (RBAC)

`admin` · `diretor` · `coordenacao` · `secretaria` · `financeiro` · `professor` · `aluno` · `responsavel`

O controle de acesso é centralizado em [`roles.ts`](src/lib/auth/roles.ts) (grupos de
papéis) e [`permissions.ts`](src/lib/auth/permissions.ts) (matriz papel→permissão,
espelhando a tabela `role_permissions`). É aplicado em camadas: **proxy** (rotas),
**guards de servidor** (`requireAuth` / `requireRole` / `requirePermission`),
componente **`<Can>`** (UI) e **RLS** no banco (`has_permission`).

### Módulo de Autenticação & Permissões

- Login e-mail/senha, logout, **recuperação de senha** (`/recuperar-senha` →
  e-mail → `/auth/callback` → `/redefinir-senha`).
- **Cadastro inicial de perfil** (`/completar-perfil`) quando o nome está vazio.
- **Bloqueio de usuário inativo** (`status` ≠ `active`) e registro de
  **último acesso** (`last_access_at`).
- Tabelas: `profiles`, `roles`, `permissions`, `role_permissions`.

### Layout & Dashboards

- Layout interno com **sidebar** (desktop) e **menu drawer** (mobile), **header**
  com nome/perfil/logout e navegação filtrada por perfil.
- **Dashboard diferente por perfil** (admin, diretor, coordenação, secretaria,
  financeiro, professor, aluno, responsável) — `src/components/dashboard/`.
- **Dados reais vs. exemplo**: contagens reais de alunos/professores vêm de
  `profiles` ([`queries.ts`](src/lib/dashboard/queries.ts)); métricas sem tabela
  ainda (turmas, receita, notas, frequência) ficam isoladas em
  [`mock.ts`](src/lib/dashboard/mock.ts) e aparecem na UI com o selo **"exemplo"**.
- Componentes: `StatCard`, `AlertsPanel`, `ListCard`, `ProgressBar`, `Section`,
  skeletons de **loading** e `EmptyState`.

### Módulo Acadêmico

- Tabelas: `courses`, `subjects`, `classes`, `enrollments`,
  `teacher_assignments`, `student_guardians` (migration `..._academic.sql`).
- Telas em `/dashboard/academico`: **visão geral** (contagens reais), **cursos**
  e **disciplinas** (catálogo, `academic.read`/`academic.manage`), **turmas**
  (lista + detalhe com **matrículas** e **professores**, `classes.read`/manage).
- **Escopo por RLS**: aluno vê só seus dados; responsável, os alunos
  vinculados; professor, suas turmas; secretaria/coordenação/diretor/admin,
  conforme permissão. Helpers SQL: `current_profile_id`, `teaches_class`,
  `is_enrolled`, `is_guardian_of`.
- Os dashboards de admin/aluno/professor passam a usar **dados reais** deste
  módulo (turmas, cursos, curso/turma do aluno, turmas/alunos do professor).

### Módulo de Gestão de Alunos

- Tabela `students` (distinta de `profiles`; `profile_id` liga a um login
  opcional). Campos: nome, CPF (único + validado), RG, nascimento, contato,
  endereço, filiação, status (7 valores), observações, soft-delete (`deleted_at`).
- Telas em `/dashboard/alunos`: **lista** com busca (nome/CPF/telefone) e
  filtros (status, curso, turma); **cadastro**, **edição** e **detalhe com 10
  abas** (dados pessoais, matrícula, responsáveis, frequência, notas,
  financeiro, documentos, certificados, observações, histórico).
- **Inativar** (status) e **arquivar** (soft-delete) sem excluir; **exclusão
  permanente apenas pelo administrador** (com confirmação).
- **Permissões (RLS)**: gestores (admin/diretor/coordenação/secretaria)
  gerenciam; professor vê alunos das suas turmas; aluno vê só os próprios;
  responsável vê os vinculados.

### Módulo de Responsáveis

- Tabelas: `guardians` (cadastro do responsável; `profile_id` liga a um login)
  e `student_guardians` (vínculo N:N com flags `is_financial_responsible` e
  `is_pedagogical_responsible`).
- Telas em `/dashboard/responsaveis`: **lista** com busca (nome/CPF/telefone/
  e-mail), **cadastro**, **edição** e **detalhe** com **vínculo aluno↔responsável**
  (definindo se é financeiro e/ou pedagógico).
- **Painel próprio do responsável** em `/dashboard/dependentes` (acesso do
  responsável aos alunos vinculados a ele).
- **Permissões (RLS)**: admin, secretaria e coordenação gerenciam responsáveis;
  o responsável só visualiza os alunos vinculados a ele.

### Módulo de Professores

- Tabela `teachers` (cadastro; `profile_id` liga a um login) + `teacher_subjects`
  (disciplinas) e `teacher_classes` (turmas vinculadas).
- Telas em `/dashboard/professores`: **lista** com busca (nome/CPF/e-mail) e
  filtros (área, status), **cadastro**, **edição** e **detalhe** com vínculo de
  **disciplinas** e **turmas**, **carga horária** e **histórico de atuação**
  (disciplina × turma reais, do módulo Acadêmico).
- **Permissões (RLS)**: admin e coordenação gerenciam; secretaria e diretor
  visualizam (sem editar); o professor só vê o próprio cadastro.

### Módulo de Cursos

- Tabela `courses` (estendida: modalidade, tipo, status, carga horária, duração,
  valor, certificado, frequência/média mínimas, requisitos) + `course_subjects`
  (disciplinas) e `course_modules` (módulos).
- **Modalidades**: Presencial · Semipresencial · EAD. **Tipos**: Técnico ·
  Profissionalizante · Livre · Infantil · Preparatório · Reforço escolar.
- Telas em `/dashboard/academico/cursos`: **lista** com busca e filtros
  (modalidade, tipo, status), **cadastro**, **edição** e **detalhe** com
  **disciplinas** e **módulos**.
- **Permissões (RLS)**: admin, direção, coordenação e secretaria gerenciam;
  alunos veem cursos em que estão matriculados; professores veem os cursos das
  suas turmas.

### Currículo (disciplinas e módulos)

- **CRUD de disciplinas** em `/dashboard/academico/disciplinas` (nome, código,
  carga horária, status).
- **Organização curricular** na tela do curso: **módulos** ordenáveis e
  **disciplinas** com módulo, carga horária e professor responsável (com
  reordenação ↑/↓). Gerenciado por coordenação e administrador.

### Módulo de Turmas

- Tabela `classes` (estendida: unidade, turno — incl. **Sábado** —, datas,
  dias da semana, horários, professor responsável, limite de alunos, status) +
  `units` (unidades/polos) e `class_students` (roster, sincronizado com
  `enrollments`).
- Telas em `/dashboard/academico/turmas`: **lista** com busca e filtros (curso,
  professor, unidade, turno, status), **criação**, **edição** e **detalhe** com
  **alunos matriculados** (respeitando o limite máximo, com autorização para
  exceder), **professores/disciplinas** e espaço para frequência/notas.
- **Permissões (RLS)**: admin, secretaria e coordenação gerenciam; **professor
  só vê suas turmas**; aluno vê as turmas em que está matriculado.

### Módulo de Chamada e Frequência

- Tabelas `attendance` (chamada por turma/disciplina/professor/data),
  `attendance_records` (presença por aluno) e `attendance_logs` (log de
  alterações).
- **Chamada rápida** em `/dashboard/chamada/[turma]/[chamada]`: lista de alunos
  com **Presente / Falta / Falta justificada / Atraso** e observação por aluno.
- **Relatório de frequência** por turma com **alertas** (frequência abaixo de
  **75%** e **3 faltas seguidas**); frequência do aluno calculada
  automaticamente e exibida no perfil do aluno e no seu painel.
- **Permissões (RLS)**: professor faz chamada **das suas turmas**; coordenação/
  admin editam qualquer; secretaria visualiza; aluno vê a própria frequência;
  responsável vê a dos alunos vinculados.

### Módulo de Notas e Avaliações

- Tabelas `assessments` (avaliações: tipo, peso, nota máxima, data),
  `grades` (notas por aluno + feedback) e `grade_logs` (log de alterações).
- **CRUD de avaliações** e **lançamento de notas por turma** em
  `/dashboard/avaliacoes`. Tipos: prova, trabalho, atividade, participação,
  recuperação, projeto, avaliação prática.
- **Cálculo automático** de média ponderada (normalizada 0–10) e **situação
  acadêmica** (aprovado/recuperação/reprovado) com base na **média mínima do
  curso** (`courses.minimum_grade`).
- **Boletim** em `/dashboard/boletim` (aluno: o próprio; responsável: dos
  dependentes), e na aba **Notas** do aluno.
- **Permissões (RLS)**: professor lança nota **nas suas turmas**; coordenação/
  admin editam; secretaria visualiza; aluno vê as próprias notas; responsável as
  dos vinculados.

### Módulo AVA / EAD (ambiente virtual de aprendizagem)

- Tabelas `lessons` (aulas: vídeo, descrição, ordem, regra de liberação,
  status), `lesson_materials` (materiais: vídeo/PDF/slides/link/arquivo) e
  `student_lesson_progress` (progresso por aluno).
- **Gestão de aulas** em `/dashboard/ava/[curso]`: criar, **reordenar** (↑/↓),
  publicar (rascunho/publicada/arquivada) e editar; **upload de materiais** para
  o **Supabase Storage** (bucket `lesson-materials`) ou link externo.
- **Regras de liberação** por aula: liberada para todos, por **data**, ou
  **após concluir a aula anterior** — calculadas em `src/lib/ava/release.ts`.
- **Área do aluno**: cursos matriculados, progresso geral, player de aula
  (vídeo + materiais) e botão **marcar como concluída**; aulas bloqueadas
  exibem o motivo. **Responsável** acompanha o progresso dos dependentes.
- **Permissões (RLS)**: coordenação/professores/gestores gerenciam conteúdo
  (reusa `courses.manage`/`curriculum.manage`/`grades.manage`); aluno só acessa
  aulas **publicadas** dos cursos em que está **matriculado**; responsável
  visualiza as do aluno vinculado; financeiro não acessa.

### Módulo de Provas e Atividades Online

- Tabelas `online_assessments`, `assessment_questions`, `assessment_options`,
  `student_assessment_submissions`, `student_answers` e `online_assessment_logs`.
- **Criação de provas** em `/dashboard/atividades` com 7 tipos de questão:
  múltipla escolha, verdadeiro/falso, dissertativa, envio de arquivo, questão
  com imagem, com vídeo e **associação de colunas**. Configura data inicial/final,
  tempo limite, nº de tentativas, nota máx./mín., correção automática ou manual,
  mostrar gabarito, embaralhar questões/alternativas.
- **Aluno responde** com cronômetro e salvamento automático; **correção
  automática** das questões objetivas no servidor e **correção manual** das
  dissertativas/arquivos; **histórico de tentativas** e nota/feedback conforme
  a configuração.
- **Segurança**: o gabarito nunca é exposto ao aluno — questões/alternativas e
  correção passam por funções `SECURITY DEFINER`; o aluno só responde provas das
  suas turmas e o envio fora do prazo é bloqueado (salvo reabertura pelo professor).

### Módulo de Documentos

- Tabelas `documents` (upload + conferência), `generated_documents` (PDFs
  gerados) e `document_logs` (log de aprovação/reprovação).
- **Upload seguro** de documentos do aluno (RG, CPF, comprovantes, históricos,
  contratos, termos…) em `/dashboard/documentos`; arquivos no **Supabase Storage**
  em **bucket privado** acessado por **URL assinada**.
- **Conferência**: a secretaria **aprova/reprova** com observação (gera log);
  filtros por **aluno, tipo e status** (pendente/enviado/aprovado/reprovado).
- **Geração de PDF** (via `pdf-lib`): declaração de matrícula, de frequência,
  contrato educacional, histórico, recibo, comprovante financeiro e relatório
  acadêmico.
- **Permissões (RLS)**: aluno envia os próprios e o responsável os do aluno
  vinculado; secretaria/admin gerenciam e aprovam; coordenação e direção
  visualizam.

## Pré-requisitos

- **Node.js 20+** (testado com Node 24) e **npm**
- **Docker Desktop** — necessário para rodar o Supabase local (`supabase start`).
  Baixe em https://www.docker.com/products/docker-desktop/

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Subir o Supabase local (exige Docker em execução)
npm run db:start

#    Ao final, o CLI imprime as chaves locais. Confira se os valores de
#    NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY em .env.local
#    batem com o que foi exibido (os padrões já estão preenchidos).

# 3. Aplicar migrations + seed de demonstração
npm run db:reset

# 4. (Opcional) Regenerar os tipos do banco a partir do schema local
npm run gen:types

# 5. Iniciar a aplicação
npm run dev
```

App: http://localhost:3000 · Supabase Studio: http://localhost:54323

## Usuários de demonstração (seed local)

Senha de todos: **`Senha@123`**

| Perfil       | E-mail                   |
| ------------ | ------------------------ |
| Admin Geral  | admin@cme.local          |
| Diretor      | diretor@cme.local        |
| Coordenação  | coordenacao@cme.local    |
| Secretaria   | secretaria@cme.local     |
| Financeiro   | financeiro@cme.local     |
| Professor    | professor@cme.local      |
| Aluno        | aluno@cme.local          |
| Responsável  | responsavel@cme.local    |
| _(inativo)_  | inativo@cme.local        |

> `inativo@cme.local` tem `status = inactive` — serve para testar o bloqueio de
> acesso (o login é recusado com mensagem).

## Scripts

| Script             | Descrição                                  |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Servidor de desenvolvimento                |
| `npm run build`    | Build de produção                          |
| `npm run lint`     | ESLint                                      |
| `npm run db:start` | Sobe o Supabase local (Docker)             |
| `npm run db:stop`  | Para o Supabase local                      |
| `npm run db:reset` | Recria o banco a partir das migrations+seed |
| `npm run gen:types`| Gera `src/types/database.ts` do schema     |

## Estrutura

```
src/
├─ app/
│  ├─ actions/          # Server Actions (auth, profile)
│  ├─ dashboard/        # Área autenticada (layout + módulos)
│  ├─ login/            # Tela de login
│  ├─ conta-inativa/    # Conta desativada
│  └─ sem-permissao/    # Acesso negado
├─ components/
│  ├─ ui/               # Componentes reutilizáveis (Button, Input, Card…)
│  ├─ auth/             # Formulário de login
│  ├─ layout/           # Shell (sidebar/topbar) e logout
│  └─ profile/          # Formulário de perfil
├─ config/navigation.ts # Itens de menu por perfil
├─ lib/
│  ├─ auth/             # roles (RBAC), session (guards), schemas (zod)
│  ├─ supabase/         # clients (browser/server/admin) + sessão do proxy
│  ├─ env.ts            # validação de variáveis de ambiente
│  └─ utils.ts          # helper cn()
├─ types/database.ts    # tipos do banco (regeneráveis)
└─ proxy.ts             # proteção de rotas + refresh de sessão

supabase/
├─ migrations/          # schema versionado (profiles, RLS, triggers)
└─ seed.sql             # usuários de demonstração (local)
```

## Segurança

- Senhas e sessões gerenciadas pelo **Supabase Auth** (cookies httpOnly via `@supabase/ssr`).
- **RLS** habilitado em todas as tabelas; políticas por perfil.
- Trigger impede que usuário comum altere o próprio `role`/`is_active`.
- `SUPABASE_SERVICE_ROLE_KEY` usada **apenas** no servidor (`src/lib/supabase/admin.ts`, com `server-only`).
#   C e m e - E d u c a c i o n a l  
 