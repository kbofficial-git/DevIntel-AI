import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="p-4 rounded-xl bg-[#121721] border border-[#232b3b] hover:border-[#35435c] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e]">
          {label}
        </span>
        {badge ? (
          badge
        ) : Icon ? (
          <div className="w-6 h-6 rounded-md bg-[#1c2433] border border-[#2b374d] flex items-center justify-center text-[#58a6ff]">
            <Icon className="w-3.5 h-3.5" />
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold font-mono tracking-tight text-[#f0f6fc]">
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-[#8b949e] flex items-center gap-1.5">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
