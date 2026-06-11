# 🚀 Colocar o Sistema CME no ar (VPS Hostinger)

Guia passo a passo para publicar o app em **`https://seudominio.com.br`** usando um
**VPS da Hostinger** (Docker + Caddy com HTTPS automático) e o **Supabase Cloud**
para o banco de dados.

> **Por que Supabase Cloud?** O *site* fica 100% no seu VPS Hostinger. Apenas o
> banco/auth/storage vai para o Supabase Cloud (plano grátis, gerenciado), porque
> hoje ele roda só no seu PC via Docker e auto-hospedar o Supabase exige bastante
> RAM e manutenção. Se você fizer questão de tudo no VPS, veja o **Apêndice B**.

Arquitetura final:

```
Navegador ──HTTPS──> [VPS Hostinger]  Caddy (SSL) ──> App Next.js (Docker, :3000)
                                                          │
                                                          └──> Supabase Cloud (Postgres/Auth/Storage)
```

Pré-requisitos: conta GitHub (✅ você já tem), Docker no seu PC (✅ já usa),
o `supabase` CLI (já vem no projeto via `npx supabase`).

---

## Parte A — Banco de dados no Supabase Cloud

1. Acesse **https://supabase.com** → **Start your project** → entre com GitHub.
2. **New project**: dê um nome (ex.: `cme-prod`), escolha região **South America (São Paulo)**,
   defina uma **Database Password** forte e **guarde-a**. Aguarde ~2 min provisionar.
3. Vá em **Project Settings → API** e copie:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (clique em *Reveal*) → `SUPABASE_SERVICE_ROLE_KEY`
4. **Aplique as migrations** (no seu PC, na pasta do projeto). Pegue o *Project ref*
   (a parte antes de `.supabase.co` na URL):

   ```bash
   npx supabase login                 # abre o navegador p/ autorizar
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push               # cria todas as tabelas/RLS/funções/buckets
   ```

   > Isso roda **somente as migrations** (não o seed de demonstração). Os buckets
   > de Storage (`lesson-materials`, `assessment-files`, `documents`) são criados
   > pelas migrations.

5. **NÃO rode o seed de demonstração em produção** (ele cria usuários fictícios com
   senha conhecida). Vamos criar o admin de verdade na **Parte D**.

---

## Parte B — Subir o código no GitHub

No seu PC, na pasta do projeto (o repositório já foi inicializado e commitado):

```bash
# Crie um repositório PRIVADO em github.com (ex.: sistema-cme) e então:
git remote add origin https://github.com/SEU_USUARIO/sistema-cme.git
git push -u origin main
```

> O `.gitignore` já protege segredos (`.env*`). Confirme que **nenhum** arquivo
> `.env` foi enviado.

---

## Parte C — Criar e configurar o VPS na Hostinger

### C.1 Criar o VPS
1. No **hPanel** da Hostinger → **VPS** → contrate um plano (mínimo recomendado:
   **2 GB de RAM**).
2. Ao criar, escolha o template **Ubuntu 24.04** — se houver a opção
   **"Ubuntu with Docker"** / **Docker (OpenLiteSpeed/Docker)**, melhor ainda
   (já vem com Docker instalado).
3. Defina a senha de **root** e anote o **IP público** do VPS (ex.: `203.0.113.10`).

### C.2 Apontar o domínio para o VPS (DNS na Hostinger)
1. hPanel → **Domínios** → seu domínio → **DNS / Nameservers** → **Gerenciar registros DNS**.
2. Crie/edite os registros do tipo **A**:

   | Tipo | Nome | Aponta para (IP) | TTL |
   |------|------|------------------|-----|
   | A    | `@`  | IP do seu VPS    | 3600 |
   | A    | `www`| IP do seu VPS    | 3600 |

3. Salve. A propagação leva de minutos a algumas horas. Teste com:
   `ping seudominio.com.br` (deve responder o IP do VPS).

> ⚠️ O HTTPS automático do Caddy **só funciona depois** que o domínio já aponta
> para o IP do VPS.

### C.3 Acessar o VPS e instalar o Docker (se não veio pronto)
```bash
ssh root@SEU_IP_DO_VPS

# Instalar Docker (pule se o template já tiver Docker):
curl -fsSL https://get.docker.com | sh
docker --version    # confirma a instalação
```

### C.4 Baixar o código e configurar as variáveis
```bash
# Instale o git, se necessário:  apt-get update && apt-get install -y git
git clone https://github.com/SEU_USUARIO/sistema-cme.git
cd sistema-cme

# Crie o arquivo de produção a partir do exemplo:
cp .env.production.example .env.production
nano .env.production      # cole os valores da Parte A e ajuste o DOMAIN
```

Preencha `.env.production`:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # anon public
SUPABASE_SERVICE_ROLE_KEY=...            # service_role
DOMAIN=seudominio.com.br
```

### C.5 Subir tudo (build + HTTPS)
```bash
docker compose --env-file .env.production up -d --build
```
- O primeiro build leva alguns minutos.
- O Caddy vai obter o certificado SSL automaticamente (precisa do DNS já apontado).
- Acompanhe os logs: `docker compose logs -f`

Acesse **https://seudominio.com.br** 🎉

---

## Parte D — Configurar Auth e criar o administrador

### D.1 URLs de redirecionamento (Supabase → Authentication → URL Configuration)
- **Site URL:** `https://seudominio.com.br`
- **Redirect URLs** (adicione as duas):
  - `https://seudominio.com.br/auth/callback`
  - `https://seudominio.com.br/redefinir-senha`

### D.2 Criar o usuário administrador
1. Supabase → **Authentication → Users → Add user** → informe e-mail e senha,
   marque **Auto Confirm User**.
2. Supabase → **SQL Editor** → rode (troque o e-mail):

   ```sql
   update public.profiles
      set role = 'admin', status = 'active', full_name = 'Administrador'
    where user_id = (select id from auth.users where email = 'voce@seudominio.com.br');
   ```

3. Faça login em `https://seudominio.com.br/login` com esse e-mail/senha.

> A partir daí, crie os demais usuários pela própria aplicação (ou pelo painel do
> Supabase, promovendo o perfil conforme necessário).

---

## Atualizações futuras (deploy de novas versões)

No seu PC: `git push`. No VPS:
```bash
cd sistema-cme
git pull
docker compose --env-file .env.production up -d --build
```
Se mudou o banco (novas migrations), rode no seu PC: `npx supabase db push`.

---

## Apêndice A — Comandos úteis no VPS
```bash
docker compose ps                 # status dos containers
docker compose logs -f app        # logs do Next.js
docker compose logs -f caddy      # logs do SSL/Caddy
docker compose restart app        # reiniciar o app
docker compose down               # parar tudo
docker system prune -f            # limpar imagens antigas (libera disco)
```

## Apêndice B — Self-host do Supabase no VPS (avançado)
Se você quiser **tudo** no VPS Hostinger (sem Supabase Cloud), é possível rodar o
Supabase via Docker, mas exige mais recursos e manutenção:
- VPS com **≥ 4 GB de RAM**.
- Seguir o guia oficial: https://supabase.com/docs/guides/self-hosting/docker
  (clonar o repo do Supabase, ajustar `.env` com segredos JWT, e-mail/SMTP, etc.).
- Depois, aplicar as migrations deste projeto no Postgres do Supabase self-hosted e
  apontar as variáveis do app para `https://api.seudominio.com.br` (subdomínio).

Recomendação: comece com o **Supabase Cloud** (Parte A). Você pode migrar depois
sem alterar o código — só trocando as 3 variáveis de ambiente.

## Apêndice C — Problemas comuns
- **HTTPS não emite / "connection refused":** o DNS ainda não propagou ou as portas
  80/443 estão bloqueadas. Verifique o registro A e o firewall do VPS (libere 80 e 443).
- **"Variáveis de ambiente inválidas" no build:** faltou preencher
  `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` no `.env.production` (são embutidas no build).
- **Login não persiste / erro de sessão:** confira a **Site URL** e as **Redirect URLs**
  na Parte D.
- **Upload de arquivos falha:** confirme que as migrations rodaram (os buckets de
  Storage são criados por elas) e que o projeto Supabase é o mesmo das variáveis.
