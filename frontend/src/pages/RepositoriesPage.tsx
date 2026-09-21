import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import {
  GitHubRepository,
} from '../types/auth';
import {
  IngestionStatusResponse,
} from '../types/intelligence';
import {
  fetchGitHubRepositories,
  connectRepository,
  deleteRepository,
  triggerIngestion,
  fetchIngestionStatus,
} from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FolderGit2,
  GitBranch,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  MessageSquareCode,
  FileCheck2,
  Bug,
  ListTodo,
  ShieldCheck,
  Lock,
  Globe,
  Star,
  GitFork,
  Search,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const RepositoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId, refreshRepositories } = useRepository();

  const [repoStatus, setRepoStatus] = useState<IngestionStatusResponse | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load indexing status for selected repo
  const loadStatus = async (repoId: string) => {
    try {
      const res = await fetchIngestionStatus(repoId);
      if (res.data) setRepoStatus(res.data);
    } catch {
      setRepoStatus(null);
    }
  };

  useEffect(() => {
    if (!selectedRepoId) return;
    loadStatus(selectedRepoId);

    const interval = setInterval(() => {
      loadStatus(selectedRepoId);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRepoId]);

  const loadGithub = async () => {
    try {
      setLoadingGithub(true);
      const res = await fetchGitHubRepositories();
      setGithubRepos(res.data || []);
    } catch (err) {
      console.error('Failed to load GitHub repositories', err);
    } finally {
      setLoadingGithub(false);
    }
  };

  const handleTriggerIndex = async () => {
    if (!selectedRepoId || indexing) return;
    try {
      setIndexing(true);
      setMessage({ type: 'success', text: `Indexing started for ${selectedRepo?.fullName}.` });
      await triggerIngestion(selectedRepoId);
      await loadStatus(selectedRepoId);
      refreshRepositories();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to trigger indexing' });
    } finally {
      setIndexing(false);
    }
  };

  const handleConnect = async (repo: GitHubRepository) => {
    try {
      setActionLoadingId(repo.id);
      const res = await connectRepository({
        githubRepoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        description: repo.description,
        defaultBranch: repo.default_branch,
        private: repo.private,
        githubUrl: repo.html_url,
        language: repo.language,
      });

      if (res.data) {
        setMessage({ type: 'success', text: `Connected ${repo.full_name}` });
        await refreshRepositories();
        setSelectedRepoId(res.data.id);
        setShowConnectModal(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to connect repository' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisconnect = async (repoId: string, repoName: string) => {
    if (!window.confirm(`Disconnect repository ${repoName}?`)) return;
    try {
      setActionLoadingId(repoId);
      await deleteRepository(repoId);
      setMessage({ type: 'success', text: `Repository ${repoName} disconnected.` });
      await refreshRepositories();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to disconnect repository' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || !selectedRepoId) return;
    navigate(`/chat?repo=${selectedRepoId}&q=${encodeURIComponent(chatPrompt)}`);
  };

  const connectedGithubIds = new Set(repositories.map((r) => r.githubRepoId));
  const filteredGithubRepos = githubRepos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalChunks = repoStatus?.totalChunks ?? 0;
  const job = repoStatus?.latestJob;
  const isIndexed = totalChunks > 0 || job?.status === 'COMPLETED';

  return (
    <div className="space-y-6 pb-12">
      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Workspace Header Banner */}
      {selectedRepo ? (
        <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff] shrink-0">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-[#f0f6fc] truncate">
                  {selectedRepo.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                  DEFAULT
                </span>
                <StatusBadge
                  status={job?.status || (isIndexed ? 'COMPLETED' : 'NOT_INDEXED')}
                  chunksCount={totalChunks}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-mono flex-wrap">
                <span>{selectedRepo.fullName}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#c9d1d9]">
                  <GitBranch className="w-3 h-3 text-[#58a6ff]" />
                  {selectedBranch}
                </span>
                {selectedRepo.language && (
                  <>
                    <span>•</span>
                    <span className="text-[#58a6ff]">{selectedRepo.language}</span>
                  </>
                )}
                {repoStatus?.repository.lastIndexedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Indexed {new Date(repoStatus.repository.lastIndexedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {job?.status === 'FAILED' && job.errorMessage && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-400 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Indexing Error: {job.errorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Repository Selector Dropdown */}
              <select
                value={selectedRepoId || ''}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#18202d] border border-[#2b374d] text-xs font-semibold text-[#f0f6fc] focus:outline-none"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleTriggerIndex}
                disabled={indexing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${indexing ? 'animate-spin text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                <span>Re-index Repository</span>
              </button>

              {selectedRepo.githubUrl && (
                <a
                  href={selectedRepo.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono transition-colors"
                >
                  <span>Open in GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowConnectModal(true);
                  loadGithub();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Repo</span>
              </button>
            </div>
          </div>

          {/* 4 Stat Boxes Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1c2433]">
            <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433]">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                INDEXED FILES
              </span>
              <span className="text-base font-bold font-mono text-[#f0f6fc] mt-0.5 block">
                {job?.totalFiles ? job.totalFiles.toLocaleString() : isIndexed ? 'Verified' : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433]">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                INDEXED CHUNKS
              </span>
              <span className="text-base font-bold font-mono text-[#f0f6fc] mt-0.5 block">
                {totalChunks > 0 ? totalChunks.toLocaleString() : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433]">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                INDEXING STATUS
              </span>
              <span className="text-xs font-bold font-mono text-emerald-400 mt-1 block">
                {isIndexed ? '• Indexed' : '• Pending Index'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433]">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                LAST INDEXED
              </span>
              <span className="text-xs font-mono text-[#c9d1d9] mt-1 block truncate">
                {repoStatus?.repository.lastIndexedAt
                  ? new Date(repoStatus.repository.lastIndexedAt).toLocaleDateString()
                  : 'Pending initial index'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-[#121721] border border-[#232b3b] rounded-2xl space-y-4">
          <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-60" />
          <h2 className="text-sm font-bold text-[#f0f6fc]">No Repository Connected</h2>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            Connect a repository from your GitHub account to access the workspace and intelligence tools.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowConnectModal(true);
              loadGithub();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f6feb] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Connect GitHub Repository</span>
          </button>
        </div>
      )}

      {/* Two-Column Workspace Layout */}
      {selectedRepo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Codebase Chat Quick-Launch Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MessageSquareCode className="w-4 h-4 text-[#58a6ff]" />
                    <h2 className="text-sm font-bold text-[#f0f6fc]">Codebase Chat</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                      Target: {selectedRepo.name} ({selectedBranch})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                      RAG Grounded
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Ask architectural questions, locate implementation logic, or explain pipeline flows across indexed files.
                </p>
              </div>

              {/* Sample Suggested Prompts */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-[#8b949e] block">
                  Suggested inquiries for this repository:
                </span>
                <div className="space-y-1.5">
                  {[
                    'Explain the overall architecture and folder structure of this project.',
                    'Where is authentication and request validation handled?',
                    'How does the repository indexing and embedding pipeline work?',
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => navigate(`/chat?repo=${selectedRepo.id}&q=${encodeURIComponent(prompt)}`)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0c1017] hover:bg-[#18202d] border border-[#232b3b] hover:border-[#3d4d6b] text-xs text-[#c9d1d9] hover:text-[#f0f6fc] transition-colors flex items-center justify-between gap-2 group"
                    >
                      <span className="truncate">"{prompt}"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompt Input Form */}
              <form onSubmit={handleQuickChat} className="pt-2 border-t border-[#1c2433] space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    placeholder={`Ask anything about ${selectedRepo.name}...`}
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                  />
                  <button
                    type="submit"
                    disabled={!chatPrompt.trim()}
                    className="absolute right-1.5 p-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-30 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-mono">
                  <span>Press Enter to open in full Codebase Chat</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat?repo=${selectedRepo.id}`)}
                    className="text-[#58a6ff] hover:underline flex items-center gap-1"
                  >
                    <span>Open full chat workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Intelligence Actions & Lifecycle States */}
          <div className="lg:col-span-5 space-y-4">
            {/* Intelligence Actions Panel */}
            <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
                  Intelligence Actions
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                  READ-ONLY ANALYSIS
                </span>
              </div>

              {/* Action 1: Code Review */}
              <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-[#f0f6fc]">Code Review</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    Diff Analysis
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e]">
                  Analyze a Git diff against indexed repository context.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/review?repo=${selectedRepo.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#273244] transition-colors"
                >
                  <span>Review Diff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action 2: Debug Assistant */}
              <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-[#f0f6fc]">Debug Assistant</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">
                    Diagnostic
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e]">
                  Diagnose an error using stack traces and repository context.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/debug?repo=${selectedRepo.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#273244] transition-colors"
                >
                  <span>Diagnose Error</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action 3: Implementation Plans */}
              <div className="p-3 rounded-xl bg-[#0c1017] border border-[#1c2433] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-[#a371f7]" />
                    <span className="text-xs font-semibold text-[#f0f6fc]">Implementation Plans</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#a371f7]/10 text-[#a371f7] border border-[#a371f7]/25">
                    Scaffolding
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e]">
                  Generate a grounded implementation plan based on the existing codebase.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/plans?repo=${selectedRepo.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#273244] transition-colors"
                >
                  <span>Draft Implementation Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Repository Indexing States & Info */}
            <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
                  Repository Metadata & Policy
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">
                  {isIndexed ? 'Indexed (Up to date)' : 'Pending Index'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#1c2433]">
                  <span className="text-[#8b949e]">Primary Language</span>
                  <span className="text-[#f0f6fc] font-semibold">
                    {selectedRepo.language || 'Multi-language'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1c2433]">
                  <span className="text-[#8b949e]">Visibility</span>
                  <span className="text-[#f0f6fc] flex items-center gap-1">
                    {selectedRepo.private ? (
                      <>
                        <Lock className="w-3 h-3 text-[#d29922]" /> Private
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-[#58a6ff]" /> Public
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1c2433]">
                  <span className="text-[#8b949e]">Default Branch</span>
                  <span className="text-[#58a6ff]">{selectedBranch}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8b949e]">Execution Mode</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Analysis Mode
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1c2433]">
                <button
                  type="button"
                  onClick={() => handleDisconnect(selectedRepo.id, selectedRepo.fullName)}
                  disabled={actionLoadingId === selectedRepo.id}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 text-xs font-mono text-rose-400 border border-rose-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect Repository</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repository Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121721] border border-[#232b3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#232b3b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Connect GitHub Repositories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#232b3b] bg-[#0c1017]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search available repositories from your GitHub account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#121721] border border-[#232b3b] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {loadingGithub ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff] mx-auto mb-2" />
                  <p className="text-xs text-[#8b949e]">Fetching repositories from GitHub...</p>
                </div>
              ) : filteredGithubRepos.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8b949e]">
                  No repositories found matching your query.
                </div>
              ) : (
                filteredGithubRepos.map((repo) => {
                  const isConnected = connectedGithubIds.has(repo.id);
                  const isConnecting = actionLoadingId === repo.id;

                  return (
                    <div
                      key={repo.id}
                      className="p-3.5 rounded-xl bg-[#0c1017] border border-[#1c2433] hover:border-[#2b374d] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#f0f6fc] truncate">
                            {repo.full_name}
                          </span>
                          {repo.private && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18202d] text-[#8b949e] border border-[#273244] flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5 text-[#d29922]" /> Private
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#8b949e]">
                          {repo.language && <span>{repo.language}</span>}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#d29922]" /> {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" /> {repo.forks_count}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConnect(repo)}
                            disabled={isConnecting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                          >
                            {isConnecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
