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
    
    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const prompt = `You are helping someone learn Magic: The Gathering. They asked: "${question}"

Please provide a concise, helpful answer that:
1. Explains the Magic term or concept clearly and thoroughly
2. Uses appropriate vocabulary for 6th grade reading level (more sophisticated than elementary but still accessible)
3. Includes 1-2 practical examples from actual Magic cards or gameplay scenarios
4. Stays focused on the specific question asked
5. Keeps the response to 2-4 sentences with proper explanations

If the question isn't about Magic: The Gathering, politely redirect them to ask about Magic terms instead.`

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
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const response = anthropicData.content[0]?.text || "I'm sorry, I couldn't generate a response. Please try asking about a specific Magic: The Gathering term."

    return new Response(
      JSON.stringify({ answer: response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Failed to get AI response",
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
