import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Repository } from '../types/auth';
import {
  ImplementationPlanResult,
  Citation,
} from '../types/intelligence';
import { fetchConnectedRepositories, createPlan } from '../services/api';
import {
  ListTodo,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileCode,
  ExternalLink,
  X,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  Network,
  Info,
} from 'lucide-react';
import { FeedbackWidget } from '../components/FeedbackWidget';

const sampleRequests = [
  'Add role-based access control (RBAC) with Admin, Editor, and Viewer permissions.',
  'Implement asynchronous webhook delivery with exponential backoff and retry tracking.',
  'Add rate limiting to all public authentication and search endpoints using Redis token bucket.',
];

export const PlansPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [featureRequest, setFeatureRequest] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<ImplementationPlanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

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

  const handleGeneratePlan = async () => {
    if (!selectedRepoId) {
      setErrorMessage('Please select a repository first.');
      return;
    }
    if (!featureRequest.trim()) {
      setErrorMessage('Please enter a feature request description.');
      return;
    }

    setPlanning(true);
    setErrorMessage(null);
    setPlanResult(null);

    try {
      const res = await createPlan(selectedRepoId, {
        request: featureRequest,
        context: additionalContext || undefined,
      });

      if (res.data) {
        setPlanResult(res.data);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate implementation plan');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#f0f6fc]">AI Implementation Planning</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30">
              Milestone 4
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Produce an architectural roadmap, affected files breakdown, dependencies, and testing plan without modifying files.
          </p>
        </div>

        {/* Repository selector */}
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
          <select
            value={selectedRepoId}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setPlanResult(null);
            }}
            disabled={loadingRepos || planning}
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

      {/* Main Grid: Feature Request on Left, Architectural Plan on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
            <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono block">
              Feature Specification
            </span>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                Feature Request or Objective *
              </label>
              <textarea
                value={featureRequest}
                onChange={(e) => setFeatureRequest(e.target.value)}
                placeholder="e.g. Add role-based access control (RBAC) with admin and viewer roles..."
                rows={5}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-xs text-[#f0f6fc] leading-relaxed focus:outline-none focus:border-[#58a6ff] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                Technical Constraints & Context (Optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g. Keep existing session cookies, ensure zero downtime migration..."
                rows={3}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y"
              />
            </div>

            {/* Quick Samples */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-[#8b949e] font-mono block">
                Sample Prompts:
              </span>
              {sampleRequests.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setFeatureRequest(sample)}
                  className="w-full text-left p-2 rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[11px] text-[#c9d1d9] hover:text-[#58a6ff] transition leading-snug flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 shrink-0 text-[#58a6ff]" />
                  <span className="truncate">{sample}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleGeneratePlan}
                disabled={planning || !selectedRepoId || !featureRequest.trim()}
                className="w-full py-2 px-4 rounded bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {planning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synthesizing Implementation Roadmap...
                  </>
                ) : (
                  <>
                    <ListTodo className="w-4 h-4" />
                    Generate Implementation Plan
                  </>
                )}
              </button>
            </div>

            {/* Read-only notice */}
            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#58a6ff] shrink-0 mt-0.5" />
              <span>
                DevIntel AI provides read-only architectural plans. It will never modify repository files or create unauthorized commits.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Plan Display */}
        <div className="lg:col-span-7 space-y-4">
          {planning ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-[#f0f6fc]">
                  Analyzing Repository Architecture & Routes
                </h3>
                <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
                  Retrieving relevant schemas, controllers, and services, assembling risks, dependencies, and testing plan.
                </p>
              </div>
            </div>
          ) : !planResult ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] mx-auto">
                <ListTodo className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">No Plan Generated Yet</h3>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Enter a feature request on the left and click <strong>Generate Implementation Plan</strong> to receive a structured roadmap with affected files, steps, dependencies, and tests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Summary */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono">
                      Executive Summary
                    </span>
                    <p className="text-xs text-[#c9d1d9] mt-1 leading-relaxed">
                      {planResult.summary}
                    </p>
                  </div>
                  <button
                    onClick={handleGeneratePlan}
                    title="Re-generate plan"
                    className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Assumptions */}
                {planResult.assumptions.length > 0 && (
                  <div className="pt-2 border-t border-[#30363d]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1">
                      Assumptions
                    </span>
                    <ul className="space-y-1">
                      {planResult.assumptions.map((assumption, aIdx) => (
                        <li
                          key={aIdx}
                          className="text-xs text-[#8b949e] flex items-start gap-2"
                        >
                          <span className="text-[#58a6ff]">•</span>
                          <span>{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Affected Files */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-3">
                <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#58a6ff]" />
                  Affected Files & Modules ({planResult.affectedFiles.length})
                </span>
                <div className="space-y-2">
                  {planResult.affectedFiles.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-[#58a6ff]">
                          {file.path}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e]">
                        <strong className="text-[#c9d1d9]">Reason:</strong> {file.reason}
                      </p>
                      <p className="text-xs text-[#8b949e]">
                        <strong className="text-[#c9d1d9]">Expected change:</strong> {file.expectedChange}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Steps Checklist */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-3">
                <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sequenced Implementation Steps
                </span>
                <div className="space-y-3">
                  {planResult.implementationSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded bg-[#0d1117] border border-[#30363d] flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                        {step.order}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-semibold text-[#f0f6fc]">
                          {step.title}
                        </h4>
                        <p className="text-xs text-[#8b949e] leading-relaxed">
                          {step.description}
                        </p>
                        {step.filePaths.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {step.filePaths.map((fp, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[10px] font-mono text-[#8b949e]"
                              >
                                {fp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies & Risks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dependencies */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-[#58a6ff]" />
                    Dependencies
                  </span>
                  <ul className="space-y-1.5">
                    {planResult.dependencies.map((dep, dIdx) => (
                      <li
                        key={dIdx}
                        className="text-xs text-[#8b949e] flex items-start gap-2"
                      >
                        <span className="text-[#58a6ff]">•</span>
                        <span>{dep}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-yellow-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Risks & Mitigations
                  </span>
                  <ul className="space-y-1.5">
                    {planResult.risks.map((risk, rIdx) => (
                      <li
                        key={rIdx}
                        className="text-xs text-[#8b949e] flex items-start gap-2"
                      >
                        <span className="text-yellow-400">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Testing Plan & Architectural Considerations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Testing Plan */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#58a6ff]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Testing Plan
                  </span>
                  <ul className="space-y-1.5">
                    {planResult.testingPlan.map((tp, tIdx) => (
                      <li
                        key={tIdx}
                        className="text-xs text-[#8b949e] flex items-start gap-2"
                      >
                        <span className="text-[#58a6ff]">•</span>
                        <span>{tp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Architectural Considerations */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#a371f7]">
                    <Layers className="w-3.5 h-3.5" />
                    Architecture & Non-functionals
                  </span>
                  <ul className="space-y-1.5">
                    {planResult.architecturalConsiderations.map((ac, cIdx) => (
                      <li
                        key={cIdx}
                        className="text-xs text-[#8b949e] flex items-start gap-2"
                      >
                        <span className="text-[#a371f7]">•</span>
                        <span>{ac}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Citations Footer */}
              {planResult.citations.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                    Retrieved Repository Citations ({planResult.citations.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {planResult.citations.map((cit, cIdx) => (
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
                  capability="plan"
                  meta={planResult.meta}
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
                  Architecture Reference Snippet
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
                  Relevance Match
                </label>
                <div className="text-xs font-mono text-[#3fb950]">
                  {Math.round(selectedCitation.similarity * 100)}% match with feature query
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8b949e] block mb-1">
                  Reference Code Snippet
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
