import { supabase } from './supabase'
import type { Database } from '../types/database'

type Collection = Database['public']['Tables']['collections']['Row']
type CollectionInsert = Database['public']['Tables']['collections']['Insert']
type Wishlist = Database['public']['Tables']['wishlists']['Row']
type WishlistInsert = Database['public']['Tables']['wishlists']['Insert']
type TradingProfile = Database['public']['Tables']['tradingProfiles']['Row']
type TradingProfileInsert = Database['public']['Tables']['tradingProfiles']['Insert']
type Deck = Database['public']['Tables']['decks']['Row']
type DeckInsert = Database['public']['Tables']['decks']['Insert']
type DeckCard = Database['public']['Tables']['deckCards']['Row']
type DeckCardInsert = Database['public']['Tables']['deckCards']['Insert']

// Collection API
export const collectionApi = {
  async getCollection(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addToCollection(
    userId: string, 
    cardId: string, 
    normalQuantity: number = 0, 
    foilQuantity: number = 0, 
    cardData: any = {}
  ): Promise<Collection> {
    const { data, error } = await supabase.rpc('upsert_collection_entry', {
      p_user_id: userId,
      p_card_id: cardId,
      p_normal_quantity: normalQuantity,
      p_foil_quantity: foilQuantity,
      p_card_data: cardData
    })

    if (error) throw error
    return data
  },

  async removeFromCollection(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId)

    if (error) throw error
    return true
  },

  async updateQuantity(
    userId: string, 
    cardId: string, 
    normalQuantity: number = 0, 
    foilQuantity: number = 0
  ): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .update({ 
        normal_quantity: normalQuantity,
        foil_quantity: foilQuantity
      })
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async clearCollection(userId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  }
}

// Wishlist API
export const wishlistApi = {
  async getWishlist(userId: string): Promise<Wishlist[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addToWishlist(
    userId: string, 
    cardId: string, 
    normalQuantity: number = 0, 
    foilQuantity: number = 0, 
    priority: string = 'medium',
    cardData: any = {}
  ): Promise<Wishlist> {
    const { data, error } = await supabase.rpc('upsert_wishlist_entry', {
      p_user_id: userId,
      p_card_id: cardId,
      p_normal_quantity: normalQuantity,
      p_foil_quantity: foilQuantity,
      p_priority: priority,
      p_card_data: cardData
    })

    if (error) throw error
    return data
  },

  async removeFromWishlist(userId: string, cardId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId)

    if (error) throw error
    return true
  },

  async updateQuantity(
    userId: string, 
    cardId: string, 
    normalQuantity: number = 0, 
    foilQuantity: number = 0
  ): Promise<Wishlist | null> {
    const { data, error } = await supabase
      .from('wishlists')
      .update({ 
        normal_quantity: normalQuantity,
        foil_quantity: foilQuantity
      })
      .eq('user_id', userId)
      .eq('card_id', cardId)
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

// Deck API
export const deckApi = {
  async getDecks(userId: string): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getDeck(deckId: number): Promise<Deck | null> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async createDeck(deck: DeckInsert): Promise<Deck> {
    const { data, error } = await supabase
      .from('decks')
      .insert(deck)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateDeck(deckId: number, updates: Partial<DeckInsert>): Promise<Deck> {
    const { data, error } = await supabase
      .from('decks')
      .update(updates)
      .eq('id', deckId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteDeck(deckId: number): Promise<boolean> {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)

    if (error) throw error
    return true
  },

  async getDeckCards(deckId: number): Promise<DeckCard[]> {
    const { data, error } = await supabase
      .from('deckCards')
      .select('*')
      .eq('deckId', deckId)
      .order('createdAt')

    if (error) throw error
    return data || []
  },

  async addCardToDeck(deckCard: DeckCardInsert): Promise<DeckCard> {
    // Check if card already exists in deck
    const { data: existing } = await supabase
      .from('deckCards')
      .select('*')
      .eq('deckId', deckCard.deckId)
      .eq('cardId', deckCard.cardId)
      .eq('isSideboard', deckCard.isSideboard || false)
      .single()

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('deckCards')
        .update({ quantity: existing.quantity + (deckCard.quantity || 1) })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new card
      const { data, error } = await supabase
        .from('deckCards')
        .insert(deckCard)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async removeCardFromDeck(deckCardId: number): Promise<boolean> {
    const { error } = await supabase
      .from('deckCards')
      .delete()
      .eq('id', deckCardId)

    if (error) throw error
    return true
  },

  async updateDeckCardQuantity(deckCardId: number, quantity: number): Promise<DeckCard> {
    const { data, error } = await supabase
      .from('deckCards')
      .update({ quantity })
      .eq('id', deckCardId)
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
