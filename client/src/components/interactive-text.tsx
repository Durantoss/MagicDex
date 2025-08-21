import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// MTG terms from dictionary with 6th grade reading level definitions
const mtgTerms = [
  { term: "artifact", definition: "A magical object that remains on the battlefield to provide ongoing benefits. Artifacts represent equipment, vehicles, or other constructed items that enhance your strategy." },
  { term: "creature", definition: "A permanent card representing beings that can battle on your behalf. Creatures have power and toughness values and can attack opponents or defend you by blocking." },
  { term: "spell", definition: "A magical effect that resolves immediately when cast, then goes to the graveyard. Spells include instants and sorceries that create temporary effects." },
  { term: "enchantment", definition: "A magical effect that remains on the battlefield permanently, altering the rules of the game. Enchantments provide continuous benefits or abilities." },
  { term: "planeswalker", definition: "A powerful ally representing magical beings who can be summoned to assist you. Planeswalkers have loyalty counters and unique abilities that can influence the battlefield." },
  { term: "land", definition: "The foundation of your mana base, representing locations that produce magical energy. Different land types generate specific colors of mana needed to cast spells." },
  { term: "lands", definition: "The foundation of your mana base, representing locations that produce magical energy. Different land types generate specific colors of mana needed to cast spells." },
  { term: "attack", definition: "The combat action where creatures attempt to deal damage to opponents or their planeswalkers. Attacking creatures become tapped unless they have vigilance." },
  { term: "attacking", definition: "The combat action where creatures attempt to deal damage to opponents or their planeswalkers. Attacking creatures become tapped unless they have vigilance." },
  { term: "attackers", definition: "Creatures that are currently attempting to deal damage to opponents or their planeswalkers during the combat phase." },
  { term: "block", definition: "The defensive action where creatures intercept attacking creatures to prevent damage. Blocking can result in combat between creatures." },
  { term: "blocking", definition: "The defensive action where creatures intercept attacking creatures to prevent damage. Blocking can result in combat between creatures." },
  { term: "blockers", definition: "Creatures that intercept attacking creatures to prevent damage during combat." },
  { term: "cast", definition: "The process of playing a spell by paying its mana cost and following proper timing rules. Casting puts spells onto the stack to await resolution." },
  { term: "casting", definition: "The process of playing a spell by paying its mana cost and following proper timing rules. Casting puts spells onto the stack to await resolution." },
  { term: "tap", definition: "To rotate a card 90 degrees sideways, indicating it has been activated or used. Tapped permanents cannot be tapped again until they untap." },
  { term: "tapped", definition: "A card rotated 90 degrees sideways, indicating it has been activated or used. Tapped permanents cannot be tapped again until they untap." },
  { term: "untap", definition: "To rotate a tapped card back to its upright position, making it available for use again. Most permanents untap automatically during your untap step." },
  { term: "draw", definition: "To move the top card of your library into your hand, increasing your available options. Drawing typically occurs during your draw step and from spell effects." },
  { term: "discard", definition: "To place a card from your hand into your graveyard, either by choice or due to game effects. Discarding can trigger abilities on certain cards." },
  { term: "battlefield", definition: "The shared play area where all permanent cards exist and interact. This zone contains creatures, artifacts, enchantments, lands, and planeswalkers that are currently in play." },
  { term: "hand", definition: "Your private collection of cards available for casting, hidden from opponents. The hand represents your immediate strategic options and resources." },
  { term: "library", definition: "Your personal collection of cards arranged in a specific order, face-down. Also called your deck, this zone supplies new cards through drawing." },
  { term: "deck", definition: "Your personal collection of cards arranged in a specific order, face-down. Also called your library, this zone supplies new cards through drawing." },
  { term: "graveyard", definition: "The discard zone where used, destroyed, or discarded cards accumulate. While cards here are typically inactive, some spells can retrieve them." },
  { term: "exile", definition: "A separate zone for cards temporarily or permanently removed from the game. Exiled cards are typically inaccessible unless specific effects return them." },
  { term: "mana", definition: "The fundamental magical energy resource required to cast spells and activate abilities. Mana comes in five colors plus colorless variants." },
  { term: "power", definition: "A creature's offensive combat value, representing the amount of damage it deals during combat. Power is the first number in the bottom-right corner." },
  { term: "toughness", definition: "A creature's defensive combat value, representing how much damage it can withstand before being destroyed. Toughness is the second number in the bottom-right corner." },
  { term: "flying", definition: "A keyword ability that allows creatures to attack and block in aerial combat. Only creatures with flying or reach can block flying creatures." },
  { term: "first strike", definition: "A combat ability allowing creatures to deal damage before regular combat damage. This can eliminate blockers before they can retaliate." },
  { term: "double strike", definition: "A combat ability that allows creatures to deal damage twice - once during first strike and again during regular combat damage." },
  { term: "trample", definition: "An ability that allows excess combat damage to carry over to the defending player when blocked. The remainder flows past the blocking creature." },
  { term: "vigilance", definition: "A keyword ability that prevents creatures from tapping when attacking. This allows them to remain available for defensive blocking." },
  { term: "lifelink", definition: "An ability that causes damage dealt by the creature to also increase your life total by the same amount. This provides both offense and healing." },
  { term: "deathtouch", definition: "A keyword ability making any amount of damage dealt by this creature lethal to other creatures. Even one point of damage will destroy the target." },
  { term: "haste", definition: "An ability that removes summoning sickness, allowing creatures to attack immediately upon entering the battlefield. This provides immediate offensive pressure." },
  { term: "hexproof", definition: "A protective ability that prevents opponents from targeting the permanent with spells or abilities. You can still target your own hexproof permanents." },
  { term: "shroud", definition: "A protective ability that prevents anyone, including you, from targeting the permanent with spells or abilities. More restrictive than hexproof." },
  { term: "reach", definition: "A defensive ability that allows creatures to block flying creatures. Creatures with reach can engage in aerial combat even without flight." },
  { term: "priority", definition: "The system determining which player can cast spells or activate abilities next. Priority passes between players until both choose not to act." },
  { term: "stack", definition: "The zone where spells and abilities wait to resolve in last-in, first-out order. Players can respond to spells by adding more to the stack." },
  { term: "resolve", definition: "When a spell or ability on the stack takes effect and is removed from the stack. Spells and abilities resolve one at a time in reverse order." },
  { term: "permanent", definition: "A card that stays on the battlefield after being played. Permanents include creatures, artifacts, enchantments, lands, and planeswalkers." },
  { term: "permanents", definition: "Cards that stay on the battlefield after being played. Permanents include creatures, artifacts, enchantments, lands, and planeswalkers." },
  { term: "instant", definition: "A type of spell that can be cast at almost any time when you have priority. Instants resolve immediately and then go to the graveyard." },
  { term: "instants", definition: "Types of spells that can be cast at almost any time when you have priority. Instants resolve immediately and then go to the graveyard." },
  { term: "sorcery", definition: "A type of spell that can only be cast during your main phases when the stack is empty. Sorceries resolve immediately and then go to the graveyard." },
  { term: "sorceries", definition: "Types of spells that can only be cast during your main phases when the stack is empty. Sorceries resolve immediately and then go to the graveyard." },
  { term: "loyalty", definition: "Counters that represent a planeswalker's allegiance and health. Planeswalkers enter with base loyalty and can gain or lose loyalty through abilities." },
  { term: "loyalty counters", definition: "Counters that represent a planeswalker's allegiance and health. Planeswalkers with zero loyalty counters are destroyed." },
  { term: "summoning sickness", definition: "A rule preventing creatures from attacking or using tap abilities on the turn they enter the battlefield, unless they have haste." },
  { term: "phases", definition: "Distinct segments within a turn that govern when specific actions can be performed. Phases include untap, upkeep, draw, main, combat, and end phases." },
  { term: "combat phase", definition: "The portion of a turn where creatures can attack and combat damage is dealt. Includes declare attackers, declare blockers, and damage steps." },
  { term: "main phase", definition: "The portions of your turn when you can cast most spells and activate abilities. There are two main phases per turn." },
  { term: "upkeep", definition: "The second step of the beginning phase where triggered abilities that trigger 'at the beginning of your upkeep' are put on the stack." },
  { term: "end step", definition: "The first step of the ending phase where triggered abilities that trigger 'at the beginning of your end step' are put on the stack." },
  { term: "cleanup", definition: "The final step of each turn where damage is removed from creatures and players discard down to their maximum hand size." }
];

// Create a case-insensitive lookup map for faster searches
const termLookup = new Map<string, string>();
mtgTerms.forEach(({ term, definition }) => {
  termLookup.set(term.toLowerCase(), definition);
});

interface InteractiveTextProps {
  children: string;
  className?: string;
}

export function InteractiveText({ children, className = "" }: InteractiveTextProps) {
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set());

  const handlePopoverChange = (termKey: string, isOpen: boolean) => {
    setOpenPopovers(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(termKey);
      } else {
        newSet.delete(termKey);
      }
      return newSet;
    });
  };

  const parseText = (text: string) => {
    // Create a regex pattern that matches all MTG terms (case-insensitive, whole words only)
    const termPattern = new RegExp(`\\b(${Array.from(termLookup.keys()).join('|')})\\b`, 'gi');
    
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = termPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const matchedTerm = match[0];
      const definition = termLookup.get(matchedTerm.toLowerCase());
      const termKey = `${matchedTerm}-${keyCounter++}`;

      if (definition) {
        parts.push(
          <Popover 
            key={termKey}
            open={openPopovers.has(termKey)}
            onOpenChange={(isOpen) => handlePopoverChange(termKey, isOpen)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="link"
                className="p-0 h-auto text-amber-300 hover:text-amber-200 underline underline-offset-2 decoration-amber-300/50 hover:decoration-amber-200/50 font-medium inline"
                data-testid={`term-${matchedTerm.toLowerCase()}`}
              >
                {matchedTerm}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-4 bg-slate-900 border-amber-300/20 shadow-xl"
              side="top"
              align="center"
            >
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-300 capitalize">
                  {matchedTerm}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {definition}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        );
      } else {
        parts.push(matchedTerm);
      }

      lastIndex = termPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return <span className={className}>{parseText(children)}</span>;
}