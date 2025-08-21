import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";
import FilterSidebar from "@/components/filter-sidebar";
import CardGrid from "@/components/card-grid";
import CardDetailModal from "@/components/card-detail-modal";
import CollectionModal from "@/components/collection-modal";
import DeckBuilderModal from "@/components/deck-builder-modal";
import { searchCards } from "@/lib/scryfall-api";
import { SearchFilters, ScryfallCard } from "@/types/scryfall";
import { Button } from "@/components/ui/button";
import { Bookmark, User, Wand2 } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    sort: "name",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showDeckBuilderModal, setShowDeckBuilderModal] = useState(false);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ["/api/cards/search", filters, currentPage],
    queryFn: () => searchCards(filters, currentPage),
    enabled: filters.query.length > 0,
  });

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCardClick = (card: ScryfallCard) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-mtg-dark text-slate-100">
      {/* Header */}
      <header className="bg-mtg-secondary border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-mtg-primary text-2xl">✨</div>
                <h1 className="text-xl font-bold text-white" data-testid="text-site-title">MTG Database</h1>
              </div>
            </div>

            {/* Main Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowDeckBuilderModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-deck-builder"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                AI Deck Builder
              </Button>
              <Button 
                onClick={() => setShowCollectionModal(true)}
                className="bg-mtg-accent hover:bg-mtg-accent/90 text-white"
                data-testid="button-collection"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                My Collection
              </Button>
              <Button 
                className="bg-mtg-primary hover:bg-mtg-primary/90 text-white"
                data-testid="button-profile"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Filter Sidebar */}
        <FilterSidebar onFiltersChange={handleSearch} currentFilters={filters} />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Search Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" data-testid="text-search-title">
                {filters.query ? "Search Results" : "MTG Card Database"}
              </h2>
              {searchResults && (
                <p className="text-slate-400" data-testid="text-results-count">
                  Showing {searchResults.data.length} of {searchResults.total_cards} cards
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400" data-testid="text-loading">Loading cards...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-400" data-testid="text-error">
                Error loading cards. Please try again.
              </div>
            </div>
          )}

          {!filters.query && !isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-search-prompt">
                  Search for Magic: The Gathering Cards
                </h3>
                <p className="text-slate-400" data-testid="text-search-instructions">
                  Use the search bar above to find cards by name, text, or type
                </p>
              </div>
            </div>
          )}

          {searchResults && searchResults.data.length > 0 && (
            <CardGrid
              cards={searchResults.data}
              onCardClick={handleCardClick}
              currentPage={currentPage}
              totalCards={searchResults.total_cards}
              hasMore={searchResults.has_more}
              onPageChange={handlePageChange}
            />
          )}

          {searchResults && searchResults.data.length === 0 && filters.query && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-no-results">
                  No cards found
                </h3>
                <p className="text-slate-400" data-testid="text-no-results-hint">
                  Try adjusting your search terms or filters
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCardModal && selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setShowCardModal(false)}
        />
      )}

      {showCollectionModal && (
        <CollectionModal
          onClose={() => setShowCollectionModal(false)}
        />
      )}

      {showDeckBuilderModal && (
        <DeckBuilderModal
          onClose={() => setShowDeckBuilderModal(false)}
        />
      )}
    </div>
  );
}
