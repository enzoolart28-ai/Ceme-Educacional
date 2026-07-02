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
  UserPlus,
  Ticket,
  Trophy,
  School,
  UserMinus,
  Building2,
  ClipboardSignature,
  Landmark,
  GitCompareArrows,
  ArrowUpDown,
  FileClock,
  PlugZap,
  MessageCircleMore,
  Wallet,
  Receipt,
  Table2,
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
  GESTOR_ROLES,
  COMERCIAL_ROLES,
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
    label: "Captar Lead",
    href: "/dashboard/captar-lead",
    icon: UserPlus,
    roles: ALL_ROLES,
  },
  {
    label: "Alertas",
    href: "/dashboard/alertas",
    icon: BellRing,
    roles: ["admin", "diretor", "gestor", "coordenacao", "secretaria", "financeiro", "professor"],
  },
  {
    label: "Gestão",
    href: "/dashboard/gestao",
    icon: Building2,
    roles: GESTOR_ROLES,
  },
  {
    label: "Metas",
    href: "/dashboard/gestao/metas",
    icon: Target,
    roles: GESTOR_ROLES,
  },
  {
    label: "Relatórios Gerenciais",
    href: "/dashboard/gestao/relatorios",
    icon: BarChart3,
    roles: GESTOR_ROLES,
  },
  {
    label: "Auditoria",
    href: "/dashboard/gestao/auditoria",
    icon: FileClock,
    roles: GESTOR_ROLES,
  },
  {
    label: "Aprovações Financeiras",
    href: "/dashboard/gestao/aprovacoes-financeiras",
    icon: ClipboardSignature,
    roles: GESTOR_ROLES,
  },
  {
    label: "Fluxo de Caixa",
    href: "/dashboard/gestao/fluxo-caixa",
    icon: GitCompareArrows,
    roles: ["admin", "diretor", "gestor", "financeiro"],
  },
  {
    label: "Conferência de Caixa",
    href: "/dashboard/gestao/conferencia-caixa",
    icon: Landmark,
    roles: GESTOR_ROLES,
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
    roles: [...ACADEMIC_ROLES, "comercial"],
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
    label: "Diário de Notas",
    href: "/dashboard/avaliacoes/diario",
    icon: Table2,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "Pedagógico",
    href: "/dashboard/pedagogico",
    icon: School,
    roles: ACADEMIC_ROLES,
  },
  {
    label: "Desistências",
    href: "/dashboard/desistencias",
    icon: UserMinus,
    roles: ["admin", "diretor", "gestor", "coordenacao", "secretaria"],
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
    roles: COMERCIAL_ROLES,
  },
  {
    label: "Eventos",
    href: "/dashboard/eventos",
    icon: Ticket,
    roles: COMERCIAL_ROLES,
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
    label: "Integração Asaas",
    href: "/dashboard/financeiro/integracoes/asaas",
    icon: PlugZap,
    roles: ["admin", "diretor", "financeiro"],
  },
  {
    label: "Integração WhatsApp",
    href: "/dashboard/integracoes/whatsapp",
    icon: MessageCircleMore,
    roles: ["admin", "diretor", "gestor", "comercial", "secretaria", "financeiro"],
  },
  {
    label: "Contas a Pagar",
    href: "/dashboard/financeiro/contas-a-pagar",
    icon: Receipt,
    roles: ["admin", "diretor", "gestor", "financeiro"],
  },
  {
    label: "Caixa",
    href: "/dashboard/financeiro/caixa",
    icon: Landmark,
    roles: ["admin", "diretor", "financeiro"],
  },
  {
    label: "Movimentações",
    href: "/dashboard/financeiro/movimentacoes",
    icon: ArrowUpDown,
    roles: ["admin", "diretor", "gestor", "financeiro"],
  },
  {
    label: "Fechamento de Caixa",
    href: "/dashboard/financeiro/fechamento-caixa",
    icon: ClipboardCheck,
    roles: ["admin", "diretor", "financeiro"],
  },
  {
    label: "Solicitações Financeiras",
    href: "/dashboard/financeiro/solicitacoes",
    icon: ClipboardSignature,
    roles: ["admin", "diretor", "gestor", "coordenacao", "secretaria", "financeiro", "professor"],
  },
  {
    label: "Relatórios",
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
