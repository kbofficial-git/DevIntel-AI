import React, { useState } from 'react';
import { ReviewFinding } from '../../types/intelligence';
import { Copy, Check, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  findings?: ReviewFinding[];
  onFindingClick?: (finding: ReviewFinding, index: number) => void;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  findings = [],
  onFindingClick,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const diffLines = diff.split('\n');

  // Find if a given line index in diff corresponds to any finding
  const getFindingForLine = (lineContent: string) => {
    return findings.find((f) => {
      if (!f.evidence) return false;
      const firstEvidenceLine = f.evidence.split('\n')[0].trim();
      return lineContent.trim().includes(firstEvidenceLine) || firstEvidenceLine.includes(lineContent.trim());
    });
  };

  return (
    <div className={`rounded-xl bg-[#0c1017] border border-[#232b3b] overflow-hidden font-mono text-xs flex flex-col ${className}`}>
      {/* Diff Toolbar */}
      <div className="px-3.5 py-2.5 bg-[#121721] border-b border-[#232b3b] flex items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-[#18202d] border border-[#273244] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                viewMode === 'unified'
                  ? 'bg-[#2b374d] text-[#f0f6fc]'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Unified
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-[#2b374d] text-[#f0f6fc]'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Split
            </button>
          </div>
          <span className="text-[#8b949e] text-[11px] hidden sm:inline">
            {diffLines.length} lines in diff
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18202d] hover:bg-[#232d3e] text-[#8b949e] hover:text-[#f0f6fc] border border-[#273244] transition-colors"
          title="Copy raw diff"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Diff'}</span>
        </button>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto flex-1 p-2">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => {
              const isAddition = line.startsWith('+') && !line.startsWith('+++');
              const isDeletion = line.startsWith('-') && !line.startsWith('---');
              const isHeader = line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('@@');

              const matchedFinding = (isAddition || isDeletion) ? getFindingForLine(line) : undefined;

              const rowClass = isAddition
                ? 'bg-emerald-950/25 text-emerald-300'
                : isDeletion
                ? 'bg-rose-950/25 text-rose-300'
                : isHeader
                ? 'bg-[#18202d]/60 text-[#58a6ff] font-semibold'
                : 'text-[#c9d1d9]';

              return (
                <React.Fragment key={idx}>
                  <tr className={`hover:bg-[#141b26] transition-colors ${rowClass}`}>
                    <td className="w-10 pr-3 text-right select-none text-[#48546b] text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="whitespace-pre leading-relaxed pl-2 font-mono">
                      {line || ' '}
                    </td>
                  </tr>

                  {/* Inline Finding Callout (if line triggered a finding) */}
                  {matchedFinding && (
                    <tr>
                      <td colSpan={2} className="p-1">
                        <div
                          onClick={() => onFindingClick && onFindingClick(matchedFinding, findings.indexOf(matchedFinding))}
                          className="cursor-pointer mx-3 my-1 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 hover:border-rose-400 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {matchedFinding.severity === 'CRITICAL' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <span className="font-semibold truncate">
                              [{matchedFinding.severity}] {matchedFinding.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 shrink-0">
                            <span>Jump to Finding</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
