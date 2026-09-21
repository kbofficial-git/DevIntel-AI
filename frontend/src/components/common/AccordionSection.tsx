import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  badge,
  icon: Icon,
  defaultExpanded = false,
  children,
  className = '',
  headerRight,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-xl bg-[#121721] border border-[#232b3b] overflow-hidden transition-colors ${className}`}>
      <div className="flex items-center justify-between p-3.5 hover:bg-[#18202d] transition-colors">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1 rounded bg-[#1c2433] text-[#58a6ff] shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-semibold text-[#f0f6fc] truncate">
              {title}
            </span>
            {badge && <div>{badge}</div>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#8b949e]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#8b949e]" />
            )}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-[#1c2433] bg-[#0c1017]/60">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
};
