import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Repository } from '../types/auth';
import {
  CodeReviewResult,
  Severity,
  Citation,
} from '../types/intelligence';
import { fetchConnectedRepositories, reviewCode } from '../services/api';
import {
  FileCheck2,
  FolderGit2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Info,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
  FileCode,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { FeedbackWidget } from '../components/FeedbackWidget';

const severityConfig: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: ShieldAlert,
  },
  HIGH: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
  },
  LOW: {
    label: 'Low',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info,
  },
  INFO: {
    label: 'Info',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: Info,
  },
};

const sampleDiff = `diff --git a/backend/src/routes/user.routes.ts b/backend/src/routes/user.routes.ts
--- a/backend/src/routes/user.routes.ts
+++ b/backend/src/routes/user.routes.ts
@@ -15,4 +15,5 @@
-userRouter.get('/:id', requireAuth, userController.getById);
+userRouter.get('/:id', userController.getById);
+// Unchecked direct SQL query interpolation
+const query = \`SELECT * FROM users WHERE id = '\${req.params.id}'\`;`;

export const ReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [diffInput, setDiffInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [descInput, setDescInput] = useState<string>('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Record<number, boolean>>({});
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    fetchConnectedRepositories()
      .then((res) => {
        const repos = res.data || [];
        setRepositories(repos);
        if (repos.length > 0) {
          if (repoParam && repos.some((r) => r.id === repoParam)) {
            setSelectedRepoId(repoParam);
          } else {
            setSelectedRepoId(repos[0].id);
          }
        }
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load repositories');
      })
      .finally(() => setLoadingRepos(false));
  }, [repoParam]);

  const handleReview = async () => {
    if (!selectedRepoId) {
      setErrorMessage('Please select a repository first.');
      return;
    }
    if (!diffInput.trim()) {
      setErrorMessage('Please provide a Git diff to review.');
      return;
    }

    setReviewing(true);
    setErrorMessage(null);
    setReviewResult(null);

    try {
      const res = await reviewCode(selectedRepoId, {
        diff: diffInput,
        title: titleInput || undefined,
        description: descInput || undefined,
      });

      if (res.data) {
        setReviewResult(res.data);
        // Expand the first finding by default if present
        if (res.data.findings.length > 0) {
          setExpandedFindings({ 0: true });
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to run code review');
    } finally {
      setReviewing(false);
    }
  };

  const toggleFinding = (idx: number) => {
    setExpandedFindings((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredFindings = reviewResult
    ? reviewResult.findings.filter((f) => filterSeverity === 'ALL' || f.severity === filterSeverity)
    : [];

  const severityCounts = reviewResult
    ? reviewResult.findings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#f0f6fc]">AI Code Review</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30">
              Milestone 4
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Ground your pull request diffs against indexed repository architecture, security, and conventions.
          </p>
        </div>

        {/* Repository selector */}
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
          <select
            value={selectedRepoId}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setReviewResult(null);
            }}
            disabled={loadingRepos || reviewing}
            className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#58a6ff]"
          >
            {loadingRepos ? (
              <option>Loading repositories...</option>
            ) : repositories.length === 0 ? (
              <option>No repositories connected</option>
            ) : (
              repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Diff Editor on Left, Review Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono">
                Diff Input
              </span>
              <button
                type="button"
                onClick={() => {
                  setDiffInput(sampleDiff);
                  setTitleInput('Refactor user lookup and route');
                }}
                className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Load Sample Diff
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                PR / Commit Title (Optional)
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Add authentication middleware to user routes"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                PR / Change Description (Optional)
              </label>
              <textarea
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="e.g. Summarize context or purpose of this change..."
                rows={2}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                Unified Git Diff *
              </label>
              <textarea
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                placeholder="Paste unified git diff here (e.g. diff --git a/... b/...)..."
                rows={14}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-xs text-[#f0f6fc] font-mono leading-relaxed focus:outline-none focus:border-[#58a6ff] resize-y"
              />
            </div>

            <button
              onClick={handleReview}
              disabled={reviewing || !selectedRepoId || !diffInput.trim()}
              className="w-full py-2 px-4 rounded bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              {reviewing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Diff Against Codebase...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  Run AI Code Review
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Review Findings & Results */}
        <div className="lg:col-span-7 space-y-4">
          {reviewing ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-[#f0f6fc]">
                  Examining Diff & Repository Context
                </h3>
                <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
                  Retrieving relevant file chunks, checking security directives, and synthesizing structured findings.
                </p>
              </div>
            </div>
          ) : !reviewResult ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] mx-auto">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">No Review Generated Yet</h3>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Select a repository, paste a git diff on the left, and click <strong>Run AI Code Review</strong> to identify bugs, security flaws, and architectural regressions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Review Summary Header */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono">
                      Review Summary
                    </span>
                    <p className="text-xs text-[#c9d1d9] mt-1 leading-relaxed">
                      {reviewResult.summary}
                    </p>
                  </div>
                  <button
                    onClick={handleReview}
                    title="Re-run review"
                    className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Clean state banner */}
                {!reviewResult.hasIssues && (
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Clean diff:</strong> {reviewResult.noIssuesMessage || 'no significant issues found'}
                    </span>
                  </div>
                )}

                {/* Severity Filter Pills */}
                {reviewResult.findings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30363d]">
                    <button
                      onClick={() => setFilterSeverity('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                        filterSeverity === 'ALL'
                          ? 'bg-[#1f6feb] text-white'
                          : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      All ({reviewResult.findings.length})
                    </button>
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((sev) => {
                      const count = severityCounts[sev] || 0;
                      if (count === 0) return null;
                      const cfg = severityConfig[sev];
                      return (
                        <button
                          key={sev}
                          onClick={() => setFilterSeverity(sev)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1 ${
                            filterSeverity === sev
                              ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                              : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                          }`}
                        >
                          <span>{cfg.label}</span>
                          <span className="text-[10px] opacity-75 font-mono">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Findings List */}
              <div className="space-y-3">
                {filteredFindings.map((finding, idx) => {
                  const isExpanded = !!expandedFindings[idx];
                  const cfg = severityConfig[finding.severity] || severityConfig.INFO;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={idx}
                      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden transition"
                    >
                      {/* Finding Card Header */}
                      <button
                        onClick={() => toggleFinding(idx)}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-[#21262d]/40 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1 rounded ${cfg.bg} ${cfg.color} mt-0.5`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#f0f6fc]">
                                {finding.title}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                              >
                                {finding.severity}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                                {finding.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8b949e] font-mono mt-1">
                              {finding.filePath}:{finding.startLine}-{finding.endLine} • Confidence:{' '}
                              {Math.round(finding.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#8b949e] shrink-0 mt-1" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#8b949e] shrink-0 mt-1" />
                        )}
                      </button>

                      {/* Expandable Finding Details */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-[#30363d] space-y-3 bg-[#0d1117]/50">
                          <div className="mt-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1">
                              Explanation
                            </span>
                            <p className="text-xs text-[#c9d1d9] leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>

                          {finding.evidence && (
                            <div>
                              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1">
                                Evidence / Triggering Code
                              </span>
                              <pre className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-xs font-mono text-red-300 overflow-x-auto">
                                {finding.evidence}
                              </pre>
                            </div>
                          )}

                          {finding.suggestedFix && (
                            <div>
                              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1">
                                Suggested Fix
                              </span>
                              <pre className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-xs font-mono text-emerald-300 overflow-x-auto">
                                {finding.suggestedFix}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Citations Footer */}
              {reviewResult.citations.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                    Repository Citations ({reviewResult.citations.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {reviewResult.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => setSelectedCitation(cit)}
                        className="text-left px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-xs font-mono text-[#58a6ff] transition flex items-center gap-1.5"
                      >
                        <span>
                          {cit.filePath}:{cit.startLine}-{cit.endLine}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#8b949e]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback and Observability */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <FeedbackWidget
                  repositoryId={selectedRepoId}
                  capability="review"
                  meta={reviewResult.meta}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Citation Inspector Drawer Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-[#161b22] border-l border-[#30363d] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="h-14 px-5 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#58a6ff]" />
                <span className="font-semibold text-xs font-mono text-[#f0f6fc]">
                  Citation Context
                </span>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#8b949e] block mb-1">
                  File & Range
                </label>
                <div className="text-xs font-mono text-[#f0f6fc] bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  {selectedCitation.filePath}:{selectedCitation.startLine}-{selectedCitation.endLine}
                  {selectedCitation.symbolName && (
                    <span className="text-[#58a6ff] block mt-0.5">
                      Symbol: {selectedCitation.symbolName}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8b949e] block mb-1">
                  Relevance Score
                </label>
                <div className="text-xs font-mono text-[#3fb950]">
                  {Math.round(selectedCitation.similarity * 100)}% match with review context
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8b949e] block mb-1">
                  Retrieved Code Snippet
                </label>
                <pre className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {selectedCitation.snippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
