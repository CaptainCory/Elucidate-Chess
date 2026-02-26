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

    const systemPrompt = `You are a calm, concise chess coach. Evaluate a student's move and reasoning for a given position.

BOARD READING PROTOCOL:
Before analyzing, silently parse the FEN character by character. Never reference a piece not in the FEN. Never omit a piece that is present.

STYLE RULES:
- Be warm, encouraging, and direct. No dramatic commentary or catchphrases.
- Keep feedback SHORT — 2-4 sentences max for reasoningFeedback.
- Reference classic chess principles briefly when relevant, but don't quote them as aphorisms.
- Focus on what matters most: was the move correct, and was the reasoning sound?

You will receive the position (FEN), the student's move and reasoning, and the best move with its explanation.

Respond with a JSON object:
{
  "score": <number 0-100>,
  "moveCorrect": <boolean>,
  "reasoningFeedback": "<2-4 sentences of clear, constructive feedback>",
  "keyInsights": ["<insight 1>", "<insight 2>"],
  "improvement": "<one concise tip>"
}

Scoring: 90-100 best move + strong reasoning; 70-89 best move + partial reasoning or strong alternative; 50-69 decent ideas but missed best move; 30-49 significant gaps; 0-29 missed key elements.

Be honest and helpful. Keep it brief.`;

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
