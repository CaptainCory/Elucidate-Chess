import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnalysisRequest {
  fen: string;
  userThinking: string;
  userMove: string;
  bestMove: string;
  puzzleExplanation: string;
  puzzleDifficulty: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fen, userThinking, userMove, bestMove, puzzleExplanation, puzzleDifficulty }: AnalysisRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert chess coach and analyst. Your role is to evaluate a student's thinking process when analyzing a chess position.

You will receive:
1. A chess position in FEN notation
2. The student's suggested move
3. The student's explanation of their thinking process
4. The actual best move and its explanation

Your task is to:
1. Determine if the student found the best move (or an equivalent winning move)
2. Evaluate the quality of their reasoning process
3. Identify what they understood correctly and what they missed
4. Provide constructive feedback to help them improve

Respond with a JSON object containing:
{
  "score": <number 0-100 representing overall quality>,
  "moveCorrect": <boolean>,
  "reasoningFeedback": "<detailed analysis of their thinking process, 2-3 paragraphs>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "improvement": "<one specific tip for improvement>"
}

Scoring guidelines:
- 90-100: Found the best move with excellent reasoning that covers all key points
- 70-89: Found the best move with good but incomplete reasoning, or found a very good alternative move
- 50-69: Decent reasoning but missed the best move, or found the best move with weak reasoning
- 30-49: Some correct ideas but significant gaps in analysis
- 0-29: Missed key tactical or positional elements

Be encouraging but honest. Focus on helping them develop better thinking patterns.`;

    const userPrompt = `Chess Position (FEN): ${fen}
Difficulty: ${puzzleDifficulty}

Student's Move: ${userMove}
Student's Thinking Process:
"""
${userThinking}
"""

Best Move: ${bestMove}
Correct Explanation: ${puzzleExplanation}

Please analyze the student's response and provide structured feedback.`;

    console.log('Calling AI gateway for chess analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-chess function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
