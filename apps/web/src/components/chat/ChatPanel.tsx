'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, ConversationType, SendMessageResponse } from '@zeroe-pulse/shared';
import { api } from '@/lib/api';

interface ChatPanelProps {
  conversationId: string | null;
  conversationType: ConversationType;
  initialMessages?: Message[];
  dealId?: string;
  onConversationCreated?: (id: string) => void;
  onSkillGenerated?: (skill: { name: string; description: string; content: string }) => void;
  placeholder?: string;
  className?: string;
}

// Clean skill_ready tags from message content for display
function cleanMessageContent(content: string): string {
  // Remove <skill_ready>...</skill_ready> blocks but keep a note
  const hasSkillReady = content.includes('<skill_ready>');
  let cleaned = content.replace(/<skill_ready>[\s\S]*?<\/skill_ready>/g, '');

  // If we removed a skill block, add a note
  if (hasSkillReady && cleaned.trim()) {
    cleaned = cleaned.trim() + '\n\n✅ **Skill ready!** Check the preview panel to save it.';
  } else if (hasSkillReady) {
    cleaned = '✅ **Skill ready!** Check the preview panel to save it.';
  }

  return cleaned;
}

export function ChatPanel({
  conversationId,
  conversationType,
  initialMessages = [],
  dealId,
  onConversationCreated,
  onSkillGenerated,
  placeholder = 'Type your message...',
  className = '',
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Update conversation ID when prop changes
  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  // Cancel any ongoing request
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput('');
    setError('');
    setIsLoading(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      let convId = currentConversationId;

      // Create conversation if needed
      if (!convId) {
        const createResult = await api.createConversation({
          type: conversationType,
          dealId: dealId,
        });

        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error?.message || 'Failed to create conversation');
        }

        convId = createResult.data.id;
        setCurrentConversationId(convId);
        onConversationCreated?.(convId);
      }

      // Add optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: convId,
        role: 'user',
        content: messageContent,
        metadata: {},
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUserMessage]);

      // Send message with abort signal
      const result = await api.sendMessage(convId, { content: messageContent }, abortControllerRef.current.signal);

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

      // Check for generated skill
      if (result.data.generatedSkill) {
        onSkillGenerated?.(result.data.generatedSkill);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - remove optimistic message
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
        setError('Request cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-300"
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
            <p className="text-sm">Start a conversation</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-zeroe-blue text-white'
                  : 'bg-slate-100 text-charcoal'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cleanMessageContent(message.content)}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-2 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-coral hover:text-coral/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none input text-sm"
            style={{ minHeight: '40px', maxHeight: '150px' }}
          />
          {isLoading ? (
            <button
              onClick={cancelRequest}
              className="btn-danger px-4"
              title="Stop generating"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-primary px-4 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
