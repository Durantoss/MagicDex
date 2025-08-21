import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";
import CardGrid from "@/components/card-grid";
import CardDetailModal from "@/components/card-detail-modal";
import CollectionModal from "@/components/collection-modal";
import DeckBuilderModal from "@/components/deck-builder-modal";
import { SearchFilters, ScryfallCard } from "@/types/scryfall";
import { Button } from "@/components/ui/button";
import { Bookmark, User, Wand2, Book, BookOpen } from "lucide-react";
import { Link } from "wouter";

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
    queryFn: async () => {
      // Construct query parameters
      const params = new URLSearchParams({
        q: filters.query || "*",
        page: currentPage.toString(),
      });
      
      // Add filters to query
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.minCmc) params.append('minCmc', filters.minCmc.toString());
      if (filters.maxCmc) params.append('maxCmc', filters.maxCmc.toString());
      if (filters.colors?.length) params.append('colors', filters.colors.join(','));
      if (filters.type && filters.type !== 'All Types') params.append('type', filters.type);
      if (filters.set && filters.set !== 'All Sets') params.append('set', filters.set);
      if (filters.rarity?.length) params.append('rarity', filters.rarity.join(','));
      
      const response = await fetch(`/api/cards/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!filters.query && filters.query.length > 0,
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
      {/* Enhanced Mobile-Optimized Header */}
      <header className="bg-glass border-b border-glass backdrop-blur-md sticky top-0 z-50 shadow-magical">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Desktop Header Layout */}
          <div className="hidden lg:flex items-center justify-between h-20">
            {/* Enhanced Logo and Brand */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="text-4xl animate-glow">✨</div>
                  <div className="absolute inset-0 text-4xl animate-pulse opacity-50">✨</div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-primary" data-testid="text-site-title">
                    MTG Database
                  </h1>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">
                    Discover • Collect • Build
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Main Search Bar */}
            <div className="flex-1 max-w-3xl mx-12">
              <div className="relative">
                <SearchBar onSearch={handleSearch} currentFilters={filters} />
                <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-20 blur-sm animate-pulse pointer-events-none"></div>
              </div>
            </div>

            {/* Enhanced User Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/rules">
                <Button 
                  className="relative bg-gradient-gold hover:shadow-glow text-white font-semibold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm lg:text-base touch-manipulation"
                  data-testid="button-rules"
                >
                  <Book className="mr-1 lg:mr-2 h-4 w-4" />
                  Rules
                  <div className="absolute inset-0 bg-gradient-gold rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/dictionary">
                <Button 
                  className="relative bg-purple-600 hover:shadow-glow text-white font-semibold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm lg:text-base touch-manipulation"
                  data-testid="button-dictionary"
                >
                  <BookOpen className="mr-1 lg:mr-2 h-4 w-4" />
                  Dictionary
                  <div className="absolute inset-0 bg-purple-600 rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Button 
                onClick={() => setShowDeckBuilderModal(true)}
                className="relative bg-mtg-primary hover:shadow-magical text-white font-semibold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card animate-glow text-sm lg:text-base touch-manipulation"
                data-testid="button-deck-builder"
              >
                <Wand2 className="mr-1 lg:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">AI Builder</span>
                <span className="sm:hidden">AI</span>
                <div className="absolute inset-0 bg-mtg-primary rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
              <Button 
                onClick={() => setShowCollectionModal(true)}
                className="relative bg-mtg-accent hover:shadow-glow text-white font-semibold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm lg:text-base touch-manipulation"
                data-testid="button-collection"
              >
                <Bookmark className="mr-1 lg:mr-2 h-4 w-4" />
                Collection
                <div className="absolute inset-0 bg-mtg-accent rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
              <Link href="/profile">
                <Button 
                  className="relative bg-mtg-secondary hover:shadow-card-hover text-white font-semibold px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card border-glass text-sm lg:text-base touch-manipulation"
                  data-testid="button-profile"
                >
                  <User className="mr-1 lg:mr-2 h-4 w-4" />
                  Profile
                  <div className="absolute inset-0 bg-mtg-secondary rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Header Layout */}
          <div className="lg:hidden">
            {/* Top Row - Logo and Profile */}
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="text-2xl animate-glow">✨</div>
                  <div className="absolute inset-0 text-2xl animate-pulse opacity-50">✨</div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gradient-primary" data-testid="text-site-title">
                    MTG Database
                  </h1>
                </div>
              </div>
              
              <Link href="/profile">
                <Button 
                  size="sm"
                  className="relative bg-mtg-secondary hover:shadow-card-hover text-white font-semibold p-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-card border-glass"
                  data-testid="button-profile-mobile"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Second Row - Search Bar */}
            <div className="pb-3">
              <div className="relative">
                <SearchBar onSearch={handleSearch} currentFilters={filters} />
                <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-20 blur-sm animate-pulse pointer-events-none"></div>
              </div>
            </div>

            {/* Third Row - Action Buttons */}
            <div className="flex items-center justify-center space-x-2 pb-4">
              <Link href="/rules">
                <Button 
                  size="sm"
                  className="relative bg-gradient-gold hover:shadow-glow text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm touch-manipulation"
                  data-testid="button-rules-mobile"
                >
                  <Book className="mr-1.5 h-4 w-4" />
                  Rules
                </Button>
              </Link>
              <Link href="/dictionary">
                <Button 
                  size="sm"
                  className="relative bg-purple-600 hover:shadow-glow text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm touch-manipulation"
                  data-testid="button-dictionary-mobile"
                >
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  Dictionary
                </Button>
              </Link>
              <Button 
                size="sm"
                onClick={() => setShowDeckBuilderModal(true)}
                className="relative bg-mtg-primary hover:shadow-magical text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-card animate-glow text-sm touch-manipulation"
                data-testid="button-deck-builder-mobile"
              >
                <Wand2 className="mr-1.5 h-4 w-4" />
                AI Builder
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowCollectionModal(true)}
                className="relative bg-mtg-accent hover:shadow-glow text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-card text-sm touch-manipulation"
                data-testid="button-collection-mobile"
              >
                <Bookmark className="mr-1.5 h-4 w-4" />
                Collection
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-screen">
        {/* Enhanced Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Search Results Header */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-gradient-primary mb-1" data-testid="text-search-title">
                  {filters.query ? "Search Results" : "Discover Magic"}
                </h2>
                <div className="flex items-center space-x-4">
                  {searchResults && (
                    <p className="text-slate-300 font-medium" data-testid="text-results-count">
                      <span className="text-gradient-accent font-bold">{searchResults.data.length}</span> of{' '}
                      <span className="text-gradient-gold font-bold">{searchResults.total_cards.toLocaleString()}</span> cards found
                    </p>
                  )}
                  {!filters.query && (
                    <p className="text-slate-400 italic">
                      Search for cards, build decks, manage your collection
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-primary opacity-10 rounded-full blur-xl animate-float"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-accent opacity-10 rounded-full blur-lg animate-float" style={{animationDelay: '1s'}}></div>
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
                  Use the search bar above or tap the filter button to find cards
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

        {/* Legal Disclaimer */}
        <footer className="mt-16 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-0.5 bg-gradient-primary"></div>
                <span className="text-slate-400 font-medium text-sm">DISCLAIMER</span>
                <div className="w-8 h-0.5 bg-gradient-primary"></div>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-3 text-slate-400 text-sm leading-relaxed">
                <p>
                  <strong className="text-slate-300">For Informational Purposes Only:</strong> This application is designed for educational and informational purposes only. It is not affiliated with, endorsed by, or sponsored by Wizards of the Coast LLC.
                </p>
                
                <p>
                  <strong className="text-slate-300">Intellectual Property Rights:</strong> Magic: The Gathering, MTG, all card names, artwork, set names, symbols, and other intellectual property are the exclusive property of Wizards of the Coast LLC. All rights reserved.
                </p>
                
                <p>
                  <strong className="text-slate-300">Data Sources:</strong> Card data and images are provided by Scryfall API and other publicly available sources. This application does not claim ownership of any MTG-related content.
                </p>
                
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                  If you are a rights holder and have concerns about content displayed here, please contact us for immediate resolution.
                </p>
              </div>
            </div>
          </div>
        </footer>
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
