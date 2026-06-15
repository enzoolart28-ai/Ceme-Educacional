// =============================================================================
// Configuração de navegação por perfil
// =============================================================================
// Cada item declara quais perfis podem vê-lo. A sidebar e os guards filtram
// a partir daqui — assim, menu e permissão nunca saem de sincronia.
// =============================================================================
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  IdCard,
  Contact,
  UsersRound,
  Presentation,
  ClipboardList,
  ClipboardCheck,
  MonitorPlay,
  FileQuestion,
  FolderArchive,
  Megaphone,
  Mail,
  Bell,
  BellRing,
  CalendarDays,
  Target,
  Ticket,
  Trophy,
  Wallet,
  BookOpen,
  BarChart3,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/models";
import {
  ACADEMIC_ROLES,
  ALL_ROLES,
  FINANCE_ROLES,
  MANAGEMENT_ROLES,
  REPORT_ROLES,
  STAFF_ROLES,
} from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Perfis autorizados a ver/acessar o item. */
  roles: readonly UserRole[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Painel",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    icon: CalendarDays,
    roles: ALL_ROLES,
  },
  {
    label: "Alertas",
    href: "/dashboard/alertas",
    icon: BellRing,
    roles: ["admin", "diretor", "coordenacao", "secretaria", "financeiro", "professor"],
  },
  {
    label: "Usuários",
    href: "/dashboard/usuarios",
    icon: Users,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Acadêmico",
    href: "/dashboard/academico",
    icon: GraduationCap,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "Alunos",
    href: "/dashboard/alunos",
    icon: IdCard,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "Chamada",
    href: "/dashboard/chamada",
    icon: ClipboardCheck,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "Avaliações",
    href: "/dashboard/avaliacoes",
    icon: ClipboardList,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "AVA / EAD",
    href: "/dashboard/ava",
    icon: MonitorPlay,
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor", "aluno", "responsavel"],
  },
  {
    label: "Provas Online",
    href: "/dashboard/atividades",
    icon: FileQuestion,
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor", "aluno", "responsavel"],
  },
  {
    label: "Documentos",
    href: "/dashboard/documentos",
    icon: FolderArchive,
    roles: ["admin", "diretor", "coordenacao", "secretaria", "aluno", "responsavel"],
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicacao",
    icon: Megaphone,
    roles: ALL_ROLES,
  },
  {
    label: "Mensagens",
    href: "/dashboard/mensagens",
    icon: Mail,
    roles: ALL_ROLES,
  },
  {
    label: "Notificações",
    href: "/dashboard/notificacoes",
    icon: Bell,
    roles: ALL_ROLES,
  },
  {
    label: "Professores",
    href: "/dashboard/professores",
    icon: Presentation,
    roles: STAFF_ROLES,
  },
  {
    label: "Responsáveis",
    href: "/dashboard/responsaveis",
    icon: Contact,
    roles: ["admin", "secretaria", "coordenacao"],
  },
  {
    label: "Comercial (CRM)",
    href: "/dashboard/crm",
    icon: Target,
    roles: STAFF_ROLES,
  },
  {
    label: "Eventos",
    href: "/dashboard/eventos",
    icon: Ticket,
    roles: STAFF_ROLES,
  },
  {
    label: "Campanhas",
    href: "/dashboard/campanhas",
    icon: Trophy,
    roles: ["admin", "coordenacao", "secretaria"],
  },
  {
    label: "Meus dependentes",
    href: "/dashboard/dependentes",
    icon: UsersRound,
    roles: ["responsavel"],
  },
  {
    label: "Secretaria",
    href: "/dashboard/secretaria",
    icon: ClipboardList,
    roles: STAFF_ROLES,
  },
  {
    label: "Financeiro",
    href: "/dashboard/financeiro",
    icon: Wallet,
    roles: FINANCE_ROLES,
  },
  {
    label: "RelatÃ³rios",
    href: "/dashboard/relatorios",
    icon: BarChart3,
    roles: REPORT_ROLES,
  },
  {
    label: "Boletim",
    href: "/dashboard/boletim",
    icon: BookOpen,
    roles: ["admin", "aluno", "responsavel"],
  },
  {
    label: "Meu Perfil",
    href: "/dashboard/perfil",
    icon: UserCircle,
    roles: ALL_ROLES,
  },
] as const;

/** Itens de navegação visíveis para um determinado perfil. */
export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
