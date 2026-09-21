import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import {
  CodeReviewResult,
  Severity,
  Citation,
} from '../types/intelligence';
import { reviewCode } from '../services/api';
import { DiffViewer } from '../components/common/DiffViewer';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { SourceInspector } from '../components/common/SourceInspector';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  FileCheck2,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileCode,
  Sparkles,
  RotateCcw,
  BookOpen,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
} from 'lucide-react';

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

  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId } = useRepository();

  const [diffInput, setDiffInput] = useState<string>(sampleDiff);
  const [titleInput, setTitleInput] = useState<string>('Refactor user lookup and route');
  const [descInput, setDescInput] = useState<string>('');
  const [showInputModal, setShowInputModal] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<number, boolean>>({ 0: true });
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  useEffect(() => {
    if (repoParam && repositories.some((r) => r.id === repoParam)) {
      setSelectedRepoId(repoParam);
    }
  }, [repoParam, repositories, setSelectedRepoId]);

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
    setShowInputModal(false);

    try {
      const res = await reviewCode(selectedRepoId, {
        diff: diffInput,
        title: titleInput || undefined,
        description: descInput || undefined,
      });

      if (res.data) {
        setReviewResult(res.data);
        if (res.data.findings.length > 0) {
          setExpandedFindings({ 0: true });
        }
        if (res.data.citations && res.data.citations.length > 0) {
          setSelectedCitation(res.data.citations[0]);
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

  // Derive counts from actual findings
  const findings = reviewResult?.findings || [];
  const severityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };
  const categoryCounts: Record<string, number> = {};

  findings.forEach((f) => {
    if (severityCounts[f.severity] !== undefined) {
      severityCounts[f.severity]++;
    }
    categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
  });

  const filteredFindings = findings.filter((f) => {
    return filterSeverity === 'ALL' || f.severity === filterSeverity;
  });

  if (!selectedRepo) {
    return (
      <div className="p-12 text-center bg-[#121721] border border-[#232b3b] rounded-2xl space-y-4">
        <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-60" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">No Repository Selected</h2>
        <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
          Please select or connect a repository first to run AI code reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Action Bar */}
      <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded bg-[#1f6feb] shrink-0"></span>
              <h1 className="text-lg font-bold text-[#f0f6fc]">
                AI Code Review
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                RAG GROUNDED
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Analyze a Git diff against indexed repository context using semantic vector retrieval. Strictly read-only analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Repo selector dropdown */}
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
              onClick={() => setShowInputModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Input & Diff</span>
            </button>

            <button
              type="button"
              onClick={handleReview}
              disabled={reviewing || !diffInput.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {reviewing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCheck2 className="w-3.5 h-3.5" />
              )}
              <span>Analyze Diff</span>
            </button>
          </div>
        </div>

        {/* Telemetry / Context Sub-bar */}
        <div className="pt-2 border-t border-[#1c2433] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#c9d1d9] font-medium">
              Repository: {selectedRepo.name}
            </span>
            <span>•</span>
            <span className="text-[#58a6ff]">Branch: {selectedBranch}</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Read-Only Safety Lock
            </span>
          </div>

          {reviewResult?.meta && (
            <div className="flex items-center gap-2.5">
              {reviewResult.meta.latencyMs !== undefined && (
                <span>⏱ {reviewResult.meta.latencyMs}ms</span>
              )}
              {reviewResult.meta.chunksRetrieved !== undefined && (
                <span>• {reviewResult.meta.chunksRetrieved} chunks retrieved</span>
              )}
              {reviewResult.meta.model && (
                <span>• {reviewResult.meta.model}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Split Workbench: Left Diff Viewer, Right Findings & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column: Diff Viewer (lg: 6 or 7 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#8b949e] uppercase tracking-wider text-[11px]">
              Inspected Git Diff
            </span>
            <button
              type="button"
              onClick={() => setShowInputModal(true)}
              className="text-[#58a6ff] hover:underline text-xs flex items-center gap-1 font-mono"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit diff</span>
            </button>
          </div>

          <DiffViewer
            diff={diffInput}
            findings={findings}
            onFindingClick={(_f, idx) => {
              setExpandedFindings((prev) => ({ ...prev, [idx]: true }));
            }}
            className="flex-1 min-h-[500px]"
          />
        </div>

        {/* Right Column: Review Summary & Findings Cards */}
        <div className="lg:col-span-6 space-y-4">
          {reviewing ? (
            <div className="p-16 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Analyzing Diff Against Indexed Codebase
                </h3>
                <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
                  Retrieving relevant file vectors, verifying cryptographic and architectural patterns, and synthesizing structured findings.
                </p>
              </div>
            </div>
          ) : !reviewResult ? (
            <div className="p-16 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff] mx-auto">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#f0f6fc]">Ready for AI Code Review</h3>
                <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
                  Click <strong>Analyze Diff</strong> to evaluate the current changes against your indexed codebase architecture.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReview}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Analyze Diff Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Review Summary Card */}
              <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[#f0f6fc]">
                        Review Summary
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                        RAG Grounded
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      {reviewResult.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReview}
                    title="Re-run review"
                    className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Severity Metric Boxes Row */}
                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25">
                    <div className="text-base font-bold text-rose-400">
                      {severityCounts.CRITICAL}
                    </div>
                    <div className="text-[10px] text-rose-300 uppercase">Critical</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/25">
                    <div className="text-base font-bold text-orange-400">
                      {severityCounts.HIGH}
                    </div>
                    <div className="text-[10px] text-orange-300 uppercase">High</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/25">
                    <div className="text-base font-bold text-amber-400">
                      {severityCounts.MEDIUM}
                    </div>
                    <div className="text-[10px] text-amber-300 uppercase">Medium</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0c1017] border border-[#232b3b]">
                    <div className="text-base font-bold text-[#8b949e]">
                      {severityCounts.LOW}
                    </div>
                    <div className="text-[10px] text-[#8b949e] uppercase">Low</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0c1017] border border-[#232b3b]">
                    <div className="text-base font-bold text-[#8b949e]">
                      {severityCounts.INFO}
                    </div>
                    <div className="text-[10px] text-[#8b949e] uppercase">Info</div>
                  </div>
                </div>

                {/* Clean state banner */}
                {!reviewResult.hasIssues && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Clean diff: {reviewResult.noIssuesMessage || 'no significant issues or regressions flagged.'}
                    </span>
                  </div>
                )}

                {/* Severity Filter Pills */}
                {findings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1c2433]">
                    <button
                      type="button"
                      onClick={() => setFilterSeverity('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                        filterSeverity === 'ALL'
                          ? 'bg-[#1f6feb] text-white'
                          : 'bg-[#141a24] text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      All ({findings.length})
                    </button>
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((sev) => {
                      const count = severityCounts[sev] || 0;
                      if (count === 0) return null;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setFilterSeverity(sev)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                            filterSeverity === sev
                              ? 'bg-[#18202d] text-[#f0f6fc] border-[#384866]'
                              : 'bg-[#141a24] text-[#8b949e] border-[#232b3b] hover:text-[#f0f6fc]'
                          }`}
                        >
                          <span>{sev}</span>
                          <span className="text-[10px] ml-1 opacity-75">({count})</span>
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
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#121721] border border-[#232b3b] hover:border-[#35435c] overflow-hidden transition-all"
                    >
                      {/* Finding Card Header */}
                      <button
                        type="button"
                        onClick={() => toggleFinding(idx)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-[#18202d]/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <SeverityBadge severity={finding.severity} />
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#f0f6fc]">
                                {finding.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                                {finding.category}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#8b949e] flex items-center gap-2">
                              <span>{finding.filePath}:{finding.startLine}–{finding.endLine}</span>
                              {finding.confidence > 0 && (
                                <span>• Confidence: {Math.round(finding.confidence * 100)}%</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-[#8b949e] mt-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Finding Body */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-[#1c2433] bg-[#0c1017]/50 space-y-3">
                          <div className="pt-3">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1">
                              Explanation
                            </span>
                            <p className="text-xs text-[#c9d1d9] leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>

                          {/* Evidence snippet */}
                          {finding.evidence && (
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 block mb-1">
                                Evidence (Detected in Diff)
                              </span>
                              <pre className="p-3 rounded-xl bg-[#0c1017] border border-rose-500/25 text-xs font-mono text-rose-300 overflow-x-auto leading-relaxed">
                                {finding.evidence}
                              </pre>
                            </div>
                          )}

                          {/* Suggested fix */}
                          {finding.suggestedFix && (
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                                Standard Repository Pattern / Suggested Fix
                              </span>
                              <pre className="p-3 rounded-xl bg-[#0c1017] border border-emerald-500/25 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                                {finding.suggestedFix}
                              </pre>
                            </div>
                          )}

                          {/* Citations inspect link */}
                          {reviewResult.citations.length > 0 && (
                            <div className="pt-2 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-mono text-[#8b949e]">
                                Source: {reviewResult.citations[0].filePath}:{reviewResult.citations[0].startLine}–{reviewResult.citations[0].endLine}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCitation(reviewResult.citations[0]);
                                  setShowInspector(true);
                                }}
                                className="text-[11px] font-mono text-[#58a6ff] hover:underline flex items-center gap-1"
                              >
                                <span>Inspect Vector Evidence</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredFindings.length === 0 && (
                  <div className="p-8 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-[#f0f6fc]">No Issues Identified</div>
                    <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
                      {findings.length === 0
                        ? 'The AI reviewer found no critical, security, or quality issues in this changeset.'
                        : `No findings match the selected severity filter (${filterSeverity}).`}
                    </p>
                  </div>
                )}
              </div>

              {/* Citations Footer */}
              {reviewResult.citations.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#f0f6fc] font-mono flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                      Repository Citations ({reviewResult.citations.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInspector(!showInspector)}
                      className="text-xs text-[#58a6ff] font-mono hover:underline flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{showInspector ? 'Hide Inspector' : 'Open Inspector'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {reviewResult.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          setSelectedCitation(cit);
                          setShowInspector(true);
                        }}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-[#0c1017] border border-[#232b3b] hover:border-[#58a6ff] text-xs font-mono text-[#58a6ff] transition flex items-center gap-1.5"
                      >
                        <span>{cit.filePath}</span>
                        <span className="text-[#8b949e]">L{cit.startLine}–{cit.endLine}</span>
                        <ExternalLink className="w-3 h-3 text-[#8b949e]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Widget */}
              <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b]">
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

      {/* Floating or Docked Source Inspector Drawer */}
      {showInspector && selectedCitation && (
        <div className="fixed inset-y-0 right-0 z-50 flex shadow-2xl animate-in slide-in-from-right duration-200">
          <SourceInspector
            citation={selectedCitation}
            onClose={() => setShowInspector(false)}
            repoFullName={selectedRepo.fullName}
            defaultBranch={selectedBranch}
            githubBaseUrl={selectedRepo.githubUrl}
          />
        </div>
      )}

      {/* Input Modal for entering/editing diff */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121721] border border-[#232b3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#232b3b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Input Git Diff for Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInputModal(false)}
                className="p-1 rounded hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8b949e] uppercase font-mono">
                  PR / Diff Payload
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDiffInput(sampleDiff);
                    setTitleInput('Refactor user lookup and route');
                  }}
                  className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-mono"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Sample Vulnerable Diff</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Refactor user authentication and SQL query"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="e.g. Changed how user IDs are queried from database..."
                  className="w-full p-2.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Unified Git Diff *
                </label>
                <textarea
                  rows={10}
                  value={diffInput}
                  onChange={(e) => setDiffInput(e.target.value)}
                  placeholder="Paste git diff here (diff --git a/... b/...)..."
                  className="w-full p-3 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#232b3b] bg-[#0c1017] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInputModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={reviewing || !diffInput.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                <span>Run Code Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
