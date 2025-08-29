// pages/CollectionPage.tsx
import React, { useState, useEffect } from "react";
import { getCollection, removeCardFromCollection, CollectionCard } from "../utils/collection";
import { showToast } from "../utils/toast";

export const CollectionPage: React.FC = () => {
  const [collection, setCollection] = useState<CollectionCard[]>([]);

  useEffect(() => {
    setCollection(getCollection());
  }, []);

  const handleRemove = (id: string) => {
    removeCardFromCollection(id);
    setCollection(getCollection());
    showToast("Card removed from collection", "error");
  };

  return (
    <div className="collection-page">
      <h1>Your Collection</h1>
      {collection.length === 0 && <p>No cards yet. Add some to your collection!</p>}
      <div className="card-grid">
        {collection.map((card) => (
          <div key={card.id} className="card">
            {card.imageUrl && <img src={card.imageUrl} alt={card.name} />}
            <h3>{card.name}</h3>
            <p>Quantity: {card.quantity}</p>
            <button className="btn" onClick={() => handleRemove(card.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
