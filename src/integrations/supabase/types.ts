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
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name: string
          provider: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          api_key_id: string | null
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
          video_generation_id: string | null
        }
        Insert: {
          amount: number
          api_key_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
          video_generation_id?: string | null
        }
        Update: {
          amount?: number
          api_key_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
          video_generation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_video_generation_id_fkey"
            columns: ["video_generation_id"]
            isOneToOne: false
            referencedRelation: "video_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      model_pricing: {
        Row: {
          audio_on: boolean | null
          created_at: string
          duration_seconds: number | null
          id: string
          mode: string | null
          model_id: string
          price: number
          resolution: string | null
        }
        Insert: {
          audio_on?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mode?: string | null
          model_id: string
          price: number
          resolution?: string | null
        }
        Update: {
          audio_on?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mode?: string | null
          model_id?: string
          price?: number
          resolution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_pricing_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "video_models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_generations: {
        Row: {
          api_key_id: string | null
          aspect_ratio: string | null
          audio_enabled: boolean | null
          created_at: string
          credits_used: number
          duration_seconds: number | null
          error_message: string | null
          id: string
          input_media_ids: string[] | null
          mode: string | null
          model_id: string
          negative_prompt: string | null
          output_url: string | null
          prompt: string
          resolution: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          aspect_ratio?: string | null
          audio_enabled?: boolean | null
          created_at?: string
          credits_used?: number
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          input_media_ids?: string[] | null
          mode?: string | null
          model_id: string
          negative_prompt?: string | null
          output_url?: string | null
          prompt: string
          resolution?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          aspect_ratio?: string | null
          audio_enabled?: boolean | null
          created_at?: string
          credits_used?: number
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          input_media_ids?: string[] | null
          mode?: string | null
          model_id?: string
          negative_prompt?: string | null
          output_url?: string | null
          prompt?: string
          resolution?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_generations_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_generations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "video_models"
            referencedColumns: ["id"]
          },
        ]
      }
      video_models: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          enabled_for_admin: boolean
          enabled_for_premium: boolean
          enabled_for_user: boolean
          id: string
          max_images: number
          name: string
          provider: string
          server: string
          supports_audio: boolean
          supports_image_to_video: boolean
          supports_negative_prompt: boolean
          supports_text_to_video: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          enabled_for_admin?: boolean
          enabled_for_premium?: boolean
          enabled_for_user?: boolean
          id?: string
          max_images?: number
          name: string
          provider: string
          server: string
          supports_audio?: boolean
          supports_image_to_video?: boolean
          supports_negative_prompt?: boolean
          supports_text_to_video?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          enabled_for_admin?: boolean
          enabled_for_premium?: boolean
          enabled_for_user?: boolean
          id?: string
          max_images?: number
          name?: string
          provider?: string
          server?: string
          supports_audio?: boolean
          supports_image_to_video?: boolean
          supports_negative_prompt?: boolean
          supports_text_to_video?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      voucher_redemption_attempts: {
        Row: {
          attempted_at: string
          attempted_code: string
          id: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          attempted_code: string
          id?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          attempted_code?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          credits: number
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          credits?: number
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          credits?: number
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_voucher_lock_remaining_minutes: {
        Args: { check_user_id: string }
        Returns: number
      }
      has_model_access: { Args: { model_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_voucher_redemption_locked: {
        Args: { check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "premium" | "user"
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
      app_role: ["admin", "premium", "user"],
    },
  },
} as const
