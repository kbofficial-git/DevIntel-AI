import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Code2,
  MessageSquareCode,
  FileCheck2,
  Bug,
  ListTodo,
  Activity,
  Settings,
  Terminal,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Repositories', path: '/repositories', icon: FolderGit2 },
  { name: 'AI Chat', path: '/chat', icon: MessageSquareCode },
  { name: 'Code Review', path: '/review', icon: FileCheck2 }, // Live in Milestone 4
  { name: 'Debugging', path: '/debug', icon: Bug }, // Live in Milestone 4
  { name: 'Plans', path: '/plans', icon: ListTodo }, // Live in Milestone 4
  { name: 'Codebase', path: '/codebase', icon: Code2, badge: 'Phase 4' },
  { name: 'Activity', path: '/activity', icon: Activity, badge: 'Phase 11' },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#30363d] flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#1f6feb]/15 border border-[#1f6feb]/40 flex items-center justify-center text-[#58a6ff]">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-wide text-[#f0f6fc] block leading-tight">
            DevIntel AI
          </span>
          <span className="text-[10px] text-[#8b949e] font-mono block">
            Developer Platform
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#8b949e] uppercase font-mono">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/50">
        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[11px]">Milestone 3 Active</span>
        </div>
      </div>
    </aside>
  );
};
