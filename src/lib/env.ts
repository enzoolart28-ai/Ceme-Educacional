// =============================================================================
// Validação de variáveis de ambiente
// =============================================================================
// Falha cedo e com mensagem clara se algo essencial estiver faltando.
// =============================================================================
import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL inválida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória"),
});

const clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientEnv.success) {
  const issues = clientEnv.error.issues.map((i) => `  - ${i.message}`).join("\n");
  throw new Error(
    `Variáveis de ambiente inválidas:\n${issues}\n` +
      "Verifique o arquivo .env.local (veja .env.example).",
  );
}

export const env = clientEnv.data;

/** Lê a service role key apenas no servidor. Lança erro se usada no cliente. */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não pode ser usada no cliente.");
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.");
  }
  return key;
}
