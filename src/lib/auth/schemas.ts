import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail")
    .email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(120),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Recuperação de senha: solicitar link por e-mail.
export const recoverSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
});

export type RecoverInput = z.infer<typeof recoverSchema>;

// Redefinição de senha: nova senha + confirmação.
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
