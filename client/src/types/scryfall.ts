export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity?: string[];
  rarity: "common" | "uncommon" | "rare" | "mythic";
  set: string;
  set_name: string;
  artist?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    type_line: string;
    oracle_text?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
  }>;
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
  };
}

export interface ScryfallSearchResponse {
  data: ScryfallCard[];
  total_cards: number;
  has_more: boolean;
  next_page?: string;
}

export interface SearchFilters {
  query: string;
  minCmc?: number;
  maxCmc?: number;
  colors?: string[];
  type?: string;
  set?: string;
  rarity?: string[];
  sort?: string;
  foilFilter?: 'all' | 'foil-only' | 'non-foil-only' | 'has-foil';
}
