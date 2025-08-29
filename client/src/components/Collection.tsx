// src/components/Collection.tsx
import React from 'react';

type CardData = {
  id: string;
  title: string;
  rarity: 'common' | 'foil';
  price: number;
  imageUrl: string;
};

type CollectionProps = {
  cards: CardData[];
};

const Collection: React.FC<CollectionProps> = ({ cards }) => {
  return (
    <section className="card-grid">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`stat-card ${card.rarity === 'foil' ? 'card-foil foil-shimmer' : ''}`}
        >
          <img src={card.imageUrl} alt={card.title} className="card-image" />
          <div className="stat-value">{card.title}</div>
          <div className={`stat-label ${card.rarity === 'foil' ? 'stat-foil' : ''}`}>
            {card.rarity.toUpperCase()}
          </div>
          <div className="price-display">${card.price.toFixed(2)}</div>
        </div>
      ))}
    </section>
  );
};

export default Collection;
