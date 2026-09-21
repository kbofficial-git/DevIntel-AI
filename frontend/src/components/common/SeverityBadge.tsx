import React from 'react';
import { Severity } from '../../types/intelligence';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}

const severityConfigs: Record<
  Severity,
  { label: string; text: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL: {
    label: 'Critical',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: ShieldAlert,
  },
  HIGH: {
    label: 'High',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: 'Medium',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
  },
  LOW: {
    label: 'Low',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    icon: Info,
  },
  INFO: {
    label: 'Info',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: Info,
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className = '',
  showIcon = true,
}) => {
  const cfg = severityConfigs[severity] || severityConfigs.INFO;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{cfg.label}</span>
    </span>
  );
};
