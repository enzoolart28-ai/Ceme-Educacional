import { z } from "zod";
import { ALL_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/types/models";

const roleEnum = z.custom<UserRole>((v) => ALL_ROLES.includes(v as UserRole), "Perfil inválido");

export const createUserSchema = z.object({
  full_name: z.string().min(2, "Informe o nome completo").max(150),
  email: z.string().email("E-mail inválido").max(180),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
  role: roleEnum,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const resetPasswordSchema = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
