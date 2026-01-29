'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left side - can add breadcrumbs or search later */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-charcoal">Dashboard</h2>
      </div>

      {/* Right side - user menu */}
      <div className="flex items-center gap-4">
        {/* Sync status indicator */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Connected</span>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 bg-zeroe-blue/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-zeroe-blue">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-charcoal">{user?.name}</span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-charcoal">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/settings/password"
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  Change Password
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-coral hover:bg-slate-50"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
