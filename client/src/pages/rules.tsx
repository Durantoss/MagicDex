import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Book, MessageCircle, Send, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { InteractiveText } from "@/components/interactive-text";

interface RuleQuestion {
  question: string;
  answer: string;
  timestamp: number;
}

export default function RulesPage() {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<RuleQuestion[]>([]);
  const { toast } = useToast();

  const askQuestionMutation = useMutation({
    mutationFn: async (userQuestion: string) => {
      const response = await apiRequest("POST", "/api/rules/ask", {
        question: userQuestion
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newAnswer: RuleQuestion = {
        question,
        answer: data.answer,
        timestamp: Date.now()
      };
      setAnswers(prev => [newAnswer, ...prev]);
      setQuestion("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askQuestionMutation.mutate(question.trim());
  };

  const rulesData = [
    {
      category: "Game Basics",
      rules: [
        {
          title: "Starting the Game",
          content: "Each player starts with 20 life and draws 7 cards. The player who goes first doesn't draw on their first turn."
        },
        {
          title: "Winning the Game",
          content: "You win by reducing your opponent's life to 0 or below, by making them draw from an empty library, or through specific card effects that say 'you win the game'."
        },
        {
          title: "Card Types",
          content: "There are several card types: Lands (provide mana), Creatures (attack and block), Instants (cast anytime), Sorceries (cast on your turn), Enchantments (permanent effects), Artifacts (colorless permanents), and Planeswalkers (powerful allies)."
        }
      ]
    },
    {
      category: "Turn Structure",
      rules: [
        {
          title: "Turn Phases",
          content: "Each turn has these phases: Beginning (Untap, Upkeep, Draw), Main Phase 1, Combat (Declare Attackers, Declare Blockers, Combat Damage), Main Phase 2, End (End Step, Cleanup)."
        },
        {
          title: "Priority",
          content: "Players get chances to cast spells and activate abilities. The active player gets priority first, then it passes to other players in turn order."
        },
        {
          title: "The Stack",
          content: "Spells and abilities go on 'the stack' and resolve in reverse order (last in, first out). Players can respond to spells before they resolve."
        }
      ]
    },
    {
      category: "Combat",
      rules: [
        {
          title: "Attacking",
          content: "During your combat phase, choose which creatures attack. They become 'tapped' unless they have vigilance. Creatures with summoning sickness (played this turn) can't attack."
        },
        {
          title: "Blocking",
          content: "Defending player chooses which creatures block attackers. Each creature can block one attacker, but multiple creatures can block the same attacker."
        },
        {
          title: "Combat Damage",
          content: "Attacking and blocking creatures deal damage equal to their power. Damage is dealt simultaneously unless a creature has first strike or double strike."
        },
        {
          title: "Trample",
          content: "If a creature with trample is blocked, excess damage (beyond what's needed to destroy blockers) carries over to the defending player."
        }
      ]
    },
    {
      category: "Mana and Casting",
      rules: [
        {
          title: "Mana System",
          content: "Lands produce mana when tapped. Different lands produce different colors of mana: White (Plains), Blue (Islands), Black (Swamps), Red (Mountains), Green (Forests)."
        },
        {
          title: "Mana Cost",
          content: "Each spell has a mana cost shown in the top-right corner. Colored mana symbols require specific colors, while numbers can be paid with any color or colorless mana."
        },
        {
          title: "Casting Timing",
          content: "Sorceries and creatures can only be cast during your main phases when the stack is empty. Instants can be cast anytime you have priority."
        }
      ]
    },
    {
      category: "Keyword Abilities",
      rules: [
        {
          title: "Flying",
          content: "Creatures with flying can only be blocked by creatures with flying or reach."
        },
        {
          title: "First Strike & Double Strike",
          content: "First strike deals damage before normal combat damage. Double strike deals damage during both first strike and normal combat damage steps."
        },
        {
          title: "Deathtouch",
          content: "Any amount of damage from a creature with deathtouch is enough to destroy another creature."
        },
        {
          title: "Hexproof & Shroud",
          content: "Hexproof prevents opponents from targeting the permanent. Shroud prevents anyone (including you) from targeting it."
        },
        {
          title: "Haste & Vigilance",
          content: "Haste allows creatures to attack the turn they're played. Vigilance means the creature doesn't tap when attacking."
        }
      ]
    },
    {
      category: "Advanced Concepts",
      rules: [
        {
          title: "Planeswalkers",
          content: "Planeswalkers enter with loyalty counters. You can activate one loyalty ability per turn during your main phases. If they reach 0 loyalty, they're destroyed."
        },
        {
          title: "Graveyard & Exile",
          content: "When cards are destroyed or used, they go to the graveyard. Some effects exile cards instead, removing them from the game entirely (though some cards can return from exile)."
        },
        {
          title: "Triggered vs Activated Abilities",
          content: "Triggered abilities happen automatically when conditions are met (usually start with 'When' or 'Whenever'). Activated abilities have costs you pay to use them (format: 'Cost: Effect')."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-slate-400 hover:text-white" data-testid="button-back-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Book className="h-6 w-6 text-amber-400" />
                <h1 className="text-xl font-bold text-white">MTG Rules Guide</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Rules Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Book className="mr-2 h-5 w-5 text-amber-400" />
                  Magic: The Gathering Rules
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm sm:text-base">
                  Learn the fundamentals of Magic with interactive term definitions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[600px] sm:h-[800px] pr-2 sm:pr-4">
                  {rulesData.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-6 sm:mb-8">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <Badge variant="secondary" className="bg-amber-600 text-white text-xs sm:text-sm">
                          {section.category}
                        </Badge>
                      </div>
                      
                      <Accordion type="single" collapsible className="space-y-2">
                        {section.rules.map((rule, ruleIndex) => (
                          <AccordionItem 
                            key={ruleIndex} 
                            value={`${sectionIndex}-${ruleIndex}`}
                            className="border border-slate-600 rounded-lg px-3 sm:px-4"
                          >
                            <AccordionTrigger className="text-white hover:text-amber-400 text-left text-sm sm:text-base py-3 sm:py-4">
                              {rule.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-300 pb-3 sm:pb-4 text-sm sm:text-base">
                              <InteractiveText>{rule.content}</InteractiveText>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Q&A Section */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="bg-slate-800 border-slate-700 h-fit">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <MessageCircle className="mr-2 h-5 w-5 text-blue-400" />
                  Ask a Rules Question
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm sm:text-base">
                  Get instant answers to your Magic rules questions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., How does first strike work?"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                    data-testid="input-rules-question"
                  />
                  <Button 
                    type="submit" 
                    disabled={askQuestionMutation.isPending || !question.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white touch-manipulation btn-touch text-sm sm:text-base"
                    data-testid="button-ask-question"
                  >
                    {askQuestionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {askQuestionMutation.isPending ? "Getting Answer..." : "Ask Question"}
                  </Button>
                </form>

                {answers.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-white font-semibold text-base sm:text-lg">Recent Questions</h3>
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-4">
                        {answers.map((qa, index) => (
                          <div key={index} className="bg-slate-700 rounded-lg p-3 sm:p-4 space-y-2">
                            <div className="text-blue-300 font-medium text-xs sm:text-sm">
                              Q: {qa.question}
                            </div>
                            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                              A: {qa.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
