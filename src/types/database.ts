export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          user_type: string
          company_id: string | null
          is_global_admin: boolean | null
          can_view_all_trips: boolean | null
          can_view_company_trips: boolean | null
          microsoft_oauth_id: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          user_type?: string
          company_id?: string | null
          is_global_admin?: boolean | null
          can_view_all_trips?: boolean | null
          can_view_company_trips?: boolean | null
          microsoft_oauth_id?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          user_type?: string
          company_id?: string | null
          is_global_admin?: boolean | null
          can_view_all_trips?: boolean | null
          can_view_company_trips?: boolean | null
          microsoft_oauth_id?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_participants: {
        Row: {
          id: string
          trip_id: string
          company_id: string
          user_id: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          company_id: string
          user_id?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          company_id?: string
          user_id?: string | null
          role?: string
          created_at?: string
        }
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
  }
}