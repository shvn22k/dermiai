export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SkinType = "oily" | "dry" | "combination" | "normal" | "sensitive" | "unsure";
export type FitzpatrickTone = "I" | "II" | "III" | "IV" | "V" | "VI";
export type CaseStatus = "open" | "healing" | "resolved" | "see-dermatologist";
export type MessageRole = "system" | "user" | "assistant";
export type TimelineKind = "Check-in" | "Status" | "Consultation" | "Ingredients" | "Reminder";
export type ReminderChannel = "email" | "push";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          first_name: string | null;
          skin_type: SkinType | null;
          fitzpatrick_tone: FitzpatrickTone | null;
          allergies: string[];
          medications: string[];
          concerns: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          first_name?: string | null;
          skin_type?: SkinType | null;
          fitzpatrick_tone?: FitzpatrickTone | null;
          allergies?: string[];
          medications?: string[];
          concerns?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          first_name?: string | null;
          skin_type?: SkinType | null;
          fitzpatrick_tone?: FitzpatrickTone | null;
          allergies?: string[];
          medications?: string[];
          concerns?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body_site: string;
          status: CaseStatus;
          placeholder_angle: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body_site: string;
          status?: CaseStatus;
          placeholder_angle?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body_site?: string;
          status?: CaseStatus;
          placeholder_angle?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      case_images: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          storage_path: string;
          cnn_output: Json | null;
          model_version: string | null;
          pain_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          storage_path: string;
          cnn_output?: Json | null;
          model_version?: string | null;
          pain_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          storage_path?: string;
          cnn_output?: Json | null;
          model_version?: string | null;
          pain_level?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_images_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          model_version: string | null;
          escalate_to_clinician: boolean;
          safety_flags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          model_version?: string | null;
          escalate_to_clinician?: boolean;
          safety_flags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          model_version?: string | null;
          escalate_to_clinician?: boolean;
          safety_flags?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_events: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          kind: TimelineKind;
          title: string;
          detail: string | null;
          pain_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          kind: TimelineKind;
          title: string;
          detail?: string | null;
          pain_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          kind?: TimelineKind;
          title?: string;
          detail?: string | null;
          pain_level?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_events_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          title: string;
          reminder_type: string;
          time: string;
          repeat_pattern: string;
          repeat_days: number[] | null;
          meta: string | null;
          enabled: boolean;
          channel: ReminderChannel;
          due_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          case_id?: string | null;
          title: string;
          reminder_type?: string;
          time: string;
          repeat_pattern?: string;
          repeat_days?: number[] | null;
          meta?: string | null;
          enabled?: boolean;
          channel?: ReminderChannel;
          due_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          case_id?: string | null;
          title?: string;
          reminder_type?: string;
          time?: string;
          repeat_pattern?: string;
          repeat_days?: number[] | null;
          meta?: string | null;
          enabled?: boolean;
          channel?: ReminderChannel;
          due_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
