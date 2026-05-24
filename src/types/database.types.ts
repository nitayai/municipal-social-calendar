export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = "user" | "manager" | "super_admin";
export type PostPlatform = "facebook" | "instagram" | "tiktok" | "whatsapp" | "story" | "reels" | "digital_signage";
export type PostStatus = "draft" | "pending_approval" | "rejected" | "approved" | "published";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; slug: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string; created_at?: string; updated_at?: string };
      };
      profiles: {
        Row: { id: string; email: string; full_name: string | null; role: UserRole; organization_id: string | null; created_at: string; updated_at: string };
        Insert: { id: string; email: string; full_name?: string | null; role?: UserRole; organization_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string; full_name?: string | null; role?: UserRole; organization_id?: string | null; created_at?: string; updated_at?: string };
      };
      departments: {
        Row: { id: string; organization_id: string | null; name: string; is_default: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id?: string | null; name: string; is_default?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string | null; name?: string; is_default?: boolean; created_at?: string; updated_at?: string };
      };
      posts: {
        Row: {
          id: string; organization_id: string | null; department: string; department_id: string | null;
          platforms: PostPlatform[]; scheduled_date: string; scheduled_time: string;
          title: string | null; content: string; status: PostStatus;
          created_by: string | null; approval_comment: string | null;
          is_scheduled: boolean; platform_scheduled_time: string | null;
          notes: string | null; created_by_name: string | null;
          approved_by: string | null; approved_by_name: string | null;
          scheduled_by_name: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; organization_id?: string | null; department: string; department_id?: string | null;
          platforms: PostPlatform[]; scheduled_date: string; scheduled_time: string;
          title?: string | null; content: string; status?: PostStatus;
          created_by?: string | null; approval_comment?: string | null;
          is_scheduled?: boolean; platform_scheduled_time?: string | null;
          notes?: string | null; created_by_name?: string | null;
          approved_by?: string | null; approved_by_name?: string | null;
          scheduled_by_name?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; organization_id?: string | null; department?: string; department_id?: string | null;
          platforms?: PostPlatform[]; scheduled_date?: string; scheduled_time?: string;
          title?: string | null; content?: string; status?: PostStatus;
          created_by?: string | null; approval_comment?: string | null;
          is_scheduled?: boolean; platform_scheduled_time?: string | null;
          notes?: string | null; created_by_name?: string | null;
          approved_by?: string | null; approved_by_name?: string | null;
          scheduled_by_name?: string | null;
          created_at?: string; updated_at?: string;
        };
      };
      post_attachments: {
        Row: { id: string; post_id: string; type: "upload" | "link"; url: string; name: string | null; created_at: string };
        Insert: { id?: string; post_id: string; type: "upload" | "link"; url: string; name?: string | null; created_at?: string };
        Update: { id?: string; post_id?: string; type?: "upload" | "link"; url?: string; name?: string | null };
      };
      open_tasks: {
        Row: { id: string; title: string; notes: string | null; priority: "high" | "normal" | "low"; created_at: string; created_by: string | null };
        Insert: { id?: string; title: string; notes?: string | null; priority?: "high" | "normal" | "low"; created_at?: string; created_by?: string | null };
        Update: { id?: string; title?: string; notes?: string | null; priority?: "high" | "normal" | "low" };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { user_role: UserRole; post_platform: PostPlatform; post_status: PostStatus };
  };
}

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type DepartmentInsert = Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
export type PostAttachment = Database["public"]["Tables"]["post_attachments"]["Row"];
export type PostAttachmentInsert = Database["public"]["Tables"]["post_attachments"]["Insert"];
export type OpenTask = Database["public"]["Tables"]["open_tasks"]["Row"];
export type OpenTaskInsert = Database["public"]["Tables"]["open_tasks"]["Insert"];
export type OpenTaskUpdate = Database["public"]["Tables"]["open_tasks"]["Update"];
