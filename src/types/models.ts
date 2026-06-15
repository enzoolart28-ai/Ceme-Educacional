// =============================================================================
// Aliases de conveniência derivados dos tipos gerados (database.ts)
// =============================================================================
// database.ts é gerado por `npm run gen:types` e não deve ser editado à mão.
// Este arquivo expõe nomes curtos e estáveis usados pela aplicação.
// =============================================================================
import type { Database } from "@/types/database";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type PermissionRow = Database["public"]["Tables"]["permissions"]["Row"];
export type RolePermission =
  Database["public"]["Tables"]["role_permissions"]["Row"];

// --- Acadêmico ---------------------------------------------------------------
export type ClassShift = Database["public"]["Enums"]["class_shift"];
export type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseModality = Database["public"]["Enums"]["course_modality"];
export type CourseType = Database["public"]["Enums"]["course_type"];
export type CourseStatus = Database["public"]["Enums"]["course_status"];
export type CourseSubject = Database["public"]["Tables"]["course_subjects"]["Row"];
export type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type SubjectStatus = Database["public"]["Enums"]["subject_status"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type ClassStatus = Database["public"]["Enums"]["class_status"];
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type ClassStudent = Database["public"]["Tables"]["class_students"]["Row"];
export type ClassStudentStatus =
  Database["public"]["Enums"]["class_student_status"];

// --- Chamada / Frequência ----------------------------------------------------
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceRecord =
  Database["public"]["Tables"]["attendance_records"]["Row"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type AttendanceRecordStatus =
  Database["public"]["Enums"]["attendance_record_status"];

// --- Notas / Avaliações ------------------------------------------------------
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
export type Grade = Database["public"]["Tables"]["grades"]["Row"];
export type AssessmentType = Database["public"]["Enums"]["assessment_type"];

// --- Campanhas / Sorteios / Desafios -----------------------------------------
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignLevel = Database["public"]["Tables"]["campaign_levels"]["Row"];
export type CampaignParticipant =
  Database["public"]["Tables"]["campaign_participants"]["Row"];
export type CampaignProgress = Database["public"]["Tables"]["campaign_progress"]["Row"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type CampaignParticipantStatus =
  Database["public"]["Enums"]["campaign_participant_status"];
export type CampaignLevelDifficulty =
  Database["public"]["Enums"]["campaign_level_difficulty"];

// --- Alertas Automáticos -----------------------------------------------------
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type AlertType = Database["public"]["Enums"]["alert_type"];
export type AlertPriority = Database["public"]["Enums"]["alert_priority"];
export type AlertStatus = Database["public"]["Enums"]["alert_status"];

// --- Eventos e Palestras -----------------------------------------------------
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventRegistration =
  Database["public"]["Tables"]["event_registrations"]["Row"];
export type EventStatus = Database["public"]["Enums"]["event_status"];

// --- Comercial / CRM ---------------------------------------------------------
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInteraction = Database["public"]["Tables"]["lead_interactions"]["Row"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadInteractionType = Database["public"]["Enums"]["lead_interaction_type"];

// --- Calendário Acadêmico ----------------------------------------------------
export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
export type CalendarEventType = Database["public"]["Enums"]["calendar_event_type"];
export type EventVisibility = Database["public"]["Enums"]["event_visibility"];

// --- Comunicação Interna -----------------------------------------------------
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementRead =
  Database["public"]["Tables"]["announcement_reads"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AnnouncementTarget =
  Database["public"]["Enums"]["announcement_target"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// --- Documentos --------------------------------------------------------------
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentType = Database["public"]["Enums"]["document_type"];
export type DocumentStatus = Database["public"]["Enums"]["document_status"];
export type GeneratedDocument =
  Database["public"]["Tables"]["generated_documents"]["Row"];
export type GeneratedDocumentType =
  Database["public"]["Enums"]["generated_document_type"];

// --- Provas / Atividades Online ----------------------------------------------
export type OnlineAssessment =
  Database["public"]["Tables"]["online_assessments"]["Row"];
export type OnlineAssessmentStatus =
  Database["public"]["Enums"]["online_assessment_status"];
export type CorrectionType =
  Database["public"]["Enums"]["assessment_correction_type"];
export type QuestionType = Database["public"]["Enums"]["question_type"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
export type AssessmentQuestion =
  Database["public"]["Tables"]["assessment_questions"]["Row"];
export type AssessmentOption =
  Database["public"]["Tables"]["assessment_options"]["Row"];
export type StudentAssessmentSubmission =
  Database["public"]["Tables"]["student_assessment_submissions"]["Row"];
export type StudentAnswer =
  Database["public"]["Tables"]["student_answers"]["Row"];

// --- AVA / EAD ---------------------------------------------------------------
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type LessonMaterial = Database["public"]["Tables"]["lesson_materials"]["Row"];
export type StudentLessonProgress =
  Database["public"]["Tables"]["student_lesson_progress"]["Row"];
export type LessonStatus = Database["public"]["Enums"]["lesson_status"];
export type LessonReleaseType = Database["public"]["Enums"]["lesson_release_type"];
export type MaterialType = Database["public"]["Enums"]["material_type"];
export type LessonProgressStatus =
  Database["public"]["Enums"]["lesson_progress_status"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type TeacherAssignment =
  Database["public"]["Tables"]["teacher_assignments"]["Row"];
export type StudentGuardian =
  Database["public"]["Tables"]["student_guardians"]["Row"];
export type Guardian = Database["public"]["Tables"]["guardians"]["Row"];
export type GuardianInsert = Database["public"]["Tables"]["guardians"]["Insert"];
export type GuardianUpdate = Database["public"]["Tables"]["guardians"]["Update"];

// --- Professores -------------------------------------------------------------
export type TeacherStatus = Database["public"]["Enums"]["teacher_status"];
export type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
export type TeacherInsert = Database["public"]["Tables"]["teachers"]["Insert"];
export type TeacherUpdate = Database["public"]["Tables"]["teachers"]["Update"];
export type TeacherSubject = Database["public"]["Tables"]["teacher_subjects"]["Row"];
export type TeacherClass = Database["public"]["Tables"]["teacher_classes"]["Row"];

// --- Alunos ------------------------------------------------------------------
export type StudentStatus = Database["public"]["Enums"]["student_status"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];
