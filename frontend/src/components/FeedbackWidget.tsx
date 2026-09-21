import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, Cpu, Check, Layers } from 'lucide-react';
import { submitFeedback } from '../services/api';
import { AIMetadata } from '../types/intelligence';

interface FeedbackWidgetProps {
  repositoryId: string;
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
    if (submitting || submitted) return;
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
      className={`flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 ${className}`}
    >
      {/* AI Observability Metadata */}
      <div className="flex items-center gap-3 flex-wrap">
        {meta?.latencyMs !== undefined && (
          <span className="inline-flex items-center text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-mono">
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            {meta.latencyMs}ms
          </span>
        )}
        {meta?.chunksRetrieved !== undefined && (
          <span className="inline-flex items-center text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-mono">
            <Layers className="w-3 h-3 mr-1 text-slate-400" />
            {meta.chunksRetrieved} chunk{meta.chunksRetrieved === 1 ? '' : 's'}
          </span>
        )}
        {meta?.model && (
          <span className="inline-flex items-center text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-mono">
            <Cpu className="w-3 h-3 mr-1 text-slate-400" />
            {meta.model}
          </span>
        )}
      </div>

      {/* Thumbs Feedback */}
      <div className="flex items-center gap-1.5 ml-auto">
        {submitted ? (
          <span className="inline-flex items-center text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Check className="w-3 h-3 mr-1" /> Feedback recorded
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-1">Helpful?</span>
            <button
              onClick={() => handleRate(1)}
              disabled={submitting}
              title="Helpful"
              className={`p-1 rounded transition-colors ${
                rating === 1
                  ? 'text-emerald-400 bg-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRate(-1)}
              disabled={submitting}
              title="Not helpful"
              className={`p-1 rounded transition-colors ${
                rating === -1
                  ? 'text-rose-400 bg-rose-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
