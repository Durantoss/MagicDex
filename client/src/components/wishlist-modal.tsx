import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getCardImageUrl } from "@/lib/scryfall-api";
import { X, Search, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistApi } from "@/lib/api";

interface WishlistModalProps {
  onClose: () => void;
}

export default function WishlistModal({ onClose }: WishlistModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ["/api/wishlist", user?.id],
    queryFn: () => user ? wishlistApi.getWishlist(user.id) : [],
    enabled: !!user,
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!user) throw new Error("User not authenticated");
      return await wishlistApi.removeFromWishlist(user.id, cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from Wishlist",
        description: "Card has been removed from your wishlist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove card from wishlist.",
        variant: "destructive",
      });
    },
  });

  // Filter wishlist based on search
  const wishlistArray = Array.isArray(wishlist) ? wishlist : [];
  const filteredWishlist = searchQuery.length > 0 
    ? wishlistArray.filter((item: any) => 
        item.cardData?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cardData?.type_line?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : wishlistArray;

  // Calculate wishlist stats
  const totalCards = filteredWishlist.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const uniqueCards = filteredWishlist.length;
  const totalValue = filteredWishlist.reduce((sum: number, item: any) => {
    const price = item.cardData?.prices?.usd ? parseFloat(item.cardData.prices.usd) : 0;
    return sum + (price * item.quantity);
  }, 0);

  const handleRemoveFromWishlist = (cardId: string) => {
    removeFromWishlistMutation.mutate(cardId);
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400" data-testid="text-loading-wishlist">Loading wishlist...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-3xl font-bold text-white" data-testid="text-wishlist-title">
                My Wishlist
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
                data-testid="button-close-wishlist"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Wishlist Search */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="Search your wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-glass border-glass text-white placeholder-slate-400 pr-10"
              data-testid="input-wishlist-search"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Wishlist Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Total Cards</h3>
                <p className="text-2xl font-bold text-pink-400" data-testid="text-wishlist-total-cards">
                  {totalCards}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Unique Cards</h3>
                <p className="text-2xl font-bold text-purple-400" data-testid="text-wishlist-unique-cards">
                  {uniqueCards}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Total Value</h3>
                <p className="text-2xl font-bold text-green-400" data-testid="text-wishlist-total-value">
                  ${totalValue.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Average Value</h3>
                <p className="text-2xl font-bold text-yellow-400" data-testid="text-wishlist-average-value">
                  ${uniqueCards > 0 ? (totalValue / uniqueCards).toFixed(2) : "0.00"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wishlist Grid */}
          {filteredWishlist.length === 0 && searchQuery.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">💝</div>
                <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-empty-wishlist">
                  Your wishlist is empty
                </h3>
                <p className="text-slate-400" data-testid="text-empty-wishlist-hint">
                  Add cards you want to your wishlist!
                </p>
              </div>
            </div>
          ) : searchQuery.length > 0 && filteredWishlist.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No cards found
                </h3>
                <p className="text-slate-400">
                  Try adjusting your search terms
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredWishlist.map((item: any) => (
                <Card
                  key={item.id}
                  className="bg-mtg-gray border-slate-600 hover:bg-slate-600 transition-colors group"
                  data-testid={`wishlist-item-${item.cardId}`}
                >
                  <CardContent className="p-3 relative">
                    <img
                      src={getCardImageUrl(item.cardData, "small")}
                      alt={item.cardData.name}
                      className="w-full h-32 object-cover rounded mb-2"
                      loading="lazy"
                    />
                    <h4 className="font-semibold text-white text-sm mb-1 truncate" data-testid={`text-wishlist-card-name-${item.cardId}`}>
                      {item.cardData.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-1" data-testid={`text-wishlist-quantity-${item.cardId}`}>
                      Qty: {item.quantity}
                    </p>
                    <p className="text-xs text-green-400 mb-2" data-testid={`text-wishlist-value-${item.cardId}`}>
                      ${item.cardData.prices?.usd ? (parseFloat(item.cardData.prices.usd) * item.quantity).toFixed(2) : "0.00"}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => handleRemoveFromWishlist(item.cardId)}
                        disabled={removeFromWishlistMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
                        data-testid={`button-remove-wishlist-${item.cardId}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Wishlist Actions */}
          <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-600">
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              data-testid="button-export-wishlist"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Export Wishlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
