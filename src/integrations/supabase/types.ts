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
            referencedRelation: "auth_users_view"
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
          phone: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_view"
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
            referencedRelation: "auth_users_view"
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
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
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
          withdrawal_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_view: {
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
      claim_pending_transfer: {
        Args: {
          claim_code_param: string
          recipient_id: string
        }
        Returns: boolean
      }
      find_recipient: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          full_name: string
          email: string
          phone: string
          country: string
        }[]
      }
      increment_balance: {
        Args: {
          user_id: string
          amount: number
        }
        Returns: undefined
      }
      process_money_transfer: {
        Args: {
          sender_id: string
          recipient_identifier: string
          transfer_amount: number
          transfer_fees: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
