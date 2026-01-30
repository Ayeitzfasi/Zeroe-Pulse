'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { ChatPanel } from '@/components/chat';
import type { Message } from '@zeroe-pulse/shared';

export default function NewChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleConversationCreated = (id: string) => {
    setConversationId(id);
    // Update URL without full navigation
    window.history.replaceState(null, '', `/chat/${id}`);
  };

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
              <h1 className="text-xl font-heading font-bold text-charcoal">New Chat</h1>
              <p className="text-sm text-slate-blue">Start a general conversation with AI</p>
            </div>
          </div>
        </div>

        {/* Welcome message for new conversations */}
        {messages.length === 0 && (
          <div className="px-6 py-4">
            <div className="bg-slate-100 rounded-lg p-4">
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="font-medium">Welcome! How can I help you today?</p>
                <p className="text-slate-600 text-sm mt-2">
                  You can ask me questions, get help with tasks, or just have a conversation. 
                  I have access to your deal context and skills to provide relevant assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        <ChatPanel
          conversationId={conversationId}
          conversationType="general"
          initialMessages={messages}
          onConversationCreated={handleConversationCreated}
          placeholder="Type your message..."
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}
