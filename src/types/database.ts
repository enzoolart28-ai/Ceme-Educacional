export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          dedupe_key: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["alert_priority"]
          related_class_id: string | null
          related_student_id: string | null
          related_user_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          related_class_id?: string | null
          related_student_id?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          related_class_id?: string | null
          related_student_id?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_class_id_fkey"
            columns: ["related_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_student_id_fkey"
            columns: ["related_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          author_id: string | null
          created_at: string
          id: string
          message: string
          target_id: string | null
          target_type: Database["public"]["Enums"]["announcement_target"]
          title: string
        }
        Insert: {
          attachment_url?: string | null
          author_id?: string | null
          created_at?: string
          id?: string
          message: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["announcement_target"]
          title: string
        }
        Update: {
          attachment_url?: string | null
          author_id?: string | null
          created_at?: string
          id?: string
          message?: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["announcement_target"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_charges: {
        Row: {
          asaas_customer_id: string
          asaas_payment_id: string
          bank_slip_url: string | null
          billing_type: string
          created_at: string
          due_date: string
          environment: string
          external_reference: string
          id: string
          invoice_id: string
          invoice_url: string | null
          pix_encoded_image: string | null
          pix_expiration_at: string | null
          pix_payload: string | null
          raw_response: Json
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          asaas_customer_id: string
          asaas_payment_id: string
          bank_slip_url?: string | null
          billing_type: string
          created_at?: string
          due_date: string
          environment: string
          external_reference: string
          id?: string
          invoice_id: string
          invoice_url?: string | null
          pix_encoded_image?: string | null
          pix_expiration_at?: string | null
          pix_payload?: string | null
          raw_response?: Json
          status: string
          updated_at?: string
          value: number
        }
        Update: {
          asaas_customer_id?: string
          asaas_payment_id?: string
          bank_slip_url?: string | null
          billing_type?: string
          created_at?: string
          due_date?: string
          environment?: string
          external_reference?: string
          id?: string
          invoice_id?: string
          invoice_url?: string | null
          pix_encoded_image?: string | null
          pix_expiration_at?: string | null
          pix_payload?: string | null
          raw_response?: Json
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_charges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          asaas_customer_id: string
          cpf_cnpj: string
          created_at: string
          environment: string
          id: string
          last_synced_at: string
          name: string
          raw_response: Json
          student_id: string
          updated_at: string
        }
        Insert: {
          asaas_customer_id: string
          cpf_cnpj: string
          created_at?: string
          environment: string
          id?: string
          last_synced_at?: string
          name: string
          raw_response?: Json
          student_id: string
          updated_at?: string
        }
        Update: {
          asaas_customer_id?: string
          cpf_cnpj?: string
          created_at?: string
          environment?: string
          id?: string
          last_synced_at?: string
          name?: string
          raw_response?: Json
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhook_events: {
        Row: {
          asaas_event_id: string
          asaas_payment_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
        }
        Insert: {
          asaas_event_id: string
          asaas_payment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
        }
        Update: {
          asaas_event_id?: string
          asaas_payment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
        }
        Relationships: []
      }
      assessment_options: {
        Row: {
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
          text: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          media_url: string | null
          order_index: number
          points: number
          statement: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          media_url?: string | null
          order_index?: number
          points?: number
          statement: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          media_url?: string | null
          order_index?: number
          points?: number
          statement?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "online_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string
          course_id: string | null
          created_at: string
          date: string | null
          id: string
          max_grade: number
          name: string
          notes: string | null
          subject_id: string | null
          teacher_id: string | null
          type: Database["public"]["Enums"]["assessment_type"]
          updated_at: string
          weight: number
        }
        Insert: {
          class_id: string
          course_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          max_grade?: number
          name: string
          notes?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
          weight?: number
        }
        Update: {
          class_id?: string
          course_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          max_grade?: number
          name?: string
          notes?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          end_time: string | null
          id: string
          start_time: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          subject_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          action: string
          attendance_id: string | null
          changed_by: string | null
          created_at: string
          detail: string | null
          id: string
        }
        Insert: {
          action: string
          attendance_id?: string | null
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Update: {
          action?: string
          attendance_id?: string | null
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_id: string
          created_at: string
          id: string
          observation: string | null
          status: Database["public"]["Enums"]["attendance_record_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_id: string
          created_at?: string
          id?: string
          observation?: string | null
          status?: Database["public"]["Enums"]["attendance_record_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_id?: string
          created_at?: string
          id?: string
          observation?: string | null
          status?: Database["public"]["Enums"]["attendance_record_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_datetime: string | null
          id: string
          location: string | null
          start_datetime: string
          teacher_id: string | null
          title: string
          type: Database["public"]["Enums"]["calendar_event_type"]
          unit_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          location?: string | null
          start_datetime: string
          teacher_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          unit_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          location?: string | null
          start_datetime?: string
          teacher_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          unit_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_levels: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["campaign_level_difficulty"]
          id: string
          name: string
          order_index: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["campaign_level_difficulty"]
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["campaign_level_difficulty"]
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_levels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          age: number | null
          campaign_id: string
          city: string | null
          created_at: string
          current_level: number
          eligible_for_draw: boolean
          father_name: string | null
          full_name: string
          guardian_name: string | null
          id: string
          is_winner: boolean
          mother_name: string | null
          phone: string | null
          school: string | null
          status: Database["public"]["Enums"]["campaign_participant_status"]
          updated_at: string
        }
        Insert: {
          age?: number | null
          campaign_id: string
          city?: string | null
          created_at?: string
          current_level?: number
          eligible_for_draw?: boolean
          father_name?: string | null
          full_name: string
          guardian_name?: string | null
          id?: string
          is_winner?: boolean
          mother_name?: string | null
          phone?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["campaign_participant_status"]
          updated_at?: string
        }
        Update: {
          age?: number | null
          campaign_id?: string
          city?: string | null
          created_at?: string
          current_level?: number
          eligible_for_draw?: boolean
          father_name?: string | null
          full_name?: string
          guardian_name?: string | null
          id?: string
          is_winner?: boolean
          mother_name?: string | null
          phone?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["campaign_participant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_progress: {
        Row: {
          completed_at: string
          id: string
          level_id: string
          notes: string | null
          participant_id: string
          score: number | null
        }
        Insert: {
          completed_at?: string
          id?: string
          level_id: string
          notes?: string | null
          participant_id: string
          score?: number | null
        }
        Update: {
          completed_at?: string
          id?: string
          level_id?: string
          notes?: string | null
          participant_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "campaign_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_progress_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "campaign_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          prizes: string | null
          rules: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          prizes?: string | null
          rules?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          prizes?: string | null
          rules?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          attachment_url: string | null
          cash_session_id: string
          category: string
          cost_center_id: string | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          financial_request_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["cash_movement_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["cash_movement_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          cash_session_id: string
          category?: string
          cost_center_id?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          financial_request_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["cash_movement_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["cash_movement_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          cash_session_id?: string
          category?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          financial_request_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["cash_movement_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["cash_movement_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_financial_request_id_fkey"
            columns: ["financial_request_id"]
            isOneToOne: false
            referencedRelation: "financial_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["cash_register_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["cash_register_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["cash_register_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          cash_register_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          difference: number | null
          difference_reason: string | null
          expected_closing_balance: number | null
          id: string
          informed_closing_balance: number | null
          manager_review_notes: string | null
          manager_reviewed_at: string | null
          manager_reviewed_by: string | null
          opened_at: string
          opened_by: string
          opening_balance: number
          status: Database["public"]["Enums"]["cash_session_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          cash_register_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          difference?: number | null
          difference_reason?: string | null
          expected_closing_balance?: number | null
          id?: string
          informed_closing_balance?: number | null
          manager_review_notes?: string | null
          manager_reviewed_at?: string | null
          manager_reviewed_by?: string | null
          opened_at?: string
          opened_by: string
          opening_balance?: number
          status?: Database["public"]["Enums"]["cash_session_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          cash_register_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          difference?: number | null
          difference_reason?: string | null
          expected_closing_balance?: number | null
          id?: string
          informed_closing_balance?: number | null
          manager_review_notes?: string | null
          manager_reviewed_at?: string | null
          manager_reviewed_by?: string | null
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          status?: Database["public"]["Enums"]["cash_session_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_manager_reviewed_by_fkey"
            columns: ["manager_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          created_at: string
          enrollment_id: string | null
          id: string
          status: Database["public"]["Enums"]["class_student_status"]
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["class_student_status"]
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["class_student_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          course_id: string
          created_at: string
          end_date: string | null
          end_time: string | null
          id: string
          main_teacher_id: string | null
          max_students: number | null
          name: string
          shift: Database["public"]["Enums"]["class_shift"]
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["class_status"]
          unit_id: string | null
          updated_at: string
          weekdays: string[]
          year: number
        }
        Insert: {
          course_id: string
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          main_teacher_id?: string | null
          max_students?: number | null
          name: string
          shift?: Database["public"]["Enums"]["class_shift"]
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          unit_id?: string | null
          updated_at?: string
          weekdays?: string[]
          year: number
        }
        Update: {
          course_id?: string
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          main_teacher_id?: string | null
          max_students?: number | null
          name?: string
          shift?: Database["public"]["Enums"]["class_shift"]
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          unit_id?: string | null
          updated_at?: string
          weekdays?: string[]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget_limit: number
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["department_status"]
          updated_at: string
        }
        Insert: {
          budget_limit?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["department_status"]
          updated_at?: string
        }
        Update: {
          budget_limit?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["department_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          updated_at: string
          workload_hours: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          updated_at?: string
          workload_hours?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
          workload_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subjects: {
        Row: {
          course_id: string
          created_at: string
          id: string
          module_id: string | null
          order_index: number
          subject_id: string
          teacher_id: string | null
          workload_hours: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          module_id?: string | null
          order_index?: number
          subject_id: string
          teacher_id?: string | null
          workload_hours?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string | null
          order_index?: number
          subject_id?: string
          teacher_id?: string | null
          workload_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          certificate_enabled: boolean
          created_at: string
          description: string
          duration: string | null
          id: string
          minimum_attendance: number | null
          minimum_grade: number | null
          modality: Database["public"]["Enums"]["course_modality"]
          name: string
          notes: string | null
          price: number | null
          requirements: string | null
          status: Database["public"]["Enums"]["course_status"]
          type: Database["public"]["Enums"]["course_type"]
          updated_at: string
          workload_hours: number | null
        }
        Insert: {
          certificate_enabled?: boolean
          created_at?: string
          description?: string
          duration?: string | null
          id?: string
          minimum_attendance?: number | null
          minimum_grade?: number | null
          modality?: Database["public"]["Enums"]["course_modality"]
          name: string
          notes?: string | null
          price?: number | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
          workload_hours?: number | null
        }
        Update: {
          certificate_enabled?: boolean
          created_at?: string
          description?: string
          duration?: string | null
          id?: string
          minimum_attendance?: number | null
          minimum_grade?: number | null
          modality?: Database["public"]["Enums"]["course_modality"]
          name?: string
          notes?: string | null
          price?: number | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
          workload_hours?: number | null
        }
        Relationships: []
      }
      department_goals: {
        Row: {
          achieved_value: number
          created_at: string
          department_id: string
          description: string | null
          end_date: string | null
          id: string
          manager_notes: string | null
          progress_percentage: number
          responsible_user_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          achieved_value?: number
          created_at?: string
          department_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_notes?: string | null
          progress_percentage?: number
          responsible_user_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          achieved_value?: number
          created_at?: string
          department_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_notes?: string | null
          progress_percentage?: number
          responsible_user_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_goals_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          manager_id: string | null
          name: string
          status: Database["public"]["Enums"]["department_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["department_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["department_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          detail: string | null
          document_id: string | null
          id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          document_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          document_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          observation: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          student_id: string
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          observation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          student_id: string
          title: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          observation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          student_id?: string
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          age: number | null
          attended: boolean
          city: string | null
          converted_to_lead: boolean
          converted_to_student: boolean
          course_interest: string | null
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          guardian_name: string | null
          id: string
          lead_id: string | null
          notes: string | null
          phone: string | null
          school: string | null
          student_id: string | null
        }
        Insert: {
          age?: number | null
          attended?: boolean
          city?: string | null
          converted_to_lead?: boolean
          converted_to_student?: boolean
          course_interest?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          guardian_name?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          school?: string | null
          student_id?: string | null
        }
        Update: {
          age?: number | null
          attended?: boolean
          city?: string | null
          converted_to_lead?: boolean
          converted_to_student?: boolean
          course_interest?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          guardian_name?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          school?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          max_registrations: number | null
          name: string
          responsible_user_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_registrations?: number | null
          name: string
          responsible_user_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_registrations?: number | null
          name?: string
          responsible_user_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      financial_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          metadata: Json
          payment_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_plans: {
        Row: {
          course_id: string | null
          created_at: string
          discount_value: number
          due_day: number
          id: string
          installments: number
          name: string
          notes: string | null
          scholarship_percentage: number
          total_value: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          discount_value?: number
          due_day?: number
          id?: string
          installments?: number
          name: string
          notes?: string | null
          scholarship_percentage?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          discount_value?: number
          due_day?: number
          id?: string
          installments?: number
          name?: string
          notes?: string | null
          scholarship_percentage?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_plans_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_request_history: {
        Row: {
          action: string
          created_at: string
          financial_request_id: string
          id: string
          new_status:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          financial_request_id: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          financial_request_id?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["financial_request_status"]
            | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_request_history_financial_request_id_fkey"
            columns: ["financial_request_id"]
            isOneToOne: false
            referencedRelation: "financial_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_request_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_requests: {
        Row: {
          approved_amount: number | null
          attachment_url: string | null
          beneficiary_document: string | null
          beneficiary_name: string | null
          cost_center_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          desired_payment_method: Database["public"]["Enums"]["payment_method"]
          expense_category: string
          id: string
          justification: string | null
          manager_decision:
            | Database["public"]["Enums"]["manager_decision"]
            | null
          manager_decision_at: string | null
          manager_id: string | null
          manager_reason: string | null
          paid_amount: number | null
          paid_at: string | null
          paid_by: string | null
          payment_proof_url: string | null
          priority: Database["public"]["Enums"]["financial_request_priority"]
          request_date: string
          requested_amount: number
          requester_id: string
          required_date: string | null
          status: Database["public"]["Enums"]["financial_request_status"]
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          attachment_url?: string | null
          beneficiary_document?: string | null
          beneficiary_name?: string | null
          cost_center_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          desired_payment_method?: Database["public"]["Enums"]["payment_method"]
          expense_category?: string
          id?: string
          justification?: string | null
          manager_decision?:
            | Database["public"]["Enums"]["manager_decision"]
            | null
          manager_decision_at?: string | null
          manager_id?: string | null
          manager_reason?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          priority?: Database["public"]["Enums"]["financial_request_priority"]
          request_date?: string
          requested_amount: number
          requester_id: string
          required_date?: string | null
          status?: Database["public"]["Enums"]["financial_request_status"]
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          attachment_url?: string | null
          beneficiary_document?: string | null
          beneficiary_name?: string | null
          cost_center_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          desired_payment_method?: Database["public"]["Enums"]["payment_method"]
          expense_category?: string
          id?: string
          justification?: string | null
          manager_decision?:
            | Database["public"]["Enums"]["manager_decision"]
            | null
          manager_decision_at?: string | null
          manager_id?: string | null
          manager_reason?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          priority?: Database["public"]["Enums"]["financial_request_priority"]
          request_date?: string
          requested_amount?: number
          requester_id?: string
          required_date?: string | null
          status?: Database["public"]["Enums"]["financial_request_status"]
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_requests_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_requests_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_requests_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          created_at: string
          enrollment_id: string | null
          file_url: string
          generated_by: string | null
          id: string
          student_id: string
          title: string
          type: Database["public"]["Enums"]["generated_document_type"]
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          file_url: string
          generated_by?: string | null
          id?: string
          student_id: string
          title: string
          type: Database["public"]["Enums"]["generated_document_type"]
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          file_url?: string
          generated_by?: string | null
          id?: string
          student_id?: string
          title?: string
          type?: Database["public"]["Enums"]["generated_document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_logs: {
        Row: {
          action: string
          assessment_id: string | null
          changed_by: string | null
          created_at: string
          detail: string | null
          id: string
        }
        Insert: {
          action: string
          assessment_id?: string | null
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Update: {
          action?: string
          assessment_id?: string | null
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assessment_id: string
          created_at: string
          feedback: string | null
          grade: number | null
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_login_aliases: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          login_cpf: string
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          login_cpf: string
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          login_cpf?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_login_aliases_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_login_aliases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          account_created_at: string | null
          address: string | null
          auto_family_key: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          kinship: string | null
          notes: string | null
          phone: string | null
          profile_id: string | null
          review_required: boolean
          rg: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          account_created_at?: string | null
          address?: string | null
          auto_family_key?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          kinship?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          review_required?: boolean
          rg?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          account_created_at?: string | null
          address?: string | null
          auto_family_key?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          kinship?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          review_required?: boolean
          rg?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          discount_value: number
          due_date: string
          enrollment_id: string | null
          final_value: number | null
          fine_value: number
          id: string
          interest_value: number
          notes: string | null
          original_value: number
          paid_at: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          discount_value?: number
          due_date: string
          enrollment_id?: string | null
          final_value?: number | null
          fine_value?: number
          id?: string
          interest_value?: number
          notes?: string | null
          original_value?: number
          paid_at?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          discount_value?: number
          due_date?: string
          enrollment_id?: string | null
          final_value?: number | null
          fine_value?: number
          id?: string
          interest_value?: number
          notes?: string | null
          original_value?: number
          paid_at?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "class_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          interaction_type: Database["public"]["Enums"]["lead_interaction_type"]
          lead_id: string
          next_contact_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          interaction_type?: Database["public"]["Enums"]["lead_interaction_type"]
          lead_id: string
          next_contact_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          interaction_type?: Database["public"]["Enums"]["lead_interaction_type"]
          lead_id?: string
          next_contact_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          age: number | null
          city: string | null
          converted_student_id: string | null
          course_interest: string | null
          created_at: string
          email: string | null
          full_name: string
          guardian_name: string | null
          id: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          age?: number | null
          city?: string | null
          converted_student_id?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          guardian_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          age?: number | null
          city?: string | null
          converted_student_id?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          guardian_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          created_at: string
          external_url: string | null
          file_url: string | null
          id: string
          lesson_id: string
          title: string
          type: Database["public"]["Enums"]["material_type"]
        }
        Insert: {
          created_at?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          lesson_id: string
          title: string
          type?: Database["public"]["Enums"]["material_type"]
        }
        Update: {
          created_at?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          lesson_id?: string
          title?: string
          type?: Database["public"]["Enums"]["material_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          module_id: string | null
          order_index: number
          release_date: string | null
          release_type: Database["public"]["Enums"]["lesson_release_type"]
          status: Database["public"]["Enums"]["lesson_status"]
          subject_id: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string | null
          order_index?: number
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["lesson_release_type"]
          status?: Database["public"]["Enums"]["lesson_status"]
          subject_id?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string | null
          order_index?: number
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["lesson_release_type"]
          status?: Database["public"]["Enums"]["lesson_status"]
          subject_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      management_audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          previous_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_reviews: {
        Row: {
          created_at: string
          deadline: string | null
          department_id: string | null
          id: string
          manager_id: string | null
          notes: string | null
          reference_id: string | null
          review_type: Database["public"]["Enums"]["manager_review_type"]
          status: Database["public"]["Enums"]["manager_review_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          reference_id?: string | null
          review_type?: Database["public"]["Enums"]["manager_review_type"]
          status?: Database["public"]["Enums"]["manager_review_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          reference_id?: string | null
          review_type?: Database["public"]["Enums"]["manager_review_type"]
          status?: Database["public"]["Enums"]["manager_review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_reviews_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_reviews_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      online_assessment_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          assessment_id: string | null
          created_at: string
          detail: string | null
          id: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          assessment_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          assessment_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_assessment_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_assessment_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "online_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      online_assessments: {
        Row: {
          class_id: string
          correction_type: Database["public"]["Enums"]["assessment_correction_type"]
          course_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          max_attempts: number
          max_grade: number
          min_grade: number
          show_answer_key: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          start_date: string | null
          status: Database["public"]["Enums"]["online_assessment_status"]
          subject_id: string | null
          teacher_id: string | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          correction_type?: Database["public"]["Enums"]["assessment_correction_type"]
          course_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_attempts?: number
          max_grade?: number
          min_grade?: number
          show_answer_key?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          start_date?: string | null
          status?: Database["public"]["Enums"]["online_assessment_status"]
          subject_id?: string | null
          teacher_id?: string | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          correction_type?: Database["public"]["Enums"]["assessment_correction_type"]
          course_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_attempts?: number
          max_grade?: number
          min_grade?: number
          show_answer_key?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          start_date?: string | null
          status?: Database["public"]["Enums"]["online_assessment_status"]
          subject_id?: string | null
          teacher_id?: string | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          cash_movement_id: string | null
          category_id: string
          competence_month: number
          competence_year: number
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payee_id: string | null
          recurring: boolean
          status: Database["public"]["Enums"]["payable_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          cash_movement_id?: string | null
          category_id: string
          competence_month: number
          competence_year: number
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payee_id?: string | null
          recurring?: boolean
          status?: Database["public"]["Enums"]["payable_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_movement_id?: string | null
          category_id?: string
          competence_month?: number
          competence_year?: number
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payee_id?: string | null
          recurring?: boolean
          status?: Database["public"]["Enums"]["payable_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_cash_movement_id_fkey"
            columns: ["cash_movement_id"]
            isOneToOne: false
            referencedRelation: "cash_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
        ]
      }
      payees: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          pix_key: string | null
          profile_id: string | null
          type: Database["public"]["Enums"]["payee_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          pix_key?: string | null
          profile_id?: string | null
          type?: Database["public"]["Enums"]["payee_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          pix_key?: string | null
          profile_id?: string | null
          type?: Database["public"]["Enums"]["payee_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_provider: string | null
          provider_payment_id: string | null
          received_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_provider?: string | null
          provider_payment_id?: string | null
          received_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_provider?: string | null
          provider_payment_id?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          key: string
          label: string
        }
        Insert: {
          description?: string
          key: string
          label: string
        }
        Update: {
          description?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_access_at: string | null
          must_change_password: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          last_access_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_access_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_key: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          permission_key: string
          role_key: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          permission_key?: string
          role_key?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      roles: {
        Row: {
          description: string
          key: Database["public"]["Enums"]["user_role"]
          label: string
        }
        Insert: {
          description?: string
          key: Database["public"]["Enums"]["user_role"]
          label: string
        }
        Update: {
          description?: string
          key?: Database["public"]["Enums"]["user_role"]
          label?: string
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answer_text: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          grade: number | null
          id: string
          question_id: string
          selected_option_id: string | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          question_id: string
          selected_option_id?: string | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          question_id?: string
          selected_option_id?: string | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "assessment_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "student_assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assessment_submissions: {
        Row: {
          assessment_id: string
          attempt_number: number
          created_at: string
          feedback: string | null
          grade: number | null
          id: string
          reopened_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          attempt_number?: number
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          reopened_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          attempt_number?: number
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          reopened_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "online_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_financial_responsible: boolean
          is_pedagogical_responsible: boolean
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_financial_responsible?: boolean
          is_pedagogical_responsible?: boolean
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_financial_responsible?: boolean
          is_pedagogical_responsible?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          progress_percentage: number
          status: Database["public"]["Enums"]["lesson_progress_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          father_name: string | null
          full_name: string
          id: string
          mother_name: string | null
          notes: string | null
          phone: string | null
          profile_id: string | null
          rg: string | null
          state: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          full_name: string
          id?: string
          mother_name?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          rg?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          full_name?: string
          id?: string
          mother_name?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          rg?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["subject_status"]
          updated_at: string
          workload_hours: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["subject_status"]
          updated_at?: string
          workload_hours?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["subject_status"]
          updated_at?: string
          workload_hours?: number | null
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          cpf: string | null
          created_at: string
          education: string | null
          email: string | null
          expertise_area: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          profile_id: string | null
          rg: string | null
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at: string
          workload: number | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          expertise_area?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
          workload?: number | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          expertise_area?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
          workload?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          display_name: string | null
          guardian_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          opt_in_status: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opted_in_at: string | null
          opted_out_at: string | null
          phone_e164: string
          profile_id: string | null
          student_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          guardian_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opt_in_status?: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_e164: string
          profile_id?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          guardian_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opt_in_status?: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_e164?: string
          profile_id?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_follow_up_rules: {
        Row: {
          created_at: string
          created_by: string | null
          delay_minutes: number
          enabled: boolean
          id: string
          name: string
          template_language: string
          template_name: string
          trigger_type: Database["public"]["Enums"]["whatsapp_trigger_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          enabled?: boolean
          id?: string
          name: string
          template_language?: string
          template_name: string
          trigger_type: Database["public"]["Enums"]["whatsapp_trigger_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          enabled?: boolean
          id?: string
          name?: string
          template_language?: string
          template_name?: string
          trigger_type?: Database["public"]["Enums"]["whatsapp_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_follow_up_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          contact_id: string
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["whatsapp_message_direction"]
          error_code: string | null
          error_message: string | null
          id: string
          meta_message_id: string | null
          metadata: Json
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"]
          template_name: string | null
        }
        Insert: {
          body?: string | null
          contact_id: string
          created_at?: string
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["whatsapp_message_direction"]
          error_code?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          metadata?: Json
          read_at?: string | null
          sent_at?: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"]
          template_name?: string | null
        }
        Update: {
          body?: string | null
          contact_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["whatsapp_message_direction"]
          error_code?: string | null
          error_message?: string | null
          id?: string
          meta_message_id?: string | null
          metadata?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"]
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          attempts: number
          contact_id: string
          created_at: string
          follow_up_rule_id: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          processed_at: string | null
          scheduled_for: string
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["whatsapp_outbox_status"]
          template_components: Json
          template_language: string
          template_name: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          contact_id: string
          created_at?: string
          follow_up_rule_id?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          processed_at?: string | null
          scheduled_for: string
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["whatsapp_outbox_status"]
          template_components?: Json
          template_language?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          contact_id?: string
          created_at?: string
          follow_up_rule_id?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          processed_at?: string | null
          scheduled_for?: string
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["whatsapp_outbox_status"]
          template_components?: Json
          template_language?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_follow_up_rule_id_fkey"
            columns: ["follow_up_rule_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_follow_up_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          components: Json
          created_at: string
          id: string
          language: string
          last_synced_at: string | null
          meta_template_id: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          components?: Json
          created_at?: string
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          components?: Json
          created_at?: string
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_webhook_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_attendance: { Args: { p_class: string }; Returns: boolean }
      can_manage_content: { Args: never; Returns: boolean }
      can_manage_grades: { Args: { p_class: string }; Returns: boolean }
      can_manage_online_assessment: {
        Args: { p_assessment: string }
        Returns: boolean
      }
      can_read_cash: { Args: never; Returns: boolean }
      can_review_cash: { Args: never; Returns: boolean }
      can_send_announcements: { Args: never; Returns: boolean }
      can_view_alert: {
        Args: {
          p_related_user: string
          p_type: Database["public"]["Enums"]["alert_type"]
        }
        Returns: boolean
      }
      can_view_announcement: {
        Args: {
          p_target: string
          p_type: Database["public"]["Enums"]["announcement_target"]
        }
        Returns: boolean
      }
      can_view_financial_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      can_view_management: { Args: never; Returns: boolean }
      can_view_online_assessment: {
        Args: { p_assessment: string }
        Returns: boolean
      }
      cash_session_expected_balance: {
        Args: { p_session: string }
        Returns: number
      }
      current_guardian_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_status: {
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      enrolled_in_course: { Args: { p_course: string }; Returns: boolean }
      financial_invoice_paid_amount: {
        Args: { p_invoice: string }
        Returns: number
      }
      generate_alerts: { Args: never; Returns: number }
      get_student_assessment: { Args: { p_assessment: string }; Returns: Json }
      get_submission_review: { Args: { p_submission: string }; Returns: Json }
      guardian_of_course_student: {
        Args: { p_course: string }
        Returns: boolean
      }
      guards_student: { Args: { p_student_id: string }; Returns: boolean }
      has_permission: { Args: { p_permission: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_enrolled: { Args: { p_class: string }; Returns: boolean }
      is_gestor: { Args: never; Returns: boolean }
      is_guardian_of: { Args: { p_student: string }; Returns: boolean }
      is_own_student: { Args: { p_student: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      list_message_recipients: {
        Args: never
        Returns: {
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      owns_teacher: { Args: { p_teacher: string }; Returns: boolean }
      record_last_access: { Args: never; Returns: undefined }
      refresh_overdue_invoices: { Args: never; Returns: undefined }
      register_for_event: {
        Args: {
          p_age?: number
          p_city?: string
          p_course?: string
          p_email?: string
          p_event: string
          p_full_name: string
          p_guardian?: string
          p_notes?: string
          p_phone?: string
          p_school?: string
        }
        Returns: string
      }
      save_assessment_progress: {
        Args: { p_answers: Json; p_submission: string; p_submit: boolean }
        Returns: undefined
      }
      send_message: {
        Args: {
          p_attachment?: string
          p_body: string
          p_receiver: string
          p_subject: string
        }
        Returns: string
      }
      start_assessment: { Args: { p_assessment: string }; Returns: string }
      teaches_class: { Args: { p_class: string }; Returns: boolean }
    }
    Enums: {
      alert_priority: "baixa" | "media" | "alta" | "critica"
      alert_status: "novo" | "visualizado" | "resolvido" | "ignorado"
      alert_type:
        | "frequencia_baixa"
        | "faltas_consecutivas"
        | "mensalidade_vencida"
        | "ava_inativo"
        | "chamada_pendente"
        | "atividade_sem_correcao"
        | "documento_pendente"
        | "certificado_pendente"
        | "lead_sem_retorno"
        | "evento_proximo"
        | "prova_proxima"
      announcement_target:
        | "all"
        | "class"
        | "course"
        | "guardians"
        | "teachers"
        | "user"
      assessment_correction_type: "automatic" | "manual"
      assessment_type:
        | "prova"
        | "trabalho"
        | "atividade"
        | "participacao"
        | "recuperacao"
        | "projeto"
        | "pratica"
      attendance_record_status:
        | "present"
        | "absent"
        | "justified_absence"
        | "late"
      attendance_status: "open" | "finalized"
      calendar_event_type:
        | "aula"
        | "prova"
        | "atividade"
        | "reuniao"
        | "feriado"
        | "institucional"
        | "vencimento_financeiro"
        | "palestra"
      campaign_level_difficulty: "facil" | "medio" | "dificil"
      campaign_participant_status:
        | "inscrito"
        | "em_andamento"
        | "concluido"
        | "desistente"
      campaign_status: "rascunho" | "ativa" | "encerrada" | "cancelada"
      cash_movement_status: "pending" | "completed" | "cancelled" | "reversed"
      cash_movement_type:
        | "entry"
        | "exit"
        | "reinforcement"
        | "withdrawal"
        | "reversal"
        | "adjustment"
      cash_register_status: "active" | "inactive"
      cash_session_status:
        | "open"
        | "closed"
        | "under_review"
        | "with_difference"
        | "approved"
        | "rejected"
      class_shift: "manha" | "tarde" | "noite" | "integral" | "sabado"
      class_status: "open" | "in_progress" | "finished" | "cancelled"
      class_student_status: "active" | "inactive" | "transferred" | "cancelled"
      course_modality: "presencial" | "semipresencial" | "ead"
      course_status: "active" | "inactive" | "planning" | "closed"
      course_type:
        | "tecnico"
        | "profissionalizante"
        | "livre"
        | "infantil"
        | "preparatorio"
        | "reforco"
      department_status: "active" | "inactive"
      document_status: "pendente" | "enviado" | "aprovado" | "reprovado"
      document_type:
        | "rg"
        | "cpf"
        | "comprovante_residencia"
        | "historico_escolar"
        | "certidao"
        | "contrato"
        | "termo_matricula"
        | "termo_estagio"
        | "comprovante_pagamento"
        | "outros"
      enrollment_status: "active" | "transferred" | "cancelled" | "completed"
      event_status:
        | "planejado"
        | "aberto_inscricao"
        | "encerrado"
        | "cancelado"
        | "finalizado"
      event_visibility: "public" | "restricted" | "private"
      financial_request_priority: "baixa" | "media" | "alta" | "urgente"
      financial_request_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "partially_approved"
        | "rejected"
        | "needs_information"
        | "paid"
        | "cancelled"
      generated_document_type:
        | "declaracao_matricula"
        | "declaracao_frequencia"
        | "contrato_educacional"
        | "historico_escolar"
        | "recibo"
        | "comprovante_financeiro"
        | "relatorio_academico"
      goal_status:
        | "not_started"
        | "in_progress"
        | "on_track"
        | "late"
        | "completed"
        | "cancelled"
      invoice_status:
        | "paid"
        | "open"
        | "overdue"
        | "partial"
        | "cancelled"
        | "renegotiated"
      lead_interaction_type:
        | "ligacao"
        | "whatsapp"
        | "email"
        | "presencial"
        | "agendamento"
        | "observacao"
        | "outro"
      lead_source:
        | "instagram"
        | "whatsapp"
        | "facebook"
        | "indicacao"
        | "evento"
        | "palestra"
        | "escola_parceira"
        | "site"
        | "outro"
      lead_status:
        | "novo"
        | "em_atendimento"
        | "aguardando_retorno"
        | "agendado"
        | "compareceu"
        | "matriculado"
        | "desistiu"
        | "sem_resposta"
      lesson_progress_status: "not_started" | "in_progress" | "completed"
      lesson_release_type: "all" | "date" | "after_previous"
      lesson_status: "draft" | "published" | "archived"
      manager_decision:
        | "approved"
        | "partially_approved"
        | "rejected"
        | "needs_information"
        | "returned_for_correction"
        | "forwarded_to_direction"
      manager_review_status:
        | "on_track"
        | "attention"
        | "late"
        | "critical"
        | "completed"
      manager_review_type:
        | "department"
        | "goal"
        | "cash_session"
        | "financial_request"
        | "indicator"
        | "other"
      material_type: "video" | "pdf" | "slides" | "link" | "file"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "announcement"
        | "message"
      online_assessment_status: "draft" | "published" | "closed" | "archived"
      payable_status: "pendente" | "pago" | "vencido" | "cancelado"
      payee_type:
        | "colaborador"
        | "professor"
        | "preceptor"
        | "fornecedor"
        | "outro"
      payment_method:
        | "cash"
        | "pix"
        | "credit_card"
        | "debit_card"
        | "bank_slip"
        | "transfer"
        | "other"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "essay"
        | "file_upload"
        | "image"
        | "video"
        | "matching"
      student_status:
        | "active"
        | "inactive"
        | "defaulter"
        | "locked"
        | "transferred"
        | "completed"
        | "dropout"
      subject_status: "active" | "inactive"
      submission_status: "in_progress" | "submitted" | "graded"
      teacher_status: "active" | "inactive" | "on_leave" | "dismissed"
      user_role:
        | "admin"
        | "diretor"
        | "coordenacao"
        | "secretaria"
        | "financeiro"
        | "professor"
        | "aluno"
        | "responsavel"
        | "gestor"
        | "comercial"
      user_status: "active" | "inactive" | "suspended" | "pending"
      whatsapp_message_direction: "inbound" | "outbound"
      whatsapp_message_status:
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "received"
      whatsapp_opt_in_status: "pending" | "opted_in" | "opted_out"
      whatsapp_outbox_status:
        | "pending"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
      whatsapp_trigger_type:
        | "lead_no_response"
        | "invoice_due"
        | "invoice_overdue"
        | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alert_priority: ["baixa", "media", "alta", "critica"],
      alert_status: ["novo", "visualizado", "resolvido", "ignorado"],
      alert_type: [
        "frequencia_baixa",
        "faltas_consecutivas",
        "mensalidade_vencida",
        "ava_inativo",
        "chamada_pendente",
        "atividade_sem_correcao",
        "documento_pendente",
        "certificado_pendente",
        "lead_sem_retorno",
        "evento_proximo",
        "prova_proxima",
      ],
      announcement_target: [
        "all",
        "class",
        "course",
        "guardians",
        "teachers",
        "user",
      ],
      assessment_correction_type: ["automatic", "manual"],
      assessment_type: [
        "prova",
        "trabalho",
        "atividade",
        "participacao",
        "recuperacao",
        "projeto",
        "pratica",
      ],
      attendance_record_status: [
        "present",
        "absent",
        "justified_absence",
        "late",
      ],
      attendance_status: ["open", "finalized"],
      calendar_event_type: [
        "aula",
        "prova",
        "atividade",
        "reuniao",
        "feriado",
        "institucional",
        "vencimento_financeiro",
        "palestra",
      ],
      campaign_level_difficulty: ["facil", "medio", "dificil"],
      campaign_participant_status: [
        "inscrito",
        "em_andamento",
        "concluido",
        "desistente",
      ],
      campaign_status: ["rascunho", "ativa", "encerrada", "cancelada"],
      cash_movement_status: ["pending", "completed", "cancelled", "reversed"],
      cash_movement_type: [
        "entry",
        "exit",
        "reinforcement",
        "withdrawal",
        "reversal",
        "adjustment",
      ],
      cash_register_status: ["active", "inactive"],
      cash_session_status: [
        "open",
        "closed",
        "under_review",
        "with_difference",
        "approved",
        "rejected",
      ],
      class_shift: ["manha", "tarde", "noite", "integral", "sabado"],
      class_status: ["open", "in_progress", "finished", "cancelled"],
      class_student_status: ["active", "inactive", "transferred", "cancelled"],
      course_modality: ["presencial", "semipresencial", "ead"],
      course_status: ["active", "inactive", "planning", "closed"],
      course_type: [
        "tecnico",
        "profissionalizante",
        "livre",
        "infantil",
        "preparatorio",
        "reforco",
      ],
      department_status: ["active", "inactive"],
      document_status: ["pendente", "enviado", "aprovado", "reprovado"],
      document_type: [
        "rg",
        "cpf",
        "comprovante_residencia",
        "historico_escolar",
        "certidao",
        "contrato",
        "termo_matricula",
        "termo_estagio",
        "comprovante_pagamento",
        "outros",
      ],
      enrollment_status: ["active", "transferred", "cancelled", "completed"],
      event_status: [
        "planejado",
        "aberto_inscricao",
        "encerrado",
        "cancelado",
        "finalizado",
      ],
      event_visibility: ["public", "restricted", "private"],
      financial_request_priority: ["baixa", "media", "alta", "urgente"],
      financial_request_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "partially_approved",
        "rejected",
        "needs_information",
        "paid",
        "cancelled",
      ],
      generated_document_type: [
        "declaracao_matricula",
        "declaracao_frequencia",
        "contrato_educacional",
        "historico_escolar",
        "recibo",
        "comprovante_financeiro",
        "relatorio_academico",
      ],
      goal_status: [
        "not_started",
        "in_progress",
        "on_track",
        "late",
        "completed",
        "cancelled",
      ],
      invoice_status: [
        "paid",
        "open",
        "overdue",
        "partial",
        "cancelled",
        "renegotiated",
      ],
      lead_interaction_type: [
        "ligacao",
        "whatsapp",
        "email",
        "presencial",
        "agendamento",
        "observacao",
        "outro",
      ],
      lead_source: [
        "instagram",
        "whatsapp",
        "facebook",
        "indicacao",
        "evento",
        "palestra",
        "escola_parceira",
        "site",
        "outro",
      ],
      lead_status: [
        "novo",
        "em_atendimento",
        "aguardando_retorno",
        "agendado",
        "compareceu",
        "matriculado",
        "desistiu",
        "sem_resposta",
      ],
      lesson_progress_status: ["not_started", "in_progress", "completed"],
      lesson_release_type: ["all", "date", "after_previous"],
      lesson_status: ["draft", "published", "archived"],
      manager_decision: [
        "approved",
        "partially_approved",
        "rejected",
        "needs_information",
        "returned_for_correction",
        "forwarded_to_direction",
      ],
      manager_review_status: [
        "on_track",
        "attention",
        "late",
        "critical",
        "completed",
      ],
      manager_review_type: [
        "department",
        "goal",
        "cash_session",
        "financial_request",
        "indicator",
        "other",
      ],
      material_type: ["video", "pdf", "slides", "link", "file"],
      notification_type: [
        "info",
        "success",
        "warning",
        "announcement",
        "message",
      ],
      online_assessment_status: ["draft", "published", "closed", "archived"],
      payable_status: ["pendente", "pago", "vencido", "cancelado"],
      payee_type: [
        "colaborador",
        "professor",
        "preceptor",
        "fornecedor",
        "outro",
      ],
      payment_method: [
        "cash",
        "pix",
        "credit_card",
        "debit_card",
        "bank_slip",
        "transfer",
        "other",
      ],
      question_type: [
        "multiple_choice",
        "true_false",
        "essay",
        "file_upload",
        "image",
        "video",
        "matching",
      ],
      student_status: [
        "active",
        "inactive",
        "defaulter",
        "locked",
        "transferred",
        "completed",
        "dropout",
      ],
      subject_status: ["active", "inactive"],
      submission_status: ["in_progress", "submitted", "graded"],
      teacher_status: ["active", "inactive", "on_leave", "dismissed"],
      user_role: [
        "admin",
        "diretor",
        "coordenacao",
        "secretaria",
        "financeiro",
        "professor",
        "aluno",
        "responsavel",
        "gestor",
        "comercial",
      ],
      user_status: ["active", "inactive", "suspended", "pending"],
      whatsapp_message_direction: ["inbound", "outbound"],
      whatsapp_message_status: [
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
        "received",
      ],
      whatsapp_opt_in_status: ["pending", "opted_in", "opted_out"],
      whatsapp_outbox_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "cancelled",
      ],
      whatsapp_trigger_type: [
        "lead_no_response",
        "invoice_due",
        "invoice_overdue",
        "manual",
      ],
    },
  },
} as const

