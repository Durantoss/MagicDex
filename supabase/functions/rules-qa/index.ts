import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question } = await req.json()
    
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create AI prompt for MTG rules
    const prompt = `You are an expert Magic: The Gathering rules advisor. A player is asking about the rules. Please provide a clear, accurate, and concise answer to their question. Focus on the official rules and provide practical examples when helpful.

Player's Question: "${question}"

Please provide a helpful answer that explains the rule clearly and concisely. If the question involves complex interactions, break it down into simple steps. If the question is unclear or too broad, ask for clarification while providing some general guidance.`

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
        max_tokens: 1000,
        system: "You are a Magic: The Gathering rules expert. Provide accurate, clear, and helpful explanations of MTG rules. Keep answers concise but thorough.",
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const answer = anthropicData.content[0].text

    return new Response(
      JSON.stringify({ 
        question,
        answer,
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Failed to get rules answer",
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
