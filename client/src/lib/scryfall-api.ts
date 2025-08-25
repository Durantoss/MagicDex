import { ScryfallSearchResponse, SearchFilters } from "@/types/scryfall";

export async function searchCards(filters: SearchFilters, page = 1): Promise<ScryfallSearchResponse> {
  const searchParams = new URLSearchParams();
  
  let query = filters.query;
  
  // Add filters to query
  if (filters.minCmc !== undefined || filters.maxCmc !== undefined) {
    const min = filters.minCmc ?? 0;
    const max = filters.maxCmc ?? 20;
    query += ` cmc>=${min} cmc<=${max}`;
  }
  
  if (filters.colors && filters.colors.length > 0) {
    query += ` color:${filters.colors.join("")}`;
  }
  
  if (filters.type && filters.type !== "All Types") {
    query += ` type:${filters.type}`;
  }
  
  if (filters.set && filters.set !== "All Sets") {
    query += ` set:${filters.set}`;
  }
  
  if (filters.rarity && filters.rarity.length > 0) {
    const rarityQuery = filters.rarity.map(r => `rarity:${r}`).join(" OR ");
    query += ` (${rarityQuery})`;
  }

  // Add foil-specific filters
  if (filters.foilFilter) {
    switch (filters.foilFilter) {
      case 'foil-only':
        query += ' is:foil';
        break;
      case 'non-foil-only':
        query += ' -is:foil';
        break;
      case 'has-foil':
        // This will be handled by post-processing since Scryfall doesn't have a direct query for this
        break;
    }
  }
  
  searchParams.set("q", query);
  searchParams.set("page", page.toString());
  
  if (filters.sort) {
    searchParams.set("order", filters.sort);
  }

  const response = await fetch(`/api/cards/search?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return response.json();
}

export function getCardImageUrl(card: any, size: "small" | "normal" | "large" = "normal"): string {
  if (card.image_uris) {
    return card.image_uris[size];
  }
  
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris[size];
  }
  
  // Fallback placeholder
  return "https://via.placeholder.com/300x420/1e293b/ffffff?text=No+Image";
}

export function formatManaCost(manaCost?: string): string {
  if (!manaCost) return "";
  
  // Simple formatting - in a real app you'd want to render mana symbols
  return manaCost.replace(/[{}]/g, "");
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "common": return "bg-gray-600";
    case "uncommon": return "bg-blue-600";
    case "rare": return "bg-yellow-600";
    case "mythic": return "bg-red-600";
    default: return "bg-gray-600";
  }
}

export function getManaTypeColors(colors?: string[]): string {
  if (!colors || colors.length === 0) return "Colorless";
  const colorNames = {
    W: "White",
    U: "Blue", 
    B: "Black",
    R: "Red",
    G: "Green"
  };
  return colors.map(c => colorNames[c as keyof typeof colorNames] || c).join(", ");
}

export function getColorSymbols(colors?: string[]): { symbol: string; color: string }[] {
  if (!colors || colors.length === 0) return [{ symbol: "C", color: "bg-gray-600" }];
  const colorMap = {
    W: { symbol: "W", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    U: { symbol: "U", color: "bg-blue-600 text-white border-blue-700" },
    B: { symbol: "B", color: "bg-gray-800 text-white border-gray-900" },
    R: { symbol: "R", color: "bg-red-600 text-white border-red-700" },
    G: { symbol: "G", color: "bg-green-600 text-white border-green-700" }
  };
  return colors.map(c => colorMap[c as keyof typeof colorMap] || { symbol: c, color: "bg-gray-600" });
}

export function getPriceRange(prices?: { usd?: string; usd_foil?: string; eur?: string; eur_foil?: string }) {
  if (!prices) return null;
  
  const priceValues = [
    prices.usd ? parseFloat(prices.usd) : null,
    prices.usd_foil ? parseFloat(prices.usd_foil) : null
  ].filter(p => p !== null && p > 0) as number[];
  
  if (priceValues.length === 0) return null;
  
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);
  const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  
  return { min, max, avg, hasRange: min !== max };
}

// Fetch all printings/variations of a card by name
export async function getCardVariations(cardName: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cardName)}"&unique=prints&order=released`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch variations: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching card variations:", error);
    return [];
  }
}

// Search for "Liliana of the Veil" specifically (from user's original request)
export async function searchLilianaOfTheVeil(): Promise<any[]> {
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

// Enhanced search with foil filtering
export async function searchCardsWithFoilOptions(
  query: string,
  options: {
    foilFilter?: 'all' | 'foil-only' | 'non-foil-only' | 'has-foil';
    sortByFoilPrice?: boolean;
    page?: number;
  } = {}
): Promise<any> {
  try {
    let searchQuery = query;
    
    // Add foil-specific filters to the query
    if (options.foilFilter === 'foil-only') {
      searchQuery += " is:foil";
    } else if (options.foilFilter === 'non-foil-only') {
      searchQuery += " -is:foil";
    }

    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&unique=cards&order=name&page=${options.page || 1}`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    let results = data.data || [];

    // Post-process for 'has-foil' filter since Scryfall doesn't have a direct query
    if (options.foilFilter === 'has-foil') {
      results = results.filter((card: any) => card.prices?.usd_foil);
    }

    // Sort by foil price if requested
    if (options.sortByFoilPrice) {
      results.sort((a: any, b: any) => {
        const aPrice = a.prices?.usd_foil ? parseFloat(a.prices.usd_foil) : 0;
        const bPrice = b.prices?.usd_foil ? parseFloat(b.prices.usd_foil) : 0;
        return bPrice - aPrice; // Descending order
      });
    }

    return {
      ...data,
      data: results
    };
  } catch (error) {
    console.error("Error searching cards with foil options:", error);
    return { data: [] };
  }
}

// Check if a card has foil availability
export function hasfoilAvailability(card: any): boolean {
  return !!(card.prices?.usd_foil);
}

// Get foil price premium percentage
export function getFoilPremium(card: any): number | null {
  const normalPrice = card.prices?.usd ? parseFloat(card.prices.usd) : null;
  const foilPrice = card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null;
  
  if (!normalPrice || !foilPrice || normalPrice <= 0) return null;
  
  return ((foilPrice - normalPrice) / normalPrice) * 100;
}

// Get card by specific set and collector number
export async function getCardBySetAndNumber(setCode: string, collectorNumber: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/${setCode}/${collectorNumber}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching specific card:", error);
    return null;
  }
}

// Group variations by set for better organization
export function groupVariationsBySet(variations: any[]): Record<string, any[]> {
  const grouped = variations.reduce((acc, card) => {
    const setName = card.set_name;
    if (!acc[setName]) {
      acc[setName] = [];
    }
    acc[setName].push(card);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort sets by release date (newest first)
  return Object.entries(grouped)
    .sort(([, a], [, b]) => {
      const dateA = new Date((a as any[])[0]?.released_at || '1900-01-01');
      const dateB = new Date((b as any[])[0]?.released_at || '1900-01-01');
      return dateB.getTime() - dateA.getTime();
    })
    .reduce((acc, [setName, cards]) => {
      acc[setName] = (cards as any[]).sort((a: any, b: any) => {
        // Sort by collector number within set
        const numA = parseInt(a.collector_number) || 0;
        const numB = parseInt(b.collector_number) || 0;
        return numA - numB;
      });
      return acc;
    }, {} as Record<string, any[]>);
}
