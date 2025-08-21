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
    <aside className="w-80 bg-mtg-secondary border-r border-slate-700 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4" data-testid="text-filters-title">Advanced Filters</h3>
        </div>

        {/* Mana Cost Filter */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium text-slate-300">Mana Cost</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minCmc || ""}
              onChange={(e) => setMinCmc(e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-mtg-gray border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-mtg-primary"
              data-testid="input-min-cmc"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxCmc || ""}
              onChange={(e) => setMaxCmc(e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-mtg-gray border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-mtg-primary"
              data-testid="input-max-cmc"
            />
          </div>
        </div>

        {/* Color Identity */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium text-slate-300">Color Identity</Label>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <Button
                key={color.symbol}
                type="button"
                onClick={() => handleColorToggle(color.symbol)}
                className={`p-2 rounded text-sm transition-colors ${
                  selectedColors.includes(color.symbol)
                    ? `${color.color} opacity-100`
                    : `${color.color} opacity-50 hover:opacity-75`
                }`}
                data-testid={`button-color-${color.symbol.toLowerCase()}`}
              >
                {color.symbol}
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

        {/* Apply Filters Button */}
        <Button
          onClick={applyFilters}
          className="w-full bg-mtg-primary hover:bg-mtg-primary/90 text-white py-2 px-4 rounded-lg transition-colors duration-200"
          data-testid="button-apply-filters"
        >
          Apply Filters
        </Button>

        {/* Clear Filters */}
        <Button
          onClick={clearFilters}
          variant="outline"
          className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors duration-200"
          data-testid="button-clear-filters"
        >
          Clear All
        </Button>
      </div>
    </aside>
  );
}
