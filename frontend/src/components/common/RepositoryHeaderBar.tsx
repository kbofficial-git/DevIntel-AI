import React, { useState } from 'react';
import { useRepository } from '../../contexts/RepositoryContext';
import { triggerIngestion } from '../../services/api';
import { GitBranch, FolderGit2, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react';

interface RepositoryHeaderBarProps {
  rightAction?: React.ReactNode;
  showBranch?: boolean;
  className?: string;
}

export const RepositoryHeaderBar: React.FC<RepositoryHeaderBarProps> = ({
  rightAction,
  showBranch = true,
  className = '',
}) => {
  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId, refreshRepositories } = useRepository();
  const [reindexing, setReindexing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleReindex = async () => {
    if (!selectedRepoId || reindexing) return;
    try {
      setReindexing(true);
      setFeedbackMsg(null);
      await triggerIngestion(selectedRepoId);
      setFeedbackMsg('Indexing triggered');
      setTimeout(() => setFeedbackMsg(null), 3000);
      refreshRepositories();
    } catch {
      setFeedbackMsg('Failed to trigger indexing');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setReindexing(false);
    }
  };

  if (!selectedRepo) {
    return (
      <div className={`p-3 rounded-xl bg-[#121722] border border-[#232b3b] flex items-center justify-between text-xs text-[#8b949e] ${className}`}>
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#58a6ff]" />
          <span>No repository selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl bg-[#121722] border border-[#232b3b] flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}>
      {/* Left: Target repo selector & Branch */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e]">
          TARGET REPOSITORY:
        </span>

        {/* Repository selector dropdown */}
        <div className="relative inline-flex items-center">
          <FolderGit2 className="w-3.5 h-3.5 text-[#58a6ff] absolute left-2.5 pointer-events-none" />
          <select
            value={selectedRepoId || ''}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="appearance-none pl-8 pr-7 py-1 rounded-lg bg-[#18202d] border border-[#2b374d] text-xs font-semibold text-[#f0f6fc] hover:border-[#3d4d6b] focus:outline-none focus:border-[#58a6ff] cursor-pointer"
          >
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.fullName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] absolute right-2 pointer-events-none" />
        </div>

        {/* Branch pill (dynamic default branch from existing data) */}
        {showBranch && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#18202d] border border-[#2b374d] text-[11px] font-mono text-[#8b949e]">
            <GitBranch className="w-3 h-3 text-[#58a6ff]" />
            <span className="text-[#c9d1d9]">{selectedBranch}</span>
          </div>
        )}

        {/* Open on GitHub link */}
        {selectedRepo.githubUrl && (
          <a
            href={selectedRepo.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded hover:bg-[#18202d] text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {feedbackMsg && (
          <span className="text-[11px] font-mono text-emerald-400 mr-1">
            {feedbackMsg}
          </span>
        )}

        <button
          type="button"
          onClick={handleReindex}
          disabled={reindexing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-[11px] font-mono transition-colors disabled:opacity-50"
          title="Trigger ingestion for target repository"
        >
          <RefreshCw className={`w-3 h-3 ${reindexing ? 'animate-spin text-[#58a6ff]' : 'text-[#8b949e]'}`} />
          <span>Re-index Context</span>
        </button>

        {rightAction}
      </div>
    </div>
  );
};
