import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, type Message, type Deal } from '../lib/api';

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
  const [deal, setDeal] = useState<Deal | null>(null);

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

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

  // Load deal when context changes
  useEffect(() => {
    const loadDeal = async () => {
      if (context?.type === 'deal' && context.hubspotId) {
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
            // Load messages
            const convDetailResult = await api.getConversation(conv.id);
            if (convDetailResult.success && convDetailResult.data) {
              setMessages(convDetailResult.data.messages);
            }
          } else {
            // Reset for new conversation
            setConversationId(null);
            setMessages([]);
          }
        } else {
          setDeal(null);
        }
      } else {
        setDeal(null);
        setConversationId(null);
        setMessages([]);
      }
    };

    if (isAuthenticated && context) {
      loadDeal();
    }
  }, [context, isAuthenticated]);

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
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [checkAuth]);

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_AUTH_TOKEN' }, () => {
      setIsAuthenticated(false);
      setMessages([]);
      setConversationId(null);
      setDeal(null);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setError('');
    setIsSending(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      let convId = conversationId;

      // Create conversation if needed
      if (!convId) {
        const createResult = await api.createConversation({
          type: deal ? 'deal' : 'general',
          dealId: deal?.id,
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

      // Send message
      const result = await api.sendMessage(convId, messageContent);

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSending(false);
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
        <div className="h-1.5 w-24 bg-zeroe-gradient rounded-full mb-4" />
        <h1 className="text-xl font-heading font-bold text-charcoal mb-2">
          Zeroe Pulse AI
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
            <div className="h-1.5 w-8 bg-zeroe-gradient rounded-full" />
            <span className="font-heading font-bold text-charcoal text-sm">
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
            <p className="text-xs text-slate-blue">Deal</p>
            <p className="text-sm font-medium text-charcoal truncate">{deal.name}</p>
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
        ) : context?.type ? (
          <div className="mt-2 text-sm text-slate-blue">
            <span className="capitalize">{context.type}</span>
            {context.name && <span className="font-medium">: {context.name}</span>}
            {!deal && context.type === 'deal' && (
              <p className="text-xs text-amber-600 mt-1">
                Deal not synced. Sync from web platform first.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400">
            Navigate to a HubSpot deal to see context
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
              {deal
                ? 'Ask me about this deal'
                : context?.type === 'deal'
                ? 'Deal not synced yet'
                : 'Navigate to a HubSpot deal to start'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-zeroe-blue text-white'
                    : 'bg-white border border-slate-200 text-charcoal'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:text-zeroe-blue prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:text-xs">
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
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 p-2 bg-coral/10 border border-coral/20 rounded-lg text-coral text-xs">
          {error}
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
            placeholder={deal ? 'Ask about this deal...' : 'Type a message...'}
            disabled={isSending || (!deal && context?.type !== 'deal')}
            rows={1}
            className="flex-1 resize-none input text-sm py-2"
            style={{ minHeight: '36px', maxHeight: '100px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending || (!deal && context?.type !== 'deal')}
            className="btn-primary px-3 disabled:opacity-50"
          >
            {isSending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Enter to send, Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}
