import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchHealth, fetchIngestionStatus, triggerIngestion, HealthData } from '../services/api';
import { IngestionStatusResponse } from '../types/intelligence';
import { RepositoryHeaderBar } from '../components/common/RepositoryHeaderBar';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Sparkles,
  MessageSquareCode,
  FileCheck2,
  Bug,
  ListTodo,
  FolderGit2,
  RefreshCw,
  Plus,
  ExternalLink,
  Cpu,
  Layers,
  FileCode2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { repositories, selectedRepo, refreshRepositories } = useRepository();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [repoStatusMap, setRepoStatusMap] = useState<Record<string, IngestionStatusResponse>>({});
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'indexed' | 'indexing' | 'not_indexed'>('all');
  const [indexingId, setIndexingId] = useState<string | null>(null);

  const loadHealthAndStatus = async () => {
    try {
      setLoadingHealth(true);
      const hRes = await fetchHealth();
      if (hRes.data) setHealth(hRes.data);
    } catch {
      // ignore
    } finally {
      setLoadingHealth(false);
    }

    // Fetch ingestion status for each repository
    for (const repo of repositories) {
      fetchIngestionStatus(repo.id)
        .then((res) => {
          if (res.data) {
            setRepoStatusMap((prev) => ({ ...prev, [repo.id]: res.data! }));
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadHealthAndStatus();
  }, [repositories]);

  const handleIndexRepo = async (repoId: string) => {
    try {
      setIndexingId(repoId);
      await triggerIngestion(repoId);
      const res = await fetchIngestionStatus(repoId);
      if (res.data) {
        setRepoStatusMap((prev) => ({ ...prev, [repoId]: res.data! }));
      }
    } catch (err) {
      console.error('Failed to trigger index', err);
    } finally {
      setIndexingId(null);
    }
  };

  // Derive real statistics from existing data
  const totalConnected = repositories.length;
  let indexedCount = 0;
  let inProgressCount = 0;
  let totalIndexedChunks = 0;
  let totalIndexedFiles = 0;

  repositories.forEach((repo) => {
    const status = repoStatusMap[repo.id];
    const jobStatus = status?.latestJob?.status;
    const chunks = status?.totalChunks ?? 0;
    if (chunks > 0 || jobStatus === 'COMPLETED') {
      indexedCount++;
      totalIndexedChunks += chunks;
      if (status?.latestJob?.totalFiles) {
        totalIndexedFiles += status.latestJob.totalFiles;
      }
    } else if (jobStatus === 'IN_PROGRESS' || jobStatus === 'QUEUED') {
      inProgressCount++;
    }
  });

  const filteredRepositories = repositories.filter((repo) => {
    const status = repoStatusMap[repo.id];
    const jobStatus = status?.latestJob?.status;
    const chunks = status?.totalChunks ?? 0;
    const isIndexed = chunks > 0 || jobStatus === 'COMPLETED';
    const isIndexing = jobStatus === 'IN_PROGRESS' || jobStatus === 'QUEUED';

    if (activeTab === 'indexed') return isIndexed;
    if (activeTab === 'indexing') return isIndexing;
    if (activeTab === 'not_indexed') return !isIndexed && !isIndexing;
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#232b3b]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#f0f6fc]">
              Developer Intelligence Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ONLINE
            </span>
          </div>
          <p className="text-xs text-[#8b949e]">
            DevIntel indexes your GitHub repositories to provide grounded codebase chat, code reviews, debugging, and implementation plans.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              refreshRepositories();
              loadHealthAndStatus();
            }}
            disabled={loadingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a24] hover:bg-[#1f2633] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#232b3b] text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-[#58a6ff]' : ''}`} />
            <span>Sync Repositories</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/repositories')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Target Repository Context Bar */}
      <RepositoryHeaderBar />

      {/* 4 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="CONNECTED REPOSITORIES"
          value={totalConnected}
          subtext={user?.login ? `Targeting @${user.login}` : 'Active in workspace'}
          icon={FolderGit2}
        />
        <MetricCard
          label="INDEXED REPOSITORIES"
          value={`${indexedCount} / ${totalConnected}`}
          subtext={inProgressCount > 0 ? `${inProgressCount} in queue / indexing` : 'Repository indexes up to date'}
          icon={ShieldCheck}
        />
        <MetricCard
          label="INDEXED FILES"
          value={totalIndexedFiles > 0 ? totalIndexedFiles.toLocaleString() : '—'}
          subtext="Processed codebase files"
          icon={FileCode2}
        />
        <MetricCard
          label="INDEXED CHUNKS"
          value={totalIndexedChunks > 0 ? totalIndexedChunks.toLocaleString() : '—'}
          subtext="Vector embeddings stored"
          icon={Layers}
        />
      </div>

      {/* AI Intelligence Workbenches Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              AI Intelligence Workbenches
            </h2>
          </div>
          {selectedRepo && (
            <span className="text-[11px] font-mono text-[#8b949e]">
              TARGET: {selectedRepo.name.toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Codebase Chat */}
          <div className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#33425c] transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#1c2433] text-[10px] font-mono text-[#58a6ff] border border-[#2b374d]">
                  Interactive Chat
                </span>
                <MessageSquareCode className="w-4 h-4 text-[#58a6ff]" />
              </div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Codebase Chat</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                Ask questions, explore architecture, and query code logic grounded in your indexed repository.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1c2433] space-y-2">
              {selectedRepo && (
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="truncate">Ready on {selectedRepo.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate(selectedRepo ? `/chat?repo=${selectedRepo.id}` : '/chat')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#58a6ff] border border-[#2b374d] transition-colors"
              >
                <span>Start Codebase Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Code Review */}
          <div className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#33425c] transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#1c2433] text-[10px] font-mono text-emerald-400 border border-[#2b374d]">
                  Git Diff
                </span>
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Code Review</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                Analyze a Git diff against repository context to catch security vulnerabilities and regression bugs.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1c2433] space-y-2">
              <button
                type="button"
                onClick={() => navigate(selectedRepo ? `/review?repo=${selectedRepo.id}` : '/review')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] transition-colors"
              >
                <span>Review Open Diff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Debug Assistant */}
          <div className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#33425c] transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#1c2433] text-[10px] font-mono text-rose-400 border border-[#2b374d]">
                  Diagnostic
                </span>
                <Bug className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Debug Assistant</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                Diagnose errors using repository context and stack traces with targeted code evidence.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1c2433] space-y-2">
              <button
                type="button"
                onClick={() => navigate(selectedRepo ? `/debug?repo=${selectedRepo.id}` : '/debug')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] transition-colors"
              >
                <span>Debug Stack Trace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Implementation Plans */}
          <div className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#33425c] transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#1c2433] text-[10px] font-mono text-[#a371f7] border border-[#2b374d]">
                  Scaffolding
                </span>
                <ListTodo className="w-4 h-4 text-[#a371f7]" />
              </div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Implementation Plans</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                Generate a grounded implementation plan based on the existing codebase without modifying files.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1c2433] space-y-2">
              <button
                type="button"
                onClick={() => navigate(selectedRepo ? `/plans?repo=${selectedRepo.id}` : '/plans')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] transition-colors"
              >
                <span>Draft Implementation Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Repositories Table / Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232b3b] pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Connected Repositories
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#18202d] text-[#8b949e] border border-[#273244]">
              {repositories.length}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#121721] p-0.5 rounded-lg border border-[#232b3b]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#1e2738] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              All ({repositories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('indexed')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'indexed'
                  ? 'bg-[#1e2738] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Indexed ({indexedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('indexing')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'indexing'
                  ? 'bg-[#1e2738] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Indexing ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('not_indexed')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'not_indexed'
                  ? 'bg-[#1e2738] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Not Indexed ({repositories.length - indexedCount - inProgressCount})
            </button>
          </div>
        </div>

        {repositories.length === 0 ? (
          <div className="p-8 text-center bg-[#121721] border border-dashed border-[#232b3b] rounded-xl space-y-3">
            <FolderGit2 className="w-8 h-8 text-[#8b949e] mx-auto opacity-60" />
            <h3 className="text-xs font-semibold text-[#f0f6fc]">No connected repositories yet</h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              Connect a GitHub repository to trigger vector indexing and query your codebase.
            </p>
            <button
              type="button"
              onClick={() => navigate('/repositories')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f6feb] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRepositories.map((repo) => {
              const statusInfo = repoStatusMap[repo.id];
              const job = statusInfo?.latestJob;
              const isIndexing = indexingId === repo.id || job?.status === 'IN_PROGRESS' || job?.status === 'QUEUED';
              const totalChunks = statusInfo?.totalChunks ?? 0;

              return (
                <div
                  key={repo.id}
                  className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#35435c] transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-[#f0f6fc] truncate">
                        {repo.fullName}
                      </span>
                      <StatusBadge
                        status={job?.status || (totalChunks > 0 ? 'COMPLETED' : 'NOT_INDEXED')}
                        chunksCount={totalChunks}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e]">
                      <span>branch: {repo.defaultBranch}</span>
                      {repo.language && (
                        <>
                          <span>•</span>
                          <span className="text-[#58a6ff]">{repo.language}</span>
                        </>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-[#8b949e] line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1c2433] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {repo.githubUrl && (
                        <a
                          href={repo.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                          title="Open on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleIndexRepo(repo.id)}
                        disabled={isIndexing}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#18202d] hover:bg-[#232d3e] text-[11px] font-mono text-[#c9d1d9] border border-[#273244] transition-colors disabled:opacity-50"
                        title="Trigger Indexing"
                      >
                        {isIndexing ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#58a6ff]" />
                        ) : (
                          <Cpu className="w-3 h-3 text-[#58a6ff]" />
                        )}
                        <span>{totalChunks > 0 ? 'Re-index' : 'Index'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/chat?repo=${repo.id}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1f6feb]/15 hover:bg-[#1f6feb]/25 text-[#58a6ff] border border-[#1f6feb]/35 text-xs font-medium transition-colors"
                    >
                      <MessageSquareCode className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Status Footer Bar */}
      <div className="p-3 rounded-xl bg-[#0f141d] border border-[#232b3b] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8b949e] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold text-[#606d85]">
            STATUS:
          </span>
          <span className="text-[#c9d1d9]">
            Repository sync active • Backend {health?.status === 'ok' ? 'Healthy' : 'Degraded'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PostgreSQL & pgvector Connected
          </span>
        </div>
      </div>
    </div>
  );
};
