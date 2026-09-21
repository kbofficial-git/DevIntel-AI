import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Repository,
} from '../types/auth';
import {
  ChatMessage,
  Citation,
  Conversation,
} from '../types/intelligence';
import {
  fetchConnectedRepositories,
  fetchConversations,
  fetchConversation,
  askQuestion,
} from '../services/api';
import {
  MessageSquareCode,
  FolderGit2,
  Send,
  Loader2,
  FileCode,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Bot,
  User as UserIcon,
  X,
  Plus,
} from 'lucide-react';
import { FeedbackWidget } from '../components/FeedbackWidget';

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repoParam = searchParams.get('repo');

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [sendingQuery, setSendingQuery] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load connected repositories
  useEffect(() => {
    fetchConnectedRepositories()
      .then((res) => {
        const repos = res.data || [];
        setRepositories(repos);

        if (repos.length > 0) {
          if (repoParam && repos.some((r) => r.id === repoParam)) {
            setSelectedRepoId(repoParam);
          } else {
            setSelectedRepoId(repos[0].id);
          }
        }
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load repositories');
      })
      .finally(() => {
        setLoadingRepos(false);
      });
  }, [repoParam]);

  // Load conversations when selected repository changes
  useEffect(() => {
    if (!selectedRepoId) return;

    fetchConversations(selectedRepoId)
      .then((res) => {
        const convos = res.data || [];
        setConversations(convos);
        if (convos.length > 0) {
          loadConversationMessages(convos[0].id);
        } else {
          setActiveConversationId(undefined);
          setMessages([]);
        }
      })
      .catch(() => {
        setConversations([]);
      });
  }, [selectedRepoId]);

  const loadConversationMessages = async (convoId: string) => {
    try {
      setActiveConversationId(convoId);
      const res = await fetchConversation(selectedRepoId, convoId);
      if (res.data && res.data.messages) {
        setMessages(
          res.data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : undefined,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load conversation history', err);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || !selectedRepoId || sendingQuery) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setSendingQuery(true);
    setErrorMessage(null);

    try {
      const res = await askQuestion(selectedRepoId, textToSend, activeConversationId);
      if (res.data) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations,
          meta: res.data.meta,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
          // Refresh conversation list
          fetchConversations(selectedRepoId).then((r) => setConversations(r.data || []));
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to query codebase');
    } finally {
      setSendingQuery(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);

  if (loadingRepos) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#8b949e]">Loading codebase chat workspace...</p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-[#161b22] border border-[#30363d] rounded-xl text-center space-y-4">
        <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-70" />
        <h2 className="text-sm font-semibold text-[#f0f6fc]">No connected repositories</h2>
        <p className="text-xs text-[#8b949e]">
          Connect a repository from your GitHub account first to start querying your codebase.
        </p>
        <button
          onClick={() => navigate('/repositories')}
          className="px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors"
        >
          Go to Repositories
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 relative">
      {/* Left Sidebar: Conversations & Repo Selector */}
      <div className="w-64 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shrink-0 overflow-hidden">
        {/* Repo Selector Header */}
        <div className="p-3 border-b border-[#30363d] space-y-2">
          <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider block">
            Target Repository
          </label>
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
          >
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.name} ({repo.owner})
              </option>
            ))}
          </select>
        </div>

        {/* New Chat Button */}
        <div className="p-2 border-b border-[#30363d]">
          <button
            onClick={() => {
              setActiveConversationId(undefined);
              setMessages([]);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-[#8b949e] uppercase">
            Recent Threads
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8b949e]">
              No previous threads
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversationMessages(c.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  activeConversationId === c.id
                    ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30'
                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                }`}
              >
                <span className="truncate">{c.title}</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="h-12 px-5 border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquareCode className="w-4 h-4 text-[#58a6ff]" />
            <span className="text-xs font-semibold text-[#f0f6fc]">
              {selectedRepo?.fullName}
            </span>
            <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
              Branch: {selectedRepo?.defaultBranch}
            </span>
          </div>

          <div className="text-[11px] font-mono text-[#8b949e] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Grounded RAG Mode</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="max-w-md mx-auto my-12 text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">
                Explore {selectedRepo?.name} with Grounded AI
              </h3>
              <p className="text-xs text-[#8b949e]">
                Ask questions about component architecture, authentication, data flows, and code patterns. Every answer is grounded in retrieved code chunks.
              </p>

              <div className="space-y-2 pt-2 text-left">
                <div className="text-[11px] font-mono text-[#8b949e] text-center">
                  Suggested Questions:
                </div>
                {[
                  'Where is authentication handled in this codebase?',
                  'Explain the database models and relations.',
                  'How does the repository ingestion pipeline work?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSend(promptText)}
                    className="w-full text-left p-2.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-xs text-[#c9d1d9] transition-colors"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1f6feb]/15 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#1f6feb] text-white'
                      : 'bg-[#0d1117] border border-[#30363d] text-[#c9d1d9]'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.content}
                  </div>

                  {/* Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 border-t border-[#30363d] space-y-1.5">
                      <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-[#58a6ff]" />
                        <span>Source Citations ({msg.citations.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setSelectedCitation(c)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] font-mono text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                          >
                            <span>{c.filePath}</span>
                            <span className="text-[#8b949e]">
                              L{c.startLine}-{c.endLine}
                            </span>
                            <span className="text-[9px] px-1 rounded bg-[#21262d] text-[#8b949e]">
                              {Math.round(c.similarity * 100)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <FeedbackWidget
                      repositoryId={selectedRepoId}
                      capability="chat"
                      referenceId={msg.id || activeConversationId}
                      meta={msg.meta}
                    />
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e] shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {sendingQuery && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#1f6feb]/15 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center gap-2 text-xs text-[#8b949e]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                <span>Searching vector embeddings and synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/60">
          <div className="flex gap-2 items-end">
            <textarea
              rows={2}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this repository (Enter to submit, Shift+Enter for new line)..."
              disabled={sendingQuery}
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] resize-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={sendingQuery || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              {sendingQuery ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Citation Inspector Drawer / Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#58a6ff]" />
                <span className="text-xs font-mono font-semibold text-[#f0f6fc]">
                  {selectedCitation.filePath}
                </span>
                <span className="text-[11px] font-mono text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                  Lines {selectedCitation.startLine}–{selectedCitation.endLine}
                </span>
                {selectedCitation.symbolName && (
                  <span className="text-[10px] font-mono text-[#a371f7] bg-[#a371f7]/10 px-1.5 py-0.5 rounded border border-[#a371f7]/30">
                    {selectedCitation.symbolName}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#0d1117]">
              <pre className="text-xs font-mono text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">
                {selectedCitation.snippet}
              </pre>
            </div>

            <div className="p-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
              <span>Relevance score: {Math.round(selectedCitation.similarity * 100)}%</span>
              <a
                href={`${selectedRepo?.githubUrl}/blob/${selectedRepo?.defaultBranch}/${selectedCitation.filePath}#L${selectedCitation.startLine}-L${selectedCitation.endLine}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#58a6ff] hover:underline"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
