import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AmazonSticker } from "@/components/AmazonSticker";
import Index from "./pages/Index";
import PositionPage from "./pages/PositionPage";
import ProfilePage from "./pages/ProfilePage";
import Membership from "./pages/Membership";
import LeaderboardPage from "./pages/LeaderboardPage";
import HowItWorks from "./pages/HowItWorks";
import AddPuzzlePage from "./pages/AddPuzzlePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AmazonSticker />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/position/:id" element={<PositionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/add-puzzle" element={<AddPuzzlePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
