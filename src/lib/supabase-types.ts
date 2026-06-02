export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          sport: string
          tournament: string
          budget: number
          squad_size: number
          enable_bots: boolean
          phase: 'scheduled' | 'lobby' | 'bidding' | 'sold' | 'unsold' | 'done'
          host_id: string
          player_idx: number
          current_bid: number
          current_bidder: string | null
          ends_at: number | null
          scheduled_at: number | null
          passed_by: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sport: string
          tournament: string
          budget?: number
          squad_size?: number
          enable_bots?: boolean
          phase?: 'scheduled' | 'lobby' | 'bidding' | 'sold' | 'unsold' | 'done'
          host_id: string
          player_idx?: number
          current_bid?: number
          current_bidder?: string | null
          ends_at?: number | null
          scheduled_at?: number | null
          passed_by?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sport?: string
          tournament?: string
          budget?: number
          squad_size?: number
          enable_bots?: boolean
          phase?: 'scheduled' | 'lobby' | 'bidding' | 'sold' | 'unsold' | 'done'
          host_id?: string
          player_idx?: number
          current_bid?: number
          current_bidder?: string | null
          ends_at?: number | null
          scheduled_at?: number | null
          passed_by?: Json
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          room_id: string
          owner_id: string | null
          name: string
          color: string
          photo: string | null
          budget: number
          spent: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          owner_id?: string | null
          name: string
          color?: string
          photo?: string | null
          budget?: number
          spent?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          owner_id?: string | null
          name?: string
          color?: string
          photo?: string | null
          budget?: number
          spent?: number
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          name: string
          country: string
          role: string
          tier: string
          base_price: number
          sold_price: number | null
          status: 'unsold' | 'sold' | 'current'
          team_id: string | null
          image: string | null
          nat: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          country: string
          role: string
          tier: string
          base_price?: number
          sold_price?: number | null
          status?: 'unsold' | 'sold' | 'current'
          team_id?: string | null
          image?: string | null
          nat?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          country?: string
          role?: string
          tier?: string
          base_price?: number
          sold_price?: number | null
          status?: 'unsold' | 'sold' | 'current'
          team_id?: string | null
          image?: string | null
          nat?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      bids: {
        Row: {
          id: string
          room_id: string
          player_id: string
          team_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          team_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          team_id?: string
          amount?: number
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          message?: string
          created_at?: string
        }
      }
    }
  }
}
