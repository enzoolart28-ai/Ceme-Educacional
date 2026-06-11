# 🚀 Colocar o Sistema CME no ar (Vercel + Supabase) — RECOMENDADO

Caminho mais simples e estável para Next.js. O **site** roda na **Vercel** (grátis,
HTTPS e deploy automáticos) e o **banco/auth/storage** no **Supabase Cloud** (grátis).
**Seu domínio continua registrado na Hostinger** — só ajustamos o DNS para apontar
para a Vercel.

```
Navegador ──HTTPS──> Vercel (Next.js)  ──>  Supabase Cloud (Postgres/Auth/Storage)
   (domínio gerenciado na Hostinger, DNS apontando para a Vercel)
```

> Os arquivos `Dockerfile` / `docker-compose.yml` / `Caddyfile` do projeto **não são
> usados** neste caminho (servem só para o plano VPS). Pode ignorá-los.

---

## Parte A — Banco de dados no Supabase Cloud

1. **https://supabase.com** → *Start your project* → entrar com GitHub.
2. **New project**: nome (ex.: `cme-prod`), região **South America (São Paulo)**,
   defina e **guarde a Database Password**. Aguarde ~2 min.
3. **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (*Reveal*) → `SUPABASE_SERVICE_ROLE_KEY`
4. **Aplicar as migrations** (no seu PC, na pasta do projeto):
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF   # ref = parte antes de .supabase.co
   npx supabase db push                              # cria tabelas/RLS/funções/buckets
   ```
   > Roda só as migrations (não o seed de demonstração). Os buckets de Storage
   > (`lesson-materials`, `assessment-files`, `documents`) são criados pelas migrations.

---

## Parte B — Subir o código no GitHub

```bash
# Crie um repositório PRIVADO em github.com (ex.: sistema-cme) e então:
git remote add origin https://github.com/SEU_USUARIO/sistema-cme.git
git push -u origin main
```

---

## Parte C — Importar na Vercel

1. **https://vercel.com** → *Sign Up* com **GitHub**.
2. **Add New… → Project** → selecione o repositório `sistema-cme` → **Import**.
3. **Framework Preset:** Next.js (detectado automaticamente). Não mude Build/Output.
4. Abra **Environment Variables** e adicione (marque *Production* e *Preview*):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL da Parte A |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave **anon public** |
   | `SUPABASE_SERVICE_ROLE_KEY` | a chave **service_role** |

5. Clique **Deploy**. Em ~2 min sai uma URL `https://seu-projeto.vercel.app` — teste o login lá.

---

## Parte D — Apontar o seu domínio (DNS na Hostinger → Vercel)

1. Vercel → seu projeto → **Settings → Domains → Add** → digite `seudominio.com.br`
   e também `www.seudominio.com.br`.
2. A Vercel vai **mostrar os registros DNS** que você deve criar. Normalmente:

   | Tipo | Nome | Valor (use o que a Vercel mostrar) |
   |------|------|------------------------------------|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

3. No **hPanel da Hostinger** → **Domínios → seu domínio → Gerenciar registros DNS**:
   - **Remova** registros **A** antigos do `@` que apontem para outro lugar (ex.: parking da Hostinger).
   - **Crie** os registros que a Vercel pediu (tabela acima).
4. Volte na Vercel; quando o domínio ficar **Valid/Verified**, ela emite o **SSL automático**.
   Propagação: de minutos a algumas horas.

> Dica: **mantenha os nameservers da Hostinger** (só edite os registros). Não precisa
> trocar para os nameservers da Vercel.

---

## Parte E — Auth e usuário administrador (no Supabase)

1. **Authentication → URL Configuration:**
   - **Site URL:** `https://seudominio.com.br`
   - **Redirect URLs:** `https://seudominio.com.br/auth/callback` e
     `https://seudominio.com.br/redefinir-senha`
2. **Authentication → Users → Add user** → e-mail + senha, marque **Auto Confirm User**.
3. **SQL Editor** (troque o e-mail):
   ```sql
   update public.profiles
      set role = 'admin', status = 'active', full_name = 'Administrador'
    where user_id = (select id from auth.users where email = 'voce@seudominio.com.br');
   ```
4. Faça login em `https://seudominio.com.br/login`.

---

## Atualizações futuras
- **Código:** `git push` → a Vercel faz o deploy sozinha.
- **Banco (novas migrations):** no seu PC, `npx supabase db push`.

## Problemas comuns
- **Build falhou com "Variáveis de ambiente inválidas":** faltou definir
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas *Environment Variables* da Vercel.
- **Domínio "Invalid Configuration" na Vercel:** o registro DNS na Hostinger ainda não
  propagou ou há um registro A antigo conflitante no `@` — remova-o.
- **Login não persiste:** confira a **Site URL** e as **Redirect URLs** (Parte E).
- **Upload de arquivos falha:** confirme que `npx supabase db push` rodou (cria os buckets)
  e que as variáveis apontam para o mesmo projeto Supabase.
