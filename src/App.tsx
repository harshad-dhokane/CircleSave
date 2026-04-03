import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StarknetConfig } from '@starknet-react/core';
import { provider, paymasterProvider, connectors, chains } from '@/lib/starknet';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { HomePage } from '@/pages/HomePage';
import { CirclesPage } from '@/pages/CirclesPage';
import { CircleDetailPage } from '@/pages/CircleDetailPage';
import { CreateCirclePage } from '@/pages/CreateCirclePage';
import { SdkPage } from '@/pages/SdkPage';
import { SwapPage } from '@/pages/SwapPage';
import { BatchingPage } from '@/pages/BatchingPage';
import { DcaPage } from '@/pages/DcaPage';
import { LendingPage } from '@/pages/LendingPage';
import { LogsPage } from '@/pages/LogsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
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
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      paymasterProvider={paymasterProvider}
      connectors={connectors}
      autoConnect
    >
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route element={<AppShellLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:address" element={<ProfilePage />} />
            <Route path="/circles" element={<CirclesPage />} />
            <Route path="/circles/create" element={<CreateCirclePage />} />
            <Route path="/circles/:id" element={<CircleDetailPage />} />
            <Route path="/help" element={<SdkPage />} />
            <Route path="/sdk" element={<Navigate to="/help" replace />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/batching" element={<BatchingPage />} />
            <Route path="/dca" element={<DcaPage />} />
            <Route path="/lending" element={<LendingPage />} />
            <Route path="/staking" element={<Navigate to="/dashboard" replace />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/api" element={<ApiPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </StarknetConfig>
  );
}

export default App;
