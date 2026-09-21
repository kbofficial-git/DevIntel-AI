import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { fetchHealth, HealthData } from '../services/api';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnectivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchHealth();
      if (response.success && response.data) {
        setHealth(response.data);
      } else {
        setError(response.error?.message || 'Failed to get health status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error communicating with API');
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h1 className="text-xl font-bold text-[#f0f6fc] tracking-tight">
            Developer Platform Overview
          </h1>
          <p className="text-xs text-[#8b949e] mt-1">
            DevIntel AI — Grounded Codebase Intelligence & Engineering Platform
          </p>
        </div>
        <button
          onClick={checkConnectivity}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Connectivity</span>
        </button>
      </div>

      {/* Connectivity Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend API Health */}
        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#8b949e] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#58a6ff]" />
              Backend Service
            </span>
            {loading ? (
              <span className="text-[10px] text-[#8b949e] font-mono">Checking...</span>
            ) : health ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#8b949e]">
              <span>Endpoint</span>
              <span className="font-mono text-[#c9d1d9]">GET /api/health</span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Uptime</span>
              <span className="font-mono text-[#c9d1d9]">
                {health ? `${health.uptimeSeconds}s` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Environment</span>
              <span className="font-mono text-[#c9d1d9]">
                {health?.environment || 'development'}
              </span>
            </div>
          </div>
        </div>

        {/* Database & pgvector Status */}
        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#8b949e] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#79c0ff]" />
              PostgreSQL & pgvector
            </span>
            {loading ? (
              <span className="text-[10px] text-[#8b949e] font-mono">Checking...</span>
            ) : health?.database.connected ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                CONNECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" />
                STANDBY
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#8b949e]">
              <span>Vector Extension</span>
              <span className="font-mono text-[#c9d1d9]">
                {health?.database.pgvectorAvailable ? 'Available' : 'Configured (schema)'}
              </span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>ORM</span>
              <span className="font-mono text-[#c9d1d9]">Prisma Client</span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Latency</span>
              <span className="font-mono text-[#c9d1d9]">
                {health?.database.latencyMs ? `${health.database.latencyMs}ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* System Architecture Node */}
        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#8b949e] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#a371f7]" />
              Architecture Mode
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              MONOLITH
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#8b949e]">
              <span>Frontend</span>
              <span className="font-mono text-[#c9d1d9]">React 18 + Vite</span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Backend</span>
              <span className="font-mono text-[#c9d1d9]">Express + TS</span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Last Checked</span>
              <span className="font-mono text-[#c9d1d9] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8b949e]" />
                {lastChecked ? lastChecked.toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner if API is down */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium block">API Connection Notice:</span>
            <span>{error}</span>
            <div className="mt-1 text-[#8b949e]">
              Ensure backend server is running via <code className="font-mono text-xs bg-[#21262d] px-1 py-0.5 rounded">npm run dev</code> in <code className="font-mono text-xs bg-[#21262d] px-1 py-0.5 rounded">backend/</code>.
            </div>
          </div>
        </div>
      )}

      {/* Raw Health Payload Inspector (Developer Tool Style) */}
      {health && (
        <div className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#30363d] bg-[#21262d]/50 flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-[#c9d1d9] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#58a6ff]" />
              Response: GET /api/health
            </span>
            <span className="text-[10px] font-mono text-emerald-400">HTTP 200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono text-[#c9d1d9] bg-[#0d1117] overflow-x-auto">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}

      {/* Foundation Milestones Card */}
      <div className="p-5 rounded-lg bg-[#161b22] border border-[#30363d]">
        <h2 className="text-sm font-semibold text-[#f0f6fc] mb-3">
          Milestone 1 — Foundation Checklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Node.js + Express + TypeScript modular architecture</span>
          </div>
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Pino structured logging with request trace IDs</span>
          </div>
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Layered separation (routes → controllers → services → repos)</span>
          </div>
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>PostgreSQL & pgvector schema configuration (Prisma ORM)</span>
          </div>
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>React + Vite + Tailwind developer application shell</span>
          </div>
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Docker Compose setup for PostgreSQL with pgvector</span>
          </div>
        </div>
      </div>
    </div>
  );
};
