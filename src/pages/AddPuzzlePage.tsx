import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Lock, Crown, ArrowLeft, Plus, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MobileNav } from '@/components/MobileNav';
import { UserMenu } from '@/components/UserMenu';
import { AuthModal } from '@/components/AuthModal';
import { PlanBadge } from '@/components/PlanBadge';
import type { ChessTheme, ChessPuzzle } from '@/data/chessPuzzles';

const ACCESS_CODE = 'PAULMORPHY';

const ALL_THEMES: ChessTheme[] = [
  'fork', 'pin', 'skewer', 'discovered-attack', 'double-check', 'deflection',
  'decoy', 'overloading', 'removing-the-defender', 'zwischenzug', 'trapped-piece',
  'back-rank-checkmate', 'smothered-mate', 'checkmate', 'sacrifice', 'hanging-piece',
  'x-ray', 'promotion', 'endgame', 'battery', 'quiet-move',
];

const DIFFICULTIES: ChessPuzzle['difficulty'][] = ['beginner', 'intermediate', 'advanced', 'master'];

export default function AddPuzzlePage() {
  const { user, loading, isPremium } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  // Gate states
  const [codeInput, setCodeInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Form state
  const [form, setForm] = useState({
    id: '',
    name: '',
    fen: '',
    previousFen: '',
    bestMove: '',
    difficulty: '' as ChessPuzzle['difficulty'] | '',
    explanation: '',
  });
  const [selectedThemes, setSelectedThemes] = useState<ChessTheme[]>([]);
  const [output, setOutput] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You need to be signed in with a premium account to access the puzzle editor.
        </p>
        <Button onClick={() => setShowSignIn(true)} className="bg-primary text-primary-foreground">
          Sign In
        </Button>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to puzzles
        </Link>
        <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
      </div>
    );
  }

  // Not premium
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Crown className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Premium Required</h1>
        <p className="text-muted-foreground text-center max-w-md">
          The puzzle editor is available exclusively to premium members.
        </p>
        <Link to="/membership">
          <Button className="bg-primary text-primary-foreground">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to puzzles
        </Link>
      </div>
    );
  }

  // Code gate
  if (!authenticated) {
    const handleSubmitCode = () => {
      if (codeInput.trim().toUpperCase() === ACCESS_CODE) {
        setAuthenticated(true);
        setCodeError(false);
      } else {
        setCodeError(true);
      }
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Enter Access Code</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This area is restricted. Enter the access code to continue.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <div className="relative">
            <Input
              type={showCode ? 'text' : 'password'}
              placeholder="Access code"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCode()}
              className={codeError ? 'border-destructive' : ''}
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {codeError && <p className="text-sm text-destructive">Incorrect access code.</p>}
          <Button onClick={handleSubmitCode} className="w-full bg-primary text-primary-foreground">
            Enter
          </Button>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to puzzles
        </Link>
      </div>
    );
  }

  const toggleTheme = (theme: ChessTheme) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateOutput = () => {
    if (!form.id || !form.name || !form.fen || !form.previousFen || !form.bestMove || !form.difficulty || !form.explanation || selectedThemes.length === 0) {
      setOutput('// ❌ Please fill in all fields and select at least one theme.');
      return;
    }

    const puzzle = {
      id: `'${form.id}'`,
      name: `'${form.name.replace(/'/g, "\\'")}'`,
      fen: `'${form.fen}'`,
      previousFen: `'${form.previousFen}'`,
      bestMove: `'${form.bestMove}'`,
      difficulty: `'${form.difficulty}'` as string,
      explanation: `'${form.explanation.replace(/'/g, "\\'")}'`,
      themes: `[${selectedThemes.map((t) => `'${t}'`).join(', ')}]`,
    };

    const code = `{
  id: ${puzzle.id},
  name: ${puzzle.name},
  fen: ${puzzle.fen},
  previousFen: ${puzzle.previousFen},
  bestMove: ${puzzle.bestMove},
  difficulty: ${puzzle.difficulty},
  explanation: ${puzzle.explanation},
  themes: ${puzzle.themes},
},`;

    setOutput(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground hidden sm:inline">ChessThink</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Puzzle Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge />
            <div className="hidden lg:block"><UserMenu /></div>
            <MobileNav user={user} onSignIn={() => {}} />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Puzzle</h1>
            <p className="text-sm text-muted-foreground mt-1">Fill out the form to generate a puzzle entry for chessPuzzles.ts</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">Puzzle ID</Label>
              <Input id="id" placeholder="e.g. 13" value={form.id} onChange={(e) => updateField('id', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Puzzle Name</Label>
              <Input id="name" placeholder="e.g. Knight Fork Tactic" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fen">Current FEN</Label>
              <Input id="fen" placeholder="e.g. rnbqkbnr/pppppppp/8/..." value={form.fen} onChange={(e) => updateField('fen', e.target.value)} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">The position the solver will see</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousFen">Previous FEN</Label>
              <Input id="previousFen" placeholder="FEN before opponent's last move" value={form.previousFen} onChange={(e) => updateField('previousFen', e.target.value)} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">Used for the intro animation showing the opponent's move</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bestMove">Best Move (SAN)</Label>
              <Input id="bestMove" placeholder="e.g. Nxf7" value={form.bestMove} onChange={(e) => updateField('bestMove', e.target.value)} className="font-mono" />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => updateField('difficulty', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                placeholder="Explain why this is the best move, what tactical themes are at play..."
                value={form.explanation}
                onChange={(e) => updateField('explanation', e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Themes <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
              <div className="flex flex-wrap gap-2">
                {ALL_THEMES.map((theme) => (
                  <Badge
                    key={theme}
                    variant={selectedThemes.includes(theme) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      selectedThemes.includes(theme)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => toggleTheme(theme)}
                  >
                    {selectedThemes.includes(theme) && <Check className="w-3 h-3 mr-1" />}
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate */}
        <div className="space-y-4">
          <Button onClick={generateOutput} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Generate Puzzle Entry
          </Button>

          {output && (
            <div className="relative">
              <pre className="bg-card border border-border rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {output}
              </pre>
              {!output.startsWith('//') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2"
                >
                  Copy
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
