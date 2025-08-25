import { ScryfallCard } from "@/types/scryfall";
import { getCardImageUrl, formatManaCost, getRarityColor, getManaTypeColors, getColorSymbols, getPriceRange, getCardVariations, groupVariationsBySet } from "@/lib/scryfall-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, X, Loader2, Package, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistApi } from "@/lib/api";
import { useState } from "react";

interface CardDetailModalProps {
  card: ScryfallCard;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVariation, setSelectedVariation] = useState<any>(card);
  const [selectedFinish, setSelectedFinish] = useState<'normal' | 'foil'>('normal');
  const [quantity, setQuantity] = useState(1);

  // Get user collection
  const { data: collection = [] } = useQuery({
    queryKey: ["/api/collection"],
  });

  // Get user wishlist
  const { data: wishlist = [] } = useQuery({
    queryKey: ["/api/wishlist", user?.id],
    queryFn: () => user ? wishlistApi.getWishlist(user.id) : [],
    enabled: !!user,
  });

  // Get card variations
  const { data: variations = [], isLoading: variationsLoading } = useQuery({
    queryKey: ["card-variations", card.name],
    queryFn: () => getCardVariations(card.name),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const groupedVariations = groupVariationsBySet(variations);

  // Add to collection mutation
  const addToCollectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/collection", {
        cardId: selectedVariation.id,
        quantity: quantity,
        finish: selectedFinish,
        cardData: {
          ...selectedVariation,
          finish: selectedFinish,
          quantity: quantity
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({
        title: "Added to Collection",
        description: `Added ${quantity}x ${selectedVariation.name} (${selectedFinish}) to your collection.`,
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

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return await wishlistApi.addToWishlist({
        userId: user.id,
        cardId: selectedVariation.id,
        quantity: quantity,
        cardData: {
          ...selectedVariation,
          finish: selectedFinish,
          quantity: quantity
        } as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: `Added ${quantity}x ${selectedVariation.name} (${selectedFinish}) to your wishlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add card to wishlist.",
        variant: "destructive",
      });
    },
  });

  const isInCollection = Array.isArray(collection) && collection.some((item: any) => item.cardId === selectedVariation.id);
  const isInWishlist = Array.isArray(wishlist) && wishlist.some((item: any) => item.cardId === selectedVariation.id);

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

            <div className="space-y-6">
              {/* Core Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mana Cost */}
                <div className="bg-mtg-gray p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mana Cost</label>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-lg px-3 py-1 ${getRarityColor(card.rarity)}`} data-testid="text-mana-cost">
                      {formatManaCost(card.mana_cost) || card.cmc}
                    </Badge>
                    <span className="text-slate-400 text-sm">CMC: {card.cmc}</span>
                  </div>
                </div>

                {/* Mana Type/Colors */}
                <div className="bg-mtg-gray p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mana Type</label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-1">
                      {getColorSymbols(card.colors).map((colorInfo, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded text-xs font-bold border ${colorInfo.color}`}
                          data-testid={`color-symbol-${colorInfo.symbol.toLowerCase()}`}
                        >
                          {colorInfo.symbol}
                        </span>
                      ))}
                    </div>
                    <span className="text-white text-sm" data-testid="text-mana-type">
                      {getManaTypeColors(card.colors)}
                    </span>
                  </div>
                </div>

                {/* Card Type */}
                <div className="bg-mtg-gray p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Card Type</label>
                  <p className="text-white font-medium" data-testid="text-type-line">{card.type_line}</p>
                </div>

                {/* Rarity */}
                <div className="bg-mtg-gray p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                  <Badge className={`capitalize text-sm px-3 py-1 ${getRarityColor(card.rarity)}`} data-testid="text-rarity">
                    {card.rarity}
                  </Badge>
                </div>
              </div>

              {/* Market Value Section */}
              {(() => {
                const priceRange = getPriceRange(card.prices);
                return priceRange && (
                  <div className="bg-mtg-gray p-4 rounded-lg">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Market Value Estimates</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {priceRange.hasRange ? (
                        <>
                          <div className="text-center">
                            <p className="text-sm text-slate-400">Low</p>
                            <p className="text-green-300 text-lg font-semibold" data-testid="text-price-low">
                              ${priceRange.min.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-slate-400">Average</p>
                            <p className="text-green-400 text-xl font-bold" data-testid="text-price-avg">
                              ${priceRange.avg.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-slate-400">High</p>
                            <p className="text-green-300 text-lg font-semibold" data-testid="text-price-high">
                              ${priceRange.max.toFixed(2)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-3 text-center">
                          <p className="text-sm text-slate-400">Current Price</p>
                          <p className="text-green-400 text-2xl font-bold" data-testid="text-price">
                            ${priceRange.avg.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    {card.prices?.usd && card.prices?.usd_foil && (
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-600">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Normal</p>
                          <p className="text-white font-medium">${card.prices.usd}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Foil</p>
                          <p className="text-white font-medium">${card.prices.usd_foil}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Oracle Text */}
              {card.oracle_text && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Oracle Text</label>
                  <div className="bg-mtg-gray p-4 rounded-lg">
                    <p className="text-white whitespace-pre-wrap leading-relaxed" data-testid="text-oracle-text">
                      {card.oracle_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Card Faces for Double-Faced Cards */}
              {card.card_faces && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Card Faces</label>
                  <div className="space-y-3">
                    {card.card_faces.map((face, index) => (
                      <div key={index} className="bg-mtg-gray p-4 rounded-lg border border-slate-600">
                        <h4 className="font-semibold text-white text-lg mb-2">{face.name}</h4>
                        <p className="text-sm text-slate-300 mb-2">{face.type_line}</p>
                        {face.oracle_text && (
                          <p className="text-sm text-white whitespace-pre-wrap">{face.oracle_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Variations Section */}
              {variations.length > 1 && (
                <div className="bg-mtg-gray p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-mtg-accent" />
                    <label className="text-sm font-medium text-slate-300">
                      Available Variations ({variations.length} printings)
                    </label>
                    {variationsLoading && <Loader2 className="h-4 w-4 animate-spin text-mtg-accent" />}
                  </div>

                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                      <TabsTrigger value="details" className="text-slate-300 data-[state=active]:text-white">
                        Collection Options
                      </TabsTrigger>
                      <TabsTrigger value="variations" className="text-slate-300 data-[state=active]:text-white">
                        All Printings
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      {/* Finish Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Finish</label>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedFinish === 'normal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedFinish('normal')}
                            className={`flex-1 ${selectedFinish === 'normal' ? 'bg-mtg-accent' : 'border-slate-600'}`}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Normal
                            {selectedVariation.prices?.usd && (
                              <span className="ml-2 text-green-400">${selectedVariation.prices.usd}</span>
                            )}
                          </Button>
                          {selectedVariation.prices?.usd_foil && (
                            <Button
                              variant={selectedFinish === 'foil' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedFinish('foil')}
                              className={`flex-1 ${selectedFinish === 'foil' ? 'bg-mtg-accent' : 'border-slate-600'}`}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Foil
                              <span className="ml-2 text-green-400">${selectedVariation.prices.usd_foil}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Quantity Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Quantity</label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="border-slate-600 text-slate-300"
                          >
                            -
                          </Button>
                          <span className="px-4 py-2 bg-slate-800 rounded text-white min-w-[3rem] text-center">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                            className="border-slate-600 text-slate-300"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Set Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Set</label>
                        <Select
                          value={selectedVariation.id}
                          onValueChange={(value) => {
                            const variation = variations.find(v => v.id === value);
                            if (variation) setSelectedVariation(variation);
                          }}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {Object.entries(groupedVariations).map(([setName, setCards]) => (
                              setCards.map((variation: any) => (
                                <SelectItem
                                  key={variation.id}
                                  value={variation.id}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{setName} ({variation.set.toUpperCase()})</span>
                                    {variation.prices?.usd && (
                                      <span className="text-green-400 ml-2">${variation.prices.usd}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="variations" className="mt-4">
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Object.entries(groupedVariations).map(([setName, setCards]) => (
                          <div key={setName} className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-600 pb-1">
                              {setName}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {(setCards as any[]).map((variation) => (
                                <div
                                  key={variation.id}
                                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                    selectedVariation.id === variation.id
                                      ? 'bg-mtg-accent/20 border border-mtg-accent'
                                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                                  }`}
                                  onClick={() => setSelectedVariation(variation)}
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={getCardImageUrl(variation, "small")}
                                      alt={variation.name}
                                      className="w-8 h-11 rounded object-cover"
                                    />
                                    <div>
                                      <p className="text-sm text-white">{variation.set.toUpperCase()}</p>
                                      <p className="text-xs text-slate-400">#{variation.collector_number}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {variation.prices?.usd && (
                                      <p className="text-sm text-green-400">${variation.prices.usd}</p>
                                    )}
                                    {variation.prices?.usd_foil && (
                                      <p className="text-xs text-green-300">Foil: ${variation.prices.usd_foil}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Set</label>
                  <p className="text-white" data-testid="text-set-name">{selectedVariation.set_name}</p>
                  <p className="text-slate-400 text-sm" data-testid="text-set-code">({selectedVariation.set.toUpperCase()})</p>
                </div>
                {selectedVariation.artist && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Artist</label>
                    <p className="text-white" data-testid="text-artist">{selectedVariation.artist}</p>
                  </div>
                )}
              </div>
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
                onClick={() => addToWishlistMutation.mutate()}
                disabled={addToWishlistMutation.isPending || isInWishlist || !user}
                variant="outline"
                className="flex-1 bg-mtg-primary hover:bg-mtg-primary/90 text-white py-3 px-4 rounded-lg transition-colors duration-200"
                data-testid="button-add-to-wishlist"
              >
                <Heart className="mr-2 h-4 w-4" />
                {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
