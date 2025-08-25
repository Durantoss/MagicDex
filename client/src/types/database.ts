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
          username: string
          password: string
        }
        Insert: {
          id?: string
          username: string
          password: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          userId: string
          cardId: string
          quantity: number
          cardData: Json
        }
        Insert: {
          id?: string
          userId: string
          cardId: string
          quantity?: number
          cardData: Json
        }
        Update: {
          id?: string
          userId?: string
          cardId?: string
          quantity?: number
          cardData?: Json
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          userId: string
          cardId: string
          quantity: number
          priority: string
          cardData: Json
          createdAt: string | null
        }
        Insert: {
          id?: string
          userId: string
          cardId: string
          quantity?: number
          priority?: string
          cardData: Json
          createdAt?: string | null
        }
        Update: {
          id?: string
          userId?: string
          cardId?: string
          quantity?: number
          priority?: string
          cardData?: Json
          createdAt?: string | null
        }
        Relationships: []
      }
      tradeInterests: {
        Row: {
          id: string
          fromUserId: string
          toUserId: string
          status: string
          message: string | null
          createdAt: string | null
          updatedAt: string | null
        }
        Insert: {
          id?: string
          fromUserId: string
          toUserId: string
          status?: string
          message?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          fromUserId?: string
          toUserId?: string
          status?: string
          message?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      tradeCards: {
        Row: {
          id: string
          tradeInterestId: string
          cardId: string
          quantity: number
          cardData: Json
          offeredBy: string
        }
        Insert: {
          id?: string
          tradeInterestId: string
          cardId: string
          quantity?: number
          cardData: Json
          offeredBy: string
        }
        Update: {
          id?: string
          tradeInterestId?: string
          cardId?: string
          quantity?: number
          cardData?: Json
          offeredBy?: string
        }
        Relationships: []
      }
      tradingProfiles: {
        Row: {
          id: string
          userId: string
          isTrading: boolean
          location: string | null
          tradingPreferences: Json | null
          reputation: number
          completedTrades: number
          bio: string | null
          createdAt: string | null
          updatedAt: string | null
        }
        Insert: {
          id?: string
          userId: string
          isTrading?: boolean
          location?: string | null
          tradingPreferences?: Json | null
          reputation?: number
          completedTrades?: number
          bio?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          userId?: string
          isTrading?: boolean
          location?: string | null
          tradingPreferences?: Json | null
          reputation?: number
          completedTrades?: number
          bio?: string | null
          createdAt?: string | null
          updatedAt?: string | null
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
