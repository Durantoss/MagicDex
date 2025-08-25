import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SearchFilters } from "@/types/scryfall";
import FilterMenu from "./filter-menu";

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

export default function SearchBar({ onSearch, currentFilters = { query: "", sort: "name" } }: SearchBarProps) {
  const [query, setQuery] = useState(currentFilters.query || "");

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
    
    // Auto-search as user types (with minimum 3 characters)
    if (value.trim().length >= 3) {
      onSearch({
        query: value.trim(),
        sort: "name",
      });
    } else if (value.trim().length === 0) {
      // Clear results when search is empty
      onSearch({
        query: "",
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
          placeholder="Search cards..."
          className="w-full h-10 sm:h-12 lg:h-14 bg-glass border-glass rounded-lg sm:rounded-xl lg:rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 pl-9 sm:pl-12 lg:pl-14 pr-12 sm:pr-16 lg:pr-20 text-white text-sm sm:text-base lg:text-lg placeholder-slate-400 transition-all duration-300 focus:outline-none focus:shadow-magical focus:scale-[1.01] sm:focus:scale-[1.02] lg:focus:scale-105 hover:shadow-card backdrop-blur-md touch-manipulation"
          data-testid="input-search"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        
        {/* Enhanced Search Icon */}
        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
          <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-focus-within:text-gradient-primary transition-all duration-300 group-hover:scale-110" />
        </div>
        
        {/* Magical Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-10 group-focus-within:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
        
        
        {/* Filter Menu Button */}
        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <FilterMenu onFiltersChange={onSearch} currentFilters={currentFilters} />
          {/* Active Search Indicator */}
          {query.length > 0 && (
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-accent rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </form>
  );
}
