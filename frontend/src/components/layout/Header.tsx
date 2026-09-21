import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GitBranch, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between shrink-0">
      {/* Active Repo Context Placeholder */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#8b949e]">
          <GitBranch className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span>No repository selected</span>
        </div>
        <span className="text-xs text-[#8b949e]">
          Milestone 2: Auth & Repositories
        </span>
      </div>

      {/* User info & Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Development</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#30363d]">
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-7 h-7 rounded-full border border-[#30363d] object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e]">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="text-xs font-medium text-[#f0f6fc] block leading-tight">
                  {user.name || user.login}
                </span>
                <span className="text-[10px] text-[#8b949e] font-mono block">
                  @{user.login}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#f85149] transition-colors border border-transparent hover:border-[#30363d]"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
