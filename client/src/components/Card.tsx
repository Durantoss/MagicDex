// src/components/Card.tsx
import React from "react";
import { addCardToCollection } from "../utils/collection";
import { showToast } from "../utils/toast";

interface CardProps {
  id: string;
  name: string;
  imageUrl?: string;
}

export const Card: React.FC<CardProps> = ({ id, name, imageUrl }) => {
  return (
    <div className="card">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          style={{ maxWidth: "100%", borderRadius: "0.5rem" }}
        />
      )}
      <h3>{name}</h3>
      <button
        className="btn btn-primary"
        onClick={() => {
          addCardToCollection({ id, name, quantity: 1, imageUrl });
          showToast(`${name} added to your collection!`);
        }}
      >
        Add to Collection
      </button>
    </div>
  );
};
