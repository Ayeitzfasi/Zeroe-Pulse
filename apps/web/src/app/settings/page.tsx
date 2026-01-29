'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal">Settings</h1>
          <p className="text-slate-blue">Manage your account and integrations</p>
        </div>

        {/* Profile Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zeroe-blue/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-zeroe-blue">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-charcoal">{user?.name}</p>
                <p className="text-sm text-slate-blue">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Role: {user?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-charcoal">Password</p>
                <p className="text-sm text-slate-blue">Change your account password</p>
              </div>
              <Link href="/settings/password" className="btn-secondary text-sm">
                Change Password
              </Link>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Integrations</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">HS</span>
                </div>
                <div>
                  <p className="font-medium text-charcoal">HubSpot</p>
                  <p className="text-sm text-slate-blue">Sync deals and contacts</p>
                </div>
              </div>
              <button className="btn-secondary text-sm" disabled>
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">CF</span>
                </div>
                <div>
                  <p className="font-medium text-charcoal">Confluence</p>
                  <p className="text-sm text-slate-blue">Search documentation</p>
                </div>
              </div>
              <button className="btn-secondary text-sm" disabled>
                Connect
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-4">Integrations coming in Phase 7</p>
        </div>
      </div>
    </AppLayout>
  );
}
