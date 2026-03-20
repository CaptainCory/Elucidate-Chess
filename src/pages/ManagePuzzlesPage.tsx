import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Brain, Lock, Crown, ArrowLeft, Pencil, Trash2, Save, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { MobileNav } from '@/components/MobileNav';
import { UserMenu } from '@/components/UserMenu';
import { AuthModal } from '@/components/AuthModal';
import { PlanBadge } from '@/components/PlanBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ACCESS_CODE = 'PAULMORPHY';
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'master'] as const;

interface Puzzle {
  id: string;
  name: string;
  fen: string;
  previous_fen: string;
  best_move: string;
  difficulty: string;
  explanation: string;
}

export default function ManagePuzzlesPage() {
  const { user, loading, isPremium } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Puzzle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPuzzles = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('puzzles')
      .select('id, name, fen, previous_fen, best_move, difficulty, explanation')
      .order('difficulty')
      .order('id');
    if (error) {
      toast({ title: 'Error loading puzzles', description: error.message, variant: 'destructive' });
    } else {
      setPuzzles(data || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (authenticated) fetchPuzzles();
  }, [authenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
        <p className="text-muted-foreground text-center max-w-md">You need to be signed in with a premium account.</p>
        <Button onClick={() => setShowSignIn(true)} className="bg-primary text-primary-foreground">Sign In</Button>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to puzzles</Link>
        <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Crown className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Premium Required</h1>
        <Link to="/membership"><Button className="bg-primary text-primary-foreground"><Crown className="w-4 h-4 mr-2" />Upgrade</Button></Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to puzzles</Link>
      </div>
    );
  }

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
            <button type="button" onClick={() => setShowCode(!showCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {codeError && <p className="text-sm text-destructive">Incorrect access code.</p>}
          <Button onClick={handleSubmitCode} className="w-full bg-primary text-primary-foreground">Enter</Button>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to puzzles</Link>
      </div>
    );
  }

  const sanitizeAlphanumeric = (value: string) => value.replace(/[^a-zA-Z0-9 .,;:!?'"\-()+=]/g, '').slice(0, 500);
  const sanitizeFen = (value: string) => value.replace(/[^rnbqkpRNBQKP1-8wbKQa-h0-9 /\-]/g, '').slice(0, 100);
  const sanitizeMove = (value: string) => value.replace(/[^a-zA-Z0-9#+=x\-]/g, '').slice(0, 10);

  const handleEdit = (puzzle: Puzzle) => {
    setEditingPuzzle({ ...puzzle });
  };

  const updateEditField = (field: keyof Puzzle, value: string) => {
    if (!editingPuzzle) return;
    let sanitized = value;
    if (field === 'name') sanitized = sanitizeAlphanumeric(value);
    else if (field === 'explanation') sanitized = sanitizeAlphanumeric(value).slice(0, 500);
    else if (field === 'fen' || field === 'previous_fen') sanitized = sanitizeFen(value);
    else if (field === 'best_move') sanitized = sanitizeMove(value);
    setEditingPuzzle({ ...editingPuzzle, [field]: sanitized });
  };

  const handleSave = async () => {
    if (!editingPuzzle) return;
    const { id, name, fen, previous_fen, best_move, difficulty, explanation } = editingPuzzle;
    if (!name || !fen || !previous_fen || !best_move || !difficulty || !explanation) {
      toast({ title: 'Missing fields', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('puzzles')
      .update({ name, fen, previous_fen, best_move, difficulty, explanation })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Puzzle updated!' });
      setPuzzles(prev => prev.map(p => p.id === id ? editingPuzzle : p));
      setEditingPuzzle(null);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('puzzles').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Puzzle deleted' });
      setPuzzles(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
    setDeleting(false);
  };

  const difficultyColor = (d: string) => {
    if (d === 'beginner') return 'text-green-400';
    if (d === 'intermediate') return 'text-yellow-400';
    if (d === 'advanced') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground hidden sm:inline">Elucidate Chess</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Manage Puzzles</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/add-puzzle"><Button variant="outline" size="sm">Add New</Button></Link>
            <PlanBadge />
            <div className="hidden lg:block"><UserMenu /></div>
            <MobileNav user={user} onSignIn={() => {}} />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Puzzle Catalog</h1>
            <p className="text-sm text-muted-foreground mt-1">{puzzles.length} puzzles · Click edit to modify</p>
          </div>
          <Link to="/"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : puzzles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No puzzles found.</div>
        ) : (
          <div className="space-y-3">
            {puzzles.map(puzzle => (
              <div key={puzzle.id} className="chess-card p-4 rounded-xl flex items-center gap-4">
                <a href={`/position/${puzzle.id}`} className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center cursor-pointer" title={`Go to puzzle ${puzzle.id}`}>
                  <span className="font-mono font-bold text-primary text-sm">{puzzle.id}</span>
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{puzzle.name}</span>
                    <span className={`text-xs font-medium capitalize ${difficultyColor(puzzle.difficulty)}`}>{puzzle.difficulty}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {puzzle.best_move} · {puzzle.explanation.slice(0, 80)}{puzzle.explanation.length > 80 ? '…' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(puzzle)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(puzzle)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPuzzle} onOpenChange={(open) => !open && setEditingPuzzle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Puzzle: {editingPuzzle?.id}</DialogTitle>
            <DialogDescription>Modify the puzzle fields below and save.</DialogDescription>
          </DialogHeader>
          {editingPuzzle && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingPuzzle.name} onChange={(e) => updateEditField('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={editingPuzzle.difficulty} onValueChange={(v) => updateEditField('difficulty', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current FEN</Label>
                <Input value={editingPuzzle.fen} onChange={(e) => updateEditField('fen', e.target.value)} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Previous FEN</Label>
                <Input value={editingPuzzle.previous_fen} onChange={(e) => updateEditField('previous_fen', e.target.value)} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Best Move (SAN)</Label>
                <Input value={editingPuzzle.best_move} onChange={(e) => updateEditField('best_move', e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Explanation</Label>
                <Textarea
                  value={editingPuzzle.explanation}
                  onChange={(e) => updateEditField('explanation', e.target.value)}
                  rows={6}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{editingPuzzle.explanation.length}/500</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingPuzzle(null)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Puzzle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.id} — {deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChessQuoteFooter />
    </div>
  );
}
