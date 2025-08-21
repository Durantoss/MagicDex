import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SearchFilters } from "@/types/scryfall";

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({
        query: query.trim(),
        sort: "name",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-search as user types (debounced in real implementation)
    if (value.trim().length > 2) {
      onSearch({
        query: value.trim(),
        sort: "name",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      {/* Enhanced Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for magic cards, spells, creatures..."
          className="w-full h-14 bg-glass border-glass rounded-2xl px-6 py-4 pl-14 text-white text-lg placeholder-slate-400 transition-all duration-300 focus:outline-none focus:shadow-magical focus:scale-105 hover:shadow-card backdrop-blur-md"
          data-testid="input-search"
        />
        
        {/* Enhanced Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className="h-6 w-6 text-slate-400 group-focus-within:text-gradient-primary transition-all duration-300 group-hover:scale-110" />
        </div>
        
        {/* Magical Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-10 group-focus-within:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Search Suggestions Hint */}
        {query.length === 0 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="bg-glass px-2 py-1 rounded-full border border-glass">⌘K</span>
              <span>Quick search</span>
            </div>
          </div>
        )}
        
        {/* Active Search Indicator */}
        {query.length > 0 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-gradient-accent rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </form>
  );
}
