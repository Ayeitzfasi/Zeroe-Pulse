import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, type Message, type Deal, type Contact, type Company } from '../lib/api';

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  hubspotId: string | null;
  name: string | null;
  portalId: string | null;
}

const WEB_URL = 'http://localhost:3000';

// Clean skill_ready tags from message content
function cleanMessageContent(content: string): string {
  const hasSkillReady = content.includes('<skill_ready>');
  let cleaned = content.replace(/<skill_ready>[\s\S]*?<\/skill_ready>/g, '');
  if (hasSkillReady && cleaned.trim()) {
    cleaned = cleaned.trim();
  } else if (hasSkillReady) {
    cleaned = 'Skill ready! View it in the web platform.';
  }
  return cleaned;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<HubSpotContext | null>(null);

  // Record data
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [associatedDeal, setAssociatedDeal] = useState<Deal | null>(null);

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
      setIsAuthenticated(!!response?.token);
      setIsLoading(false);
    });
  }, []);

  // Request context from content script
  const requestContext = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'REQUEST_CONTEXT' }).catch(() => {
          // Content script might not be ready
        });
      }
    });
  }, []);

  // Cancel any ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }, []);

  // Reset chat state
  const resetChatState = useCallback(() => {
    cancelRequest();
    setConversationId(null);
    setMessages([]);
    setError('');
  }, [cancelRequest]);

  // Load record data when context changes
  useEffect(() => {
    const loadRecordData = async () => {
      // Cancel any ongoing request when context changes
      cancelRequest();

      // Reset all record states
      setDeal(null);
      setContact(null);
      setCompany(null);
      setAssociatedDeal(null);
      resetChatState();

      if (!context || !context.hubspotId || !isAuthenticated) return;

      try {
        if (context.type === 'deal') {
          const result = await api.getDealByHubspotId(context.hubspotId);
          if (result.success && result.data) {
            setDeal(result.data.deal);
            // Load existing conversation for this deal
            const convResult = await api.getConversations({
              type: 'deal',
              dealId: result.data.deal.id,
              limit: 1
            });
            if (convResult.success && convResult.data && convResult.data.conversations.length > 0) {
              const conv = convResult.data.conversations[0];
              setConversationId(conv.id);
              const convDetailResult = await api.getConversation(conv.id);
              if (convDetailResult.success && convDetailResult.data) {
                setMessages(convDetailResult.data.messages);
              }
            }
          }
        } else if (context.type === 'contact') {
          const result = await api.getContactByHubspotId(context.hubspotId);
          if (result.success && result.data) {
            setContact(result.data.contact);
            if (result.data.associatedDeal) {
              setAssociatedDeal(result.data.associatedDeal);
            }
          }
        } else if (context.type === 'company') {
          const result = await api.getCompanyByHubspotId(context.hubspotId);
          if (result.success && result.data) {
            setCompany(result.data.company);
            if (result.data.associatedDeal) {
              setAssociatedDeal(result.data.associatedDeal);
            }
          }
        }
      } catch (err) {
        console.error('Error loading record data:', err);
      }
    };

    loadRecordData();
  }, [context, isAuthenticated, cancelRequest, resetChatState]);

  useEffect(() => {
    checkAuth();

    // Listen for context updates and auth changes
    const listener = (message: { type: string; context?: HubSpotContext; token?: string }) => {
      if (message.type === 'HUBSPOT_CONTEXT_UPDATE' && message.context) {
        setContext(message.context);
      }
      if (message.type === 'AUTH_TOKEN_UPDATED') {
        setIsAuthenticated(!!message.token);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Request context on load
    requestContext();

    // Listen for tab changes and visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestContext();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also request context when window gains focus
    const handleFocus = () => {
      requestContext();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth, requestContext]);

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_AUTH_TOKEN' }, () => {
      setIsAuthenticated(false);
      resetChatState();
      setDeal(null);
      setContact(null);
      setCompany(null);
      setAssociatedDeal(null);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setError('');
    setIsSending(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      let convId = conversationId;

      // Determine conversation type and deal ID
      const convType = deal ? 'deal' : associatedDeal ? 'deal' : 'general';
      const dealId = deal?.id || associatedDeal?.id;

      // Create conversation if needed
      if (!convId) {
        const createResult = await api.createConversation({
          type: convType,
          dealId: dealId,
        });

        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error?.message || 'Failed to create conversation');
        }

        convId = createResult.data.id;
        setConversationId(convId);
      }

      // Add optimistic user message
      const optimisticUserMessage: Message = {
        id: 'temp-' + Date.now(),
        conversationId: convId,
        role: 'user',
        content: messageContent,
        metadata: {},
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUserMessage]);

      // Send message with abort signal
      const result = await api.sendMessage(convId, messageContent, abortControllerRef.current.signal);

      if (!result.success || !result.data) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
        throw new Error(result.error?.message || 'Failed to send message');
      }

      // Replace optimistic message with real messages
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUserMessage.id),
        result.data!.userMessage,
        result.data!.assistantMessage,
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - remove optimistic message
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
        setError('Request cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  // Check if chat should be enabled
  const canChat = deal || contact || company || (context?.type && context.hubspotId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <div className="h-1.5 w-24 bg-zeroe-gradient rounded-full mb-4 animate-pulse" />
        <p className="text-slate-blue text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <img src="/icons/icon-48.png" alt="Pulse AI" className="w-12 h-12 mb-4" />
        <h1 className="text-xl font-heading font-bold text-charcoal mb-2">
          Pulse AI
        </h1>
        <p className="text-slate-blue text-sm text-center mb-4">
          Sign in to use the extension
        </p>
        <a
          href={WEB_URL + '/login?extension=true'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          Sign In
        </a>
        <p className="text-xs text-slate-400 mt-4 text-center px-4">
          After signing in, click "Sync to Extension" on the dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-48.png" alt="" className="w-6 h-6" />
            <span className="font-heading font-bold text-zeroe-blue text-sm">
              Pulse AI
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-coral hover:text-coral/80"
          >
            Sign Out
          </button>
        </div>

        {/* Context display */}
        {deal ? (
          <div className="mt-2 p-2 bg-zeroe-blue/5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zeroe-blue bg-zeroe-blue/10 px-1.5 py-0.5 rounded">Deal</span>
            </div>
            <p className="text-sm font-medium text-charcoal truncate mt-1">{deal.name}</p>
            {deal.companyName && (
              <p className="text-xs text-slate-blue truncate">{deal.companyName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                {deal.stageLabel}
              </span>
              {deal.amount && (
                <span className="text-xs text-slate-600">
                  ${deal.amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ) : contact ? (
          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Contact</span>
            </div>
            <p className="text-sm font-medium text-charcoal truncate mt-1">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.email && (
              <p className="text-xs text-slate-blue truncate">{contact.email}</p>
            )}
            {contact.company && (
              <p className="text-xs text-slate-blue truncate">{contact.company}</p>
            )}
            {associatedDeal ? (
              <div className="mt-1.5 pt-1.5 border-t border-purple-100">
                <p className="text-xs text-slate-500">Associated Deal:</p>
                <p className="text-xs font-medium text-charcoal truncate">{associatedDeal.name}</p>
              </div>
            ) : (
              <p className="text-xs text-amber-600 mt-1">No deal associated</p>
            )}
          </div>
        ) : company ? (
          <div className="mt-2 p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Company</span>
            </div>
            <p className="text-sm font-medium text-charcoal truncate mt-1">{company.name}</p>
            {company.domain && (
              <p className="text-xs text-slate-blue truncate">{company.domain}</p>
            )}
            {company.industry && (
              <p className="text-xs text-slate-blue">{company.industry}</p>
            )}
            {associatedDeal ? (
              <div className="mt-1.5 pt-1.5 border-t border-green-100">
                <p className="text-xs text-slate-500">Associated Deal:</p>
                <p className="text-xs font-medium text-charcoal truncate">{associatedDeal.name}</p>
              </div>
            ) : (
              <p className="text-xs text-amber-600 mt-1">No deal associated</p>
            )}
          </div>
        ) : context?.type ? (
          <div className="mt-2 p-2 bg-slate-100 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded capitalize">
                {context.type}
              </span>
            </div>
            {context.name && (
              <p className="text-sm font-medium text-charcoal truncate mt-1">{context.name}</p>
            )}
            <p className="text-xs text-amber-600 mt-1">
              {context.type === 'deal'
                ? 'Deal not synced. Sync from web platform first.'
                : 'Loading record data...'}
            </p>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400 text-center py-2">
            Navigate to a HubSpot record to see context
          </div>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">
              {canChat
                ? 'Ask me about this record'
                : 'Navigate to a HubSpot record to start'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-zeroe-blue text-white text-sm'
                    : 'bg-white border border-slate-200 text-charcoal'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {cleanMessageContent(message.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 p-2 bg-coral/10 border border-coral/20 rounded-lg text-coral text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-coral hover:text-coral/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <footer className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={canChat ? 'Ask about this record...' : 'Navigate to a record...'}
            disabled={isSending || !canChat}
            rows={1}
            className="flex-1 resize-none input text-sm py-2"
            style={{ minHeight: '36px', maxHeight: '100px' }}
          />
          {isSending ? (
            <button
              onClick={cancelRequest}
              className="btn-danger px-3"
              title="Stop generating"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !canChat}
              className="btn-primary px-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Enter to send, Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}
