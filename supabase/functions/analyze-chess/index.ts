import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Chess } from "npm:chess.js@1.4.0";

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

type PieceKind = 'King' | 'Queen' | 'Rook' | 'Bishop' | 'Knight' | 'Pawn';
type PieceColor = 'white' | 'black';

interface PieceOnBoard {
  square: string;
  piece: PieceKind;
  color: PieceColor;
}

interface PositionVerification {
  pieces: PieceOnBoard[];
  whitePieceCount: number;
  blackPieceCount: number;
  sideToMove: PieceColor;
  castlingRights: string;
  enPassantTarget: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  legalMovesCount: number;
  userMoveLegal: boolean;
  bestMoveLegal: boolean;
  bestMoveLeadsToMate: boolean;
}

const pieceMap: Record<string, PieceKind> = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
};

const normalizeSan = (move: string) =>
  move.replace(/[+#?!]/g, '').replace(/\s+/g, '').toLowerCase();

const parseFenPieces = (fen: string): PieceOnBoard[] => {
  const [boardPart] = fen.split(' ');
  const ranks = boardPart?.split('/') ?? [];

  if (ranks.length !== 8) {
    throw new Error('Invalid FEN: expected 8 ranks');
  }

  const files = 'abcdefgh';
  const pieces: PieceOnBoard[] = [];

  ranks.forEach((rankData, rankIndex) => {
    let fileIndex = 0;

    for (const char of rankData) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
        continue;
      }

      const mappedPiece = pieceMap[char.toLowerCase()];
      if (!mappedPiece) {
        throw new Error(`Invalid FEN: unexpected piece '${char}'`);
      }

      if (fileIndex > 7) {
        throw new Error('Invalid FEN: file index out of bounds');
      }

      pieces.push({
        square: `${files[fileIndex]}${8 - rankIndex}`,
        piece: mappedPiece,
        color: char === char.toUpperCase() ? 'white' : 'black',
      });

      fileIndex += 1;
    }

    if (fileIndex !== 8) {
      throw new Error('Invalid FEN: rank does not sum to 8 squares');
    }
  });

  return pieces;
};

const formatPieceSquare = (piece: PieceOnBoard) => `${piece.piece}@${piece.square}`;

const verifyPosition = (fen: string, bestMove: string, userMove: string): PositionVerification => {
  const pieces = parseFenPieces(fen);
  const chess = new Chess(fen);
  const legalMovesVerbose = chess.moves({ verbose: true }) as Array<{ san: string }>;
  const legalMovesSan = legalMovesVerbose.map((move) => move.san);
  const normalizedLegalMoves = new Set(legalMovesSan.map(normalizeSan));

  const normalizedBestMove = normalizeSan(bestMove);
  const normalizedUserMove = normalizeSan(userMove);

  const bestMoveLegal = normalizedLegalMoves.has(normalizedBestMove);
  const userMoveLegal = normalizedLegalMoves.has(normalizedUserMove);

  let bestMoveLeadsToMate = false;
  if (bestMoveLegal) {
    const bestMoveSan = legalMovesSan.find((move) => normalizeSan(move) === normalizedBestMove);
    if (bestMoveSan) {
      const nextPosition = new Chess(fen);
      nextPosition.move(bestMoveSan);
      bestMoveLeadsToMate = nextPosition.isCheckmate();
    }
  }

  const fenParts = fen.split(' ');
  const sideToMove: PieceColor = fenParts[1] === 'b' ? 'black' : 'white';

  return {
    pieces,
    whitePieceCount: pieces.filter((piece) => piece.color === 'white').length,
    blackPieceCount: pieces.filter((piece) => piece.color === 'black').length,
    sideToMove,
    castlingRights: fenParts[2] ?? '-',
    enPassantTarget: fenParts[3] ?? '-',
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    legalMovesCount: legalMovesSan.length,
    userMoveLegal,
    bestMoveLegal,
    bestMoveLeadsToMate,
  };
};

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

    const positionVerification = verifyPosition(fen, bestMove, userMove);
    const whitePiecesSummary = positionVerification.pieces
      .filter((piece) => piece.color === 'white')
      .map(formatPieceSquare)
      .join(', ');
    const blackPiecesSummary = positionVerification.pieces
      .filter((piece) => piece.color === 'black')
      .map(formatPieceSquare)
      .join(', ');
    const sideToMoveLabel = positionVerification.sideToMove === 'white' ? 'White' : 'Black';

    const systemPrompt = `You are an expert chess coach and analyst with the dramatic flair of Gotham Chess (Levy Rozman) and the romantic attacking spirit of Marc Esserman's "Mayhem in the Morra." Your role is to evaluate a student's thinking process when analyzing a chess position.

CRITICAL — BOARD READING PROTOCOL (DO THIS FIRST, EVERY TIME):
Before writing a single word of analysis, you MUST silently parse the FEN string character by character and build an exact mental map of every piece on the board. FEN notation encodes ranks 8→1 left to right; uppercase = White, lowercase = Black; digits = consecutive empty squares.

Piece legend: K/k=King, Q/q=Queen, R/r=Rook, B/b=Bishop, N/n=Knight, P/p=Pawn.

After parsing, mentally verify:
1. Count and locate EVERY White piece (K, Q, R, B, N, P).
2. Count and locate EVERY Black piece (k, q, r, b, n, p).
3. Identify which side is to move (second field of FEN: 'w' or 'b').
4. Note castling rights (third field) and any en passant square (fourth field).

NEVER reference a piece that is not present in the FEN. NEVER forget a piece that IS present. If your analysis mentions a piece, it must appear in the FEN. This is non-negotiable — incorrect board reading invalidates the entire analysis.


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

    const userPrompt = `=== CHESS POSITION ===
FEN: ${fen}

IMPORTANT: Parse the FEN above FIRST. Identify every piece on the board before proceeding. Do not reference any piece not present in this FEN.

Active side to move: ${sideToMoveLabel}
Difficulty: ${puzzleDifficulty}

=== VERIFIED POSITION FACTS (DETERMINISTIC ENGINE) ===
White pieces (${positionVerification.whitePieceCount}): ${whitePiecesSummary || 'None'}
Black pieces (${positionVerification.blackPieceCount}): ${blackPiecesSummary || 'None'}
Castling rights: ${positionVerification.castlingRights}
En passant target: ${positionVerification.enPassantTarget}
Current position in check: ${positionVerification.isCheck ? 'Yes' : 'No'}
Current position is checkmate: ${positionVerification.isCheckmate ? 'Yes' : 'No'}
Current position is stalemate: ${positionVerification.isStalemate ? 'Yes' : 'No'}
Legal move count from this position: ${positionVerification.legalMovesCount}
Student move is legal: ${positionVerification.userMoveLegal ? 'Yes' : 'No'}
Best move is legal: ${positionVerification.bestMoveLegal ? 'Yes' : 'No'}
Best move leads to immediate checkmate: ${positionVerification.bestMoveLeadsToMate ? 'Yes' : 'No'}

Treat the verified facts above as authoritative. Never contradict them.

=== STUDENT SUBMISSION ===
Student's Move (in SAN): ${userMove}
Student's Thinking Process:
"""
${userThinking}
"""

=== GROUND TRUTH ===
Best Move: ${bestMove}
Correct Explanation: ${puzzleExplanation}

Now analyze the student's response, grounding every claim in the actual pieces present in the FEN above. Provide structured feedback.`;

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
    const responsePayload = {
      ...analysis,
      positionVerification,
    };

    return new Response(JSON.stringify(responsePayload), {
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
