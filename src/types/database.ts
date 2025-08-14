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
      company_locations: {
        Row: {
          id: string
          company_id: string
          location_name: string
          address_line_1: string
          address_line_2: string | null
          city: string
          state_province: string | null
          postal_code: string | null
          country: string
          location_type: string
          is_primary_location: boolean
          is_meeting_location: boolean
          phone: string | null
          email: string | null
          contact_person: string | null
          meeting_room_capacity: number | null
          has_presentation_facilities: boolean
          has_catering: boolean
          parking_availability: string | null
          accessibility_notes: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          location_name: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          state_province?: string | null
          postal_code?: string | null
          country?: string
          location_type?: string
          is_primary_location?: boolean
          is_meeting_location?: boolean
          phone?: string | null
          email?: string | null
          contact_person?: string | null
          meeting_room_capacity?: number | null
          has_presentation_facilities?: boolean
          has_catering?: boolean
          parking_availability?: string | null
          accessibility_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          location_name?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state_province?: string | null
          postal_code?: string | null
          country?: string
          location_type?: string
          is_primary_location?: boolean
          is_meeting_location?: boolean
          phone?: string | null
          email?: string | null
          contact_person?: string | null
          meeting_room_capacity?: number | null
          has_presentation_facilities?: boolean
          has_catering?: boolean
          parking_availability?: string | null
          accessibility_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
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
      trip_hotels: {
        Row: {
          id: string
          trip_id: string
          hotel_name: string
          hotel_address: string
          check_in_date: string
          check_out_date: string
          nights_count: number | null
          cost_amount: number | null
          cost_currency: string
          cost_per_person: any | null
          cost_breakdown: any | null
          booking_reference: string | null
          contact_phone: string | null
          contact_email: string | null
          special_requests: string | null
          room_type: string | null
          guest_names: string[] | null
          booking_status: string
          booking_date: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          hotel_name: string
          hotel_address: string
          check_in_date: string
          check_out_date: string
          cost_amount?: number | null
          cost_currency?: string
          cost_per_person?: any | null
          cost_breakdown?: any | null
          booking_reference?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          special_requests?: string | null
          room_type?: string | null
          guest_names?: string[] | null
          booking_status?: string
          booking_date?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          hotel_name?: string
          hotel_address?: string
          check_in_date?: string
          check_out_date?: string
          cost_amount?: number | null
          cost_currency?: string
          cost_per_person?: any | null
          cost_breakdown?: any | null
          booking_reference?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          special_requests?: string | null
          room_type?: string | null
          guest_names?: string[] | null
          booking_status?: string
          booking_date?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      trip_flights: {
        Row: {
          id: string
          trip_id: string
          flight_type: string
          airline: string
          flight_number: string
          departure_airport: string
          departure_city: string
          departure_date: string
          departure_time: string
          arrival_airport: string
          arrival_city: string
          arrival_date: string
          arrival_time: string
          cost_amount: number | null
          cost_currency: string
          cost_per_person: any | null
          cost_breakdown: any | null
          booking_reference: string | null
          seat_preferences: string | null
          meal_preferences: string | null
          passenger_names: string[] | null
          booking_status: string
          booking_date: string | null
          aircraft_type: string | null
          flight_duration_minutes: number | null
          baggage_allowance: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          flight_type: string
          airline: string
          flight_number: string
          departure_airport: string
          departure_city: string
          departure_date: string
          departure_time: string
          arrival_airport: string
          arrival_city: string
          arrival_date: string
          arrival_time: string
          cost_amount?: number | null
          cost_currency?: string
          cost_per_person?: any | null
          cost_breakdown?: any | null
          booking_reference?: string | null
          seat_preferences?: string | null
          meal_preferences?: string | null
          passenger_names?: string[] | null
          booking_status?: string
          booking_date?: string | null
          aircraft_type?: string | null
          flight_duration_minutes?: number | null
          baggage_allowance?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          flight_type?: string
          airline?: string
          flight_number?: string
          departure_airport?: string
          departure_city?: string
          departure_date?: string
          departure_time?: string
          arrival_airport?: string
          arrival_city?: string
          arrival_date?: string
          arrival_time?: string
          cost_amount?: number | null
          cost_currency?: string
          cost_per_person?: any | null
          cost_breakdown?: any | null
          booking_reference?: string | null
          seat_preferences?: string | null
          meal_preferences?: string | null
          passenger_names?: string[] | null
          booking_status?: string
          booking_date?: string | null
          aircraft_type?: string | null
          flight_duration_minutes?: number | null
          baggage_allowance?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      trip_meetings: {
        Row: {
          id: string
          trip_id: string
          title: string
          meeting_type: string
          meeting_date: string
          start_time: string
          end_time: string | null
          location: string | null
          company_location_id: string | null
          description: string | null
          agenda: string | null
          priority_level: string
          meeting_status: string
          is_supplier_meeting: boolean
          supplier_company_name: string | null
          meeting_notes: string | null
          lead_status: string | null
          follow_up_date: string | null
          deal_value: number | null
          deal_currency: string
          cost_per_person: any | null
          total_estimated_cost: number | null
          cost_currency: string
          cost_breakdown: any | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          title: string
          meeting_type: string
          meeting_date: string
          start_time: string
          end_time?: string | null
          location?: string | null
          company_location_id?: string | null
          description?: string | null
          agenda?: string | null
          priority_level?: string
          meeting_status?: string
          is_supplier_meeting?: boolean
          supplier_company_name?: string | null
          meeting_notes?: string | null
          lead_status?: string | null
          follow_up_date?: string | null
          deal_value?: number | null
          deal_currency?: string
          cost_per_person?: any | null
          total_estimated_cost?: number | null
          cost_currency?: string
          cost_breakdown?: any | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          title?: string
          meeting_type?: string
          meeting_date?: string
          start_time?: string
          end_time?: string | null
          location?: string | null
          company_location_id?: string | null
          description?: string | null
          agenda?: string | null
          priority_level?: string
          meeting_status?: string
          is_supplier_meeting?: boolean
          supplier_company_name?: string | null
          meeting_notes?: string | null
          lead_status?: string | null
          follow_up_date?: string | null
          deal_value?: number | null
          deal_currency?: string
          cost_per_person?: any | null
          total_estimated_cost?: number | null
          cost_currency?: string
          cost_breakdown?: any | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      meeting_attendees: {
        Row: {
          id: string
          meeting_id: string
          attendee_name: string
          attendee_email: string | null
          attendee_company: string | null
          attendee_title: string | null
          attendee_phone: string | null
          is_external: boolean
          user_id: string | null
          attendance_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          attendee_name: string
          attendee_email?: string | null
          attendee_company?: string | null
          attendee_title?: string | null
          attendee_phone?: string | null
          is_external?: boolean
          user_id?: string | null
          attendance_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          attendee_name?: string
          attendee_email?: string | null
          attendee_company?: string | null
          attendee_title?: string | null
          attendee_phone?: string | null
          is_external?: boolean
          user_id?: string | null
          attendance_status?: string
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