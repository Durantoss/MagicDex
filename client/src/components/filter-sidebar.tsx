import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchFilters } from "@/types/scryfall";

interface FilterSidebarProps {
  onFiltersChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

export default function FilterSidebar({ onFiltersChange, currentFilters }: FilterSidebarProps) {
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
      minCmc,
      maxCmc,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      type: selectedType !== "All Types" ? selectedType : undefined,
      set: selectedSet !== "All Sets" ? selectedSet : undefined,
      rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
    };
    onFiltersChange(filters);
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

  return (
    <aside className="w-80 bg-glass border-r border-glass p-8 overflow-y-auto backdrop-blur-md">
      <div className="space-y-8">
        <div className="relative">
          <h3 className="text-2xl font-bold text-gradient-primary mb-2" data-testid="text-filters-title">
            Advanced Filters
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Refine your search with precision
          </p>
          <div className="w-12 h-0.5 bg-gradient-primary rounded-full"></div>
        </div>

        {/* Enhanced Mana Cost Filter */}
        <div className="space-y-4">
          <Label className="block text-sm font-semibold text-white flex items-center space-x-2">
            <span className="w-2 h-2 bg-gradient-gold rounded-full"></span>
            <span>Mana Cost Range</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Input
                type="number"
                placeholder="Min"
                value={minCmc || ""}
                onChange={(e) => setMinCmc(e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-glass border-glass rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:shadow-glow transition-all duration-300 hover:scale-105"
                data-testid="input-min-cmc"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="Max"
                value={maxCmc || ""}
                onChange={(e) => setMaxCmc(e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-glass border-glass rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:shadow-glow transition-all duration-300 hover:scale-105"
                data-testid="input-max-cmc"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Color Identity */}
        <div className="space-y-4">
          <Label className="block text-sm font-semibold text-white flex items-center space-x-2">
            <span className="w-2 h-2 bg-gradient-accent rounded-full"></span>
            <span>Color Identity</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <Button
                key={color.symbol}
                type="button"
                onClick={() => handleColorToggle(color.symbol)}
                className={`relative p-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-110 hover:shadow-glow group ${
                  selectedColors.includes(color.symbol)
                    ? `${color.color} opacity-100 shadow-card scale-105`
                    : `${color.color} opacity-60 hover:opacity-90`
                }`}
                data-testid={`button-color-${color.symbol.toLowerCase()}`}
              >
                {color.symbol}
                {selectedColors.includes(color.symbol) && (
                  <div className="absolute inset-0 rounded-xl bg-white opacity-20 animate-pulse"></div>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Card Type */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium text-slate-300">Card Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger 
              className="w-full bg-mtg-gray border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-mtg-primary"
              data-testid="select-card-type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cardTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Set Selection */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium text-slate-300">Set</Label>
          <Select value={selectedSet} onValueChange={setSelectedSet}>
            <SelectTrigger 
              className="w-full bg-mtg-gray border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-mtg-primary"
              data-testid="select-set"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sets.map((set) => (
                <SelectItem key={set} value={set}>
                  {set}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rarity */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium text-slate-300">Rarity</Label>
          <div className="space-y-2">
            {rarities.map((rarity) => (
              <div key={rarity} className="flex items-center space-x-2">
                <Checkbox
                  id={rarity}
                  checked={selectedRarities.includes(rarity)}
                  onCheckedChange={() => handleRarityToggle(rarity)}
                  className="rounded border-slate-600 bg-mtg-gray text-mtg-primary focus:ring-mtg-primary focus:ring-offset-0"
                  data-testid={`checkbox-rarity-${rarity}`}
                />
                <Label htmlFor={rarity} className="text-sm text-slate-300 capitalize">
                  {rarity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={applyFilters}
            className="w-full bg-mtg-primary hover:shadow-magical text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-card animate-glow"
            data-testid="button-apply-filters"
          >
            Apply Filters
          </Button>

          <Button
            onClick={clearFilters}
            className="w-full bg-glass border-glass text-slate-300 hover:text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-card backdrop-blur-md"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        </div>
      </div>
    </aside>
  );
}
