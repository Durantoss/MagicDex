import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp, Users, Heart, Star, Plus, Minus, Search, MessageSquare, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Trading() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [wishlistQuantity, setWishlistQuantity] = useState(1);
  const [wishlistPriority, setWishlistPriority] = useState("medium");
  const [tradingMessage, setTradingMessage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ["/api/wishlist"],
  }) as { data: any[], isLoading: boolean };

  const { data: tradingProfile = {} } = useQuery({
    queryKey: ["/api/trading/profile"],
  }) as { data: any };

  const { data: tradeMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/trading/matches"],
  }) as { data: any[], isLoading: boolean };

  const { data: tradeInterests = [] } = useQuery({
    queryKey: ["/api/trading/interests"],
  }) as { data: any[] };

  const { data: collection = [] } = useQuery({
    queryKey: ["/api/collection"],
  }) as { data: any[] };

  // Search for cards to add to wishlist
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/cards/search", searchQuery],
    enabled: searchQuery.length > 2,
  }) as { data: any, isLoading: boolean };

  // Mutations
  const addToWishlistMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return apiRequest("POST", "/api/wishlist", {
        cardId: cardData.id,
        quantity: wishlistQuantity,
        priority: wishlistPriority,
        cardData: cardData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/matches"] });
      toast({
        title: "Added to Wishlist!",
        description: "Card added to your trading wishlist successfully.",
      });
      setSelectedCard(null);
      setSearchQuery("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add card to wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return apiRequest("DELETE", `/api/wishlist/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/matches"] });
      toast({
        title: "Removed from Wishlist",
        description: "Card removed from your wishlist.",
      });
    },
  });

  const createTradeInterestMutation = useMutation({
    mutationFn: async (data: { toUserId: string; message: string }) => {
      return apiRequest("POST", "/api/trading/interests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/interests"] });
      toast({
        title: "Trade Interest Sent!",
        description: "Your trade interest has been sent successfully.",
      });
      setTradingMessage("");
    },
  });

  const createTradingProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/trading/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/profile"] });
      toast({
        title: "Profile Updated!",
        description: "Your trading profile has been updated.",
      });
    },
  });

  const handleCardSelect = (card: any) => {
    setSelectedCard(card);
  };

  const handleAddToWishlist = () => {
    if (!selectedCard) return;
    addToWishlistMutation.mutate(selectedCard);
  };

  const handleSendTradeInterest = (toUserId: string) => {
    if (!tradingMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please add a message with your trade interest.",
        variant: "destructive",
      });
      return;
    }
    createTradeInterestMutation.mutate({
      toUserId,
      message: tradingMessage,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" data-testid="link-home">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
            <div className="h-8 w-px bg-white/20" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trading Center
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="wishlist" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-sm border border-white/10">
            <TabsTrigger value="wishlist" className="data-[state=active]:bg-blue-500/20" data-testid="tab-wishlist">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-purple-500/20" data-testid="tab-matches">
              <Users className="w-4 h-4 mr-2" />
              Trade Matches
            </TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-green-500/20" data-testid="tab-interests">
              <MessageSquare className="w-4 h-4 mr-2" />
              Trade Interests
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-orange-500/20" data-testid="tab-profile">
              <Star className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Add Cards to Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Search for cards to add to wishlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 text-white"
                    data-testid="input-wishlist-search"
                  />
                  <Button disabled={searchLoading} data-testid="button-search-wishlist">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchLoading && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Searching cards...</p>
                  </div>
                )}

                {searchResults && searchResults.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {searchResults.data.slice(0, 12).map((card: any) => (
                      <div
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                          selectedCard?.id === card.id
                            ? 'bg-blue-500/20 border-blue-400'
                            : 'bg-white/5 border-white/10 hover:border-blue-400/50'
                        }`}
                        data-testid={`card-search-result-${card.id}`}
                      >
                        <div className="flex gap-3">
                          {card.image_uris?.small && (
                            <img src={card.image_uris.small} alt={card.name} className="w-16 h-22 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{card.name}</h3>
                            <p className="text-sm text-gray-400 truncate">{card.type_line}</p>
                            <p className="text-sm text-gray-400">CMC: {card.cmc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCard && (
                  <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <h4 className="font-semibold text-white mb-3">Add "{selectedCard.name}" to Wishlist</h4>
                    <div className="flex gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={wishlistQuantity}
                          onChange={(e) => setWishlistQuantity(parseInt(e.target.value) || 1)}
                          className="w-20 bg-white/5 border-white/10 text-white"
                          data-testid="input-wishlist-quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">Priority</Label>
                        <Select value={wishlistPriority} onValueChange={setWishlistPriority}>
                          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white" data-testid="select-wishlist-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddToWishlist}
                        disabled={addToWishlistMutation.isPending}
                        data-testid="button-add-to-wishlist"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Wishlist
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Wishlist */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Your Wishlist ({wishlist.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading wishlist...</p>
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Your wishlist is empty. Search for cards to add above!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item: any) => {
                      const card = item.cardData;
                      return (
                        <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex gap-3">
                            {card.image_uris?.small && (
                              <img src={card.image_uris.small} alt={card.name} className="w-16 h-22 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{card.name}</h3>
                              <p className="text-sm text-gray-400 truncate">{card.type_line}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  Qty: {item.quantity}
                                </Badge>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromWishlistMutation.mutate(item.cardId)}
                            disabled={removeFromWishlistMutation.isPending}
                            className="w-full mt-3"
                            data-testid={`button-remove-wishlist-${item.id}`}
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Potential Trading Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Finding trade matches...</p>
                  </div>
                ) : tradeMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No trade matches found.</p>
                    <p className="text-sm text-gray-500 mt-2">Add cards to your wishlist and collection to find trading partners!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {tradeMatches.map((match: any, index: number) => (
                      <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-white">User: {match.user.username}</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-green-400 border-green-400/30">
                              {match.matches.have.length} cards you want
                            </Badge>
                            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                              {match.matches.want.length} cards they want
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {match.matches.have.length > 0 && (
                            <div>
                              <h4 className="font-medium text-green-400 mb-2">They Have (You Want):</h4>
                              <div className="space-y-2">
                                {match.matches.have.slice(0, 3).map((card: any) => {
                                  const cardData = card.cardData;
                                  return (
                                    <div key={card.id} className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                                      <span className="text-white">{cardData.name}</span>
                                      <span className="text-gray-400">(Qty: {card.quantity})</span>
                                    </div>
                                  );
                                })}
                                {match.matches.have.length > 3 && (
                                  <p className="text-xs text-gray-400">...and {match.matches.have.length - 3} more</p>
                                )}
                              </div>
                            </div>
                          )}

                          {match.matches.want.length > 0 && (
                            <div>
                              <h4 className="font-medium text-blue-400 mb-2">They Want (You Have):</h4>
                              <div className="space-y-2">
                                {match.matches.want.slice(0, 3).map((wish: any) => {
                                  const cardData = wish.cardData;
                                  return (
                                    <div key={wish.id} className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                      <span className="text-white">{cardData.name}</span>
                                      <span className="text-gray-400">(Qty: {wish.quantity})</span>
                                    </div>
                                  );
                                })}
                                {match.matches.want.length > 3 && (
                                  <p className="text-xs text-gray-400">...and {match.matches.want.length - 3} more</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator className="my-4 bg-white/10" />

                        <div className="space-y-3">
                          <Textarea
                            placeholder="Send a message with your trade proposal..."
                            value={tradingMessage}
                            onChange={(e) => setTradingMessage(e.target.value)}
                            className="bg-white/5 border-white/10 text-white resize-none"
                            rows={3}
                            data-testid={`textarea-trade-message-${index}`}
                          />
                          <Button
                            onClick={() => handleSendTradeInterest(match.user.id)}
                            disabled={createTradeInterestMutation.isPending}
                            className="w-full"
                            data-testid={`button-send-trade-interest-${index}`}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Trade Interest
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Interests Tab */}
          <TabsContent value="interests" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Trade Interests ({tradeInterests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tradeInterests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No trade interests yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Send trade interests from the Trade Matches tab!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tradeInterests.map((interest: any) => (
                      <div key={interest.id} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            Trade with User ID: {interest.toUserId}
                          </h4>
                          <Badge 
                            className={
                              interest.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              interest.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              interest.status === 'declined' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }
                          >
                            {interest.status}
                          </Badge>
                        </div>
                        {interest.message && (
                          <p className="text-gray-300 text-sm">{interest.message}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(interest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-400" />
                  Trading Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Available for Trading</Label>
                      <Switch
                        checked={tradingProfile?.isTrading || false}
                        onCheckedChange={(checked) =>
                          createTradingProfileMutation.mutate({ isTrading: checked })
                        }
                        data-testid="switch-trading-available"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Location</Label>
                      <Input
                        placeholder="e.g., New York, NY"
                        defaultValue={tradingProfile?.location || ""}
                        onBlur={(e) =>
                          createTradingProfileMutation.mutate({ location: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-trading-location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Bio</Label>
                      <Textarea
                        placeholder="Tell other traders about yourself..."
                        defaultValue={tradingProfile?.bio || ""}
                        onBlur={(e) =>
                          createTradingProfileMutation.mutate({ bio: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white resize-none"
                        rows={4}
                        data-testid="textarea-trading-bio"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="font-semibold text-white mb-3">Trading Stats</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Reputation:</span>
                          <span className="text-white font-medium">
                            {tradingProfile?.reputation || 0} ⭐
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Completed Trades:</span>
                          <span className="text-white font-medium">
                            {tradingProfile?.completedTrades || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Collection Size:</span>
                          <span className="text-white font-medium">
                            {collection.reduce((sum: number, item: any) => sum + item.quantity, 0)} cards
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Wishlist Size:</span>
                          <span className="text-white font-medium">
                            {wishlist.reduce((sum: number, item: any) => sum + item.quantity, 0)} cards
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Quick Stats
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <span className="text-green-400 font-medium">{tradeMatches.length}</span> potential trading partners
                        </p>
                        <p className="text-gray-300">
                          <span className="text-blue-400 font-medium">{tradeInterests.length}</span> active trade interests
                        </p>
                        <p className="text-gray-300">
                          <span className="text-purple-400 font-medium">
                            {wishlist.filter((w: any) => w.priority === 'high').length}
                          </span> high-priority wants
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}