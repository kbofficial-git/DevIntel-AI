import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRepository } from '../contexts/RepositoryContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ChatMessage,
  Citation,
  Conversation,
} from '../types/intelligence';
import {
  fetchConversations,
  fetchConversation,
  askQuestion,
} from '../services/api';
import { SourceInspector } from '../components/common/SourceInspector';
import { FeedbackWidget } from '../components/FeedbackWidget';
import {
  MessageSquareCode,
  Send,
  Loader2,
  FileCode,
  Sparkles,
  ChevronRight,
  Bot,
  User as UserIcon,
  Plus,
  Search,
  BookOpen,
  FolderGit2,
  AlertCircle,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');
  const initialQuery = searchParams.get('q');

  const { repositories, selectedRepoId, selectedRepo, selectedBranch, setSelectedRepoId } = useRepository();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);
  const [searchThreadQuery, setSearchThreadQuery] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync repoParam if present in URL
  useEffect(() => {
    if (repoParam && repositories.some((r) => r.id === repoParam)) {
      setSelectedRepoId(repoParam);
    }
  }, [repoParam, repositories, setSelectedRepoId]);

  // Handle initial quick query passed from Workspace
  useEffect(() => {
    if (initialQuery && !inputQuery && messages.length === 0) {
      setInputQuery(initialQuery);
    }
  }, [initialQuery]);

  // Load conversations when selected repository changes
  useEffect(() => {
    if (!selectedRepoId) return;

    fetchConversations(selectedRepoId)
      .then((res) => {
        const convos = res.data || [];
        setConversations(convos);
        if (convos.length > 0 && !activeConversationId) {
          loadConversationMessages(convos[0].id);
        } else if (convos.length === 0) {
          setActiveConversationId(undefined);
          setMessages([]);
        }
      })
      .catch(() => {
        setConversations([]);
      });
  }, [selectedRepoId]);

  const loadConversationMessages = async (convoId: string) => {
    if (!selectedRepoId) return;
    try {
      setActiveConversationId(convoId);
      const res = await fetchConversation(selectedRepoId, convoId);
      if (res.data && res.data.messages) {
        const parsedMsgs: ChatMessage[] = res.data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations
            ? typeof m.citations === 'string'
              ? JSON.parse(m.citations)
              : m.citations
            : undefined,
          createdAt: m.createdAt,
        }));
        setMessages(parsedMsgs);

        // Auto-select first citation in inspector if present
        for (const msg of parsedMsgs) {
          if (msg.citations && msg.citations.length > 0) {
            setSelectedCitation(msg.citations[0]);
            break;
          }
        }
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

        if (res.data.citations && res.data.citations.length > 0) {
          setSelectedCitation(res.data.citations[0]);
          setShowInspector(true);
        }

        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
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

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchThreadQuery.toLowerCase())
  );

  if (!selectedRepo) {
    return (
      <div className="p-12 text-center bg-[#121721] border border-[#232b3b] rounded-2xl space-y-4">
        <FolderGit2 className="w-10 h-10 text-[#8b949e] mx-auto opacity-60" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">No Repository Selected</h2>
        <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
          Please select or connect a repository first to query your codebase.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 relative overflow-hidden">
      {/* Left Pane: Thread & Session Management */}
      <div className="w-64 bg-[#121721] border border-[#232b3b] rounded-2xl flex flex-col shrink-0 overflow-hidden select-none">
        {/* New Thread Button */}
        <div className="p-3 border-b border-[#1c2433]">
          <button
            type="button"
            onClick={() => {
              setActiveConversationId(undefined);
              setMessages([]);
              setSelectedCitation(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-xs text-white font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Thread</span>
            <span className="text-[10px] opacity-75 font-mono ml-auto">⌘N</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="p-2 border-b border-[#1c2433]">
          <div className="relative">
            <Search className="w-3 h-3 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter conversations..."
              value={searchThreadQuery}
              onChange={(e) => setSearchThreadQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#0c1017] border border-[#1c2433] text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
        </div>

        {/* Recent Threads List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-[#606d85] uppercase tracking-wider">
            RECENT THREADS
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8b949e]">
              No previous threads
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConversationId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => loadConversationMessages(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-[#1a2333] text-[#58a6ff] border border-[#2b3952]'
                      : 'text-[#8b949e] hover:bg-[#18202d] hover:text-[#c9d1d9]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block text-xs">
                      {c.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#606d85] block truncate">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1c2433] bg-[#0c1017] text-[10px] font-mono text-[#8b949e] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="truncate">{selectedRepo.name}:{selectedBranch}</span>
        </div>
      </div>

      {/* Center Pane: Main Conversation Workspace */}
      <div className="flex-1 bg-[#121721] border border-[#232b3b] rounded-2xl flex flex-col overflow-hidden">
        {/* Chat Header Toolbar */}
        <div className="h-14 px-5 border-b border-[#232b3b] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquareCode className="w-4 h-4 text-[#58a6ff] shrink-0" />
            <h2 className="text-xs font-bold text-[#f0f6fc] truncate">
              {selectedRepo.fullName}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-[#8b949e] border border-[#273244] shrink-0">
              {selectedBranch}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2433] text-[#58a6ff] border border-[#2b374d] shrink-0">
              RAG Grounded
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInspector(!showInspector)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                showInspector
                  ? 'bg-[#1c2433] text-[#58a6ff] border-[#2b374d]'
                  : 'bg-[#18202d] text-[#8b949e] hover:text-[#c9d1d9] border-[#273244]'
              }`}
              title="Toggle Source Inspector"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
          </div>
        </div>

        {/* Message Thread Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="max-w-md mx-auto my-12 text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff] mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">
                Explore {selectedRepo.name} with Grounded AI
              </h3>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Ask architectural questions, inspect code logic, and examine line-level source citations verified against indexed repository vectors.
              </p>

              <div className="space-y-2 pt-2 text-left">
                <div className="text-[11px] font-mono text-[#8b949e] text-center">
                  Suggested Inquiries:
                </div>
                {[
                  'Where is authentication handled in this codebase?',
                  'Explain the database models and relations.',
                  'How does the repository ingestion and indexing pipeline work?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handleSend(promptText)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#0c1017] hover:bg-[#18202d] border border-[#232b3b] text-xs text-[#c9d1d9] hover:text-[#f0f6fc] transition-colors"
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
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-[#1f6feb] text-white'
                      : 'bg-[#0c1017] border border-[#232b3b] text-[#c9d1d9]'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.content}
                  </div>

                  {/* Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 border-t border-[#1c2433] space-y-2">
                      <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="w-3 h-3 text-[#58a6ff]" />
                        <span>Referenced Sources ({msg.citations.length} chunks cited)</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c, cIdx) => {
                          const isSelected = selectedCitation?.filePath === c.filePath && selectedCitation?.startLine === c.startLine;
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => {
                                setSelectedCitation(c);
                                setShowInspector(true);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors border ${
                                isSelected
                                  ? 'bg-[#1a2333] text-[#58a6ff] border-[#384866]'
                                  : 'bg-[#121721] hover:bg-[#18202d] text-[#c9d1d9] border-[#232b3b]'
                              }`}
                            >
                              <span className="truncate">{c.filePath}</span>
                              <span className="text-[#8b949e]">
                                L{c.startLine}–{c.endLine}
                              </span>
                              {c.similarity > 0 && (
                                <span className="text-[10px] text-emerald-400">
                                  {Math.round(c.similarity * 100)}%
                                </span>
                              )}
                              <span className="text-[10px] text-[#58a6ff] ml-1">
                                {isSelected ? 'Viewing →' : 'View →'}
                              </span>
                            </button>
                          );
                        })}
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
                  <div className="w-8 h-8 rounded-xl bg-[#18202d] border border-[#2b374d] flex items-center justify-center text-[#58a6ff] text-xs font-bold shrink-0 mt-0.5">
                    {user?.login ? user.login.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                )}
              </div>
            ))
          )}

          {sendingQuery && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/35 flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0c1017] border border-[#232b3b] flex items-center gap-2.5 text-xs text-[#8b949e]">
                <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
                <span>Retrieving codebase context and synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#232b3b] bg-[#0c1017]">
          <div className="flex gap-2 items-end">
            <textarea
              rows={2}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this codebase (Enter to send, Shift+Enter for new line)..."
              disabled={sendingQuery}
              className="flex-1 bg-[#121721] border border-[#232b3b] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={sendingQuery || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-30 transition-colors shrink-0 shadow-sm"
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

      {/* Right Pane: Integrated Source Inspector */}
      {showInspector && selectedCitation && (
        <SourceInspector
          citation={selectedCitation}
          onClose={() => setShowInspector(false)}
          repoFullName={selectedRepo.fullName}
          defaultBranch={selectedBranch}
          githubBaseUrl={selectedRepo.githubUrl}
        />
      )}
    </div>
  );
};
