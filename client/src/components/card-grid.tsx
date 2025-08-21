import { ScryfallCard } from "@/types/scryfall";
import { getCardImageUrl, formatManaCost, getRarityColor } from "@/lib/scryfall-api";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  // Get user collection
  const { data: collection = [] } = useQuery({
    queryKey: ["/api/collection"],
  });

  // Add to collection mutation
  const addToCollectionMutation = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      const response = await apiRequest("POST", "/api/collection", {
        cardId: card.id,
        quantity: 1,
        cardData: card,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({
        title: "Added to Collection",
        description: "Card has been added to your collection.",
      });
    },
    onError: () => {
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
      const response = await apiRequest("DELETE", `/api/collection/${cardId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({
        title: "Removed from Collection",
        description: "Card has been removed from your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove card from collection.",
        variant: "destructive",
      });
    },
  });

  const isInCollection = (cardId: string) => {
    return Array.isArray(collection) && collection.some((item: any) => item.cardId === cardId);
  };

  const handleCollectionToggle = (e: React.MouseEvent, card: ScryfallCard) => {
    e.stopPropagation();
    
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mb-12">
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => onCardClick(card)}
            className="relative group cursor-pointer"
            data-testid={`card-${card.id}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Card Container with Enhanced Effects */}
            <div className="relative bg-glass border-glass rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-105 hover:-translate-y-2 group-hover:rotate-1">
              
              {/* Magical Border Glow */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500"></div>
              
              {/* Card Image */}
              <div className="relative overflow-hidden">
                <img
                  src={getCardImageUrl(card, "normal")}
                  alt={card.name}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-all duration-700 group-hover:brightness-110"
                  loading="lazy"
                />
                
                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Collection Status Indicator */}
                {isInCollection(card.id) && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-gradient-accent rounded-full p-2 shadow-glow animate-pulse">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Card Info */}
              <div className="p-5 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-gradient-primary transition-all duration-300" data-testid={`text-card-name-${card.id}`}>
                    {card.name}
                  </h3>
                  <p className="text-sm text-slate-300 font-medium" data-testid={`text-card-type-${card.id}`}>
                    {card.type_line}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Enhanced Mana Cost / CMC Display */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm text-white px-3 py-1.5 rounded-full font-semibold shadow-sm ${getRarityColor(card.rarity)} backdrop-blur-sm`}>
                      {formatManaCost(card.mana_cost) || `${card.cmc} CMC`}
                    </span>
                  </div>
                  
                  {/* Enhanced Collection Toggle Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleCollectionToggle(e, card)}
                    className={`relative p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                      isInCollection(card.id)
                        ? "bg-gradient-accent text-white shadow-glow hover:shadow-magical"
                        : "bg-glass border-glass text-mtg-accent hover:bg-gradient-accent hover:text-white hover:shadow-glow"
                    }`}
                    disabled={addToCollectionMutation.isPending || removeFromCollectionMutation.isPending}
                    data-testid={`button-collection-toggle-${card.id}`}
                  >
                    {isInCollection(card.id) ? 
                      <Check className="h-4 w-4 animate-pulse" /> : 
                      <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
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
      <div className="bg-glass border-glass rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-slate-300 font-medium" data-testid="text-pagination-info">
            Showing <span className="text-gradient-accent font-bold">{startItem}-{endItem}</span> of{' '}
            <span className="text-gradient-gold font-bold">{totalCards.toLocaleString()}</span> results
          </div>
          
          <nav className="flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-glass border-glass rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-previous-page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {/* Enhanced Page Numbers */}
            <div className="flex items-center space-x-1 mx-4">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
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
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-glass border-glass rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
