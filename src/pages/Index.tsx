import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Fetch a random puzzle from the database
    const fetchRandom = async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('id')
        .limit(100);

      if (error || !data || data.length === 0) {
        console.error('Failed to load puzzles:', error);
        return;
      }

      const randomPuzzle = data[Math.floor(Math.random() * data.length)];
      navigate(`/position/${randomPuzzle.id}`, { replace: true });
    };

    fetchRandom();
  }, [loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
