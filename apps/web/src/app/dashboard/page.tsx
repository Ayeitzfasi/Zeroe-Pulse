'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';

function DashboardContent() {
  const { user } = useAuth();
  const [syncMessage, setSyncMessage] = useState('');

  const handleSyncToExtension = () => {
    window.postMessage({ type: 'ZEROE_SYNC_TO_EXTENSION' }, '*');
    setSyncMessage('Token synced! Check the extension.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="card">
        <h1 className="text-2xl font-heading font-bold text-charcoal mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-slate-blue">
          Here&apos;s an overview of your sales intelligence.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-600">Active Deals</h3>
            <svg className="w-5 h-5 text-zeroe-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-charcoal">--</p>
          <p className="text-sm text-slate-400 mt-1">Connect HubSpot to see deals</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-600">Skills Created</h3>
            <svg className="w-5 h-5 text-zeroe-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-charcoal">0</p>
          <p className="text-sm text-slate-400 mt-1">Create your first skill</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-600">Conversations</h3>
            <svg className="w-5 h-5 text-zeroe-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-charcoal">0</p>
          <p className="text-sm text-slate-400 mt-1">Start a conversation</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-charcoal mb-1">Chrome Extension</h3>
            <p className="text-sm text-slate-blue mb-3">
              Sync your authentication to the HubSpot sidebar
            </p>
            <div className="flex items-center gap-3">
              {syncMessage && (
                <span className="text-sm text-green-600">{syncMessage}</span>
              )}
              <button
                onClick={handleSyncToExtension}
                className="btn-secondary text-sm"
              >
                Sync to Extension
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-charcoal mb-1">Connect HubSpot</h3>
            <p className="text-sm text-slate-blue mb-3">
              Import your deals and contacts from HubSpot
            </p>
            <button className="btn-secondary text-sm" disabled>
              Coming in Phase 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
