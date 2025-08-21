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
