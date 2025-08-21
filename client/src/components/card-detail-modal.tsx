import { ScryfallCard } from "@/types/scryfall";
import { getCardImageUrl, formatManaCost, getRarityColor } from "@/lib/scryfall-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CardDetailModalProps {
  card: ScryfallCard;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user collection
  const { data: collection = [] } = useQuery({
    queryKey: ["/api/collection"],
  });

  // Add to collection mutation
  const addToCollectionMutation = useMutation({
    mutationFn: async () => {
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

  const isInCollection = collection.some((item: any) => item.cardId === card.id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Card Image */}
          <div className="lg:w-1/2 p-6">
            <img
              src={getCardImageUrl(card, "large")}
              alt={card.name}
              className="w-full rounded-lg shadow-lg"
              data-testid="img-card-detail"
            />
          </div>

          {/* Card Details */}
          <div className="lg:w-1/2 p-6 space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-3xl font-bold text-white" data-testid="text-card-name">
                  {card.name}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                  data-testid="button-close-modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Mana Cost */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mana Cost</label>
                <Badge className={`text-lg px-3 py-1 ${getRarityColor(card.rarity)}`} data-testid="text-mana-cost">
                  {formatManaCost(card.mana_cost) || card.cmc}
                </Badge>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <p className="text-white" data-testid="text-type-line">{card.type_line}</p>
              </div>

              {/* Oracle Text */}
              {card.oracle_text && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Oracle Text</label>
                  <p className="text-white bg-mtg-gray p-3 rounded whitespace-pre-wrap" data-testid="text-oracle-text">
                    {card.oracle_text}
                  </p>
                </div>
              )}

              {/* Card Faces for Double-Faced Cards */}
              {card.card_faces && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Card Faces</label>
                  <div className="space-y-2">
                    {card.card_faces.map((face, index) => (
                      <div key={index} className="bg-mtg-gray p-3 rounded">
                        <h4 className="font-semibold text-white">{face.name}</h4>
                        <p className="text-sm text-slate-300">{face.type_line}</p>
                        {face.oracle_text && (
                          <p className="text-sm text-white mt-1">{face.oracle_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Set and Rarity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Set</label>
                  <p className="text-white" data-testid="text-set-name">{card.set_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Rarity</label>
                  <Badge className={`capitalize ${getRarityColor(card.rarity)}`} data-testid="text-rarity">
                    {card.rarity}
                  </Badge>
                </div>
              </div>

              {/* Artist */}
              {card.artist && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Artist</label>
                  <p className="text-white" data-testid="text-artist">{card.artist}</p>
                </div>
              )}

              {/* Market Price */}
              {card.prices?.usd && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Market Price</label>
                  <p className="text-green-400 text-xl font-semibold" data-testid="text-price">
                    ${card.prices.usd}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-slate-600">
              <Button
                onClick={() => addToCollectionMutation.mutate()}
                disabled={addToCollectionMutation.isPending || isInCollection}
                className="flex-1 bg-mtg-accent hover:bg-mtg-accent/90 text-white py-3 px-4 rounded-lg transition-colors duration-200"
                data-testid="button-add-to-collection"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isInCollection ? "In Collection" : "Add to Collection"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-mtg-primary hover:bg-mtg-primary/90 text-white py-3 px-4 rounded-lg transition-colors duration-200"
                data-testid="button-add-to-wishlist"
              >
                <Heart className="mr-2 h-4 w-4" />
                Add to Wishlist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
