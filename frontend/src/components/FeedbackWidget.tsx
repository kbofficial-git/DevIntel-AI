import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, Cpu, Check, Layers } from 'lucide-react';
import { submitFeedback } from '../services/api';
import { AIMetadata } from '../types/intelligence';

interface FeedbackWidgetProps {
  repositoryId?: string | null;
  capability: 'chat' | 'review' | 'debug' | 'plan';
  referenceId?: string;
  meta?: AIMetadata;
  className?: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  repositoryId,
  capability,
  referenceId,
  meta,
  className = '',
}) => {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (newRating: 1 | -1) => {
    if (submitting || submitted || !repositoryId) return;
    setSubmitting(true);
    try {
      const res = await submitFeedback(repositoryId, {
        capability,
        rating: newRating,
        referenceId,
      });
      if (res.data) {
        setRating(newRating);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#232b3b] text-xs text-[#8b949e] ${className}`}
    >
      {/* AI Observability Metadata (only rendered if actually returned by backend) */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
        {meta?.latencyMs !== undefined && (
          <span className="inline-flex items-center text-[#8b949e] bg-[#121722] border border-[#232b3b] px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 mr-1 text-[#58a6ff]" />
            {meta.latencyMs}ms
          </span>
        )}
        {meta?.chunksRetrieved !== undefined && (
          <span className="inline-flex items-center text-[#8b949e] bg-[#121722] border border-[#232b3b] px-2 py-0.5 rounded">
            <Layers className="w-3 h-3 mr-1 text-[#58a6ff]" />
            {meta.chunksRetrieved} chunk{meta.chunksRetrieved === 1 ? '' : 's'}
          </span>
        )}
        {meta?.model && (
          <span className="inline-flex items-center text-[#8b949e] bg-[#121722] border border-[#232b3b] px-2 py-0.5 rounded">
            <Cpu className="w-3 h-3 mr-1 text-[#a371f7]" />
            {meta.model}
          </span>
        )}
      </div>

      {/* Thumbs Feedback */}
      <div className="flex items-center gap-2 ml-auto">
        {submitted ? (
          <span className="inline-flex items-center text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-xs">
            <Check className="w-3 h-3 mr-1" /> Feedback recorded
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[#8b949e] text-xs">Was this helpful?</span>
            <button
              type="button"
              onClick={() => handleRate(1)}
              disabled={submitting || !repositoryId}
              title="Helpful"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                rating === 1
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] bg-[#141a24] hover:bg-[#1f2633] border-[#232b3b]'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => handleRate(-1)}
              disabled={submitting || !repositoryId}
              title="Not helpful"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                rating === -1
                  ? 'text-rose-400 bg-rose-500/15 border-rose-500/40'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] bg-[#141a24] hover:bg-[#1f2633] border-[#232b3b]'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>No</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

