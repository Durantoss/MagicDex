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
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search cards by name, text, or type..."
        className="w-full bg-mtg-gray text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-mtg-primary focus:border-transparent"
        data-testid="input-search"
      />
      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
    </form>
  );
}
