'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Deal, DealStage, HubSpotConfig } from '@zeroe-pulse/shared';

const STAGE_LABELS: Record<DealStage, string> = {
  qualified: 'Qualified',
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const STAGE_COLORS: Record<DealStage, string> = {
  qualified: 'bg-blue-100 text-blue-700',
  discovery: 'bg-purple-100 text-purple-700',
  demo: 'bg-yellow-100 text-yellow-700',
  proposal: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-pink-100 text-pink-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-slate-100 text-slate-700',
};

function formatCurrency(amount: number | null): string {
  if (amount === null) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not specified';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Build HubSpot URL - EU1 region
function getHubSpotUrl(portalId: number | undefined, objectType: string, objectId: string): string {
  if (!portalId) return '#';
  // EU1 region uses app-eu1.hubspot.com
  return `https://app-eu1.hubspot.com/contacts/${portalId}/record/${objectType}/${objectId}`;
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [config, setConfig] = useState<HubSpotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeal = async () => {
      setIsLoading(true);
      setError('');

      const result = await api.getDeal(dealId);

      if (result.success && result.data) {
        setDeal(result.data.deal);
        setConfig(result.data.hubspotConfig);
      } else {
        setError(result.error?.message || 'Failed to load deal');
      }

      setIsLoading(false);
    };

    loadDeal();
  }, [dealId]);

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

  if (error || !deal) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Link
            href="/deals"
            className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deals
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
              <h3 className="text-lg font-medium text-charcoal mb-2">Deal not found</h3>
              <p className="text-slate-blue">{error || 'The requested deal could not be found.'}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const portalId = config?.portalId;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/deals"
          className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Deals
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-heading font-bold text-charcoal">{deal.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[deal.stage]}`}>
                {deal.stageLabel || STAGE_LABELS[deal.stage]}
              </span>
            </div>
            {deal.companyName && (
              <p className="text-lg text-slate-blue">{deal.companyName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Details */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Deal Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-blue">Amount</dt>
                  <dd className="text-lg font-medium text-charcoal">{formatCurrency(deal.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-blue">Close Date</dt>
                  <dd className="text-lg font-medium text-charcoal">{formatDate(deal.closeDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-blue">Owner</dt>
                  <dd className="text-lg font-medium text-charcoal">{deal.ownerName || 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-blue">Stage</dt>
                  <dd className="text-lg font-medium text-charcoal">{deal.stageLabel || STAGE_LABELS[deal.stage]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-blue">Last Engagement</dt>
                  <dd className="text-lg font-medium text-charcoal">{formatShortDate(deal.lastEngagementDate)}</dd>
                </div>
              </dl>
            </div>

            {/* Associated Contacts */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">
                Contacts ({deal.contacts?.length || 0})
              </h2>
              {deal.contacts && deal.contacts.length > 0 ? (
                <div className="space-y-3">
                  {deal.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zeroe-blue/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-zeroe-blue">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{contact.name}</p>
                          {contact.jobTitle && (
                            <p className="text-sm text-slate-blue">{contact.jobTitle}</p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-slate-400">{contact.email}</p>
                          )}
                        </div>
                      </div>
                      {portalId && (
                        <a
                          href={getHubSpotUrl(portalId, '0-1', contact.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark flex items-center gap-1"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-blue text-sm">No contacts associated with this deal.</p>
              )}
            </div>

            {/* Associated Companies */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">
                Companies ({deal.companies?.length || 0})
              </h2>
              {deal.companies && deal.companies.length > 0 ? (
                <div className="space-y-3">
                  {deal.companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">
                            {company.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{company.name}</p>
                          {company.domain && (
                            <p className="text-sm text-slate-blue">{company.domain}</p>
                          )}
                        </div>
                      </div>
                      {portalId && (
                        <a
                          href={getHubSpotUrl(portalId, '0-2', company.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark flex items-center gap-1"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-blue text-sm">No companies associated with this deal.</p>
              )}
            </div>

            {/* AI Analysis Placeholder */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">AI Analysis</h2>
              {deal.analysis ? (
                <div>
                  <p className="text-slate-blue">Analysis data available</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                  <svg
                    className="w-12 h-12 text-slate-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <p className="text-slate-blue mb-2">No AI analysis yet</p>
                  <p className="text-sm text-slate-400">
                    BANT/MEDIC analysis will be available in Phase 8
                  </p>
                </div>
              )}
            </div>

            {/* AI Chat Placeholder */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">AI Chat</h2>
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <svg
                  className="w-12 h-12 text-slate-300 mx-auto mb-3"
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
                <p className="text-slate-blue mb-2">AI Chat coming soon</p>
                <p className="text-sm text-slate-400">
                  Ask questions about this deal in Phase 5
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Quick Info</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-blue">HubSpot ID</span>
                  <span className="text-sm font-mono text-charcoal">{deal.hubspotId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-blue">Last Engagement</span>
                  <span className="text-sm text-charcoal">{formatShortDate(deal.lastEngagementDate)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-blue">Last Synced</span>
                  <span className="text-sm text-charcoal">{formatDateTime(deal.lastSyncedAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-blue">Created</span>
                  <span className="text-sm text-charcoal">{formatDateTime(deal.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-blue">Updated</span>
                  <span className="text-sm text-charcoal">{formatDateTime(deal.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Actions</h2>
              <div className="space-y-2">
                <a
                  href={portalId ? getHubSpotUrl(portalId, '0-3', deal.hubspotId) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-secondary w-full flex items-center justify-center gap-2 ${!portalId ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View in HubSpot
                </a>
              </div>
            </div>

            {/* Confluence Link Placeholder */}
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Documentation</h2>
              <div className="text-center py-6 bg-slate-50 rounded-lg">
                <svg
                  className="w-10 h-10 text-slate-300 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm text-slate-blue mb-1">Confluence Integration</p>
                <p className="text-xs text-slate-400">Coming in Phase 7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
