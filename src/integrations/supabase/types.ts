export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          agent_id: string
          birth_date: string | null
          birth_place: string | null
          commission_balance: number
          country: string
          created_at: string
          full_name: string
          id: string
          identity_photo: string | null
          nationality: string | null
          phone: string
          status: Database["public"]["Enums"]["agent_status"]
          transactions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          birth_date?: string | null
          birth_place?: string | null
          commission_balance?: number
          country: string
          created_at?: string
          full_name: string
          id?: string
          identity_photo?: string | null
          nationality?: string | null
          phone: string
          status?: Database["public"]["Enums"]["agent_status"]
          transactions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          birth_date?: string | null
          birth_place?: string | null
          commission_balance?: number
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          identity_photo?: string | null
          nationality?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["agent_status"]
          transactions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: number
          id: number
          name: string
        }
        Insert: {
          country_id: number
          id?: never
          name: string
        }
        Update: {
          country_id?: number
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      pending_transfers: {
        Row: {
          amount: number
          claim_code: string
          created_at: string
          currency: string
          expires_at: string
          fees: number
          id: string
          recipient_email: string
          recipient_phone: string | null
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          claim_code: string
          created_at?: string
          currency?: string
          expires_at?: string
          fees: number
          id?: string
          recipient_email: string
          recipient_phone?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          claim_code?: string
          created_at?: string
          currency?: string
          expires_at?: string
          fees?: number
          id?: string
          recipient_email?: string
          recipient_phone?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          balance: number
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          id_card_number: string | null
          id_card_photo_url: string | null
          id_card_url: string | null
          is_verified: boolean | null
          phone: string
          selfie_url: string | null
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_verified?: boolean | null
          phone: string
          selfie_url?: string | null
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_verified?: boolean | null
          phone?: string
          selfie_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      recharges: {
        Row: {
          amount: number
          country: string
          created_at: string
          id: string
          payment_method: string
          payment_phone: string
          payment_provider: string
          provider_transaction_id: string | null
          status: string
          transaction_reference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          country: string
          created_at?: string
          id?: string
          payment_method: string
          payment_phone: string
          payment_provider: string
          provider_transaction_id?: string | null
          status?: string
          transaction_reference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          country?: string
          created_at?: string
          id?: string
          payment_method?: string
          payment_phone?: string
          payment_provider?: string
          provider_transaction_id?: string | null
          status?: string
          transaction_reference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recharges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fees: number
          id: string
          is_deleted: boolean | null
          recipient_country: string
          recipient_full_name: string
          recipient_phone: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          fees: number
          id?: string
          is_deleted?: boolean | null
          recipient_country: string
          recipient_full_name: string
          recipient_phone: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fees?: number
          id?: string
          is_deleted?: boolean | null
          recipient_country?: string
          recipient_full_name?: string
          recipient_phone?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          agent_id: string
          agent_name: string
          agent_phone: string
          amount: number
          approved_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          rejected_at: string | null
          status: string
          user_id: string
          withdrawal_phone: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          agent_phone: string
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          status?: string
          user_id: string
          withdrawal_phone: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_phone?: string
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          status?: string
          user_id?: string
          withdrawal_phone?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_deleted: boolean | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
          withdrawal_phone: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          withdrawal_phone: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          withdrawal_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_agents_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
          raw_user_meta_data: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_user_meta_data?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_user_meta_data?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_agent_exists: {
        Args: { agent_id_param: string }
        Returns: boolean
      }
      claim_pending_transfer: {
        Args:
          | Record<PropertyKey, never>
          | { claim_code_param: string; recipient_id: string }
        Returns: undefined
      }
      create_new_agent: {
        Args: {
          user_id_param: string
          agent_id_param: string
          full_name_param: string
          phone_param: string
          country_param: string
        }
        Returns: undefined
      }
      find_recipient: {
        Args: { search_term: string }
        Returns: {
          id: string
          full_name: string
          email: string
          phone: string
          country: string
        }[]
      }
      get_agent_by_user_id: {
        Args: { user_id_param: string }
        Returns: {
          agent_id: string
          birth_date: string | null
          birth_place: string | null
          commission_balance: number
          country: string
          created_at: string
          full_name: string
          id: string
          identity_photo: string | null
          nationality: string | null
          phone: string
          status: Database["public"]["Enums"]["agent_status"]
          transactions_count: number
          updated_at: string
          user_id: string
        }[]
      }
      increment_balance: {
        Args: { user_id: string; amount: number }
        Returns: number
      }
      is_agent: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_verified_agent: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      process_money_transfer: {
        Args:
          | { sender_id: number; receiver_id: number; amount: number }
          | {
              sender_id: string
              recipient_identifier: string
              transfer_amount: number
              transfer_fees: number
            }
        Returns: undefined
      }
    }
    Enums: {
      agent_status: "pending" | "active" | "suspended" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["pending", "active", "suspended", "rejected"],
    },
  },
} as const
