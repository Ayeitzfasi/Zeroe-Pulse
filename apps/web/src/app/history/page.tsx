'use client';

import { AppLayout } from '@/components/layout';

export default function HistoryPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal">Chat History</h1>
          <p className="text-slate-blue">Review your past AI conversations</p>
        </div>

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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-charcoal mb-2">No conversations yet</h3>
            <p className="text-slate-blue mb-4">
              Your AI chat history will appear here. Start a conversation from a deal page or the Chrome extension.
            </p>
            <p className="text-sm text-slate-400">Coming in Phase 5</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
