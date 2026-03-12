import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const fetchRandom = async () => {
      // Determine user's current difficulty level
      let difficulty = 'beginner';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_difficulty')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.current_difficulty) {
          difficulty = profile.current_difficulty;
        }
      }

      // Try to find a puzzle at the user's level
      let { data } = await supabase
        .from('puzzles')
        .select('id')
        .eq('difficulty', difficulty)
        .limit(100);

      // Fallback to any puzzle if none at that level
      if (!data || data.length === 0) {
        const result = await supabase.from('puzzles').select('id').limit(100);
        data = result.data;
      }

      if (!data || data.length === 0) {
        console.error('No puzzles available');
        return;
      }

      const randomPuzzle = data[Math.floor(Math.random() * data.length)];
      navigate(`/position/${randomPuzzle.id}`, { replace: true });
    };

    fetchRandom();
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
