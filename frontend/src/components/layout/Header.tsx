import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRepository } from '../../contexts/RepositoryContext';
import { GitBranch, Bell, HelpCircle, ExternalLink, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedRepo, selectedBranch } = useRepository();

  return (
    <header className="h-14 bg-[#0f141d] border-b border-[#232b3b] px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Status Pill & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-mono shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GitHub App: Active</span>
        </div>

        {/* Repository breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[#8b949e] truncate">
          <span className="text-[#606d85]">/</span>
          <span className="text-[#c9d1d9]">{user?.login || 'workspace'}</span>
          <span className="text-[#606d85]">/</span>
          <span className="text-[#f0f6fc] font-semibold truncate">
            {selectedRepo ? selectedRepo.name : 'no-repository-selected'}
          </span>
          {selectedRepo && (
            <div className="flex items-center gap-1 text-[11px] text-[#58a6ff] ml-1 bg-[#18202d] px-1.5 py-0.5 rounded border border-[#273244]">
              <GitBranch className="w-3 h-3" />
              <span>{selectedBranch}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Links & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick link to GitHub */}
        {user?.login && (
          <a
            href={`https://github.com/${user.login}`}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs font-mono text-[#8b949e] hover:text-[#58a6ff] transition-colors"
          >
            <span>github.com/{user.login}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Help Circle */}
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User initials / avatar button */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#232b3b]">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="w-7 h-7 rounded-full border border-[#2b374d] object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#18202d] border border-[#2b374d] flex items-center justify-center text-[#58a6ff] text-xs font-semibold">
                {user.login.slice(0, 2).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-rose-400 transition-colors"
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

