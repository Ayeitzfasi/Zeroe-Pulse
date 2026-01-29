'use client';

import { AppLayout } from '@/components/layout';

export default function DealsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Deals</h1>
            <p className="text-slate-blue">Manage and analyze your sales deals</p>
          </div>
          <button className="btn-primary" disabled>
            Sync from HubSpot
          </button>
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-medium text-charcoal mb-2">No deals yet</h3>
            <p className="text-slate-blue mb-4">
              Connect your HubSpot account to import deals and start analyzing them with AI.
            </p>
            <p className="text-sm text-slate-400">Coming in Phase 3</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
