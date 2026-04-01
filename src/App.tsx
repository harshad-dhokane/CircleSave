import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StarknetConfig } from '@starknet-react/core';
import { provider, connectors, chains } from '@/lib/starknet';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { CirclesPage } from '@/pages/CirclesPage';
import { CircleDetailPage } from '@/pages/CircleDetailPage';
import { CreateCirclePage } from '@/pages/CreateCirclePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SdkPage } from '@/pages/SdkPage';
import { SwapPage } from '@/pages/SwapPage';
import { DcaPage } from '@/pages/DcaPage';
import { LendingPage } from '@/pages/LendingPage';
import { LogsPage } from '@/pages/LogsPage';
import {
  ApiPage,
  ContractsPage,
  HowItWorksPage,
  LeaderboardPage,
  PrivacyPage,
  RiskDisclosurePage,
  TermsPage,
} from '@/pages/InfoPages';
import { Toaster } from '@/components/ui/sonner';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      autoConnect
    >
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen">
          <div className="site-frame flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/circles" element={<CirclesPage />} />
                <Route path="/circles/create" element={<CreateCirclePage />} />
                <Route path="/circles/:id" element={<CircleDetailPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:address" element={<ProfilePage />} />
                <Route path="/sdk" element={<SdkPage />} />
                <Route path="/swap" element={<SwapPage />} />
                <Route path="/dca" element={<DcaPage />} />
                <Route path="/lending" element={<LendingPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/api" element={<ApiPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </div>
      </BrowserRouter>
    </StarknetConfig>
  );
}

export default App;
