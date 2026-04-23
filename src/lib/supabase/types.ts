export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          body: string | null
          created_at: string
          episode_id: string | null
          face_consent: boolean
          id: string
          idempotency_key: string | null
          is_public: boolean
          meta: Json
          photo_url: string | null
          project_id: string | null
          removed_at: string | null
          reported_at: string | null
          shop_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          episode_id?: string | null
          face_consent?: boolean
          id?: string
          idempotency_key?: string | null
          is_public?: boolean
          meta?: Json
          photo_url?: string | null
          project_id?: string | null
          removed_at?: string | null
          reported_at?: string | null
          shop_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          episode_id?: string | null
          face_consent?: boolean
          id?: string
          idempotency_key?: string | null
          is_public?: boolean
          meta?: Json
          photo_url?: string | null
          project_id?: string | null
          removed_at?: string | null
          reported_at?: string | null
          shop_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          activity_id: string
          caption: string | null
          created_at: string
          id: string
          kind: string
          sort_order: number
          url: string | null
        }
        Insert: {
          activity_id: string
          caption?: string | null
          created_at?: string
          id?: string
          kind: string
          sort_order?: number
          url?: string | null
        }
        Update: {
          activity_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          sort_order?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          actor_role: string
          created_at: string
          event_type: string
          id: number
          ip_address: string | null
          meta: Json
          shop_id: string | null
          subject_key: string | null
          user_agent: string | null
        }
        Insert: {
          actor_role: string
          created_at?: string
          event_type: string
          id?: number
          ip_address?: string | null
          meta?: Json
          shop_id?: string | null
          subject_key?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_role?: string
          created_at?: string
          event_type?: string
          id?: number
          ip_address?: string | null
          meta?: Json
          shop_id?: string | null
          subject_key?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contribution_log: {
        Row: {
          activity_id: string | null
          created_at: string
          delta_points: number
          id: number
          reaction_id: string | null
          reason: string | null
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          delta_points: number
          id?: number
          reaction_id?: string | null
          reason?: string | null
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          delta_points?: number
          id?: number
          reaction_id?: string | null
          reason?: string | null
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_log_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_log_reaction_id_fkey"
            columns: ["reaction_id"]
            isOneToOne: false
            referencedRelation: "reactions"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_points: {
        Row: {
          id: string
          subject_id: string | null
          subject_type: string
          total_actions: number
          total_points: number
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id?: string | null
          subject_type: string
          total_actions?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string | null
          subject_type?: string
          total_actions?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      episode_archives: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          episode_id: string
          id: string
          kind: string
          title: string | null
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          episode_id: string
          id?: string
          kind: string
          title?: string | null
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          episode_id?: string
          id?: string
          kind?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episode_archives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_archives_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          location: string | null
          project_id: string
          seq: number | null
          session_date: string | null
          status: Database["public"]["Enums"]["episode_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          location?: string | null
          project_id: string
          seq?: number | null
          session_date?: string | null
          status?: Database["public"]["Enums"]["episode_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          location?: string | null
          project_id?: string
          seq?: number | null
          session_date?: string | null
          status?: Database["public"]["Enums"]["episode_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          episode_id: string | null
          id: number
          path: string
          project_id: string | null
          shop_id: string | null
          viewed_at: string
          viewer_session: string | null
        }
        Insert: {
          episode_id?: string | null
          id?: number
          path: string
          project_id?: string | null
          shop_id?: string | null
          viewed_at?: string
          viewer_session?: string | null
        }
        Update: {
          episode_id?: string | null
          id?: number
          path?: string
          project_id?: string | null
          shop_id?: string | null
          viewed_at?: string
          viewer_session?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      project_hosts: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          project_id: string
          role: string
          sort_order: number
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          project_id: string
          role?: string
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          project_id?: string
          role?: string
          sort_order?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_hosts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          is_public: boolean
          progress_target: Json
          progress_type: Database["public"]["Enums"]["progress_type"]
          slug: string
          started_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_public?: boolean
          progress_target?: Json
          progress_type?: Database["public"]["Enums"]["progress_type"]
          slug: string
          started_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_public?: boolean
          progress_target?: Json
          progress_type?: Database["public"]["Enums"]["progress_type"]
          slug?: string
          started_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          activity_id: string
          author_label: string | null
          author_role: string
          author_shop_id: string | null
          author_user_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          llm_draft: string | null
          read_at: string | null
          scheduled_at: string | null
          sent_at: string
          visibility: Database["public"]["Enums"]["reaction_visibility"]
        }
        Insert: {
          activity_id: string
          author_label?: string | null
          author_role: string
          author_shop_id?: string | null
          author_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          llm_draft?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string
          visibility?: Database["public"]["Enums"]["reaction_visibility"]
        }
        Update: {
          activity_id?: string
          author_label?: string | null
          author_role?: string
          author_shop_id?: string | null
          author_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          llm_draft?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string
          visibility?: Database["public"]["Enums"]["reaction_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "reactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_author_shop_id_fkey"
            columns: ["author_shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_owners: {
        Row: {
          created_at: string
          failed_attempts: number
          id: string
          last_login_at: string | null
          locked_until: string | null
          name: string
          owner_code_hash: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          name: string
          owner_code_hash: string
          shop_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          name?: string
          owner_code_hash?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_owners_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          accent_color: string | null
          address: string | null
          card_background_url: string | null
          created_at: string
          description: string | null
          frame_style: string
          id: string
          is_public: boolean
          lat: number | null
          lng: number | null
          name: string
          qr_token: string | null
          slogan: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          card_background_url?: string | null
          created_at?: string
          description?: string | null
          frame_style?: string
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          qr_token?: string | null
          slogan?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          card_background_url?: string | null
          created_at?: string
          description?: string | null
          frame_style?: string
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          qr_token?: string | null
          slogan?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: string
          kakao_id: string | null
          nickname: string
          profile_image_url: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          kakao_id?: string | null
          nickname: string
          profile_image_url?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          kakao_id?: string | null
          nickname?: string
          profile_image_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      episode_status: "planned" | "in_progress" | "completed"
      progress_type: "time" | "event" | "goal" | "mixed"
      reaction_visibility: "public" | "private"
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
  public: {
    Enums: {
      episode_status: ["planned", "in_progress", "completed"],
      progress_type: ["time", "event", "goal", "mixed"],
      reaction_visibility: ["public", "private"],
    },
  },
} as const
