// =============================================================================
// ⚠️  DADOS DE EXEMPLO (MOCK) — NÃO SÃO DADOS REAIS
// =============================================================================
// Tudo neste arquivo é placeholder para métricas cujos módulos/tabelas ainda
// não existem (turmas, cursos, financeiro, notas, frequência, comunicados).
// Quando o módulo correspondente for criado, troque o consumo por consultas
// reais (ver src/lib/dashboard/queries.ts) e remova o respectivo bloco daqui.
// Na UI, estes valores aparecem com o selo <MockBadge /> ("exemplo").
// =============================================================================
import type {
  AlertItem,
  ClassAttendance,
  DueInstallment,
  GradeItem,
  LowAttendanceStudent,
  PendingActivity,
  ScheduleItem,
  TeacherPending,
} from "@/lib/dashboard/types";

// --- Administrador / Diretor ---------------------------------------------------
export const mockAdmin = {
  turmas: 24,
  cursosAtivos: 8,
  receitaPrevista: 248_500,
  receitaRecebida: 191_200,
  inadimplencia: 0.13, // fração
};

export const mockAdminAlerts: AlertItem[] = [
  {
    id: "a1",
    title: "5 matrículas pendentes de documentação",
    description: "Secretaria precisa validar documentos enviados.",
    severity: "warning",
    time: "há 1 hora",
  },
  {
    id: "a2",
    title: "Fechamento financeiro de maio concluído",
    description: "Relatório disponível para download.",
    severity: "success",
    time: "há 3 horas",
  },
  {
    id: "a3",
    title: "12 mensalidades vencem esta semana",
    description: "Lembretes automáticos serão enviados aos responsáveis.",
    severity: "info",
    time: "ontem",
  },
  {
    id: "a4",
    title: "Turma 9ºB sem professor de Química",
    description: "Alocação pendente para a próxima semana.",
    severity: "danger",
    time: "ontem",
  },
];

// --- Aluno ---------------------------------------------------------------------
export const mockAluno = {
  curso: "Ensino Médio",
  turma: "2º Ano A",
  frequencia: 0.94,
  progressoCurso: 0.62,
  proximasAulas: [
    { time: "07:30", title: "Matemática", subtitle: "Sala 12 · Prof. Helena" },
    { time: "08:20", title: "História", subtitle: "Sala 12 · Prof. Marcos" },
    { time: "09:30", title: "Biologia", subtitle: "Lab. 2 · Prof. Ana" },
  ] satisfies ScheduleItem[],
  atividadesPendentes: [
    { title: "Lista de exercícios — Funções", subtitle: "Matemática", due: "Entrega amanhã" },
    { title: "Resumo Cap. 4", subtitle: "História", due: "Entrega em 3 dias" },
  ] satisfies PendingActivity[],
  notasRecentes: [
    { subject: "Português", grade: 8.5 },
    { subject: "Física", grade: 7.0 },
    { subject: "Geografia", grade: 9.2 },
  ] satisfies GradeItem[],
  comunicados: [
    {
      id: "c1",
      title: "Reunião de pais dia 20/06",
      description: "Confirme presença com a coordenação.",
      severity: "info",
      time: "há 2 dias",
    },
    {
      id: "c2",
      title: "Semana de provas a partir de 16/06",
      description: "Confira o cronograma no mural.",
      severity: "warning",
      time: "há 4 dias",
    },
  ] satisfies AlertItem[],
};

// --- Professor -----------------------------------------------------------------
export const mockProfessor = {
  minhasTurmas: 5,
  totalAlunos: 142,
  chamadasPendentes: 3,
  atividadesParaCorrigir: 27,
  aulasDoDia: [
    { time: "07:30", title: "2º Ano A", subtitle: "Matemática · Sala 12" },
    { time: "09:30", title: "3º Ano B", subtitle: "Matemática · Sala 8" },
    { time: "10:20", title: "1º Ano C", subtitle: "Matemática · Sala 5" },
  ] satisfies ScheduleItem[],
  alunosBaixaFrequencia: [
    { name: "Bruno Almeida", className: "2º Ano A", attendance: 0.68 },
    { name: "Carla Dias", className: "3º Ano B", attendance: 0.71 },
    { name: "Diego Souza", className: "1º Ano C", attendance: 0.62 },
  ] satisfies LowAttendanceStudent[],
  comunicados: [
    {
      id: "p1",
      title: "Conselho de classe dia 25/06",
      description: "Lance as notas até 23/06.",
      severity: "warning",
      time: "há 1 dia",
    },
  ] satisfies AlertItem[],
};

// --- Coordenação ---------------------------------------------------------------
export const mockCoordenacao = {
  alunosAbaixo75: 18,
  professoresSemChamada: 4,
  atividadesAtrasadas: 9,
  frequenciaPorTurma: [
    { className: "1º Ano A", attendance: 0.91 },
    { className: "2º Ano A", attendance: 0.83 },
    { className: "2º Ano B", attendance: 0.72 },
    { className: "3º Ano B", attendance: 0.88 },
  ] satisfies ClassAttendance[],
  turmasBaixoDesempenho: [
    { className: "2º Ano B", attendance: 0.62 },
    { className: "1º Ano C", attendance: 0.68 },
  ] satisfies ClassAttendance[],
  professoresPendentes: [
    { name: "Prof. Marcos", className: "9º Ano B" },
    { name: "Prof. Ana", className: "1º Ano A" },
  ] satisfies TeacherPending[],
};

// --- Secretaria ----------------------------------------------------------------
export const mockSecretaria = {
  matriculasPendentes: 5,
  documentosParaEmitir: 11,
  solicitacoesAbertas: 7,
};

// --- Financeiro ----------------------------------------------------------------
export const mockFinanceiro = {
  receitaPrevista: 248_500,
  receitaRecebida: 191_200,
  pagamentosEmAtraso: 32_300,
  alunosInadimplentes: 21,
  descontosConcedidos: 14_750,
  parcelasVencendo: [
    { student: "Maria Oliveira", amount: 1_250, dueDate: "10/06" },
    { student: "João Pereira", amount: 980, dueDate: "11/06" },
    { student: "Lucas Martins", amount: 1_250, dueDate: "12/06" },
    { student: "Sofia Ramos", amount: 1_100, dueDate: "13/06" },
  ] satisfies DueInstallment[],
};

// --- Responsável ---------------------------------------------------------------
export const mockResponsavel = {
  alunoVinculado: "Pedro Henrique (filho)",
  turma: "5º Ano A",
  frequencia: 0.96,
  mensalidadeStatus: "Em dia",
  comunicados: mockAluno.comunicados,
};
