/**
 * Database types for Supabase
 *
 * To generate these types automatically, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 *
 * Or use the Supabase CLI:
 * supabase gen types typescript --local > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "manager" | "super_admin";

export type PostPlatform = "facebook" | "instagram" | "tiktok" | "whatsapp";

export type PostStatus = "draft" | "pending_approval" | "rejected" | "approved" | "published";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          organization_id: string | null;
          department: string;
          department_id: string | null;
          platform: PostPlatform;
          scheduled_date: string;
          scheduled_time: string;
          title: string | null;
          content: string;
          status: PostStatus;
          created_by: string | null;
          approval_comment: string | null;
          external_link: string | null;
          attachment_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          department: string;
          department_id?: string | null;
          platform: PostPlatform;
          scheduled_date: string;
          scheduled_time: string;
          title?: string | null;
          content: string;
          status?: PostStatus;
          created_by?: string | null;
          approval_comment?: string | null;
          external_link?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          department?: string;
          department_id?: string | null;
          platform?: PostPlatform;
          scheduled_date?: string;
          scheduled_time?: string;
          title?: string | null;
          content?: string;
          status?: PostStatus;
          created_by?: string | null;
          approval_comment?: string | null;
          external_link?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      post_platform: PostPlatform;
      post_status: PostStatus;
    };
  };
}

// Helper types for easier usage
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type DepartmentInsert = Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
