import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Sparkles, Zap, MessageCircle, Send } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// MTG Dictionary data with 6th grade reading level definitions
const mtgTerms = [
  // Basic Game Terms
  {
    term: "Artifact",
    definition: "A magical object that remains on the battlefield to provide ongoing benefits. Artifacts represent equipment, vehicles, or other constructed items that enhance your strategy.",
    category: "Card Types"
  },
  {
    term: "Creature", 
    definition: "A permanent card representing beings that can battle on your behalf. Creatures have power and toughness values and can attack opponents or defend you by blocking.",
    category: "Card Types"
  },
  {
    term: "Spell",
    definition: "A magical effect that resolves immediately when cast, then goes to the graveyard. Spells include instants and sorceries that create temporary effects.",
    category: "Card Types"
  },
  {
    term: "Enchantment",
    definition: "A magical effect that remains on the battlefield permanently, altering the rules of the game. Enchantments provide continuous benefits or abilities.",
    category: "Card Types"
  },
  {
    term: "Planeswalker",
    definition: "A powerful ally representing magical beings who can be summoned to assist you. Planeswalkers have loyalty counters and unique abilities that can influence the battlefield.",
    category: "Card Types"
  },
  {
    term: "Land",
    definition: "The foundation of your mana base, representing locations that produce magical energy. Different land types generate specific colors of mana needed to cast spells.",
    category: "Card Types"
  },

  // Game Actions
  {
    term: "Attack",
    definition: "The combat action where creatures attempt to deal damage to opponents or their planeswalkers. Attacking creatures become tapped unless they have vigilance.",
    category: "Actions"
  },
  {
    term: "Block",
    definition: "The defensive action where creatures intercept attacking creatures to prevent damage. Blocking can result in combat between creatures.",
    category: "Actions"
  },
  {
    term: "Cast",
    definition: "The process of playing a spell by paying its mana cost and following proper timing rules. Casting puts spells onto the stack to await resolution.",
    category: "Actions"
  },
  {
    term: "Tap",
    definition: "To rotate a card 90 degrees sideways, indicating it has been activated or used. Tapped permanents cannot be tapped again until they untap.",
    category: "Actions"
  },
  {
    term: "Untap",
    definition: "To rotate a tapped card back to its upright position, making it available for use again. Most permanents untap automatically during your untap step.",
    category: "Actions"
  },
  {
    term: "Draw",
    definition: "To move the top card of your library into your hand, increasing your available options. Drawing typically occurs during your draw step and from spell effects.",
    category: "Actions"
  },
  {
    term: "Discard",
    definition: "To place a card from your hand into your graveyard, either by choice or due to game effects. Discarding can trigger abilities on certain cards.",
    category: "Actions"
  },

  // Game Zones
  {
    term: "Battlefield",
    definition: "The shared play area where all permanent cards exist and interact. This zone contains creatures, artifacts, enchantments, lands, and planeswalkers that are currently in play.",
    category: "Game Zones"
  },
  {
    term: "Hand",
    definition: "Your private collection of cards available for casting, hidden from opponents. The hand represents your immediate strategic options and resources.",
    category: "Game Zones"
  },
  {
    term: "Deck",
    definition: "Your personal library of cards arranged in a specific order, face-down. Also called your library, this zone supplies new cards through drawing.",
    category: "Game Zones"
  },
  {
    term: "Graveyard",
    definition: "The discard zone where used, destroyed, or discarded cards accumulate. While cards here are typically inactive, some spells can retrieve them.",
    category: "Game Zones"
  },
  {
    term: "Exile",
    definition: "A separate zone for cards temporarily or permanently removed from the game. Exiled cards are typically inaccessible unless specific effects return them.",
    category: "Game Zones"
  },

  // Mana and Costs
  {
    term: "Mana",
    definition: "The fundamental magical energy resource required to cast spells and activate abilities. Mana comes in five colors plus colorless variants.",
    category: "Mana"
  },
  {
    term: "Mana Cost",
    definition: "The specific amount and type of mana required to cast a spell, displayed in the upper-right corner. Costs may include colored and generic mana requirements.",
    category: "Mana"
  },
  {
    term: "Converted Mana Cost",
    definition: "The total numerical value of a spell's mana cost, regardless of color. For example, a spell costing two red and one blue mana has a converted cost of three.",
    category: "Mana"
  },

  // Combat Terms
  {
    term: "Power",
    definition: "A creature's offensive combat value, representing the amount of damage it deals during combat. Power is the first number in the bottom-right corner.",
    category: "Combat"
  },
  {
    term: "Toughness", 
    definition: "A creature's defensive combat value, representing how much damage it can withstand before being destroyed. Toughness is the second number in the bottom-right corner.",
    category: "Combat"
  },
  {
    term: "Flying",
    definition: "A keyword ability that allows creatures to attack and block in aerial combat. Only creatures with flying or reach can block flying creatures.",
    category: "Abilities"
  },
  {
    term: "First Strike",
    definition: "A combat ability allowing creatures to deal damage before regular combat damage. This can eliminate blockers before they can retaliate.",
    category: "Abilities"
  },
  {
    term: "Trample",
    definition: "An ability that allows excess combat damage to carry over to the defending player when blocked. The remainder flows past the blocking creature.",
    category: "Abilities"
  },
  {
    term: "Vigilance",
    definition: "A keyword ability that prevents creatures from tapping when attacking. This allows them to remain available for defensive blocking.",
    category: "Abilities"
  },
  {
    term: "Lifelink",
    definition: "An ability that causes damage dealt by the creature to also increase your life total by the same amount. This provides both offense and healing.",
    category: "Abilities"
  },
  {
    term: "Deathtouch",
    definition: "A keyword ability making any amount of damage dealt by this creature lethal to other creatures. Even one point of damage will destroy the target.",
    category: "Abilities"
  },
  {
    term: "Haste",
    definition: "An ability that removes summoning sickness, allowing creatures to attack immediately upon entering the battlefield. This provides immediate offensive pressure.",
    category: "Abilities"
  },

  // Game Flow
  {
    term: "Turn",
    definition: "The structured sequence of phases during which a player takes actions. Each turn includes untapping, drawing, main phases, combat, and passing priority to the next player.",
    category: "Game Flow"
  },
  {
    term: "Phase",
    definition: "Distinct segments within a turn that govern when specific actions can be performed. Phases include untap, upkeep, draw, main, combat, and end phases.",
    category: "Game Flow"
  },
  {
    term: "Stack",
    definition: "The zone where spells and abilities wait to resolve in last-in, first-out order. Players can respond to spells by adding more to the stack.",
    category: "Game Flow"
  },
  {
    term: "Priority",
    definition: "The system determining which player can cast spells or activate abilities next. Priority passes between players until both choose not to act.",
    category: "Game Flow"
  },

  // Card Rarity and Sets
  {
    term: "Common",
    definition: "The most frequently printed cards in booster packs, typically featuring straightforward effects and mechanics. Commons form the foundation of most limited formats.",
    category: "Rarity"
  },
  {
    term: "Uncommon", 
    definition: "Cards with moderate complexity and power level that appear less frequently than commons. Uncommons often introduce interesting synergies and build-around themes.",
    category: "Rarity"
  },
  {
    term: "Rare",
    definition: "Powerful or mechanically unique cards with limited print quantities. Rares typically feature complex abilities and serve as centerpieces for constructed strategies.",
    category: "Rarity"
  },
  {
    term: "Mythic Rare",
    definition: "The highest rarity tier, reserved for the most powerful, complex, or story-significant cards. Mythic rares appear approximately once per eight booster packs.",
    category: "Rarity"
  },
  {
    term: "Set",
    definition: "A collection of cards released together that share thematic elements, mechanics, and storylines. Sets define the Standard format and tournament legality.",
    category: "Sets"
  },

  // Deck Building
  {
    term: "Format",
    definition: "Organized play systems that define which cards are legal for tournament competition. Formats like Standard, Modern, and Commander each have different deck construction rules.",
    category: "Formats"
  },
  {
    term: "Sideboard",
    definition: "A collection of additional cards that can be swapped with main deck cards between games. Sideboards allow players to adapt their strategy against specific opponents.",
    category: "Deck Building"
  },
  {
    term: "Mulligan",
    definition: "The option to shuffle your opening hand back into your library and draw a new hand with one fewer card. Players can mulligan multiple times if needed.",
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
                    Comprehensive definitions for Magic terminology
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
              <p className="text-sm text-slate-400">Receive detailed explanations of Magic concepts with practical examples</p>
            </div>
          </div>

          <form onSubmit={handleAskAI} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about any Magic concept... (e.g., 'Explain flying mechanics' or 'How does trample function in combat?')"
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
            <h3 className="text-lg font-bold text-white">Strategy Guide</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Beginning your Magic journey? Focus first on mastering <strong>creatures</strong>, <strong>spells</strong>, and <strong>mana management</strong>. 
            These fundamental concepts form the foundation of strategic gameplay. After understanding the basics, advance to <strong>combat mechanics</strong> and <strong>timing interactions</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}