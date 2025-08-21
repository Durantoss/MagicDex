import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SearchFilters } from "@/types/scryfall";

interface FilterMenuProps {
  onFiltersChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

export default function FilterMenu({ onFiltersChange, currentFilters }: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minCmc, setMinCmc] = useState<number | undefined>(currentFilters.minCmc);
  const [maxCmc, setMaxCmc] = useState<number | undefined>(currentFilters.maxCmc);
  const [selectedColors, setSelectedColors] = useState<string[]>(currentFilters.colors || []);
  const [selectedType, setSelectedType] = useState(currentFilters.type || "All Types");
  const [selectedSet, setSelectedSet] = useState(currentFilters.set || "All Sets");
  const [selectedRarities, setSelectedRarities] = useState<string[]>(currentFilters.rarity || []);

  const colors = [
    { symbol: "W", name: "White", color: "bg-yellow-100 text-yellow-800" },
    { symbol: "U", name: "Blue", color: "bg-blue-600 text-white" },
    { symbol: "B", name: "Black", color: "bg-gray-800 text-white" },
    { symbol: "R", name: "Red", color: "bg-red-600 text-white" },
    { symbol: "G", name: "Green", color: "bg-green-600 text-white" },
    { symbol: "C", name: "Colorless", color: "bg-gray-600 text-white" },
  ];

  const cardTypes = [
    "All Types", "Creature", "Instant", "Sorcery", "Artifact", "Enchantment", "Planeswalker", "Land"
  ];

  const sets = [
    "All Sets", "March of the Machine", "Phyrexia: All Will Be One", "The Brothers' War", "Dominaria United"
  ];

  const rarities = ["common", "uncommon", "rare", "mythic"];

  const handleColorToggle = (colorSymbol: string) => {
    const newColors = selectedColors.includes(colorSymbol)
      ? selectedColors.filter(c => c !== colorSymbol)
      : [...selectedColors, colorSymbol];
    setSelectedColors(newColors);
  };

  const handleRarityToggle = (rarity: string) => {
    const newRarities = selectedRarities.includes(rarity)
      ? selectedRarities.filter(r => r !== rarity)
      : [...selectedRarities, rarity];
    setSelectedRarities(newRarities);
  };

  const applyFilters = () => {
    const filters: SearchFilters = {
      ...currentFilters,
      query: currentFilters.query || "*", // Default to wildcard search if no query
      minCmc,
      maxCmc,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      type: selectedType !== "All Types" ? selectedType : undefined,
      set: selectedSet !== "All Sets" ? selectedSet : undefined,
      rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
    };
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setMinCmc(undefined);
    setMaxCmc(undefined);
    setSelectedColors([]);
    setSelectedType("All Types");
    setSelectedSet("All Sets");
    setSelectedRarities([]);
    onFiltersChange({ query: currentFilters.query, sort: "name" });
  };

  // Check if any filters are active
  const hasActiveFilters = minCmc !== undefined || maxCmc !== undefined || 
                           selectedColors.length > 0 || selectedType !== "All Types" || 
                           selectedSet !== "All Sets" || selectedRarities.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 transition-all duration-300 hover:scale-110 ${
            hasActiveFilters 
              ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          data-testid="button-open-filters"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-80 bg-slate-900 border-slate-700 overflow-y-auto">
        <SheetHeader className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl sm:text-2xl font-bold text-gradient-primary">
              Advanced Filters
            </SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-base">
            Refine your search with precision
          </SheetDescription>
          <div className="w-12 h-0.5 bg-gradient-primary rounded-full"></div>
        </SheetHeader>

        <div className="space-y-8">
          {/* Mana Cost Filter */}
          <div className="space-y-5">
            <Label className="block text-base font-semibold text-white flex items-center space-x-2">
              <span className="w-2 h-2 bg-gradient-gold rounded-full"></span>
              <span>Mana Cost Range</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minCmc || ""}
                  onChange={(e) => setMinCmc(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-slate-800 border-slate-600 rounded-lg px-4 py-3 text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 h-12"
                  data-testid="input-min-cmc"
                />
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxCmc || ""}
                  onChange={(e) => setMaxCmc(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-slate-800 border-slate-600 rounded-lg px-4 py-3 text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 h-12"
                  data-testid="input-max-cmc"
                />
              </div>
            </div>
          </div>

          {/* Color Identity */}
          <div className="space-y-5">
            <Label className="block text-base font-semibold text-white flex items-center space-x-2">
              <span className="w-2 h-2 bg-gradient-accent rounded-full"></span>
              <span>Color Identity</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {colors.map((color) => (
                <Button
                  key={color.symbol}
                  type="button"
                  onClick={() => handleColorToggle(color.symbol)}
                  className={`relative h-12 rounded-lg text-base font-bold transition-all duration-300 hover:scale-105 touch-manipulation ${
                    selectedColors.includes(color.symbol)
                      ? `${color.color} opacity-100 shadow-lg`
                      : `${color.color} opacity-60 hover:opacity-90`
                  }`}
                  data-testid={`button-color-${color.symbol.toLowerCase()}`}
                >
                  {color.symbol}
                  {selectedColors.includes(color.symbol) && (
                    <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-pulse"></div>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Card Type */}
          <div className="space-y-4">
            <Label className="block text-base font-medium text-slate-300">Card Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger 
                className="w-full h-12 bg-slate-800 border-slate-600 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                data-testid="select-card-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {cardTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-white hover:bg-slate-700 py-3 text-base">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Set Selection */}
          <div className="space-y-4">
            <Label className="block text-base font-medium text-slate-300">Set</Label>
            <Select value={selectedSet} onValueChange={setSelectedSet}>
              <SelectTrigger 
                className="w-full h-12 bg-slate-800 border-slate-600 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                data-testid="select-set"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {sets.map((set) => (
                  <SelectItem key={set} value={set} className="text-white hover:bg-slate-700 py-3 text-base">
                    {set}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rarity */}
          <div className="space-y-4">
            <Label className="block text-base font-medium text-slate-300">Rarity</Label>
            <div className="space-y-4">
              {rarities.map((rarity) => (
                <div key={rarity} className="flex items-center space-x-4">
                  <Checkbox
                    id={rarity}
                    checked={selectedRarities.includes(rarity)}
                    onCheckedChange={() => handleRarityToggle(rarity)}
                    className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 h-5 w-5"
                    data-testid={`checkbox-rarity-${rarity}`}
                  />
                  <Label htmlFor={rarity} className="text-base text-slate-300 capitalize cursor-pointer flex-1 py-1">
                    {rarity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            <Button
              onClick={applyFilters}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base rounded-lg transition-all duration-300 hover:scale-105 shadow-lg touch-manipulation"
              data-testid="button-search"
            >
              <Search className="w-5 h-5 mr-2" />
              Apply Filters
            </Button>

            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full h-12 bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold text-base rounded-lg transition-all duration-300 hover:scale-105 touch-manipulation"
              data-testid="button-clear-filters"
            >
              <X className="w-5 h-5 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}