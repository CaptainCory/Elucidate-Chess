import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomPuzzle } from '@/data/chessPuzzles';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const puzzle = getRandomPuzzle();
    navigate(`/position/${puzzle.id}`, { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
