import { supabase } from './supabase'
import type { Database } from '../types/database'

type Collection = Database['public']['Tables']['collections']['Row']
type CollectionInsert = Database['public']['Tables']['collections']['Insert']
type Wishlist = Database['public']['Tables']['wishlists']['Row']
type WishlistInsert = Database['public']['Tables']['wishlists']['Insert']
type TradingProfile = Database['public']['Tables']['tradingProfiles']['Row']
type TradingProfileInsert = Database['public']['Tables']['tradingProfiles']['Insert']

// Collection API
export const collectionApi = {
  async getCollection(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('userId', userId)
      .order('id')

    if (error) throw error
    return data || []
  },

  async addToCollection(item: CollectionInsert): Promise<Collection> {
    // Check if card already exists
    const { data: existing } = await supabase
      .from('collections')
      .select('*')
      .eq('userId', item.userId)
      .eq('cardId', item.cardId)
      .single()

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('collections')
        .update({ quantity: existing.quantity + (item.quantity || 1) })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('collections')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async removeFromCollection(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('userId', userId)
      .eq('cardId', cardId)

    if (error) throw error
    return true
  },

  async updateQuantity(userId: string, cardId: string, quantity: number): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .update({ quantity })
      .eq('userId', userId)
      .eq('cardId', cardId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async clearCollection(userId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('userId', userId)

    if (error) throw error
  }
}

// Wishlist API
export const wishlistApi = {
  async getWishlist(userId: string): Promise<Wishlist[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addToWishlist(item: WishlistInsert): Promise<Wishlist> {
    // Check if card already exists
    const { data: existing } = await supabase
      .from('wishlists')
      .select('*')
      .eq('userId', item.userId)
      .eq('cardId', item.cardId)
      .single()

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('wishlists')
        .update({ quantity: existing.quantity + (item.quantity || 1) })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('wishlists')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async removeFromWishlist(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('userId', userId)
      .eq('cardId', cardId)

    if (error) throw error
    return true
  },

  async updateQuantity(userId: string, cardId: string, quantity: number): Promise<Wishlist | null> {
    const { data, error } = await supabase
      .from('wishlists')
      .update({ quantity })
      .eq('userId', userId)
      .eq('cardId', cardId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Trading Profile API
export const tradingApi = {
  async getTradingProfile(userId: string): Promise<TradingProfile | null> {
    const { data, error } = await supabase
      .from('tradingProfiles')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  },

  async createTradingProfile(profile: TradingProfileInsert): Promise<TradingProfile> {
    const { data, error } = await supabase
      .from('tradingProfiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTradingProfile(userId: string, updates: Partial<TradingProfileInsert>): Promise<TradingProfile> {
    const { data, error } = await supabase
      .from('tradingProfiles')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// AI API using Supabase Edge Functions
export const aiApi = {
  async buildDeck(deckType: string, strategy: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('deck-builder', {
      body: { deckType, strategy }
    })

    if (error) throw error
    return data
  },

  async askRulesQuestion(question: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('rules-qa', {
      body: { question }
    })

    if (error) throw error
    return data
  },

  async askDictionaryQuestion(question: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('dictionary-qa', {
      body: { question }
    })

    if (error) throw error
    return data
  }
}

// Scryfall API (unchanged)
export const scryfallApi = {
  async searchCards(query: string, page = 1): Promise<any> {
    const scryfallUrl = new URL("https://api.scryfall.com/cards/search")
    scryfallUrl.searchParams.set("q", query)
    scryfallUrl.searchParams.set("page", page.toString())
    scryfallUrl.searchParams.set("unique", "prints")
    scryfallUrl.searchParams.set("order", "released")
    scryfallUrl.searchParams.set("dir", "desc")

    const response = await fetch(scryfallUrl.toString())
    
    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], total_cards: 0, has_more: false }
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }

    return response.json()
  },

  async getCard(id: string): Promise<any> {
    const response = await fetch(`https://api.scryfall.com/cards/${id}`)
    
    if (!response.ok) {
      throw new Error('Card not found')
    }

    return response.json()
  },

  async getCardPricing(id: string): Promise<any> {
    const card = await this.getCard(id)
    
    return {
      cardId: id,
      name: card.name,
      prices: card.prices || {},
      purchase_uris: card.purchase_uris || {},
      last_updated: new Date().toISOString()
    }
  }
}
