'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [syncMessage, setSyncMessage] = useState('');

  const handleSyncToExtension = () => {
    // Send message to extension content script
    window.postMessage({ type: 'ZEROE_SYNC_TO_EXTENSION' }, '*');
    setSyncMessage('Token synced! Check the extension.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-12 bg-zeroe-gradient rounded-full" />
            <h1 className="text-xl font-heading font-bold text-charcoal">
              Pulse AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-blue">{user?.name}</span>
            <Link
              href="/settings/password"
              className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-sm text-coral hover:text-coral/80 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Extension Sync Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-charcoal mb-1">Chrome Extension</h3>
              <p className="text-sm text-slate-blue">
                Sync your authentication to the HubSpot sidebar extension
              </p>
            </div>
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
        </div>

        {/* Welcome Card */}
        <div className="card">
          <h2 className="text-2xl font-heading font-bold text-charcoal mb-4">
            Welcome, {user?.name}!
          </h2>
          <p className="text-slate-blue mb-6">
            Dashboard coming in Phase 2. This is a placeholder to verify authentication works.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-charcoal mb-1">Deals</h3>
              <p className="text-sm text-slate-blue">Coming in Phase 3</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-charcoal mb-1">Skills</h3>
              <p className="text-sm text-slate-blue">Coming in Phase 4</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-charcoal mb-1">AI Chat</h3>
              <p className="text-sm text-slate-blue">Coming in Phase 5</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
