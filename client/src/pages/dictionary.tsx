import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Sparkles, Zap, MessageCircle, Send } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// MTG Dictionary data with 4th grade reading level definitions
const mtgTerms = [
  // Basic Game Terms
  {
    term: "Artifact",
    definition: "A magic item that stays on the battlefield and helps you during the game. Like a sword or a treasure chest.",
    category: "Card Types"
  },
  {
    term: "Creature", 
    definition: "A monster, animal, or person that can fight for you. Creatures can attack your opponent and block their creatures.",
    category: "Card Types"
  },
  {
    term: "Spell",
    definition: "Magic that happens right away when you play it. After the magic happens, the spell goes away.",
    category: "Card Types"
  },
  {
    term: "Enchantment",
    definition: "Magic that stays on the battlefield and changes how the game works. Like a rule that keeps helping you.",
    category: "Card Types"
  },
  {
    term: "Planeswalker",
    definition: "A powerful wizard friend who helps you with their special powers. They can be attacked like you can.",
    category: "Card Types"
  },
  {
    term: "Land",
    definition: "Cards that give you mana (magic energy) to cast spells. Like forests, mountains, and islands.",
    category: "Card Types"
  },

  // Game Actions
  {
    term: "Attack",
    definition: "When your creatures try to hurt your opponent. You choose which creatures attack each turn.",
    category: "Actions"
  },
  {
    term: "Block",
    definition: "When your creatures stand in front of attacking creatures to protect you from getting hurt.",
    category: "Actions"
  },
  {
    term: "Cast",
    definition: "To play a spell or creature by paying its cost. Like buying something with mana instead of money.",
    category: "Actions"
  },
  {
    term: "Tap",
    definition: "To turn a card sideways to show it was used. Tapped cards can't be used again until next turn.",
    category: "Actions"
  },
  {
    term: "Untap",
    definition: "To turn a tapped card back upright so it can be used again. This happens at the start of your turn.",
    category: "Actions"
  },
  {
    term: "Draw",
    definition: "To take a card from the top of your deck and put it in your hand so you can play it.",
    category: "Actions"
  },
  {
    term: "Discard",
    definition: "To put a card from your hand into your graveyard. Sometimes you choose, sometimes you have to.",
    category: "Actions"
  },

  // Game Zones
  {
    term: "Battlefield",
    definition: "The area where creatures, artifacts, and other permanent cards go when you play them.",
    category: "Game Zones"
  },
  {
    term: "Hand",
    definition: "The cards you hold that your opponent can't see. You can play cards from your hand.",
    category: "Game Zones"
  },
  {
    term: "Deck",
    definition: "The pile of cards you haven't drawn yet. Also called your library. You draw cards from the top.",
    category: "Game Zones"
  },
  {
    term: "Graveyard",
    definition: "Where cards go after they're used up or destroyed. Like a trash pile, but some spells can bring cards back.",
    category: "Game Zones"
  },
  {
    term: "Exile",
    definition: "A place where cards go when they're removed from the game. Usually they can't come back.",
    category: "Game Zones"
  },

  // Mana and Costs
  {
    term: "Mana",
    definition: "The magic energy you need to cast spells. You get it from lands and some other cards.",
    category: "Mana"
  },
  {
    term: "Mana Cost",
    definition: "How much mana you need to pay to cast a spell. It's shown in the top right corner of cards.",
    category: "Mana"
  },
  {
    term: "Converted Mana Cost",
    definition: "The total amount of mana a spell costs, counting all colors. A spell costing 2 red and 1 blue has a converted cost of 3.",
    category: "Mana"
  },

  // Combat Terms
  {
    term: "Power",
    definition: "How much damage a creature deals when it attacks or blocks. The first number in the bottom right.",
    category: "Combat"
  },
  {
    term: "Toughness", 
    definition: "How much damage a creature can take before it dies. The second number in the bottom right.",
    category: "Combat"
  },
  {
    term: "Flying",
    definition: "A creature with wings that can only be blocked by other creatures with flying or reach.",
    category: "Abilities"
  },
  {
    term: "First Strike",
    definition: "This creature deals damage first in a fight. If it kills the other creature, it doesn't get hurt back.",
    category: "Abilities"
  },
  {
    term: "Trample",
    definition: "If this creature is blocked, extra damage goes through to hurt the opponent.",
    category: "Abilities"
  },
  {
    term: "Vigilance",
    definition: "This creature doesn't need to tap when it attacks, so it can still block on the opponent's turn.",
    category: "Abilities"
  },
  {
    term: "Lifelink",
    definition: "When this creature deals damage, you gain that much life. Helps you stay in the game longer.",
    category: "Abilities"
  },
  {
    term: "Deathtouch",
    definition: "Any damage this creature deals to another creature will kill it, even just 1 damage.",
    category: "Abilities"
  },
  {
    term: "Haste",
    definition: "This creature can attack right away, even on the turn you play it.",
    category: "Abilities"
  },

  // Game Flow
  {
    term: "Turn",
    definition: "One player's time to play. You untap, draw a card, play cards, attack, then the next player goes.",
    category: "Game Flow"
  },
  {
    term: "Phase",
    definition: "Different parts of your turn, like drawing cards, playing spells, or attacking.",
    category: "Game Flow"
  },
  {
    term: "Stack",
    definition: "Where spells wait to happen. The last spell played happens first, like stacking plates.",
    category: "Game Flow"
  },
  {
    term: "Priority",
    definition: "Who gets to play spells next. Players take turns playing spells before they happen.",
    category: "Game Flow"
  },

  // Card Rarity and Sets
  {
    term: "Common",
    definition: "Cards that show up often in packs. Usually simpler and easier to understand.",
    category: "Rarity"
  },
  {
    term: "Uncommon", 
    definition: "Cards that are a bit special but still show up sometimes in packs.",
    category: "Rarity"
  },
  {
    term: "Rare",
    definition: "Special cards that don't show up very often. Usually more powerful or unique.",
    category: "Rarity"
  },
  {
    term: "Mythic Rare",
    definition: "Super special cards that are very hard to find. The most powerful and unique cards.",
    category: "Rarity"
  },
  {
    term: "Set",
    definition: "A group of cards that were made together and have similar themes or mechanics.",
    category: "Sets"
  },

  // Deck Building
  {
    term: "Format",
    definition: "Rules about which cards you can use in your deck, like Standard or Commander.",
    category: "Formats"
  },
  {
    term: "Sideboard",
    definition: "Extra cards you can swap into your deck between games to help against specific opponents.",
    category: "Deck Building"
  },
  {
    term: "Mulligan",
    definition: "If you don't like your starting hand, you can shuffle it back and draw one less card.",
    category: "Game Rules"
  }
];

const categories = ["All", "Card Types", "Actions", "Game Zones", "Mana", "Combat", "Abilities", "Game Flow", "Rarity", "Sets", "Formats", "Deck Building", "Game Rules"];

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const { toast } = useToast();

  // AI Q&A mutation
  const aiQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/ai/dictionary", { question });
      return response.json();
    },
    onSuccess: (data) => {
      setAiResponse(data.answer);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuestion.trim()) {
      aiQuestionMutation.mutate(aiQuestion.trim());
    }
  };

  const filteredTerms = useMemo(() => {
    return mtgTerms.filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Card Types": return "🃏";
      case "Actions": return "⚔️";
      case "Game Zones": return "🏞️";
      case "Mana": return "💎";
      case "Combat": return "⚡";
      case "Abilities": return "✨";
      case "Game Flow": return "🔄";
      case "Rarity": return "💫";
      case "Sets": return "📚";
      case "Formats": return "🎯";
      case "Deck Building": return "🏗️";
      case "Game Rules": return "📜";
      default: return "📖";
    }
  };

  return (
    <div className="min-h-screen bg-mtg-dark text-slate-100">
      {/* Header */}
      <header className="bg-glass border-b border-glass backdrop-blur-md sticky top-0 z-50 shadow-magical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="text-slate-300 hover:text-white hover:bg-glass"
                  data-testid="button-back-home"
                >
                  ← Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <BookOpen className="h-8 w-8 text-gradient-primary" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-mtg-accent animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-primary" data-testid="text-dictionary-title">
                    MTG Dictionary
                  </h1>
                  <p className="text-sm text-slate-400 font-medium">
                    Simple definitions for Magic terms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Q&A Section */}
        <div className="bg-gradient-to-r from-mtg-primary/10 to-purple-600/10 border border-mtg-primary/20 rounded-2xl p-6 mb-8 shadow-magical">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <MessageCircle className="h-6 w-6 text-mtg-primary" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ask the AI Wizard</h2>
              <p className="text-sm text-slate-400">Get quick explanations of any Magic term with examples</p>
            </div>
          </div>

          <form onSubmit={handleAskAI} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about any Magic term... (e.g., 'What is flying?' or 'How does trample work?')"
                className="w-full h-12 bg-slate-800/50 border-slate-600 rounded-xl px-4 py-3 pr-16 text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mtg-primary"
                disabled={aiQuestionMutation.isPending}
                data-testid="input-ai-question"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!aiQuestion.trim() || aiQuestionMutation.isPending}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-mtg-primary hover:bg-mtg-primary/80 text-white px-3 py-2 rounded-lg transition-all duration-200"
                data-testid="button-ask-ai"
              >
                {aiQuestionMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {aiResponse && (
              <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-r from-mtg-primary to-purple-600 rounded-full p-2 flex-shrink-0 mt-1">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-base leading-relaxed" data-testid="text-ai-response">
                      {aiResponse}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-glass border-glass rounded-2xl p-6 mb-8 shadow-card">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Magic words..."
                  className="w-full h-12 bg-slate-800/50 border-slate-600 rounded-xl px-4 py-3 pl-12 text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mtg-primary"
                  data-testid="input-dictionary-search"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Filter by Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-mtg-primary text-white shadow-glow"
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-600"
                    }`}
                    data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="mr-1">{getCategoryIcon(category)}</span>
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6">
          <p className="text-slate-400" data-testid="text-results-count">
            Found <span className="text-gradient-accent font-bold">{filteredTerms.length}</span> Magic words
          </p>
        </div>

        {/* Dictionary Terms */}
        <div className="space-y-4">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((term, index) => (
              <div
                key={term.term}
                className="bg-glass border-glass rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02]"
                data-testid={`dictionary-term-${term.term.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-gradient-primary transition-all duration-300">
                      {term.term}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="bg-mtg-secondary/20 text-mtg-accent border-mtg-secondary text-xs"
                    >
                      <span className="mr-1">{getCategoryIcon(term.category)}</span>
                      {term.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-slate-300 text-base leading-relaxed font-medium">
                  {term.definition}
                </p>
                
                {/* Decorative element */}
                <div className="mt-4 flex items-center space-x-2 opacity-50">
                  <div className="w-2 h-2 bg-gradient-accent rounded-full"></div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent"></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-no-results">
                No Magic words found
              </h3>
              <p className="text-slate-400" data-testid="text-no-results-hint">
                Try searching for something else or pick a different type
              </p>
            </div>
          )}
        </div>

        {/* Educational Footer */}
        <div className="mt-12 bg-gradient-to-r from-mtg-primary/10 to-mtg-accent/10 border border-mtg-primary/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Zap className="h-6 w-6 text-mtg-primary" />
            <h3 className="text-lg font-bold text-white">Learning Tip</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            New to Magic? Start by learning <strong>creatures</strong>, <strong>spells</strong>, and <strong>mana</strong>. 
            These are the building blocks of every Magic game! Once you know these, try learning about <strong>attacking</strong> and <strong>blocking</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}