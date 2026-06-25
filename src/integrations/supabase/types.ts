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
      daily_challenge_scores: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          challenge_date: string
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          puzzle_id: string
        }
        Insert: {
          challenge_date: string
          created_at?: string
          id?: string
          puzzle_id: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          puzzle_id?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
          unsubscribed: boolean
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
          unsubscribed?: boolean
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
          unsubscribed?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          advanced_avg_score: number
          advanced_high_scores: number
          advanced_solved: number
          avatar_url: string | null
          average_score: number
          beginner_avg_score: number
          beginner_high_scores: number
          beginner_solved: number
          best_streak: number
          created_at: string
          current_difficulty: string
          current_streak: number
          display_name: string | null
          id: string
          intermediate_avg_score: number
          intermediate_high_scores: number
          intermediate_solved: number
          is_premium: boolean
          puzzles_solved: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advanced_avg_score?: number
          advanced_high_scores?: number
          advanced_solved?: number
          avatar_url?: string | null
          average_score?: number
          beginner_avg_score?: number
          beginner_high_scores?: number
          beginner_solved?: number
          best_streak?: number
          created_at?: string
          current_difficulty?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          intermediate_avg_score?: number
          intermediate_high_scores?: number
          intermediate_solved?: number
          is_premium?: boolean
          puzzles_solved?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advanced_avg_score?: number
          advanced_high_scores?: number
          advanced_solved?: number
          avatar_url?: string | null
          average_score?: number
          beginner_avg_score?: number
          beginner_high_scores?: number
          beginner_solved?: number
          best_streak?: number
          created_at?: string
          current_difficulty?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          intermediate_avg_score?: number
          intermediate_high_scores?: number
          intermediate_solved?: number
          is_premium?: boolean
          puzzles_solved?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      puzzle_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_hash: string | null
          puzzle_id: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_hash?: string | null
          puzzle_id: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_hash?: string | null
          puzzle_id?: string
          user_id?: string
        }
        Relationships: []
      }
      puzzles: {
        Row: {
          best_move: string
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string
          fen: string
          id: string
          name: string
          previous_fen: string
          themes: string[]
        }
        Insert: {
          best_move: string
          created_at?: string
          created_by?: string | null
          difficulty: string
          explanation: string
          fen: string
          id: string
          name: string
          previous_fen: string
          themes?: string[]
        }
        Update: {
          best_move?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string
          fen?: string
          id?: string
          name?: string
          previous_fen?: string
          themes?: string[]
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_seen_puzzles: {
        Row: {
          id: string
          puzzle_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          puzzle_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          puzzle_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_puzzle: {
        Args: { p_current_puzzle_id: string; p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_puzzle_stats: {
        Args: {
          p_difficulty?: string
          p_score: number
          p_streak: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
