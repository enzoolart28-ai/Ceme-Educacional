import { z } from "zod";

export const loginSchema = z
  .object({
    identifier: z.string().min(1, "Informe o e-mail ou CPF do aluno"),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  })
  .refine(
    ({ identifier }) => {
      const value = identifier.trim();
      if (value.includes("@")) return z.string().email().safeParse(value).success;
      return value.replace(/\D/g, "").length === 11;
    },
    { message: "Informe um e-mail valido ou CPF com 11 digitos", path: ["identifier"] },
  );

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const recoverSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail invalido"),
});

export type RecoverInput = z.infer<typeof recoverSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao conferem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
