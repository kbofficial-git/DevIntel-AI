import React, { useState } from 'react';
import { Citation } from '../../types/intelligence';
import { CodeViewer } from './CodeViewer';
import { FileCode, X, ChevronLeft, ChevronRight, ExternalLink, Copy, Check, Shield } from 'lucide-react';

interface SourceInspectorProps {
  citation: Citation | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
  repoFullName?: string;
  defaultBranch?: string;
  githubBaseUrl?: string;
  className?: string;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  citation,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
  repoFullName,
  defaultBranch = 'main',
  githubBaseUrl,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const githubFileUrl = githubBaseUrl
    ? `${githubBaseUrl}/blob/${defaultBranch}/${citation.filePath}#L${citation.startLine}-L${citation.endLine}`
    : undefined;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(citation.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <aside
      className={`w-full max-w-md lg:w-96 bg-[#0f141d] border-l border-[#232b3b] flex flex-col h-full shrink-0 shadow-2xl z-20 ${className}`}
    >
      {/* Header Bar */}
      <div className="p-3.5 border-b border-[#232b3b] bg-[#141a24] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-[#58a6ff] shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#f0f6fc] block truncate">
              Source Inspector
            </span>
            {repoFullName && (
              <span className="text-[10px] font-mono text-[#8b949e] block truncate">
                {repoFullName}:{defaultBranch}
              </span>
            )}
          </div>
        </div>

        {/* Navigation & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {totalCount !== undefined && totalCount > 1 && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={!onPrev}
                className="p-1 rounded hover:bg-[#1f2633] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30 transition-colors"
                title="Previous Citation"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {(currentIndex ?? 0) + 1}/{totalCount}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={!onNext}
                className="p-1 rounded hover:bg-[#1f2633] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30 transition-colors"
                title="Next Citation"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1f2633] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File & Range Banner */}
      <div className="p-3 bg-[#121722] border-b border-[#232b3b] space-y-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono font-medium text-[#58a6ff] truncate">
            {citation.filePath}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1b2332] text-[#8b949e] border border-[#2b374d] shrink-0">
            Lines {citation.startLine}–{citation.endLine}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#8b949e]">
          {citation.symbolName && (
            <span className="px-1.5 py-0.5 rounded bg-[#212b3d] text-[#a371f7] border border-[#2f3d54]">
              Symbol: {citation.symbolName}
            </span>
          )}
          {citation.similarity > 0 && (
            <span className="text-emerald-400">
              {Math.round(citation.similarity * 100)}% match
            </span>
          )}
        </div>
      </div>

      {/* Code Viewer Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <CodeViewer
          code={citation.snippet}
          startLine={citation.startLine}
          filePath={citation.filePath}
        />

        {/* Read-Only Safety Disclaimer */}
        <div className="p-3 rounded-lg bg-[#141a24] border border-[#232b3b] text-[11px] text-[#8b949e] space-y-1">
          <div className="flex items-center gap-1.5 text-[#c9d1d9] font-medium">
            <Shield className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Read-Only Source Context</span>
          </div>
          <p className="leading-relaxed">
            DevIntel operates in read-only analysis mode. Source files cannot be modified directly through this inspector.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#232b3b] bg-[#141a24] flex items-center justify-between gap-2 text-[11px] font-mono shrink-0">
        <button
          type="button"
          onClick={handleCopySnippet}
          className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
        </button>

        {githubFileUrl && (
          <a
            href={githubFileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[#58a6ff] hover:underline"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </aside>
  );
};
