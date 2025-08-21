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
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onCardClick(card)}
            className="bg-mtg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
            data-testid={`card-${card.id}`}
          >
            <img
              src={getCardImageUrl(card, "normal")}
              alt={card.name}
              className="w-full h-80 object-cover group-hover:brightness-110 transition-all duration-300"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="font-semibold text-white mb-1 truncate" data-testid={`text-card-name-${card.id}`}>
                {card.name}
              </h3>
              <p className="text-sm text-slate-400 mb-2 truncate" data-testid={`text-card-type-${card.id}`}>
                {card.type_line}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs text-white px-2 py-1 rounded ${getRarityColor(card.rarity)}`}>
                  {formatManaCost(card.mana_cost) || card.cmc}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleCollectionToggle(e, card)}
                  className={`p-1 transition-colors ${
                    isInCollection(card.id)
                      ? "text-green-500 hover:text-green-400"
                      : "text-mtg-accent hover:text-emerald-400"
                  }`}
                  disabled={addToCollectionMutation.isPending || removeFromCollectionMutation.isPending}
                  data-testid={`button-collection-toggle-${card.id}`}
                >
                  {isInCollection(card.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400" data-testid="text-pagination-info">
          Showing {startItem}-{endItem} of {totalCards} results
        </div>
        <nav className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            data-testid="button-previous-page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {/* Page numbers */}
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
                variant={currentPage === pageNum ? "default" : "ghost"}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm ${
                  currentPage === pageNum
                    ? "bg-mtg-primary text-white"
                    : "text-slate-400 hover:text-white"
                } transition-colors`}
                data-testid={`button-page-${pageNum}`}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasMore}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            data-testid="button-next-page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
