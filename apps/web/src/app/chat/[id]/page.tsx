'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { ChatPanel } from '@/components/chat';
import { api } from '@/lib/api';
import type { Message, ConversationWithMessages } from '@zeroe-pulse/shared';

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      setError('');

      const result = await api.getConversation(conversationId);

      if (result.success && result.data) {
        setConversation(result.data);
      } else {
        setError(result.error?.message || 'Failed to load conversation');
      }

      setIsLoading(false);
    };

    loadConversation();
  }, [conversationId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-zeroe-blue" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </AppLayout>
    );
  }

  if (error || !conversation) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <Link
            href="/history"
            className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to History
          </Link>

          <div className="card">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-coral mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-charcoal mb-2">Conversation not found</h3>
              <p className="text-slate-blue">{error || 'The requested conversation could not be found.'}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="p-2 text-slate-400 hover:text-charcoal transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-heading font-bold text-charcoal truncate max-w-md">
                {conversation.title || 'Untitled conversation'}
              </h1>
              <p className="text-sm text-slate-blue">
                {conversation.type === 'general' ? 'General conversation' : conversation.type}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/chat')}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat */}
        <ChatPanel
          conversationId={conversationId}
          conversationType={conversation.type}
          initialMessages={conversation.messages}
          dealId={conversation.dealId || undefined}
          placeholder="Continue the conversation..."
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}
