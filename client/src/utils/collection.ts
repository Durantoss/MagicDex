// src/utils/collection.ts
export interface CollectionCard {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

const STORAGE_KEY = "mtg_collection";

export function getCollection(): CollectionCard[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addCardToCollection(card: CollectionCard) {
  const collection = getCollection();
  const existing = collection.find((c) => c.id === card.id);

  if (existing) {
    existing.quantity += card.quantity || 1;
  } else {
    collection.push({ ...card, quantity: card.quantity || 1 });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function removeCardFromCollection(cardId: string) {
  const collection = getCollection().filter((c) => c.id !== cardId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}
