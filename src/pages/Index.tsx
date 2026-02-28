import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomPuzzle } from '@/data/chessPuzzles';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const puzzle = getRandomPuzzle();
    navigate(`/position/${puzzle.id}`, { replace: true });
  }, [loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
