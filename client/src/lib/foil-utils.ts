import { ScryfallCard } from "@/types/scryfall";

export interface FoilAvailability {
  hasNormal: boolean;
  hasFoil: boolean;
  normalPrice?: number;
  foilPrice?: number;
}

export interface CardQuantities {
  normal: number;
  foil: number;
}

export interface CollectionEntry {
  cardId: string;
  normalQuantity: number;
  foilQuantity: number;
  cardData: ScryfallCard;
}

/**
 * Check if a card has foil availability based on Scryfall data
 */
export function checkFoilAvailability(card: ScryfallCard): FoilAvailability {
  const normalPrice = card.prices?.usd ? parseFloat(card.prices.usd) : undefined;
  const foilPrice = card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : undefined;

  return {
    hasNormal: !!normalPrice || !foilPrice, // Assume normal exists if no foil price
    hasFoil: !!foilPrice,
    normalPrice,
    foilPrice,
  };
}

/**
 * Get the total quantity of a card (normal + foil)
 */
export function getTotalQuantity(quantities: CardQuantities): number {
  return quantities.normal + quantities.foil;
}

/**
 * Get the total value of a card collection entry
 */
export function getTotalValue(entry: CollectionEntry): number {
  const foilAvailability = checkFoilAvailability(entry.cardData);
  let total = 0;

  if (foilAvailability.normalPrice) {
    total += entry.normalQuantity * foilAvailability.normalPrice;
  }

  if (foilAvailability.foilPrice) {
    total += entry.foilQuantity * foilAvailability.foilPrice;
  }

  return total;
}

/**
 * Format quantity display for UI (e.g., "2N + 1F" or "3")
 */
export function formatQuantityDisplay(quantities: CardQuantities): string {
  const { normal, foil } = quantities;
  
  if (normal > 0 && foil > 0) {
    return `${normal}N + ${foil}F`;
  } else if (normal > 0) {
    return normal.toString();
  } else if (foil > 0) {
    return `${foil}F`;
  } else {
    return "0";
  }
}

/**
 * Calculate collection statistics including foil breakdown
 */
export function calculateCollectionStats(collection: CollectionEntry[]) {
  let totalCards = 0;
  let totalNormal = 0;
  let totalFoil = 0;
  let totalValue = 0;
  let foilValue = 0;
  let uniqueCards = collection.length;

  collection.forEach(entry => {
    totalNormal += entry.normalQuantity;
    totalFoil += entry.foilQuantity;
    totalCards += entry.normalQuantity + entry.foilQuantity;
    
    const entryValue = getTotalValue(entry);
    totalValue += entryValue;
    
    const foilAvailability = checkFoilAvailability(entry.cardData);
    if (foilAvailability.foilPrice) {
      foilValue += entry.foilQuantity * foilAvailability.foilPrice;
    }
  });

  const foilPercentage = totalCards > 0 ? (totalFoil / totalCards) * 100 : 0;

  return {
    totalCards,
    totalNormal,
    totalFoil,
    uniqueCards,
    totalValue,
    foilValue,
    normalValue: totalValue - foilValue,
    foilPercentage,
  };
}

/**
 * Search for "Liliana of the Veil" specifically (from user's original request)
 */
export async function searchLilianaOfTheVeil(): Promise<ScryfallCard[]> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=!"Liliana of the Veil"`);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching for Liliana of the Veil:", error);
    return [];
  }
}

/**
 * Enhanced card search with foil filtering
 */
export async function searchCardsWithFoilFilter(
  query: string,
  options: {
    onlyFoil?: boolean;
    onlyNormal?: boolean;
    sortByFoilPrice?: boolean;
  } = {}
): Promise<ScryfallCard[]> {
  try {
    let searchQuery = query;
    
    // Add foil-specific filters to the query if needed
    if (options.onlyFoil) {
      searchQuery += " is:foil";
    } else if (options.onlyNormal) {
      searchQuery += " -is:foil";
    }

    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&unique=cards&order=name`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    let results = data.data || [];

    // Filter results based on foil availability
    if (options.onlyFoil) {
      results = results.filter((card: ScryfallCard) => checkFoilAvailability(card).hasFoil);
    } else if (options.onlyNormal) {
      results = results.filter((card: ScryfallCard) => checkFoilAvailability(card).hasNormal);
    }

    // Sort by foil price if requested
    if (options.sortByFoilPrice) {
      results.sort((a: ScryfallCard, b: ScryfallCard) => {
        const aFoil = checkFoilAvailability(a);
        const bFoil = checkFoilAvailability(b);
        
        const aPrice = aFoil.foilPrice || 0;
        const bPrice = bFoil.foilPrice || 0;
        
        return bPrice - aPrice; // Descending order
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching cards with foil filter:", error);
    return [];
  }
}

/**
 * Update collection entry quantities
 */
export function updateCollectionQuantities(
  entry: CollectionEntry,
  finish: 'normal' | 'foil',
  change: number
): CollectionEntry {
  const updated = { ...entry };
  
  if (finish === 'normal') {
    updated.normalQuantity = Math.max(0, updated.normalQuantity + change);
  } else {
    updated.foilQuantity = Math.max(0, updated.foilQuantity + change);
  }
  
  return updated;
}

/**
 * Check if a card should show foil options in UI
 */
export function shouldShowFoilOptions(card: ScryfallCard): boolean {
  return checkFoilAvailability(card).hasFoil;
}

/**
 * Get price display string for a finish type
 */
export function getPriceDisplay(card: ScryfallCard, finish: 'normal' | 'foil'): string {
  const availability = checkFoilAvailability(card);
  
  if (finish === 'normal' && availability.normalPrice) {
    return `$${availability.normalPrice.toFixed(2)}`;
  } else if (finish === 'foil' && availability.foilPrice) {
    return `$${availability.foilPrice.toFixed(2)}`;
  }
  
  return "N/A";
}

/**
 * Create a new collection entry
 */
export function createCollectionEntry(
  card: ScryfallCard,
  normalQuantity: number = 0,
  foilQuantity: number = 0
): CollectionEntry {
  return {
    cardId: card.id,
    normalQuantity,
    foilQuantity,
    cardData: card,
  };
}

/**
 * Merge two collection entries (useful for combining duplicates)
 */
export function mergeCollectionEntries(
  entry1: CollectionEntry,
  entry2: CollectionEntry
): CollectionEntry {
  if (entry1.cardId !== entry2.cardId) {
    throw new Error("Cannot merge entries for different cards");
  }
  
  return {
    ...entry1,
    normalQuantity: entry1.normalQuantity + entry2.normalQuantity,
    foilQuantity: entry1.foilQuantity + entry2.foilQuantity,
  };
}

/**
 * Filter collection by foil status
 */
export function filterCollectionByFoil(
  collection: CollectionEntry[],
  filter: 'all' | 'normal-only' | 'foil-only' | 'has-foil'
): CollectionEntry[] {
  switch (filter) {
    case 'normal-only':
      return collection.filter(entry => entry.normalQuantity > 0 && entry.foilQuantity === 0);
    case 'foil-only':
      return collection.filter(entry => entry.foilQuantity > 0 && entry.normalQuantity === 0);
    case 'has-foil':
      return collection.filter(entry => entry.foilQuantity > 0);
    default:
      return collection;
  }
}
