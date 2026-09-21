import React from 'react';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';
import { IngestionStatus } from '../../types/intelligence';

interface StatusBadgeProps {
  status?: IngestionStatus | 'NOT_INDEXED' | string;
  chunksCount?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'NOT_INDEXED',
  chunksCount,
  className = '',
  size = 'sm',
}) => {
  const normalized = status.toUpperCase();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (normalized === 'COMPLETED' || normalized === 'INDEXED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${padding} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <Check className="w-3 h-3" />
        <span>Indexed{chunksCount !== undefined ? ` (${chunksCount.toLocaleString()} chunks)` : ''}</span>
      </span>
    );
  }

  if (normalized === 'IN_PROGRESS' || normalized === 'QUEUED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 ${padding} ${className}`}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Indexing in progress</span>
      </span>
    );
  }

  if (normalized === 'FAILED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 ${padding} ${className}`}
      >
        <AlertCircle className="w-3 h-3" />
        <span>Indexing failed</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d] ${padding} ${className}`}
    >
      <Circle className="w-2 h-2 fill-current opacity-60" />
      <span>Not Indexed</span>
    </span>
  );
};
