import React from 'react';
import { Sparkles } from 'lucide-react';
import { ScryfallCard } from '@/types/scryfall';
import { checkFoilAvailability, CardQuantities } from '@/lib/foil-utils';

interface FoilBadgeProps {
  card?: ScryfallCard;
  quantities?: CardQuantities;
  showShimmer?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FoilBadge({
  card,
  quantities,
  showShimmer = false,
  size = 'md',
  className = '',
}: FoilBadgeProps) {
  // Determine if we should show the foil badge
  const shouldShow = React.useMemo(() => {
    if (quantities) {
      return quantities.foil > 0;
    }
    if (card) {
      return checkFoilAvailability(card).hasFoil;
    }
    return false;
  }, [card, quantities]);

  if (!shouldShow) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={`
        foil-badge 
        ${sizeClasses[size]} 
        ${showShimmer ? 'foil-shimmer' : ''} 
        ${className}
      `}
    >
      <div className="flex items-center gap-1">
        <Sparkles className={iconSizes[size]} />
        <span>
          {quantities?.foil ? `${quantities.foil}F` : 'FOIL'}
        </span>
      </div>
    </div>
  );
}

// Inline foil indicator for card lists
interface FoilIndicatorProps {
  quantities: CardQuantities;
  size?: 'sm' | 'md';
}

export function FoilIndicator({ quantities, size = 'sm' }: FoilIndicatorProps) {
  if (quantities.foil <= 0) return null;

  return (
    <div className={`inline-flex items-center gap-1 text-yellow-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      <span>{quantities.foil}</span>
    </div>
  );
}

// Foil availability indicator (shows if foil exists for a card)
interface FoilAvailabilityIndicatorProps {
  card: ScryfallCard;
  showPrice?: boolean;
  size?: 'sm' | 'md';
}

export function FoilAvailabilityIndicator({
  card,
  showPrice = false,
  size = 'sm',
}: FoilAvailabilityIndicatorProps) {
  const foilAvailability = checkFoilAvailability(card);

  if (!foilAvailability.hasFoil) return null;

  return (
    <div className={`inline-flex items-center gap-1 text-yellow-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      <span>
        Foil Available
        {showPrice && foilAvailability.foilPrice && (
          <span className="text-green-400 ml-1">
            ${foilAvailability.foilPrice.toFixed(2)}
          </span>
        )}
      </span>
    </div>
  );
}

// Card wrapper that adds foil effects to card images
interface FoilCardWrapperProps {
  children: React.ReactNode;
  hasFoil: boolean;
  showEffect?: boolean;
  className?: string;
}

export function FoilCardWrapper({
  children,
  hasFoil,
  showEffect = true,
  className = '',
}: FoilCardWrapperProps) {
  return (
    <div
      className={`
        relative 
        ${hasFoil && showEffect ? 'card-foil' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Quantity display with foil formatting
interface QuantityDisplayProps {
  quantities: CardQuantities;
  showLabels?: boolean;
  compact?: boolean;
}

export function QuantityDisplay({
  quantities,
  showLabels = false,
  compact = false,
}: QuantityDisplayProps) {
  const { normal, foil } = quantities;
  const total = normal + foil;

  if (total === 0) return <span className="text-slate-500">0</span>;

  if (compact) {
    if (normal > 0 && foil > 0) {
      return (
        <span className="text-white">
          {normal}
          <span className="text-yellow-400">+{foil}F</span>
        </span>
      );
    } else if (foil > 0) {
      return (
        <span className="text-yellow-400">
          {foil}F
        </span>
      );
    } else {
      return <span className="text-white">{normal}</span>;
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {normal > 0 && (
        <span className="text-white">
          {showLabels ? `${normal} Normal` : normal}
        </span>
      )}
      
      {normal > 0 && foil > 0 && (
        <span className="text-slate-500">+</span>
      )}
      
      {foil > 0 && (
        <span className="text-yellow-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {showLabels ? `${foil} Foil` : foil}
        </span>
      )}
    </div>
  );
}

// Collection stats component with foil breakdown
interface CollectionStatsProps {
  stats: {
    totalCards: number;
    totalNormal: number;
    totalFoil: number;
    uniqueCards: number;
    totalValue: number;
    foilValue: number;
    foilPercentage: number;
  };
}

export function CollectionStats({ stats }: CollectionStatsProps) {
  return (
    <div className="collection-stats">
      <div className="stat-card">
        <div className="stat-value">{stats.uniqueCards}</div>
        <div className="stat-label">Unique Cards</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.totalCards}</div>
        <div className="stat-label">Total Cards</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.totalNormal}</div>
        <div className="stat-label">Normal Cards</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value stat-foil">{stats.totalFoil}</div>
        <div className="stat-label">Foil Cards</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">${stats.totalValue.toFixed(2)}</div>
        <div className="stat-label">Total Value</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value stat-foil">${stats.foilValue.toFixed(2)}</div>
        <div className="stat-label">Foil Value</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value stat-foil">{stats.foilPercentage.toFixed(1)}%</div>
        <div className="stat-label">Foil Percentage</div>
      </div>
    </div>
  );
}

// Price comparison component for normal vs foil
interface PriceComparisonProps {
  card: ScryfallCard;
  showDifference?: boolean;
}

export function PriceComparison({ card, showDifference = true }: PriceComparisonProps) {
  const foilAvailability = checkFoilAvailability(card);

  if (!foilAvailability.normalPrice && !foilAvailability.foilPrice) {
    return <span className="text-slate-500">No pricing available</span>;
  }

  const normalPrice = foilAvailability.normalPrice || 0;
  const foilPrice = foilAvailability.foilPrice || 0;
  const difference = foilPrice - normalPrice;
  const multiplier = normalPrice > 0 ? foilPrice / normalPrice : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Normal:</span>
        <span className="text-white">
          {foilAvailability.normalPrice ? `$${normalPrice.toFixed(2)}` : 'N/A'}
        </span>
      </div>
      
      {foilAvailability.hasFoil && (
        <div className="flex justify-between items-center">
          <span className="text-yellow-400">Foil:</span>
          <span className="text-yellow-400">
            ${foilPrice.toFixed(2)}
          </span>
        </div>
      )}
      
      {showDifference && foilAvailability.hasFoil && normalPrice > 0 && (
        <div className="pt-2 border-t border-slate-600">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Foil Premium:</span>
            <span className={difference > 0 ? 'text-green-400' : 'text-red-400'}>
              +${difference.toFixed(2)} ({multiplier.toFixed(1)}x)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
