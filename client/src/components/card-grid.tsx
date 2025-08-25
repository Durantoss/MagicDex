import { ScryfallCard } from "@/types/scryfall";
import { getCardImageUrl, formatManaCost, getRarityColor } from "@/lib/scryfall-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collectionApi } from "@/lib/api";

interface CardGridProps {
  cards: ScryfallCard[];
  onCardClick: (card: ScryfallCard) => void;
  currentPage: number;
  totalCards: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export default function CardGrid({ 
  cards, 
  onCardClick, 
  currentPage, 
  totalCards, 
  hasMore, 
  onPageChange 
}: CardGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user collection
  const { data: collection = [] } = useQuery({
    queryKey: ["collection", user?.id],
    queryFn: () => user ? collectionApi.getCollection(user.id) : [],
    enabled: !!user,
  });

  // Add to collection mutation
  const addToCollectionMutation = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      if (!user) throw new Error("User not authenticated");
      
      return await collectionApi.addToCollection(
        user.id,
        card.id,
        1, // normal quantity
        0, // foil quantity
        {
          ...card,
          image_url: card.image_uris?.normal || card.image_uris?.large,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", user?.id] });
      toast({
        title: "Added to Collection",
        description: "Card has been added to your collection.",
      });
    },
    onError: (error) => {
      console.error("Collection add error:", error);
      toast({
        title: "Error",
        description: "Failed to add card to collection.",
        variant: "destructive",
      });
    },
  });

  // Remove from collection mutation
  const removeFromCollectionMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      return await collectionApi.removeFromCollection(user.id, cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", user?.id] });
      toast({
        title: "Removed from Collection",
        description: "Card has been removed from your collection.",
      });
    },
    onError: (error) => {
      console.error("Collection remove error:", error);
      toast({
        title: "Error",
        description: "Failed to remove card from collection.",
        variant: "destructive",
      });
    },
  });

  const isInCollection = (cardId: string) => {
    return Array.isArray(collection) && collection.some((item: any) => item.card_id === cardId);
  };

  const handleCollectionToggle = (e: React.MouseEvent, card: ScryfallCard) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add cards to your collection.",
        variant: "destructive",
      });
      return;
    }
    
    if (isInCollection(card.id)) {
      removeFromCollectionMutation.mutate(card.id);
    } else {
      addToCollectionMutation.mutate(card);
    }
  };

  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCards / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCards);

  return (
    <div>
      {/* Enhanced Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => onCardClick(card)}
            className="relative group cursor-pointer"
            data-testid={`card-${card.id}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Card Container with Enhanced Effects */}
            <div className="relative bg-glass border-glass rounded-xl sm:rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-105 hover:-translate-y-2 group-hover:rotate-1 touch-manipulation">
              
              {/* Magical Border Glow */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500"></div>
              
              {/* Card Image */}
              <div className="relative overflow-hidden">
                <img
                  src={getCardImageUrl(card, "normal")}
                  alt={card.name}
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover group-hover:scale-110 transition-all duration-700 group-hover:brightness-110"
                  loading="lazy"
                />
                
                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Collection Status Indicator */}
                {isInCollection(card.id) && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <div className="bg-gradient-accent rounded-full p-1.5 sm:p-2 shadow-glow animate-pulse">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Card Info */}
              <div className="p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="font-bold text-white text-sm sm:text-base lg:text-lg leading-tight group-hover:text-gradient-primary transition-all duration-300 line-clamp-2" data-testid={`text-card-name-${card.id}`}>
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1" data-testid={`text-card-type-${card.id}`}>
                    {card.type_line}
                  </p>
                  {card.set_name && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-mtg-accent font-medium bg-slate-800/50 px-1.5 py-0.5 rounded text-center truncate">
                        {card.set?.toUpperCase() || card.set_name}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getRarityColor(card.rarity)} text-white text-center`}>
                        {card.rarity}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between space-x-1">
                  {/* Enhanced Mana Cost / CMC Display */}
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <span className="text-xs text-white px-2 py-1 rounded-full font-semibold shadow-sm bg-slate-700 backdrop-blur-sm text-center truncate">
                      {formatManaCost(card.mana_cost) || `${card.cmc} CMC`}
                    </span>
                    {card.prices?.usd && (
                      <span className="text-xs text-green-400 font-bold text-center">
                        ${parseFloat(card.prices.usd).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced Collection Toggle Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleCollectionToggle(e, card)}
                    className={`relative p-2 rounded-full transition-all duration-300 hover:scale-110 touch-manipulation flex-shrink-0 ${
                      isInCollection(card.id)
                        ? "bg-gradient-accent text-white shadow-glow hover:shadow-magical"
                        : "bg-glass border-glass text-mtg-accent hover:bg-gradient-accent hover:text-white hover:shadow-glow"
                    }`}
                    disabled={addToCollectionMutation.isPending || removeFromCollectionMutation.isPending || !user}
                    data-testid={`button-collection-toggle-${card.id}`}
                  >
                    {addToCollectionMutation.isPending || removeFromCollectionMutation.isPending ? (
                      <div className="animate-spin w-3 h-3 sm:w-3.5 sm:h-3.5 border border-white border-t-transparent rounded-full" />
                    ) : isInCollection(card.id) ? 
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" /> : 
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:rotate-90 transition-transform duration-300" />
                    }
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-primary opacity-0 group-hover:opacity-30 rounded-full blur-sm transition-opacity duration-500"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-accent opacity-0 group-hover:opacity-40 rounded-full blur-sm transition-opacity duration-700" style={{transitionDelay: '0.1s'}}></div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      <div className="bg-glass border-glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-slate-300 font-medium text-sm sm:text-base text-center sm:text-left" data-testid="text-pagination-info">
            Showing <span className="text-gradient-accent font-bold">{startItem}-{endItem}</span> of{' '}
            <span className="text-gradient-gold font-bold">{totalCards.toLocaleString()}</span> results
          </div>
          
          <nav className="flex items-center justify-center sm:justify-start space-x-1">
            <Button
              variant="ghost"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 text-slate-300 hover:text-white hover:bg-glass border-glass rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
              data-testid="button-previous-page"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            {/* Enhanced Page Numbers */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 mx-2 sm:mx-4">
              {Array.from({ length: Math.min(totalPages <= 3 ? 3 : 5, totalPages) }, (_, i) => {
                let pageNum;
                const maxPages = totalPages <= 3 ? 3 : 5;
                if (totalPages <= maxPages) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - (maxPages - 1) + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 touch-manipulation text-sm sm:text-base ${
                      currentPage === pageNum
                        ? "bg-mtg-primary text-white shadow-magical hover:shadow-glow"
                        : "text-slate-400 hover:text-white hover:bg-glass border-glass"
                    }`}
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasMore}
              className="px-3 sm:px-4 py-2 text-slate-300 hover:text-white hover:bg-glass border-glass rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
              data-testid="button-next-page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
