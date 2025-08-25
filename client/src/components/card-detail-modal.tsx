import { ScryfallCard } from "@/types/scryfall";
import { getCardImageUrl, formatManaCost, getRarityColor, getManaTypeColors, getColorSymbols, getPriceRange, getCardVariations, groupVariationsBySet } from "@/lib/scryfall-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, X, Loader2, Package, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistApi, collectionApi } from "@/lib/api";
import { useState } from "react";
import { QuantityTracker } from "./quantity-tracker";
import { FoilBadge, FoilAvailabilityIndicator, PriceComparison } from "./foil-badge";
import { checkFoilAvailability, shouldShowFoilOptions, CardQuantities } from "@/lib/foil-utils";
import { supabase } from "@/lib/supabase";

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
  const [quantities, setQuantities] = useState<CardQuantities>({ normal: 1, foil: 0 });

  // Get user collection
  const { data: collection = [] } = useQuery({
    queryKey: ["collection", user?.id],
    queryFn: () => user ? collectionApi.getCollection(user.id) : [],
    enabled: !!user,
  });

  // Get user wishlist
  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist", user?.id],
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

  // Add to collection mutation with foil support
  const addToCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.rpc('upsert_collection_entry', {
        p_user_id: user.id,
        p_card_id: selectedVariation.id,
        p_normal_quantity: quantities.normal,
        p_foil_quantity: quantities.foil,
        p_card_data: {
          ...selectedVariation,
          image_url: selectedVariation.image_uris?.normal || selectedVariation.image_uris?.large,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", user?.id] });
      const totalQuantity = quantities.normal + quantities.foil;
      const description = quantities.normal > 0 && quantities.foil > 0 
        ? `Added ${quantities.normal} normal + ${quantities.foil} foil copies of ${selectedVariation.name} to your collection.`
        : quantities.foil > 0
        ? `Added ${quantities.foil} foil copies of ${selectedVariation.name} to your collection.`
        : `Added ${quantities.normal} copies of ${selectedVariation.name} to your collection.`;
      
      toast({
        title: "Added to Collection",
        description,
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

  // Add to wishlist mutation with foil support
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.rpc('upsert_wishlist_entry', {
        p_user_id: user.id,
        p_card_id: selectedVariation.id,
        p_normal_quantity: quantities.normal,
        p_foil_quantity: quantities.foil,
        p_priority: 'medium',
        p_card_data: {
          ...selectedVariation,
          image_url: selectedVariation.image_uris?.normal || selectedVariation.image_uris?.large,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      const totalQuantity = quantities.normal + quantities.foil;
      const description = quantities.normal > 0 && quantities.foil > 0 
        ? `Added ${quantities.normal} normal + ${quantities.foil} foil copies of ${selectedVariation.name} to your wishlist.`
        : quantities.foil > 0
        ? `Added ${quantities.foil} foil copies of ${selectedVariation.name} to your wishlist.`
        : `Added ${quantities.normal} copies of ${selectedVariation.name} to your wishlist.`;
      
      toast({
        title: "Added to Wishlist",
        description,
      });
    },
    onError: (error) => {
      console.error("Wishlist add error:", error);
      toast({
        title: "Error",
        description: "Failed to add card to wishlist.",
        variant: "destructive",
      });
    },
  });

  const isInCollection = Array.isArray(collection) && collection.some((item: any) => item.card_id === selectedVariation.id);
  const isInWishlist = Array.isArray(wishlist) && wishlist.some((item: any) => item.card_id === selectedVariation.id);

  const handleQuantityChange = (finish: 'normal' | 'foil', change: number) => {
    setQuantities(prev => ({
      ...prev,
      [finish]: Math.max(0, prev[finish] + change)
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto modal-responsive">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
          {/* Card Image */}
          <div className="lg:w-1/2 p-3 sm:p-6 relative">
            <img
              src={getCardImageUrl(selectedVariation, "large")}
              alt={selectedVariation.name}
              className="w-full max-w-sm mx-auto lg:max-w-none rounded-lg shadow-lg"
              data-testid="img-card-detail"
            />
            {/* Foil badge if card has foil availability */}
            <FoilBadge card={selectedVariation} size="lg" className="absolute top-5 sm:top-8 right-5 sm:right-8" />
          </div>

          {/* Card Details */}
          <div className="lg:w-1/2 p-3 sm:p-6 space-y-4 sm:space-y-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight" data-testid="text-card-name">
                  {card.name}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white flex-shrink-0 touch-manipulation"
                  data-testid="button-close-modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                Detailed information for {card.name} including stats, pricing, and collection options
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Core Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Mana Cost */}
                <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Mana Cost</label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <Badge className={`text-sm sm:text-lg px-2 sm:px-3 py-1 ${getRarityColor(card.rarity)}`} data-testid="text-mana-cost">
                      {formatManaCost(card.mana_cost) || card.cmc}
                    </Badge>
                    <span className="text-slate-400 text-xs sm:text-sm">CMC: {card.cmc}</span>
                  </div>
                </div>

                {/* Mana Type/Colors */}
                <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Mana Type</label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center flex-wrap gap-1">
                      {getColorSymbols(card.colors).map((colorInfo, index) => (
                        <span 
                          key={index} 
                          className={`px-1.5 sm:px-2 py-1 rounded text-xs font-bold border ${colorInfo.color}`}
                          data-testid={`color-symbol-${colorInfo.symbol.toLowerCase()}`}
                        >
                          {colorInfo.symbol}
                        </span>
                      ))}
                    </div>
                    <span className="text-white text-xs sm:text-sm" data-testid="text-mana-type">
                      {getManaTypeColors(card.colors)}
                    </span>
                  </div>
                </div>

                {/* Card Type */}
                <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Card Type</label>
                  <p className="text-white font-medium text-sm sm:text-base" data-testid="text-type-line">{card.type_line}</p>
                </div>

                {/* Rarity */}
                <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Rarity</label>
                  <Badge className={`capitalize text-xs sm:text-sm px-2 sm:px-3 py-1 ${getRarityColor(card.rarity)}`} data-testid="text-rarity">
                    {card.rarity}
                  </Badge>
                </div>
              </div>

              {/* Enhanced Market Value Section with Foil Comparison */}
              <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-3">Market Value</label>
                <PriceComparison card={selectedVariation} showDifference={true} />
                
                {/* Foil availability indicator */}
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <FoilAvailabilityIndicator card={selectedVariation} showPrice={true} size="md" />
                </div>
              </div>

              {/* Oracle Text */}
              {card.oracle_text && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Oracle Text</label>
                  <div className="bg-mtg-gray p-3 sm:p-4 rounded-lg">
                    <p className="text-white whitespace-pre-wrap leading-relaxed text-sm sm:text-base" data-testid="text-oracle-text">
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
                      {/* Enhanced Quantity Tracker */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Add to Collection</label>
                        <QuantityTracker
                          card={selectedVariation}
                          quantities={quantities}
                          onQuantityChange={handleQuantityChange}
                          showPrices={true}
                        />
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-slate-600">
              <Button
                onClick={() => addToCollectionMutation.mutate()}
                disabled={addToCollectionMutation.isPending || isInCollection || (quantities.normal === 0 && quantities.foil === 0)}
                className="flex-1 bg-mtg-accent hover:bg-mtg-accent/90 text-white py-3 px-4 rounded-lg transition-colors duration-200 touch-manipulation btn-touch"
                data-testid="button-add-to-collection"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">{isInCollection ? "Update Collection" : "Add to Collection"}</span>
              </Button>
              <Button
                onClick={() => addToWishlistMutation.mutate()}
                disabled={addToWishlistMutation.isPending || isInWishlist || !user || (quantities.normal === 0 && quantities.foil === 0)}
                variant="outline"
                className="flex-1 bg-mtg-primary hover:bg-mtg-primary/90 text-white py-3 px-4 rounded-lg transition-colors duration-200 touch-manipulation btn-touch"
                data-testid="button-add-to-wishlist"
              >
                <Heart className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">{isInWishlist ? "Update Wishlist" : "Add to Wishlist"}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
