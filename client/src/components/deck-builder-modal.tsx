import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wand2, X, Copy, Download, Lightbulb, Target, BarChart3 } from "lucide-react";

interface DeckBuilderModalProps {
  onClose: () => void;
}

interface DeckSuggestion {
  deckName: string;
  strategy: string;
  mainDeck: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
  manaBase?: string;
  synergies?: string[];
  gameplayTips?: string[];
  totalCards: number;
  rawResponse?: string;
  error?: string;
}

export default function DeckBuilderModal({ onClose }: DeckBuilderModalProps) {
  const { toast } = useToast();
  const [deckType, setDeckType] = useState("Standard");
  const [strategy, setStrategy] = useState("");
  const [deckSuggestion, setDeckSuggestion] = useState<DeckSuggestion | null>(null);

  // Get user collection
  const { data: collection = [], isLoading: collectionLoading } = useQuery({
    queryKey: ["/api/collection"],
  });

  // AI deck builder mutation
  const buildDeckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/deck-builder", {
        deckType,
        strategy,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setDeckSuggestion(data);
      toast({
        title: "Deck Built Successfully!",
        description: "AI has analyzed your collection and created a deck suggestion.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deck Building Failed",
        description: error.message || "Failed to generate deck suggestions.",
        variant: "destructive",
      });
    },
  });

  const handleBuildDeck = () => {
    if (Array.isArray(collection) && collection.length === 0) {
      toast({
        title: "Empty Collection",
        description: "Add some cards to your collection first!",
        variant: "destructive",
      });
      return;
    }
    buildDeckMutation.mutate();
  };

  const copyDeckList = () => {
    if (!deckSuggestion) return;
    
    let deckText = `${deckSuggestion.deckName}\n\n`;
    
    if (deckSuggestion.mainDeck) {
      deckText += "Main Deck:\n";
      deckSuggestion.mainDeck.forEach(card => {
        deckText += `${card.quantity}x ${card.name}\n`;
      });
    } else if (deckSuggestion.rawResponse) {
      deckText += deckSuggestion.rawResponse;
    }
    
    navigator.clipboard.writeText(deckText);
    toast({
      title: "Copied!",
      description: "Deck list copied to clipboard.",
    });
  };

  const collectionArray = Array.isArray(collection) ? collection : [];
  const totalCards = collectionArray.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const uniqueCards = collectionArray.length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-3xl font-bold text-white flex items-center">
                <Wand2 className="mr-3 h-8 w-8 text-mtg-primary" />
                AI Deck Builder
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
                data-testid="button-close-deck-builder"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {!deckSuggestion ? (
            // Deck Building Form
            <div className="space-y-6">
              {/* Collection Summary */}
              <Card className="bg-mtg-gray border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">Your Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  {collectionLoading ? (
                    <p className="text-slate-400">Loading collection...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-mtg-accent" data-testid="text-total-cards-builder">
                          {totalCards}
                        </p>
                        <p className="text-slate-300">Total Cards</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-400" data-testid="text-unique-cards-builder">
                          {uniqueCards}
                        </p>
                        <p className="text-slate-300">Unique Cards</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deck Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                      Deck Format
                    </Label>
                    <Select value={deckType} onValueChange={setDeckType}>
                      <SelectTrigger 
                        className="w-full bg-mtg-gray border border-slate-600 text-white"
                        data-testid="select-deck-type"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard (60 cards)</SelectItem>
                        <SelectItem value="Commander">Commander (100 cards)</SelectItem>
                        <SelectItem value="Modern">Modern (60 cards)</SelectItem>
                        <SelectItem value="Pioneer">Pioneer (60 cards)</SelectItem>
                        <SelectItem value="Legacy">Legacy (60 cards)</SelectItem>
                        <SelectItem value="Pauper">Pauper (60 cards)</SelectItem>
                        <SelectItem value="Casual">Casual (Any size)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                      Preferred Strategy (Optional)
                    </Label>
                    <Textarea
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                      placeholder="e.g., Aggressive creatures, Control, Combo, Midrange..."
                      className="bg-mtg-gray border border-slate-600 text-white placeholder-slate-400 min-h-20"
                      data-testid="textarea-strategy"
                    />
                  </div>
                </div>

                <Card className="bg-mtg-gray border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-300">
                    <p>• AI analyzes your entire collection</p>
                    <p>• Identifies card synergies and themes</p>
                    <p>• Creates balanced mana curves</p>
                    <p>• Suggests optimal deck ratios</p>
                    <p>• Provides gameplay strategies</p>
                  </CardContent>
                </Card>
              </div>

              {/* Build Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleBuildDeck}
                  disabled={buildDeckMutation.isPending || collectionArray.length === 0}
                  className="bg-mtg-primary hover:bg-mtg-primary/90 text-white px-8 py-3 text-lg"
                  data-testid="button-build-deck"
                >
                  {buildDeckMutation.isPending ? (
                    <>
                      <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                      Building Deck...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Build My Deck
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Deck Suggestion Results
            <div className="space-y-6">
              {/* Deck Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white" data-testid="text-deck-name">
                    {deckSuggestion.deckName}
                  </h2>
                  {deckSuggestion.totalCards && (
                    <p className="text-slate-400">
                      {deckSuggestion.totalCards} cards total
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={copyDeckList}
                    variant="outline"
                    className="bg-mtg-gray hover:bg-slate-600 text-white"
                    data-testid="button-copy-deck"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy List
                  </Button>
                  <Button
                    onClick={() => setDeckSuggestion(null)}
                    className="bg-mtg-primary hover:bg-mtg-primary/90 text-white"
                    data-testid="button-build-another"
                  >
                    Build Another
                  </Button>
                </div>
              </div>

              {deckSuggestion.error && (
                <Card className="bg-yellow-900/20 border-yellow-600">
                  <CardContent className="p-4">
                    <p className="text-yellow-200">
                      {deckSuggestion.rawResponse}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!deckSuggestion.error && (
                <>
                  {/* Strategy */}
                  {deckSuggestion.strategy && (
                    <Card className="bg-mtg-gray border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Target className="mr-2 h-5 w-5 text-mtg-accent" />
                          Deck Strategy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white" data-testid="text-deck-strategy">
                          {deckSuggestion.strategy}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Main Deck */}
                  {deckSuggestion.mainDeck && (
                    <Card className="bg-mtg-gray border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5 text-blue-400" />
                          Main Deck ({deckSuggestion.mainDeck.reduce((sum, card) => sum + card.quantity, 0)} cards)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(
                            deckSuggestion.mainDeck.reduce((acc, card) => {
                              if (!acc[card.category]) acc[card.category] = [];
                              acc[card.category].push(card);
                              return acc;
                            }, {} as Record<string, typeof deckSuggestion.mainDeck>)
                          ).map(([category, cards]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="font-semibold text-mtg-accent">
                                {category} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
                              </h4>
                              <div className="space-y-1">
                                {cards.map((card, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-white" data-testid={`deck-card-${card.name.replace(/\s+/g, '-').toLowerCase()}`}>
                                      {card.name}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {card.quantity}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Synergies */}
                    {deckSuggestion.synergies && deckSuggestion.synergies.length > 0 && (
                      <Card className="bg-mtg-gray border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white">Key Synergies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {deckSuggestion.synergies.map((synergy, index) => (
                              <li key={index} className="text-white text-sm flex items-start">
                                <span className="text-mtg-accent mr-2">•</span>
                                {synergy}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Gameplay Tips */}
                    {deckSuggestion.gameplayTips && deckSuggestion.gameplayTips.length > 0 && (
                      <Card className="bg-mtg-gray border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white">Gameplay Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {deckSuggestion.gameplayTips.map((tip, index) => (
                              <li key={index} className="text-white text-sm flex items-start">
                                <span className="text-yellow-400 mr-2">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Mana Base */}
                  {deckSuggestion.manaBase && (
                    <Card className="bg-mtg-gray border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white">Mana Base Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white">{deckSuggestion.manaBase}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}