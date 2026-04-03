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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      business_connections: {
        Row: {
          access_token: string | null
          connected_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          platform: string
          platform_account_id: string | null
          platform_account_name: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          platform: string
          platform_account_id?: string | null
          platform_account_name?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          platform?: string
          platform_account_id?: string | null
          platform_account_name?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      citations: {
        Row: {
          authority_score: number | null
          created_at: string
          domain: string | null
          id: string
          is_owned: boolean | null
          last_detected_at: string | null
          mention_count: number | null
          sentiment: string | null
          source_name: string
          source_url: string
          user_id: string
        }
        Insert: {
          authority_score?: number | null
          created_at?: string
          domain?: string | null
          id?: string
          is_owned?: boolean | null
          last_detected_at?: string | null
          mention_count?: number | null
          sentiment?: string | null
          source_name: string
          source_url: string
          user_id: string
        }
        Update: {
          authority_score?: number | null
          created_at?: string
          domain?: string | null
          id?: string
          is_owned?: boolean | null
          last_detected_at?: string | null
          mention_count?: number | null
          sentiment?: string | null
          source_name?: string
          source_url?: string
          user_id?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          created_at: string
          domain: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      optimization_tasks: {
        Row: {
          ai_suggestion: string | null
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          impact_score: number | null
          priority: string
          status: string
          target_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          ai_suggestion?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_score?: number | null
          priority?: string
          status?: string
          target_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          ai_suggestion?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_score?: number | null
          priority?: string
          status?: string
          target_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_preferences: Json | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          goals: string[] | null
          id: string
          industry: string | null
          onboarding_completed: boolean
          selected_llms: string[] | null
          updated_at: string
          user_id: string
          webhook_url: string | null
          website_url: string | null
        }
        Insert: {
          alert_preferences?: Json | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          onboarding_completed?: boolean
          selected_llms?: string[] | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
          website_url?: string | null
        }
        Update: {
          alert_preferences?: Json | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          onboarding_completed?: boolean
          selected_llms?: string[] | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      prompt_rankings: {
        Row: {
          ai_response: string | null
          checked_at: string
          citations_found: number | null
          confidence_score: number | null
          id: string
          llm_platform: string
          prompt_id: string
          rank_position: number | null
          user_id: string
          visibility: string
        }
        Insert: {
          ai_response?: string | null
          checked_at?: string
          citations_found?: number | null
          confidence_score?: number | null
          id?: string
          llm_platform: string
          prompt_id: string
          rank_position?: number | null
          user_id: string
          visibility: string
        }
        Update: {
          ai_response?: string | null
          checked_at?: string
          citations_found?: number | null
          confidence_score?: number | null
          id?: string
          llm_platform?: string
          prompt_id?: string
          rank_position?: number | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_rankings_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "tracked_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          report_type: string
          title: string
          user_id: string
          visibility_score: number | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          report_type?: string
          title: string
          user_id: string
          visibility_score?: number | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          report_type?: string
          title?: string
          user_id?: string
          visibility_score?: number | null
        }
        Relationships: []
      }
      sentiment_logs: {
        Row: {
          analyzed_at: string
          id: string
          llm_platform: string
          negative_pct: number | null
          neutral_pct: number | null
          overall_sentiment: string
          positive_pct: number | null
          sample_response: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          id?: string
          llm_platform: string
          negative_pct?: number | null
          neutral_pct?: number | null
          overall_sentiment: string
          positive_pct?: number | null
          sample_response?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          analyzed_at?: string
          id?: string
          llm_platform?: string
          negative_pct?: number | null
          neutral_pct?: number | null
          overall_sentiment?: string
          positive_pct?: number | null
          sample_response?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tracked_prompts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          query: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          query: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          query?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_analyses: {
        Row: {
          ai_insights: Json | null
          completed_at: string | null
          crawl_data: Json | null
          created_at: string
          id: string
          pages_crawled: number | null
          status: string
          user_id: string
          website_url: string
        }
        Insert: {
          ai_insights?: Json | null
          completed_at?: string | null
          crawl_data?: Json | null
          created_at?: string
          id?: string
          pages_crawled?: number | null
          status?: string
          user_id: string
          website_url: string
        }
        Update: {
          ai_insights?: Json | null
          completed_at?: string | null
          crawl_data?: Json | null
          created_at?: string
          id?: string
          pages_crawled?: number | null
          status?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
