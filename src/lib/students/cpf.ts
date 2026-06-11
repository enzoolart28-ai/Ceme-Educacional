// =============================================================================
// Utilitários de CPF
// =============================================================================

/** Mantém apenas dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida um CPF (formato + dígitos verificadores). Aceita com ou sem máscara. */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const calcCheck = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) {
      total += Number(digit) * factor--;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcCheck(cpf.slice(0, 9), 10);
  const d2 = calcCheck(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

/** Formata um CPF como 000.000.000-00 (ou retorna o original se incompleto). */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return "—";
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
