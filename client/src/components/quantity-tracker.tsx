import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Sparkles, Package } from 'lucide-react';
import { ScryfallCard } from '@/types/scryfall';
import { checkFoilAvailability, getPriceDisplay, CardQuantities } from '@/lib/foil-utils';

interface QuantityTrackerProps {
  card: ScryfallCard;
  quantities: CardQuantities;
  onQuantityChange: (finish: 'normal' | 'foil', change: number) => void;
  showPrices?: boolean;
  disabled?: boolean;
  className?: string;
}

export function QuantityTracker({
  card,
  quantities,
  onQuantityChange,
  showPrices = true,
  disabled = false,
  className = '',
}: QuantityTrackerProps) {
  const foilAvailability = checkFoilAvailability(card);

  const handleQuantityChange = (finish: 'normal' | 'foil', change: number) => {
    if (disabled) return;
    onQuantityChange(finish, change);
  };

  return (
    <div className={`quantity-tracker ${className}`}>
      {/* Normal Quantity Row */}
      <div className="quantity-row">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <span className="finish-label">Normal</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="quantity-controls">
            <Button
              variant="outline"
              size="sm"
              className="quantity-button"
              onClick={() => handleQuantityChange('normal', -1)}
              disabled={disabled || quantities.normal <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="quantity-display">
              {quantities.normal}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              className="quantity-button"
              onClick={() => handleQuantityChange('normal', 1)}
              disabled={disabled}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {showPrices && foilAvailability.normalPrice && (
            <span className="price-display">
              {getPriceDisplay(card, 'normal')} each
            </span>
          )}
        </div>
      </div>

      {/* Foil Quantity Row - Only show if foil is available */}
      {foilAvailability.hasFoil && (
        <div className="quantity-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="finish-label foil">Foil</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="quantity-controls">
              <Button
                variant="outline"
                size="sm"
                className="quantity-button"
                onClick={() => handleQuantityChange('foil', -1)}
                disabled={disabled || quantities.foil <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="quantity-display">
                {quantities.foil}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                className="quantity-button"
                onClick={() => handleQuantityChange('foil', 1)}
                disabled={disabled}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {showPrices && foilAvailability.foilPrice && (
              <span className="price-display">
                {getPriceDisplay(card, 'foil')} each
              </span>
            )}
          </div>
        </div>
      )}

      {/* Total Display */}
      {(quantities.normal > 0 || quantities.foil > 0) && (
        <div className="flex justify-between items-center pt-2 border-t border-slate-600">
          <span className="text-sm text-slate-400">Total Cards:</span>
          <span className="text-sm font-semibold text-white">
            {quantities.normal + quantities.foil}
          </span>
        </div>
      )}

      {/* Total Value Display */}
      {showPrices && (quantities.normal > 0 || quantities.foil > 0) && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Total Value:</span>
          <span className="text-sm font-semibold text-green-400">
            ${(
              (quantities.normal * (foilAvailability.normalPrice || 0)) +
              (quantities.foil * (foilAvailability.foilPrice || 0))
            ).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for use in card grids and lists
interface CompactQuantityTrackerProps {
  card: ScryfallCard;
  quantities: CardQuantities;
  onQuantityChange: (finish: 'normal' | 'foil', change: number) => void;
  disabled?: boolean;
}

export function CompactQuantityTracker({
  card,
  quantities,
  onQuantityChange,
  disabled = false,
}: CompactQuantityTrackerProps) {
  const foilAvailability = checkFoilAvailability(card);

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Normal quantity */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onQuantityChange('normal', -1)}
          disabled={disabled || quantities.normal <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="min-w-[20px] text-center text-white">
          {quantities.normal}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onQuantityChange('normal', 1)}
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Separator */}
      {foilAvailability.hasFoil && (
        <span className="text-slate-500">|</span>
      )}

      {/* Foil quantity - only if available */}
      {foilAvailability.hasFoil && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onQuantityChange('foil', -1)}
            disabled={disabled || quantities.foil <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-[20px] text-center text-yellow-400">
            {quantities.foil}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onQuantityChange('foil', 1)}
            disabled={disabled}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </div>
      )}
    </div>
  );
}

// Quick add buttons for scanner and search results
interface QuickAddButtonsProps {
  card: ScryfallCard;
  onAdd: (finish: 'normal' | 'foil', quantity: number) => void;
  disabled?: boolean;
}

export function QuickAddButtons({
  card,
  onAdd,
  disabled = false,
}: QuickAddButtonsProps) {
  const foilAvailability = checkFoilAvailability(card);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 bg-slate-700 hover:bg-slate-600 border-slate-600"
        onClick={() => onAdd('normal', 1)}
        disabled={disabled}
      >
        <Package className="mr-1 h-3 w-3" />
        +1 Normal
      </Button>
      
      {foilAvailability.hasFoil && (
        <Button
          size="sm"
          variant="outline"
          className="flex-1 bg-yellow-900/20 hover:bg-yellow-800/30 border-yellow-600/50 text-yellow-300"
          onClick={() => onAdd('foil', 1)}
          disabled={disabled}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          +1 Foil
        </Button>
      )}
    </div>
  );
}

// Foil toggle component (from user's original request)
interface FoilToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function FoilToggle({
  checked,
  onChange,
  disabled = false,
  label = "Mark as Foil",
}: FoilToggleProps) {
  return (
    <label className="foil-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}
