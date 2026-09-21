import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Repository } from '../types/auth';
import {
  DebugResult,
  ConfidenceLevel,
  Citation,
} from '../types/intelligence';
import { fetchConnectedRepositories, debugIssue } from '../services/api';
import {
  Bug,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  FileCode,
  ExternalLink,
  X,
  Sparkles,
  Terminal,
  RotateCcw,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { FeedbackWidget } from '../components/FeedbackWidget';

const sampleError = {
  message: 'TypeError: Cannot read properties of null (reading "findUnique")',
  trace: `TypeError: Cannot read properties of null (reading "findUnique")
    at getUserById (/app/backend/src/repositories/user.repository.ts:32:20)
    at handleAuthCallback (/app/backend/src/controllers/auth.controller.ts:48:35)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
  filePath: 'backend/src/repositories/user.repository.ts',
  context: 'Occurs intermittently when the database connection pool drops under burst load.',
};

export const DebugPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stackTrace, setStackTrace] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [debugging, setDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
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
        setErrorNotification(err instanceof Error ? err.message : 'Failed to load repositories');
      })
      .finally(() => setLoadingRepos(false));
  }, [repoParam]);

  const handleDebug = async () => {
    if (!selectedRepoId) {
      setErrorNotification('Please select a repository first.');
      return;
    }
    if (!errorMessage.trim()) {
      setErrorNotification('Please enter an error message to investigate.');
      return;
    }

    setDebugging(true);
    setErrorNotification(null);
    setDebugResult(null);

    try {
      const res = await debugIssue(selectedRepoId, {
        errorMessage,
        stackTrace: stackTrace || undefined,
        filePath: filePath || undefined,
        context: additionalContext || undefined,
      });

      if (res.data) {
        setDebugResult(res.data);
      }
    } catch (err) {
      setErrorNotification(err instanceof Error ? err.message : 'Failed to execute debugging analysis');
    } finally {
      setDebugging(false);
    }
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            HIGH CONFIDENCE
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            MEDIUM CONFIDENCE
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            LOW CONFIDENCE (UNCERTAIN)
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#f0f6fc]">AI Debugging Assistant</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30">
              Milestone 4
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Diagnose stack traces and runtime exceptions grounded in actual indexed repository code and structure.
          </p>
        </div>

        {/* Repository selector */}
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
          <select
            value={selectedRepoId}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setDebugResult(null);
            }}
            disabled={loadingRepos || debugging}
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

      {/* Error notification banner */}
      {errorNotification && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotification}</span>
          </div>
          <button
            onClick={() => setErrorNotification(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Input on Left, Diagnostics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono">
                Error Diagnostics Input
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(sampleError.message);
                  setStackTrace(sampleError.trace);
                  setFilePath(sampleError.filePath);
                  setAdditionalContext(sampleError.context);
                }}
                className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Load Sample Error
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                Error Message / Exception *
              </label>
              <input
                type="text"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="e.g. TypeError: Cannot read properties of null"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                Stack Trace (Optional)
              </label>
              <textarea
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="Paste full call stack trace here..."
                rows={7}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-xs text-[#f0f6fc] font-mono leading-relaxed focus:outline-none focus:border-[#58a6ff] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                  Suspected File / Path (Optional)
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g. backend/src/repositories/user.repository.ts"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1 font-mono">
                  Additional Reproduction Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Steps to trigger, environment variables, or recent changes..."
                  rows={3}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y"
                />
              </div>
            </div>

            <button
              onClick={handleDebug}
              disabled={debugging || !selectedRepoId || !errorMessage.trim()}
              className="w-full py-2 px-4 rounded bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              {debugging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Investigating Call Stack & Codebase...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4" />
                  Diagnose Root Cause
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Diagnostic Results */}
        <div className="lg:col-span-7 space-y-4">
          {debugging ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-[#f0f6fc]">
                  Tracing Defect Across Codebase
                </h3>
                <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
                  Parsing stack frames, retrieving code snippets, validating hypotheses against repository facts.
                </p>
              </div>
            </div>
          ) : !debugResult ? (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-lg text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] mx-auto">
                <Bug className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">No Diagnostic Generated Yet</h3>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Enter an error message and optional stack trace on the left, then click <strong>Diagnose Root Cause</strong> to retrieve code context and generate a fix.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary & Confidence Header */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono">
                        Diagnostic Summary
                      </span>
                      {getConfidenceBadge(debugResult.confidence)}
                    </div>
                    <h2 className="text-sm font-semibold text-[#f0f6fc] leading-snug">
                      {debugResult.summary}
                    </h2>
                  </div>
                  <button
                    onClick={handleDebug}
                    title="Re-run diagnostic"
                    className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Probable Cause */}
                <div className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#d29922] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Probable Root Cause
                  </span>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    {debugResult.probableCause}
                  </p>
                </div>

                {/* Uncertainty Notes (if applicable) */}
                {debugResult.uncertaintyNotes && (
                  <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400 space-y-1">
                    <span className="font-semibold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Known Ambiguities & Uncertainty
                    </span>
                    <p className="text-[11px] leading-relaxed text-yellow-300">
                      {debugResult.uncertaintyNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence Panel */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-2.5">
                <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#58a6ff]" />
                  Repository Evidence & Trigger Chain
                </span>
                <p className="text-xs text-[#c9d1d9] leading-relaxed">
                  {debugResult.evidence}
                </p>
                {debugResult.affectedFiles.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#8b949e] font-mono">Affected files:</span>
                    {debugResult.affectedFiles.map((file, fIdx) => (
                      <span
                        key={fIdx}
                        className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#58a6ff]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Fix Code Block */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-2.5">
                <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Suggested Code Fix
                </span>
                <pre className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {debugResult.suggestedFix}
                </pre>
              </div>

              {/* Testing Strategy */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-2.5">
                <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#58a6ff]">
                  <Terminal className="w-3.5 h-3.5" />
                  Reproduction & Testing Strategy
                </span>
                <p className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-line">
                  {debugResult.testingStrategy}
                </p>
              </div>

              {/* Citations Footer */}
              {debugResult.citations.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                    Retrieved Evidence Citations ({debugResult.citations.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {debugResult.citations.map((cit, cIdx) => (
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
                  capability="debug"
                  meta={debugResult.meta}
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
                  Diagnostic Evidence Snippet
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
                  Vector Relevance
                </label>
                <div className="text-xs font-mono text-[#3fb950]">
                  {Math.round(selectedCitation.similarity * 100)}% match
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8b949e] block mb-1">
                  Context Snippet
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
