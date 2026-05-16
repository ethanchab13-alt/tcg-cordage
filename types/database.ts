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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'client' | 'cordeur'
          push_subscription: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'client' | 'cordeur'
          push_subscription?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'client' | 'cordeur'
          push_subscription?: Json | null
          updated_at?: string
        }
      }
      stringing_orders: {
        Row: {
          id: string
          client_id: string
          racket_brand: string | null
          string_type: string
          tension_mains: number
          tension_cross: number | null
          notes: string | null
          status: 'pending' | 'in_progress' | 'ready' | 'delivered'
          price: number | null
          created_at: string
          updated_at: string
          ready_at: string | null
          delivered_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          racket_brand?: string | null
          string_type: string
          tension_mains: number
          tension_cross?: number | null
          notes?: string | null
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered'
          price?: number | null
          created_at?: string
          updated_at?: string
          ready_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          client_id?: string
          racket_brand?: string | null
          string_type?: string
          tension_mains?: number
          tension_cross?: number | null
          notes?: string | null
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered'
          price?: number | null
          updated_at?: string
          ready_at?: string | null
          delivered_at?: string | null
        }
      }
      notification_log: {
        Row: {
          id: string
          order_id: string | null
          recipient_id: string
          type: 'push' | 'email'
          event: 'order_created' | 'order_ready' | 'order_delivered'
          status: 'sent' | 'failed'
          error_msg: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          recipient_id: string
          type: 'push' | 'email'
          event: 'order_created' | 'order_ready' | 'order_delivered'
          status: 'sent' | 'failed'
          error_msg?: string | null
          sent_at?: string
        }
        Update: never
      }
    }
  }
}

// Types raccourcis pratiques
export type Profile = Database['public']['Tables']['profiles']['Row']
export type StringingOrder = Database['public']['Tables']['stringing_orders']['Row']
export type NotificationLog = Database['public']['Tables']['notification_log']['Row']
export type OrderStatus = StringingOrder['status']
export type UserRole = Profile['role']
