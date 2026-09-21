import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Github, ShieldAlert, Cpu, GitFork, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleGitHubLogin = () => {
    // Full page redirect to backend OAuth endpoint
    window.location.href = '/api/auth/github';
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'access_denied':
        return 'Access was denied by GitHub. Please approve the authorization to proceed.';
      case 'missing_code_or_state':
        return 'GitHub authorization failed: missing verification parameters.';
      default:
        return decodeURIComponent(code);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1f6feb]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand & Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/30 text-[#58a6ff] mb-2 shadow-lg shadow-[#1f6feb]/5">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">
            DevIntel AI
          </h1>
          <p className="text-xs text-[#8b949e] max-w-xs mx-auto">
            Autonomous Developer Intelligence & Codebase Reasoning Platform
          </p>
        </div>

        {/* Error Alert if redirected with error */}
        {errorParam && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-xs text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Failed</span>
              <span>{getErrorMessage(errorParam)}</span>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] shadow-xl space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Connect Your Account
            </h2>
            <p className="text-xs text-[#8b949e]">
              Authenticate with your GitHub account to access repositories and developer insights.
            </p>
          </div>

          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <Github className="w-4 h-4" />
            <span>Continue with GitHub</span>
          </button>

          <div className="pt-2 border-t border-[#21262d] text-[11px] text-[#8b949e] space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Full codebase semantic understanding</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#a371f7]" />
              <span>Grounded AI review & architectural inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure server-side token management</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-[#8b949e] font-mono">
          DevIntel AI · Milestone 2 Authentication
        </div>
      </div>
    </div>
  );
};
