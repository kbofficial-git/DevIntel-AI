import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RepositoryProvider } from './contexts/RepositoryContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { ChatPage } from './pages/ChatPage';
import { ReviewPage } from './pages/ReviewPage';
import { DebugPage } from './pages/DebugPage';
import { PlansPage } from './pages/PlansPage';
import { Construction } from 'lucide-react';

const PlaceholderPage: React.FC<{ title: string; phase: string }> = ({ title, phase }) => (
  <div className="p-8 rounded-lg bg-[#161b22] border border-[#30363d] text-center max-w-lg mx-auto mt-12 space-y-3">
    <div className="w-10 h-10 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] mx-auto">
      <Construction className="w-5 h-5" />
    </div>
    <h2 className="text-base font-semibold text-[#f0f6fc]">{title}</h2>
    <p className="text-xs text-[#8b949e]">
      This module is scheduled for implementation in <span className="font-mono text-[#58a6ff]">{phase}</span>.
    </p>
    <div className="pt-2 text-[11px] font-mono text-[#8b949e]">
      Milestone 4 scope preserved.
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <RepositoryProvider>
          <Routes>
            {/* Public login route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected platform routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="repositories" element={<RepositoriesPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="debug" element={<DebugPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="codebase" element={<PlaceholderPage title="Codebase Explorer" phase="Phase 4" />} />
              <Route path="activity" element={<PlaceholderPage title="Activity & Observability" phase="Phase 11" />} />
              <Route path="settings" element={<PlaceholderPage title="Platform Settings" phase="Phase 12" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RepositoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
