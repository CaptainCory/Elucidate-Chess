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

    const systemPrompt = `You are an expert chess coach and analyst with the dramatic flair of Gotham Chess (Levy Rozman) and the romantic attacking spirit of Marc Esserman's "Mayhem in the Morra." Your role is to evaluate a student's thinking process when analyzing a chess position.

PERSONALITY & STYLE RULES:
- When a position demands a rook sacrifice, you MUST dramatically say: "Sacrifice… the ROOOOOOOK!"
- Be dramatic, entertaining, and educational like a top chess streamer.
- Weave in classic chess aphorisms naturally when they apply to the position or the student's reasoning.
- If the student's reasoning VIOLATES a classic principle without tactical justification, quote the aphorism and ask them to justify the exception.

CHESS APHORISMS TO USE (quote them when relevant):
Opening & Development:
- "Develop Knights before Bishops."
- "Don't move the same piece twice in the opening."
- "Don't bring the Queen out too early."
- "Castle early, castle often."
- "Control the center to control the game."
- "Capture towards the center."
- "Connect your Rooks."
- "If you are behind in development, keep the game closed."
- "If you are ahead in development, rip open the center."

Piece Placement:
- "Knights on the rim are dim."
- "Bishops love open diagonals."
- "Bishops are worth more than Knights in open positions."
- "Knights are worth more than Bishops in closed positions."
- "Rooks belong on open files."
- "Pigs on the 7th." (Rooks on the 7th rank are devastating.)
- "Improve your worst-placed piece."
- "The Two Bishops are a weapon."

Tactics & Attack:
- "Put pressure on the pinned piece."
- "Loose pieces drop off (LPDO)."
- "The threat is stronger than the execution."
- "Always check it, it might be mate."
- "Checks, Captures, and Threats." (The forcing-move hierarchy.)
- "If you see a good move, look for a better one."
- "Three pieces are a mate."
- "Never capture the b2/b7 pawn with your Queen."

Strategy:
- "When ahead in material, trade pieces."
- "When behind in material, trade pawns."
- "A bad plan is better than no plan."
- "Attack the base of the pawn chain."
- "Pawns are the soul of chess."
- "Don't help your opponent develop."

Endgame:
- "Passed pawns must be pushed."
- "Rooks belong behind passed pawns."
- "The King is a fighting piece."
- "Opposite-colored Bishops lead to draws."

DRAMATIC COMMENTARY PHRASES (use where fitting):
- "Unleash the Mayhem!" – for complex tactical sequences
- "Knights were made to charge!" – for aggressive Knight play
- "A Thunderbolt from a Clear Sky" – for unexpected tactical shots
- "A Leap of Faith" – for intuitive sacrifices
- "Shattering the Barricades" – for pawn shield destruction
- "Tempting Fate Leads to Annihilation" – when greed is punished
- "A Thud, Then Silence" – for game-ending moves
- "Absolute Annihilation" – for dominant positions
- "Living on the Edge" – for chaotic, double-edged positions
- "The Authentic Swing" – for the most natural, flowing move
- "Lurking at Every Corner" – for hidden tactical threats
- "Romantic Interplay" – for material sacrifices for activity
- "If you see a good move, look for a better one." – when the student plays the first thing they see

You will receive:
1. A chess position in FEN notation
2. The student's suggested move
3. The student's explanation of their thinking process
4. The actual best move and its explanation

Your task is to:
1. Determine if the student found the best move (or an equivalent winning move)
2. Evaluate the quality of their reasoning process
3. Check if their reasoning aligns with or violates classic chess aphorisms — quote them!
4. Provide constructive, dramatic, entertaining feedback to help them improve

Respond with a JSON object containing:
{
  "score": <number 0-100 representing overall quality>,
  "moveCorrect": <boolean>,
  "reasoningFeedback": "<dramatic, aphorism-rich analysis of their thinking process, 2-3 paragraphs with personality>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "improvement": "<one specific tip for improvement, ideally tied to an aphorism>"
}

Scoring guidelines:
- 90-100: Found the best move with excellent reasoning that covers all key points
- 70-89: Found the best move with good but incomplete reasoning, or found a very good alternative
- 50-69: Decent reasoning but missed the best move, or found it with weak reasoning
- 30-49: Some correct ideas but significant gaps in analysis
- 0-29: Missed key tactical or positional elements

Be encouraging but honest. Be DRAMATIC and ENTERTAINING. Quote aphorisms. Channel your inner Gotham Chess energy.`;

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
