// Central source of truth for tactical themes. Slugs match VocabularyPage anchors
// and are stored in the `puzzles.themes` text[] column.

export interface ThemeOption {
  slug: string;
  title: string;
  summary: string;
}

export const THEMES: ThemeOption[] = [
  { slug: 'fork', title: 'Fork', summary: 'One piece attacks two or more enemy pieces simultaneously.' },
  { slug: 'pin', title: 'Pin', summary: 'A piece cannot move because it would expose a more valuable piece behind it.' },
  { slug: 'skewer', title: 'Skewer', summary: 'Attack a valuable piece that must move, exposing a piece behind it.' },
  { slug: 'discovered-attack', title: 'Discovered Attack', summary: 'Move one piece to reveal an attack from another.' },
  { slug: 'back-rank-mate', title: 'Back Rank Mate', summary: 'Checkmate on the 1st or 8th rank with the king trapped by its own pawns.' },
  { slug: 'smothered-mate', title: 'Smothered Mate', summary: 'A knight checkmates a king blocked by its own pieces.' },
  { slug: 'deflection', title: 'Deflection', summary: 'Force a defender off a key square or duty.' },
  { slug: 'decoy', title: 'Decoy', summary: 'Lure a piece to a bad square.' },
  { slug: 'overloading', title: 'Overloading', summary: 'A piece has too many defensive duties at once.' },
  { slug: 'removing-the-defender', title: 'Removing the Defender', summary: 'Capture or deflect the piece guarding a key square or target.' },
  { slug: 'zwischenzug', title: 'Intermezzo (Zwischenzug)', summary: 'An unexpected in-between move — also called intermezzo — that changes the evaluation before the expected reply.' },
  { slug: 'sacrifice', title: 'Sacrifice', summary: 'Give up material for a greater positional or tactical gain.' },
  { slug: 'battery', title: 'Battery', summary: 'Two pieces aligned on the same line to amplify pressure.' },
  { slug: 'ladder-mate', title: 'Ladder Mate', summary: 'Two heavy pieces walk the king to the edge for mate.' },
  { slug: 'x-ray', title: 'X-Ray', summary: 'A piece exerts pressure through another piece.' },
  { slug: 'promotion', title: 'Pawn Promotion', summary: 'A pawn reaches the last rank and becomes a stronger piece.' },
  { slug: 'attraction', title: 'Attraction', summary: 'Force a piece (usually the king) to a vulnerable square.' },
  { slug: 'double-check', title: 'Double Check', summary: 'Two pieces give check at once — the king must move.' },
  { slug: 'windmill', title: 'Windmill', summary: 'Repeating discovered checks that rake material on every cycle.' },
  { slug: 'trapped-piece', title: 'Trapped Piece', summary: 'A piece has no safe squares and will be lost.' },
  { slug: 'mating-net', title: 'Mating Net', summary: 'A web of threats from which the king cannot escape.' },
  { slug: 'perpetual-check', title: 'Perpetual Check', summary: 'A repeating sequence of checks that forces a draw.' },
  { slug: 'fortress', title: 'Fortress', summary: 'A defensive setup that the opponent cannot break through, securing a draw.' },
  { slug: 'umbrella-pawn', title: 'Umbrella Pawn', summary: 'A pawn shelter that protects the king from checks and attacks, common in endgames.' },
  { slug: 'checkmate', title: 'Checkmate', summary: 'The ultimate goal — trap the enemy king so it has no escape and the game ends.' },
  { slug: 'check', title: 'Check', summary: 'A direct attack on the enemy king that must be answered immediately.' },
  { slug: 'double-attack', title: 'Double Attack', summary: 'A single move that creates two threats at once.' },
  { slug: 'back-rank', title: 'Back Rank', summary: 'A weak back rank where the king is hemmed in by its own pawns — fertile ground for threats and tactics.' },
  { slug: 'material-advantage', title: 'Material Advantage', summary: 'Win decisive material — sometimes the goal is mate, sometimes it is simply gaining a piece or pawns that wins the game.' },
  { slug: 'pawn-break', title: 'Pawn Break', summary: 'A pawn push that challenges the opponent\'s pawn structure and opens lines.' },
];

export const THEME_BY_SLUG: Record<string, ThemeOption> = Object.fromEntries(
  THEMES.map((t) => [t.slug, t]),
);

export function themeTitle(slug: string): string {
  return THEME_BY_SLUG[slug]?.title ?? slug.replace(/-/g, ' ');
}
