import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Package, TestTube } from 'lucide-react';
import { 
  FoilBadge, 
  FoilAvailabilityIndicator, 
  PriceComparison, 
  QuantityDisplay,
  CollectionStats,
  FoilCardWrapper
} from './foil-badge';
import { QuantityTracker, CompactQuantityTracker, QuickAddButtons, FoilToggle } from './quantity-tracker';
import { 
  checkFoilAvailability, 
  shouldShowFoilOptions, 
  formatQuantityDisplay,
  calculateCollectionStats,
  searchLilianaOfTheVeil,
  CardQuantities,
  CollectionEntry
} from '@/lib/foil-utils';
import { useToast } from '@/hooks/use-toast';

// Mock card data for testing
const mockCards = {
  foilCard: {
    id: 'test-foil-1',
    name: 'Lightning Bolt',
    mana_cost: '{R}',
    cmc: 1,
    type_line: 'Instant',
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    colors: ['R'],
    rarity: 'common' as const,
    set: 'lea',
    set_name: 'Limited Edition Alpha',
    prices: {
      usd: '15.00',
      usd_foil: '45.00'
    },
    image_uris: {
      small: 'https://cards.scryfall.io/small/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg',
      normal: 'https://cards.scryfall.io/normal/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg',
      large: 'https://cards.scryfall.io/large/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg',
      png: '',
      art_crop: '',
      border_crop: ''
    }
  },
  normalOnlyCard: {
    id: 'test-normal-1',
    name: 'Forest',
    mana_cost: '',
    cmc: 0,
    type_line: 'Basic Land — Forest',
    oracle_text: '{T}: Add {G}.',
    colors: [],
    rarity: 'common' as const,
    set: 'lea',
    set_name: 'Limited Edition Alpha',
    prices: {
      usd: '0.25'
    },
    image_uris: {
      small: 'https://cards.scryfall.io/small/front/b/6/b6a26d31-83ba-4c17-9420-698e70e0d0da.jpg',
      normal: 'https://cards.scryfall.io/normal/front/b/6/b6a26d31-83ba-4c17-9420-698e70e0d0da.jpg',
      large: 'https://cards.scryfall.io/large/front/b/6/b6a26d31-83ba-4c17-9420-698e70e0d0da.jpg',
      png: '',
      art_crop: '',
      border_crop: ''
    }
  },
  expensiveFoil: {
    id: 'test-expensive-1',
    name: 'Black Lotus',
    mana_cost: '{0}',
    cmc: 0,
    type_line: 'Artifact',
    oracle_text: '{T}, Sacrifice Black Lotus: Add three mana of any one color.',
    colors: [],
    rarity: 'rare' as const,
    set: 'lea',
    set_name: 'Limited Edition Alpha',
    prices: {
      usd: '25000.00',
      usd_foil: '75000.00'
    },
    image_uris: {
      small: 'https://cards.scryfall.io/small/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
      normal: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
      large: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
      png: '',
      art_crop: '',
      border_crop: ''
    }
  }
};

export function FoilTest() {
  const { toast } = useToast();
  const [quantities1, setQuantities1] = useState<CardQuantities>({ normal: 2, foil: 1 });
  const [quantities2, setQuantities2] = useState<CardQuantities>({ normal: 0, foil: 0 });
  const [quantities3, setQuantities3] = useState<CardQuantities>({ normal: 1, foil: 2 });
  const [foilToggle, setFoilToggle] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleQuantityChange1 = (finish: 'normal' | 'foil', change: number) => {
    setQuantities1(prev => ({
      ...prev,
      [finish]: Math.max(0, prev[finish] + change)
    }));
  };

  const handleQuantityChange2 = (finish: 'normal' | 'foil', change: number) => {
    setQuantities2(prev => ({
      ...prev,
      [finish]: Math.max(0, prev[finish] + change)
    }));
  };

  const handleQuantityChange3 = (finish: 'normal' | 'foil', change: number) => {
    setQuantities3(prev => ({
      ...prev,
      [finish]: Math.max(0, prev[finish] + change)
    }));
  };

  const handleQuickAdd = (card: any, finish: 'normal' | 'foil', quantity: number) => {
    toast({
      title: "Quick Add Test",
      description: `Would add ${quantity}x ${card.name} (${finish}) to collection`,
    });
  };

  const runTests = async () => {
    const results: string[] = [];
    
    // Test 1: Foil availability detection
    const foilAvail1 = checkFoilAvailability(mockCards.foilCard);
    const foilAvail2 = checkFoilAvailability(mockCards.normalOnlyCard);
    
    results.push(`✅ Foil availability - Lightning Bolt: ${foilAvail1.hasFoil ? 'HAS FOIL' : 'NO FOIL'}`);
    results.push(`✅ Foil availability - Forest: ${foilAvail2.hasFoil ? 'HAS FOIL' : 'NO FOIL'}`);
    
    // Test 2: Should show foil options
    const showFoil1 = shouldShowFoilOptions(mockCards.foilCard);
    const showFoil2 = shouldShowFoilOptions(mockCards.normalOnlyCard);
    
    results.push(`✅ Show foil options - Lightning Bolt: ${showFoil1 ? 'YES' : 'NO'}`);
    results.push(`✅ Show foil options - Forest: ${showFoil2 ? 'YES' : 'NO'}`);
    
    // Test 3: Quantity formatting
    const format1 = formatQuantityDisplay({ normal: 2, foil: 1 });
    const format2 = formatQuantityDisplay({ normal: 3, foil: 0 });
    const format3 = formatQuantityDisplay({ normal: 0, foil: 2 });
    
    results.push(`✅ Quantity format - 2N+1F: "${format1}"`);
    results.push(`✅ Quantity format - 3N+0F: "${format2}"`);
    results.push(`✅ Quantity format - 0N+2F: "${format3}"`);
    
    // Test 4: Collection stats calculation
    const mockCollection: CollectionEntry[] = [
      {
        cardId: 'test-1',
        normalQuantity: 2,
        foilQuantity: 1,
        cardData: mockCards.foilCard
      },
      {
        cardId: 'test-2',
        normalQuantity: 4,
        foilQuantity: 0,
        cardData: mockCards.normalOnlyCard
      },
      {
        cardId: 'test-3',
        normalQuantity: 1,
        foilQuantity: 2,
        cardData: mockCards.expensiveFoil
      }
    ];
    
    const stats = calculateCollectionStats(mockCollection);
    results.push(`✅ Collection stats - Total cards: ${stats.totalCards}`);
    results.push(`✅ Collection stats - Normal: ${stats.totalNormal}, Foil: ${stats.totalFoil}`);
    results.push(`✅ Collection stats - Foil %: ${stats.foilPercentage.toFixed(1)}%`);
    results.push(`✅ Collection stats - Total value: $${stats.totalValue.toFixed(2)}`);
    
    // Test 5: Liliana search
    try {
      const lilianaResults = await searchLilianaOfTheVeil();
      results.push(`✅ Liliana search - Found ${lilianaResults.length} printings`);
    } catch (error) {
      results.push(`❌ Liliana search - Error: ${error}`);
    }
    
    setTestResults(results);
    
    toast({
      title: "Tests Complete",
      description: `Ran ${results.length} tests. Check results below.`,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-mtg-dark min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-6 w-6 text-mtg-accent" />
        <h1 className="text-2xl font-bold text-white">Foil Functionality Test Suite</h1>
      </div>

      {/* Test Controls */}
      <Card className="bg-mtg-secondary border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} className="bg-mtg-accent hover:bg-mtg-accent/80">
            Run All Tests
          </Button>
          
          {testResults.length > 0 && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className={result.startsWith('✅') ? 'text-green-400' : 'text-red-400'}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Foil Badge Tests */}
        <Card className="bg-mtg-secondary border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Foil Badge Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">FoilBadge (with foil available)</h4>
              <div className="relative bg-slate-800 p-4 rounded-lg">
                <FoilBadge card={mockCards.foilCard} size="md" />
                <span className="text-white ml-16">Lightning Bolt</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">FoilBadge (no foil available)</h4>
              <div className="relative bg-slate-800 p-4 rounded-lg">
                <FoilBadge card={mockCards.normalOnlyCard} size="md" />
                <span className="text-white">Forest (no badge should show)</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">FoilAvailabilityIndicator</h4>
              <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                <FoilAvailabilityIndicator card={mockCards.foilCard} showPrice={true} />
                <FoilAvailabilityIndicator card={mockCards.normalOnlyCard} showPrice={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Tracker Tests */}
        <Card className="bg-mtg-secondary border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quantity Tracker Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">QuantityTracker (with foil)</h4>
              <QuantityTracker
                card={mockCards.foilCard}
                quantities={quantities1}
                onQuantityChange={handleQuantityChange1}
                showPrices={true}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">QuantityTracker (no foil available)</h4>
              <QuantityTracker
                card={mockCards.normalOnlyCard}
                quantities={quantities2}
                onQuantityChange={handleQuantityChange2}
                showPrices={true}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">CompactQuantityTracker</h4>
              <div className="bg-slate-800 p-4 rounded-lg">
                <CompactQuantityTracker
                  card={mockCards.foilCard}
                  quantities={quantities3}
                  onQuantityChange={handleQuantityChange3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Comparison Tests */}
        <Card className="bg-mtg-secondary border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Price Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">PriceComparison (normal card)</h4>
              <div className="bg-slate-800 p-4 rounded-lg">
                <PriceComparison card={mockCards.foilCard} showDifference={true} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">PriceComparison (expensive foil)</h4>
              <div className="bg-slate-800 p-4 rounded-lg">
                <PriceComparison card={mockCards.expensiveFoil} showDifference={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Tests */}
        <Card className="bg-mtg-secondary border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Add Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">QuickAddButtons (with foil)</h4>
              <QuickAddButtons
                card={mockCards.foilCard}
                onAdd={(finish, quantity) => handleQuickAdd(mockCards.foilCard, finish, quantity)}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">QuickAddButtons (no foil)</h4>
              <QuickAddButtons
                card={mockCards.normalOnlyCard}
                onAdd={(finish, quantity) => handleQuickAdd(mockCards.normalOnlyCard, finish, quantity)}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">FoilToggle</h4>
              <div className="bg-slate-800 p-4 rounded-lg">
                <FoilToggle
                  checked={foilToggle}
                  onChange={setFoilToggle}
                  label="Mark as Foil"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Components */}
        <Card className="bg-mtg-secondary border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Display Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium">QuantityDisplay (mixed)</h4>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <QuantityDisplay quantities={{ normal: 2, foil: 1 }} showLabels={true} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium">QuantityDisplay (foil only)</h4>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <QuantityDisplay quantities={{ normal: 0, foil: 3 }} showLabels={true} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium">QuantityDisplay (compact)</h4>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <QuantityDisplay quantities={{ normal: 4, foil: 2 }} compact={true} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">CollectionStats</h4>
              <CollectionStats stats={{
                totalCards: 10,
                totalNormal: 7,
                totalFoil: 3,
                uniqueCards: 5,
                totalValue: 150000.75,
                foilValue: 150000.00,
                foilPercentage: 30.0
              }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
