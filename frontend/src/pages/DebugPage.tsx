import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import {
  DebugResult,
  ConfidenceLevel,
  Citation,
} from '../types/intelligence';
import { debugIssue } from '../services/api';
import { AccordionSection } from '../components/common/AccordionSection';
import { SourceInspector } from '../components/common/SourceInspector';
import { CodeViewer } from '../components/common/CodeViewer';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  Bug,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  X,
  Sparkles,
  RotateCcw,
  BookOpen,
  Edit3,
  ExternalLink,
  Shield,
  Copy,
  Check,
  FileCode2,
} from 'lucide-react';

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

  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId } = useRepository();

  const [errorMessage, setErrorMessage] = useState<string>(sampleError.message);
  const [stackTrace, setStackTrace] = useState<string>(sampleError.trace);
  const [filePath, setFilePath] = useState<string>(sampleError.filePath);
  const [additionalContext, setAdditionalContext] = useState<string>(sampleError.context);
  const [showInputModal, setShowInputModal] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);

  useEffect(() => {
    if (repoParam && repositories.some((r) => r.id === repoParam)) {
      setSelectedRepoId(repoParam);
    }
  }, [repoParam, repositories, setSelectedRepoId]);

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
    setShowInputModal(false);

    try {
      const res = await debugIssue(selectedRepoId, {
        errorMessage,
        stackTrace: stackTrace || undefined,
        filePath: filePath || undefined,
        context: additionalContext || undefined,
      });

      if (res.data) {
        setDebugResult(res.data);
        if (res.data.citations && res.data.citations.length > 0) {
          setSelectedCitation(res.data.citations[0]);
        }
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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            CONFIDENCE: HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            CONFIDENCE: MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            CONFIDENCE: LOW (UNCERTAIN)
          </span>
        );
    }
  };

  const handleCopyFix = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!selectedRepo) {
    return (
      <div className="p-12 text-center bg-[#121721] border border-[#232b3b] rounded-2xl space-y-4">
        <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-60" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">No Repository Selected</h2>
        <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
          Please select or connect a repository first to run AI error diagnostics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Notifications */}
      {errorNotification && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotification}</span>
          </div>
          <button type="button" onClick={() => setErrorNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Context Bar */}
      <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0"></span>
              <h1 className="text-lg font-bold text-[#f0f6fc]">
                Debug Assistant
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                RAG GROUNDED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                READ-ONLY ANALYSIS
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Diagnose runtime exceptions using call stacks, grounded repository graph, and AST references.
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
              <span>Input & Trace</span>
            </button>

            <button
              type="button"
              onClick={handleDebug}
              disabled={debugging || !errorMessage.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {debugging ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bug className="w-3.5 h-3.5" />
              )}
              <span>Diagnose Error</span>
            </button>
          </div>
        </div>

        {/* Telemetry verified sub-bar */}
        <div className="pt-2 border-t border-[#1c2433] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#c9d1d9] font-medium">
              Repository: {selectedRepo.name}
            </span>
            <span>•</span>
            <span className="text-[#58a6ff]">Branch: {selectedBranch}</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Grounded Repository Graph
            </span>
          </div>

          {debugResult?.meta && (
            <div className="flex items-center gap-2.5">
              {debugResult.meta.latencyMs !== undefined && (
                <span>⏱ {debugResult.meta.latencyMs}ms</span>
              )}
              {debugResult.meta.chunksRetrieved !== undefined && (
                <span>• {debugResult.meta.chunksRetrieved} chunks retrieved</span>
              )}
              {debugResult.meta.model && (
                <span>• {debugResult.meta.model}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exception Banner Header */}
      <div className="p-3.5 rounded-xl bg-[#0c1017] border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-rose-300 font-semibold truncate">
            {errorMessage}
          </span>
          {filePath && (
            <span className="text-[#8b949e] hidden sm:inline truncate">
              · {filePath}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowInputModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18202d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono shrink-0 transition-colors"
        >
          <Edit3 className="w-3 h-3 text-[#58a6ff]" />
          <span>Edit</span>
        </button>
      </div>

      {/* Diagnostic Console Area */}
      {debugging ? (
        <div className="p-20 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#f0f6fc]">
              Tracing Exception Across Repository Call Stacks
            </h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              Extracting stack frames, correlating AST symbol boundaries, and deriving probable root causes.
            </p>
          </div>
        </div>
      ) : !debugResult ? (
        <div className="p-20 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto">
            <Bug className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#f0f6fc]">Ready for Diagnostic Analysis</h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              Click <strong>Diagnose Error</strong> to analyze the exception against indexed codebase logic.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDebug}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm"
          >
            <Bug className="w-4 h-4" />
            <span>Diagnose Root Cause</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Diagnosis Card */}
          <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#f0f6fc]">
                    Diagnosis
                  </h2>
                  {getConfidenceBadge(debugResult.confidence)}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#58a6ff] pt-1">
                  What Happened
                </div>
                <p className="text-xs font-semibold text-[#f0f6fc] leading-snug">
                  {debugResult.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDebug}
                title="Re-run diagnostic"
                className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Probable Cause Block */}
            <div className="p-3.5 rounded-xl bg-[#0c1017] border border-[#232b3b] space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#d29922] block">
                Probable Cause
              </span>
              <p className="text-xs text-[#c9d1d9] leading-relaxed">
                {debugResult.probableCause}
              </p>
            </div>
          </div>

          {/* Collapsible Accordion Sections */}
          <div className="space-y-3">
            {/* Section 1: Repository Evidence */}
            <AccordionSection
              title="Repository Evidence & Trigger Chain"
              defaultExpanded={true}
              badge={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                  {debugResult.citations.length} Grounded Chunks
                </span>
              }
              headerRight={
                debugResult.citations.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCitation(debugResult.citations[0]);
                      setShowInspector(true);
                    }}
                    className="text-xs text-[#58a6ff] font-mono hover:underline flex items-center gap-1 mr-2"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Inspect in Drawer</span>
                  </button>
                ) : null
              }
            >
              <div className="space-y-3">
                <p className="text-xs text-[#c9d1d9] leading-relaxed">
                  {debugResult.evidence}
                </p>

                {debugResult.citations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1c2433]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                      <span>{debugResult.citations[0].filePath}:{debugResult.citations[0].startLine}–{debugResult.citations[0].endLine}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCitation(debugResult.citations[0]);
                          setShowInspector(true);
                        }}
                        className="text-[#58a6ff] hover:underline flex items-center gap-1"
                      >
                        <span>Open Source Inspector</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <CodeViewer
                      code={debugResult.citations[0].snippet}
                      startLine={debugResult.citations[0].startLine}
                      filePath={debugResult.citations[0].filePath}
                    />
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Section 2: Affected Files */}
            {debugResult.affectedFiles.length > 0 && (
              <AccordionSection
                title="Affected Files"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                    {debugResult.affectedFiles.length} Grounded Files
                  </span>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {debugResult.affectedFiles.map((file, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-2.5 py-1 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#58a6ff]"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}

            {/* Section 3: Suggested Fix */}
            {debugResult.suggestedFix && (
              <AccordionSection
                title="Suggested Fix"
                defaultExpanded={true}
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Manual Review Required
                  </span>
                }
                headerRight={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyFix(debugResult.suggestedFix);
                    }}
                    className="flex items-center gap-1 text-xs text-[#58a6ff] font-mono hover:underline mr-2"
                  >
                    {copiedFix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFix ? 'Copied' : 'Copy Fix Snippet'}</span>
                  </button>
                }
              >
                <div className="space-y-2">
                  <div className="text-[11px] text-[#8b949e] flex items-center justify-between">
                    <span>Advisory only · DevIntel AI operates in read-only mode</span>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-[#0c1017] border border-emerald-500/25 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {debugResult.suggestedFix}
                  </pre>
                </div>
              </AccordionSection>
            )}

            {/* Section 4: Testing Strategy */}
            {debugResult.testingStrategy && (
              <AccordionSection
                title="Testing Strategy"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                    Advisory Validation
                  </span>
                }
              >
                <p className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-line font-mono">
                  {debugResult.testingStrategy}
                </p>
              </AccordionSection>
            )}

            {/* Section 5: Uncertainty & Alternative Hypotheses */}
            {debugResult.uncertaintyNotes && (
              <AccordionSection
                title="Uncertainty & Alternative Hypotheses"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                    Secondary Fallback
                  </span>
                }
              >
                <p className="text-xs text-yellow-300 leading-relaxed">
                  {debugResult.uncertaintyNotes}
                </p>
              </AccordionSection>
            )}
          </div>

          {/* Citations list banner */}
          {debugResult.citations.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f0f6fc] font-mono flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                  Retrieved Diagnostic Evidence ({debugResult.citations.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className="text-xs text-[#58a6ff] font-mono hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{showInspector ? 'Hide Drawer' : 'Open Drawer'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {debugResult.citations.map((cit, cIdx) => (
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

          {/* Feedback & Observability Card */}
          <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b]">
            <FeedbackWidget
              repositoryId={selectedRepoId}
              capability="debug"
              meta={debugResult.meta}
            />
          </div>
        </div>
      )}

      {/* Floating Source Inspector Drawer */}
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

      {/* Input Modal for entering/editing exception */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121721] border border-[#232b3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#232b3b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Input Exception & Stack Trace
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
                  Error Diagnostics
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(sampleError.message);
                    setStackTrace(sampleError.trace);
                    setFilePath(sampleError.filePath);
                    setAdditionalContext(sampleError.context);
                  }}
                  className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-mono"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Sample Error</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Error Message / Exception *
                </label>
                <input
                  type="text"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="e.g. TypeError: Cannot read properties of null"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Stack Trace (Optional)
                </label>
                <textarea
                  rows={6}
                  value={stackTrace}
                  onChange={(e) => setStackTrace(e.target.value)}
                  placeholder="Paste call stack trace..."
                  className="w-full p-3 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Suspected File / Path (Optional)
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g. backend/src/repositories/user.repository.ts"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Reproduction Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Steps to trigger or environment variables..."
                  className="w-full p-2.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-none"
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
                onClick={handleDebug}
                disabled={debugging || !errorMessage.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {debugging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
                <span>Run Diagnostic</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
