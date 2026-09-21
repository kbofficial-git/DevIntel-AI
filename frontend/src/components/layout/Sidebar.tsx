import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRepository } from '../../contexts/RepositoryContext';
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquareCode,
  FileCheck2,
  Bug,
  ListTodo,
  Cpu,
  Settings,
  Terminal,
  Search,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { repositories, selectedRepo } = useRepository();

  return (
    <aside className="w-64 bg-[#0f141d] border-r border-[#232b3b] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-[#232b3b] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff]">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#f0f6fc]">
            DevIntel AI
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
          v1.4
        </span>
      </div>

      {/* Quick Find / Command Box */}
      <div className="p-3 pb-1">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#141a24] border border-[#232b3b] text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="text-[11px]">Quick Find / Command</span>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#1c2433] text-[#8b949e] border border-[#2b374d]">
            ⌘K
          </span>
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {/* Section: MAIN */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#606d85] uppercase font-mono">
            MAIN
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
          </NavLink>

          <NavLink
            to="/repositories"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <FolderGit2 className="w-4 h-4 shrink-0" />
              <span>Repositories</span>
            </div>
            {repositories.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18202d] text-[#8b949e] border border-[#273244]">
                {repositories.length}
              </span>
            )}
          </NavLink>

          {/* Active Repository Sub-item */}
          {selectedRepo && (
            <div className="pl-6 pr-2 py-1">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#131924] border border-[#20293a] text-xs font-mono text-[#c9d1d9] truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                <span className="truncate">{selectedRepo.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section: AI INTELLIGENCE */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#606d85] uppercase font-mono">
            AI INTELLIGENCE
          </div>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <MessageSquareCode className="w-4 h-4 shrink-0" />
              <span>Codebase Chat</span>
            </div>
          </NavLink>

          <NavLink
            to="/review"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>Code Review</span>
            </div>
          </NavLink>

          <NavLink
            to="/debug"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Bug className="w-4 h-4 shrink-0" />
              <span>Debug Assistant</span>
            </div>
          </NavLink>

          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <ListTodo className="w-4 h-4 shrink-0" />
              <span>Implementation Plans</span>
            </div>
          </NavLink>
        </div>

        {/* Section: SYSTEM / MANAGE */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#606d85] uppercase font-mono">
            SYSTEM / MANAGE
          </div>

          <NavLink
            to="/activity"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Index Engine & Vector DB</span>
            </div>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </div>
          </NavLink>
        </div>
      </div>

      {/* User Card at Bottom */}
      {user && (
        <div className="p-3 border-t border-[#232b3b] bg-[#0c1017]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-8 h-8 rounded-full border border-[#232b3b] object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#18202d] border border-[#2b374d] flex items-center justify-center text-[#58a6ff] text-xs font-bold shrink-0">
                  {user.login.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#f0f6fc] block truncate">
                  {user.name || user.login}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 block truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Connected
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-[#18202d] text-[#8b949e] hover:text-rose-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

