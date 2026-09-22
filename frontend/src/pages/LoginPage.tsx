import React, { useState } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Github, ShieldAlert, Cpu, GitFork, Sparkles, ArrowRight, Play, Info } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, loading, loginDemoUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorParam = searchParams.get('error');
  const [showOAuthNotice, setShowOAuthNotice] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleDemoLogin = () => {
    loginDemoUser();
    navigate('/');
  };

  const handleGitHubLogin = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
    const isGhPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

    // If on GitHub Pages and no custom backend URL is configured, warn instead of throwing 404
    if (isGhPages && !apiBaseUrl) {
      setShowOAuthNotice(true);
      return;
    }

    // Full page redirect to backend OAuth endpoint
    const redirectUrl = apiBaseUrl ? `${apiBaseUrl}/api/auth/github` : '/api/auth/github';
    window.location.href = redirectUrl;
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

        {/* Informational notice if visitor tries OAuth without cloud backend */}
        {showOAuthNotice && (
          <div className="p-4 rounded-xl bg-[#1c2128] border border-[#f0883e]/30 text-xs text-[#c9d1d9] space-y-3">
            <div className="flex items-start gap-2.5 text-[#f0883e]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">GitHub Pages Static Hosting Notice</span>
                <span className="text-[#8b949e] text-[11px] leading-relaxed">
                  Direct GitHub OAuth requires a persistent backend server (Node.js/Postgres/Redis). To explore all features right now without logging in, launch the interactive live demo below!
                </span>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 px-3 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Live Demo Now</span>
            </button>
          </div>
        )}

        {/* Login Card */}
        <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] shadow-xl space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Experience DevIntel AI
            </h2>
            <p className="text-xs text-[#8b949e]">
              Explore repository intelligence, automated code reviews, and AST reasoning.
            </p>
          </div>

          {/* Primary Action for Recruiters & Guests */}
          <div className="space-y-2">
            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-between py-3 px-4 rounded-lg bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:from-[#388bfd] hover:to-[#2ea043] text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/10 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-white/10">
                  <Play className="w-3.5 h-3.5 fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-none">Explore Live Demo</div>
                  <div className="text-[10px] text-blue-100 font-normal mt-0.5">Recruiter & Guest Access • No Sign-In</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#30363d]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-wider text-[#6e7681]">or connect with github</span>
            <div className="flex-grow border-t border-[#30363d]"></div>
          </div>

          {/* Secondary Action: GitHub OAuth */}
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white font-medium text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
          >
            <Github className="w-4 h-4" />
            <span>Continue with GitHub</span>
          </button>

          <div className="pt-2 border-t border-[#21262d] text-[11px] text-[#8b949e] space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Full codebase semantic understanding & RAG</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#a371f7]" />
              <span>Grounded AI review & architectural inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant interactive preview for technical evaluations</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-[#8b949e] font-mono">
          DevIntel AI · Portfolio Showcase Edition
        </div>
      </div>
    </div>
  );
};
