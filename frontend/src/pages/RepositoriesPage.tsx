import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repository,
  GitHubRepository,
} from '../types/auth';
import {
  IngestionStatusResponse,
} from '../types/intelligence';
import {
  fetchConnectedRepositories,
  fetchGitHubRepositories,
  connectRepository,
  deleteRepository,
  triggerIngestion,
  fetchIngestionStatus,
} from '../services/api';
import {
  FolderGit2,
  Github,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  Lock,
  Globe,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Cpu,
  MessageSquareCode,
  Check,
} from 'lucide-react';

export const RepositoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [connectedRepos, setConnectedRepos] = useState<Repository[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [repoStatusMap, setRepoStatusMap] = useState<Record<string, IngestionStatusResponse>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConnected, setLoadingConnected] = useState(true);
  const [loadingGithub, setLoadingGithub] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);
  const [indexingLoadingId, setIndexingLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadConnected = async () => {
    try {
      setLoadingConnected(true);
      const res = await fetchConnectedRepositories();
      const repos = res.data || [];
      setConnectedRepos(repos);

      // Load indexing status for each connected repository
      for (const repo of repos) {
        fetchIngestionStatus(repo.id)
          .then((statusRes) => {
            if (statusRes.data) {
              setRepoStatusMap((prev) => ({ ...prev, [repo.id]: statusRes.data! }));
            }
          })
          .catch(() => {
            // Silently ignore individual status fetch errors
          });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load connected repositories');
    } finally {
      setLoadingConnected(false);
    }
  };

  const loadGithubRepos = async () => {
    try {
      setLoadingGithub(true);
      const res = await fetchGitHubRepositories();
      setGithubRepos(res.data || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load GitHub repositories');
    } finally {
      setLoadingGithub(false);
    }
  };

  useEffect(() => {
    loadConnected();
    loadGithubRepos();
  }, []);

  const handleConnect = async (repo: GitHubRepository) => {
    try {
      setActionLoadingId(repo.id);
      setErrorMessage(null);
      setSuccessMessage(null);

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
        setConnectedRepos((prev) => [res.data!, ...prev]);
        setSuccessMessage(`Successfully connected ${repo.full_name}`);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect repository');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisconnect = async (repoId: string, repoName: string) => {
    if (!window.confirm(`Disconnect repository ${repoName}?`)) return;

    try {
      setActionLoadingId(repoId);
      setErrorMessage(null);
      setSuccessMessage(null);

      await deleteRepository(repoId);
      setConnectedRepos((prev) => prev.filter((r) => r.id !== repoId));
      setSuccessMessage(`Repository ${repoName} disconnected.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to disconnect repository');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTriggerIndex = async (repoId: string, repoName: string) => {
    try {
      setIndexingLoadingId(repoId);
      setErrorMessage(null);
      setSuccessMessage(null);

      await triggerIngestion(repoId);
      setSuccessMessage(`Indexing started for ${repoName}. Processing codebase chunks in background.`);

      // Poll status every 3s for 30s
      let polls = 0;
      const interval = setInterval(async () => {
        polls++;
        try {
          const statusRes = await fetchIngestionStatus(repoId);
          if (statusRes.data) {
            setRepoStatusMap((prev) => ({ ...prev, [repoId]: statusRes.data! }));
            const status = statusRes.data.latestJob?.status;
            if (status === 'COMPLETED' || status === 'FAILED' || polls > 15) {
              clearInterval(interval);
              setIndexingLoadingId(null);
              if (status === 'COMPLETED') {
                setSuccessMessage(`Indexing completed for ${repoName}! (${statusRes.data.totalChunks} chunks indexed)`);
              }
            }
          }
        } catch {
          clearInterval(interval);
          setIndexingLoadingId(null);
        }
      }, 3000);
    } catch (err) {
      setIndexingLoadingId(null);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to trigger indexing');
    }
  };

  const connectedGithubIds = new Set(connectedRepos.map((r) => r.githubRepoId));

  const filteredGithubRepos = githubRepos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-[#58a6ff]" />
            Repository Management & Intelligence
          </h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Connect repositories, trigger vector indexing, and query codebases with grounded AI assistance.
          </p>
        </div>
        <button
          onClick={() => {
            loadConnected();
            loadGithubRepos();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingConnected || loadingGithub ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-300">
            ×
          </button>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Connected Repositories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Connected Repositories</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#21262d] text-[11px] font-mono text-[#8b949e] border border-[#30363d]">
                {connectedRepos.length}
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">Active in DevIntel</span>
          </div>

          {loadingConnected ? (
            <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-xl">
              <Loader2 className="w-6 h-6 text-[#58a6ff] animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">Loading connected repositories...</p>
            </div>
          ) : connectedRepos.length === 0 ? (
            <div className="p-8 text-center bg-[#161b22] border border-dashed border-[#30363d] rounded-xl space-y-3">
              <FolderGit2 className="w-8 h-8 text-[#8b949e] mx-auto opacity-60" />
              <h3 className="text-xs font-semibold text-[#f0f6fc]">No repositories connected yet</h3>
              <p className="text-xs text-[#8b949e] max-w-xs mx-auto">
                Connect repositories from your GitHub account on the right to start indexing and exploring code.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedRepos.map((repo) => {
                const statusInfo = repoStatusMap[repo.id];
                const job = statusInfo?.latestJob;
                const isIndexing = indexingLoadingId === repo.id || job?.status === 'IN_PROGRESS' || job?.status === 'QUEUED';
                const totalChunks = statusInfo?.totalChunks ?? 0;

                return (
                  <div
                    key={repo.id}
                    className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-[#58a6ff] truncate">
                            {repo.fullName}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                            {repo.private ? (
                              <>
                                <Lock className="w-2.5 h-2.5" /> Private
                              </>
                            ) : (
                              <>
                                <Globe className="w-2.5 h-2.5" /> Public
                              </>
                            )}
                          </span>
                          {repo.language && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1f6feb]/10 text-[#58a6ff] border border-[#1f6feb]/30">
                              {repo.language}
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-[#8b949e] line-clamp-2">{repo.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={repo.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDisconnect(repo.id, repo.fullName)}
                          disabled={actionLoadingId === repo.id}
                          className="p-1.5 rounded hover:bg-red-500/10 text-[#8b949e] hover:text-red-400 transition-colors"
                          title="Disconnect repository"
                        >
                          {actionLoadingId === repo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Indexing Status & Action Row */}
                    <div className="pt-2 border-t border-[#21262d] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isIndexing ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-[#e3b341] bg-[#e3b341]/10 px-2 py-0.5 rounded border border-[#e3b341]/30">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Indexing {job?.processedFiles ? `(${job.processedFiles}/${job.totalFiles})` : ''}</span>
                          </span>
                        ) : job?.status === 'COMPLETED' || totalChunks > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            <span>Indexed ({totalChunks} chunks)</span>
                          </span>
                        ) : job?.status === 'FAILED' ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            <span>Index Failed</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#8b949e]">
                            Not Indexed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTriggerIndex(repo.id, repo.fullName)}
                          disabled={isIndexing}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] transition-colors disabled:opacity-50"
                          title="Trigger Codebase Indexing"
                        >
                          <Cpu className="w-3 h-3 text-[#58a6ff]" />
                          <span>{totalChunks > 0 ? 'Re-index' : 'Index'}</span>
                        </button>

                        <button
                          onClick={() => navigate(`/chat?repo=${repo.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f6feb]/15 hover:bg-[#1f6feb]/25 border border-[#1f6feb]/30 text-[11px] font-mono text-[#58a6ff] transition-colors"
                          title="Ask questions about this codebase"
                        >
                          <MessageSquareCode className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Available from GitHub */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-[#8b949e]" />
              <h2 className="text-sm font-semibold text-[#f0f6fc]">GitHub Repositories</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#21262d] text-[11px] font-mono text-[#8b949e] border border-[#30363d]">
                {githubRepos.length}
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">From GitHub Account</span>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search GitHub repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          {loadingGithub ? (
            <div className="p-12 text-center bg-[#161b22] border border-[#30363d] rounded-xl">
              <Loader2 className="w-6 h-6 text-[#58a6ff] animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">Fetching repositories from GitHub...</p>
            </div>
          ) : filteredGithubRepos.length === 0 ? (
            <div className="p-8 text-center bg-[#161b22] border border-dashed border-[#30363d] rounded-xl">
              <p className="text-xs text-[#8b949e]">
                {searchQuery ? 'No repositories matching search query.' : 'No repositories found on GitHub.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredGithubRepos.map((repo) => {
                const isConnected = connectedGithubIds.has(repo.id);
                const isLoading = actionLoadingId === repo.id;

                return (
                  <div
                    key={repo.id}
                    className="p-3.5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#3b434b] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-[#f0f6fc] truncate">
                          {repo.full_name}
                        </span>
                        {repo.private && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Private
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
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(repo)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isLoading ? (
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
