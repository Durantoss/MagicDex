import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { deckType, strategy } = await req.json()
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user collection
    const { data: collection, error: collectionError } = await supabaseClient
      .from('collections')
      .select('*')
      .eq('userId', user.id)

    if (collectionError) {
      throw collectionError
    }

    if (!collection || collection.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No cards in collection", 
          message: "Add some cards to your collection first to build decks!" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare collection data for AI analysis
    const collectionSummary = collection.map(item => {
      const cardData = item.cardData as any
      return {
        name: cardData.name,
        type: cardData.type_line,
        colors: cardData.colors || [],
        cmc: cardData.cmc,
        rarity: cardData.rarity,
        quantity: item.quantity,
        oracle_text: cardData.oracle_text || ""
      }
    })

    // Create AI prompt for deck building
    const prompt = `You are an expert Magic: The Gathering deck builder. I have a collection of cards and want to build a playable deck.

My Collection:
${collectionSummary.map(card => 
  `- ${card.name} (${card.type}) - ${card.colors.join('') || 'Colorless'} - CMC ${card.cmc} - Qty: ${card.quantity}${card.oracle_text ? ' - ' + card.oracle_text.slice(0, 100) : ''}`
).join('\n')}

Deck Requirements:
- Deck Type: ${deckType || 'Any format (60 cards minimum)'}
- Strategy: ${strategy || 'Best possible with available cards'}
- Use ONLY cards from my collection
- Build a balanced, playable deck
- Include lands for proper mana base

Please suggest a deck list with:
1. Main deck (60 cards minimum)
2. Brief strategy explanation
3. Mana curve analysis
4. Key synergies
5. Suggested gameplay tips

Format your response as JSON with this structure:
{
  "deckName": "Deck Name",
  "strategy": "Brief strategy description",
  "mainDeck": [
    {"name": "Card Name", "quantity": 4, "category": "Creature/Spell/Land"}
  ],
  "manaBase": "Mana base explanation",
  "synergies": ["Key synergy 1", "Key synergy 2"],
  "gameplayTips": ["Tip 1", "Tip 2"],
  "totalCards": 60
}`

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    // Try to parse JSON response
    let deckSuggestion
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        deckSuggestion = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      // Fallback: return the raw AI response
      deckSuggestion = {
        deckName: "AI Suggested Deck",
        strategy: "See full response for details",
        rawResponse: aiResponse,
        error: "Could not parse structured response"
      }
    }

    return new Response(
      JSON.stringify(deckSuggestion),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate deck suggestions",
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
