import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import {
  ImplementationPlanResult,
  Citation,
} from '../types/intelligence';
import { createPlan } from '../services/api';
import { AccordionSection } from '../components/common/AccordionSection';
import { SourceInspector } from '../components/common/SourceInspector';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  ListTodo,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  RotateCcw,
  BookOpen,
  Edit3,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  Network,
  ShieldAlert,
  Layers,
  HelpCircle,
  FileCode2,
  ChevronDown,
  ChevronRight,
  Info,
  Plus,
} from 'lucide-react';

const sampleRequests = [
  'Add role-based access control (RBAC) with Admin, Editor, and Viewer permissions.',
  'Implement asynchronous webhook delivery with exponential backoff and retry tracking.',
  'Add rate limiting to all public authentication and search endpoints using Redis token bucket.',
];

export const PlansPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');

  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId } = useRepository();

  const [featureRequest, setFeatureRequest] = useState<string>(sampleRequests[0]);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [showInputModal, setShowInputModal] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<ImplementationPlanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 0: true, 1: true });

  useEffect(() => {
    if (repoParam && repositories.some((r) => r.id === repoParam)) {
      setSelectedRepoId(repoParam);
    }
  }, [repoParam, repositories, setSelectedRepoId]);

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
    setShowInputModal(false);

    try {
      const res = await createPlan(selectedRepoId, {
        request: featureRequest,
        context: additionalContext || undefined,
      });

      if (res.data) {
        setPlanResult(res.data);
        if (res.data.citations && res.data.citations.length > 0) {
          setSelectedCitation(res.data.citations[0]);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate implementation plan');
    } finally {
      setPlanning(false);
    }
  };

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleInspectFile = (filePath: string) => {
    const matchedCitation = planResult?.citations.find((c) => c.filePath.includes(filePath) || filePath.includes(c.filePath));
    if (matchedCitation) {
      setSelectedCitation(matchedCitation);
      setShowInspector(true);
    } else if (planResult?.citations && planResult.citations.length > 0) {
      setSelectedCitation(planResult.citations[0]);
      setShowInspector(true);
    }
  };

  if (!selectedRepo) {
    return (
      <div className="p-12 text-center bg-[#121721] border border-[#232b3b] rounded-2xl space-y-4">
        <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-60" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">No Repository Selected</h2>
        <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
          Please select or connect a repository first to generate architectural implementation blueprints.
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

      {/* Top Header & Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded bg-[#a371f7] shrink-0"></span>
              <h1 className="text-lg font-bold text-[#f0f6fc]">
                Implementation Plans
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                RAG GROUNDED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                READ-ONLY ANALYSIS
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Generate structurally grounded implementation blueprints indexed directly against repository architecture.
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
              <span>Edit Request</span>
            </button>

            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={planning || !featureRequest.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {planning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ListTodo className="w-3.5 h-3.5" />
              )}
              <span>Generate Blueprint</span>
            </button>
          </div>
        </div>

        {/* Telemetry sub-bar */}
        <div className="pt-2 border-t border-[#1c2433] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#c9d1d9] font-medium">
              Repository: {selectedRepo.name}
            </span>
            <span>•</span>
            <span className="text-[#58a6ff]">Branch: {selectedBranch}</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Grounded Architecture Models
            </span>
          </div>

          {planResult?.meta && (
            <div className="flex items-center gap-2.5">
              {planResult.meta.latencyMs !== undefined && (
                <span>⏱ {planResult.meta.latencyMs}ms</span>
              )}
              {planResult.meta.chunksRetrieved !== undefined && (
                <span>• {planResult.meta.chunksRetrieved} chunks retrieved</span>
              )}
              {planResult.meta.model && (
                <span>• {planResult.meta.model}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Plan Request Bar */}
      <div className="p-3.5 rounded-xl bg-[#0c1017] border border-[#232b3b] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 font-mono">
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#18202d] text-[#58a6ff] border border-[#273244] shrink-0">
            PLAN REQUEST
          </span>
          <span className="text-[#f0f6fc] truncate">
            "{featureRequest}"
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInputModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18202d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono transition-colors"
          >
            <Edit3 className="w-3 h-3 text-[#58a6ff]" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanResult(null);
              setShowInputModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18202d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#2b374d] text-xs font-mono transition-colors"
          >
            <Plus className="w-3 h-3 text-[#58a6ff]" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Blueprint Content Area */}
      {planning ? (
        <div className="p-20 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#f0f6fc]">
              Synthesizing Architectural Implementation Roadmap
            </h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              Scanning database models, controllers, and services, assembling sequential steps, testing strategies, and non-functional bounds.
            </p>
          </div>
        </div>
      ) : !planResult ? (
        <div className="p-20 rounded-2xl bg-[#121721] border border-[#232b3b] text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#a371f7]/15 border border-[#a371f7]/35 flex items-center justify-center text-[#a371f7] mx-auto">
            <ListTodo className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#f0f6fc]">Ready for Implementation Planning</h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              Click <strong>Generate Blueprint</strong> to produce an actionable architectural plan without modifying code.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGeneratePlan}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm"
          >
            <ListTodo className="w-4 h-4" />
            <span>Generate Implementation Plan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Blueprint Spec Banner */}
          <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                    BLUEPRINT SPEC
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    • Grounded against {selectedBranch} branch
                  </span>
                </div>

                <h2 className="text-sm font-bold text-[#f0f6fc] leading-snug">
                  {planResult.summary}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleGeneratePlan}
                title="Re-generate plan"
                className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#1c2433]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#c9d1d9]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>{planResult.affectedFiles.length} Affected Files</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#c9d1d9]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{planResult.implementationSteps.length} Steps</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0c1017] border border-[#232b3b] text-xs font-mono text-[#c9d1d9]">
                <Network className="w-3.5 h-3.5 text-[#a371f7]" />
                <span>{planResult.dependencies.length} Dependencies</span>
              </span>
            </div>
          </div>

          {/* Affected Files Card */}
          <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#f0f6fc] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#58a6ff]" />
                Affected Files ({planResult.affectedFiles.length} verified)
              </span>
              <span className="text-[11px] font-mono text-[#8b949e]">
                Click Inspect to view in Source Drawer
              </span>
            </div>

            <div className="space-y-2">
              {planResult.affectedFiles.map((file, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3.5 rounded-xl bg-[#0c1017] border border-[#1c2433] hover:border-[#2b374d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-mono font-semibold text-[#58a6ff] block truncate">
                      {file.path}
                    </span>
                    <div className="text-xs text-[#8b949e] space-y-0.5">
                      <p>
                        <strong className="text-[#c9d1d9]">Reason:</strong> {file.reason}
                      </p>
                      {file.expectedChange && (
                        <p>
                          <strong className="text-[#c9d1d9]">Expected Change:</strong> {file.expectedChange}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInspectFile(file.path)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-xs font-mono text-[#58a6ff] border border-[#2b374d] shrink-0 self-start sm:self-center transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Roadmap (Sequential Steps) */}
          <div className="p-5 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#f0f6fc] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Actionable Roadmap ({planResult.implementationSteps.length} Sequential Steps)
              </span>
              <span className="text-[11px] font-mono text-[#8b949e]">
                Click step chevron to view details
              </span>
            </div>

            <div className="space-y-2.5">
              {planResult.implementationSteps.map((step, sIdx) => {
                const isExpanded = !!expandedSteps[sIdx];
                const stepNumStr = step.order < 10 ? `0${step.order}` : `${step.order}`;
                return (
                  <div
                    key={sIdx}
                    className="rounded-xl bg-[#0c1017] border border-[#1c2433] hover:border-[#2b374d] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(sIdx)}
                      className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-[#18202d]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/35 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {stepNumStr}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-semibold text-[#f0f6fc]">
                            {step.title}
                          </h4>
                          {step.filePaths.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {step.filePaths.map((fp, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-1.5 py-0.5 rounded bg-[#18202d] text-[10px] font-mono text-[#8b949e] border border-[#273244]"
                                >
                                  {fp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-[#8b949e] mt-1">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-[#1c2433] bg-[#0c1017]/80 text-xs text-[#c9d1d9] leading-relaxed">
                        <p className="pt-2">{step.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Accordions: Risks, Testing, Architecture, Assumptions */}
          <div className="space-y-3">
            {/* Risks & Dependencies */}
            {(planResult.risks.length > 0 || planResult.dependencies.length > 0) && (
              <AccordionSection
                title="Risks & Dependencies"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                    {planResult.dependencies.length} Dependencies · {planResult.risks.length} Risks
                  </span>
                }
                icon={ShieldAlert}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planResult.dependencies.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#58a6ff] block">
                        Dependencies
                      </span>
                      <ul className="space-y-1.5 text-xs text-[#c9d1d9]">
                        {planResult.dependencies.map((dep, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <span className="text-[#58a6ff]">•</span>
                            <span>{dep}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planResult.risks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-yellow-400 block">
                        Risks & Mitigations
                      </span>
                      <ul className="space-y-1.5 text-xs text-yellow-200">
                        {planResult.risks.map((risk, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="text-yellow-400">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Testing Plan */}
            {planResult.testingPlan.length > 0 && (
              <AccordionSection
                title="Actionable Testing Plan"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d]">
                    Advisory Guide
                  </span>
                }
                icon={CheckCircle2}
              >
                <ul className="space-y-2 text-xs text-[#c9d1d9]">
                  {planResult.testingPlan.map((tp, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Architectural Considerations */}
            {planResult.architecturalConsiderations.length > 0 && (
              <AccordionSection
                title="Architectural Considerations"
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a371f7]/10 text-[#a371f7] border border-[#a371f7]/25">
                    Modular Patterns
                  </span>
                }
                icon={Layers}
              >
                <ul className="space-y-1.5 text-xs text-[#c9d1d9]">
                  {planResult.architecturalConsiderations.map((ac, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2">
                      <span className="text-[#a371f7]">•</span>
                      <span>{ac}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Assumptions */}
            {planResult.assumptions.length > 0 && (
              <AccordionSection
                title="Assumptions & Constraints"
                icon={HelpCircle}
              >
                <ul className="space-y-1.5 text-xs text-[#8b949e]">
                  {planResult.assumptions.map((asmp, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{asmp}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}
          </div>

          {/* Citations list banner */}
          {planResult.citations.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f0f6fc] font-mono flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                  Retrieved Architecture References ({planResult.citations.length})
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
                {planResult.citations.map((cit, cIdx) => (
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

          {/* Read-only Advisory Footer & Feedback */}
          <div className="p-4 rounded-2xl bg-[#121721] border border-[#232b3b] space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <Info className="w-4 h-4 text-[#58a6ff] shrink-0" />
              <span>
                <strong>Advisory Read-Only Mode:</strong> DevIntel AI does not write code, execute migrations, or commit to repositories.
              </span>
            </div>

            <FeedbackWidget
              repositoryId={selectedRepoId}
              capability="plan"
              meta={planResult.meta}
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

      {/* Input Modal for entering/editing feature request */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121721] border border-[#232b3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#232b3b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#a371f7]" />
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Feature Specification Request
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
              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Feature Request or Objective *
                </label>
                <textarea
                  rows={4}
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="Describe proposed feature or refactor..."
                  className="w-full p-3 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Technical Constraints & Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Keep existing session cookies, ensure zero downtime migration..."
                  className="w-full p-2.5 rounded-lg bg-[#0c1017] border border-[#232b3b] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] resize-none"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono text-[#8b949e] block">
                  Sample Prompts:
                </span>
                <div className="space-y-1.5">
                  {sampleRequests.map((sample, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setFeatureRequest(sample)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0c1017] hover:bg-[#18202d] border border-[#232b3b] hover:border-[#58a6ff] text-xs text-[#c9d1d9] hover:text-[#58a6ff] transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                      <span className="truncate">{sample}</span>
                    </button>
                  ))}
                </div>
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
                onClick={handleGeneratePlan}
                disabled={planning || !featureRequest.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {planning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListTodo className="w-3.5 h-3.5" />}
                <span>Generate Implementation Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
