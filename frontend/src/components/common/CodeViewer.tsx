import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  startLine?: number;
  highlightLine?: number;
  language?: string;
  filePath?: string;
  githubUrl?: string;
  className?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  startLine = 1,
  highlightLine,
  language,
  filePath,
  githubUrl,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`rounded-lg bg-[#0c1017] border border-[#232b3b] overflow-hidden font-mono text-xs ${className}`}>
      {(filePath || language || githubUrl) && (
        <div className="px-3 py-2 bg-[#121721] border-b border-[#232b3b] flex items-center justify-between gap-2 text-[11px] text-[#8b949e]">
          <div className="flex items-center gap-2 truncate">
            {filePath && <span className="text-[#c9d1d9] font-medium truncate">{filePath}</span>}
            {language && (
              <span className="px-1.5 py-0.5 rounded bg-[#1c2433] text-[10px] text-[#58a6ff]">
                {language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                title="View on GitHub"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[#1c2433] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto p-2">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNumber = startLine + idx;
              const isHighlighted = highlightLine === lineNumber;
              return (
                <tr
                  key={idx}
                  className={`${
                    isHighlighted ? 'bg-[#58a6ff]/15 border-l-2 border-[#58a6ff]' : 'hover:bg-[#141b26]/50'
                  }`}
                >
                  <td className="w-10 pr-3 text-right select-none text-[#48546b] text-[11px]">
                    {lineNumber}
                  </td>
                  <td className="whitespace-pre text-[#c9d1d9] leading-relaxed pl-2 font-mono">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
