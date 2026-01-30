'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Conversation, ConversationType } from '@zeroe-pulse/shared';

const TYPE_LABELS: Record<ConversationType, string> = {
  general: 'General',
  deal: 'Deal',
  skill_creation: 'Skill Creation',
};

const TYPE_COLORS: Record<ConversationType, string> = {
  general: 'bg-slate-100 text-slate-700',
  deal: 'bg-zeroe-blue/10 text-zeroe-blue',
  skill_creation: 'bg-purple-100 text-purple-700',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ConversationType | 'all'>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadConversations();
  }, [filter, page]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError('');

    const result = await api.getConversations({
      type: filter === 'all' ? undefined : filter,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    if (result.success && result.data) {
      setConversations(result.data.conversations);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message || 'Failed to load conversations');
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) return;

    const result = await api.deleteConversation(id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      alert(result.error?.message || 'Failed to delete conversation');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Chat History</h1>
            <p className="text-slate-blue">View and continue your previous conversations</p>
          </div>

          <Link href="/chat" className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-blue">Filter:</span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(['all', 'general', 'deal', 'skill_creation'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-zeroe-blue text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'All' : TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-coral/10 border border-coral/20 rounded-lg text-coral">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-zeroe-blue" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : conversations.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
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
              <h3 className="text-lg font-medium text-charcoal mb-2">No conversations yet</h3>
              <p className="text-slate-blue mb-4">
                Start a conversation to see it here
              </p>
              <Link href="/chat" className="btn-primary">
                Start New Chat
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Conversations List */}
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={
                    conversation.type === 'deal' && conversation.dealId
                      ? `/deals/${conversation.dealId}`
                      : conversation.type === 'skill_creation'
                      ? `/skills/new`
                      : `/chat/${conversation.id}`
                  }
                  className="card block hover:border-zeroe-blue/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-charcoal truncate">
                          {conversation.title || 'Untitled conversation'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[conversation.type]}`}>
                          {TYPE_LABELS[conversation.type]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-blue">
                        {formatRelativeTime(conversation.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(conversation.id, e)}
                        className="p-2 text-slate-400 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-zeroe-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-blue">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} conversations
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-blue px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
