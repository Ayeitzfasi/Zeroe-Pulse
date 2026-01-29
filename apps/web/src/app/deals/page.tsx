'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Deal, DealStage, DealListParams } from '@zeroe-pulse/shared';

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
  if (amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);

  // Filters
  const [stage, setStage] = useState<DealStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<DealListParams['sortBy']>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const result = await api.getDeals({
      page,
      limit,
      stage,
      search,
      sortBy,
      sortOrder,
    });

    if (result.success && result.data) {
      setDeals(result.data.deals);
      setTotalPages(result.data.totalPages);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message || 'Failed to load deals');
    }

    setIsLoading(false);
  }, [page, limit, stage, search, sortBy, sortOrder]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setError('');

    const result = await api.syncDeals();

    if (result.success && result.data) {
      setSyncMessage(`Synced ${result.data.totalFetched} deals (${result.data.created} new, ${result.data.updated} updated)`);
      loadDeals();
    } else {
      setError(result.error?.message || 'Failed to sync deals');
    }

    setIsSyncing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = (column: DealListParams['sortBy']) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: DealListParams['sortBy'] }) => {
    if (sortBy !== column) {
      return <span className="text-slate-300 ml-1">↕</span>;
    }
    return <span className="text-zeroe-blue ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Deals</h1>
            <p className="text-slate-blue">
              {total > 0 ? `${total} deals` : 'Manage and analyze your sales deals'}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync from HubSpot
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}
        {syncMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {syncMessage}
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search deals or companies..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input w-full pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Stage Filter */}
            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value as DealStage | 'all');
                setPage(1);
              }}
              className="input min-w-[150px]"
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Page Size */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="input w-auto"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Deals Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 mx-auto text-zeroe-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-blue mt-2">Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
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
              <h3 className="text-lg font-medium text-charcoal mb-2">No deals found</h3>
              <p className="text-slate-blue mb-4">
                {search || stage !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Click "Sync from HubSpot" to import your deals.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th
                        className="text-left px-4 py-3 text-sm font-medium text-charcoal cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('name')}
                      >
                        Deal Name <SortIcon column="name" />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">
                        Company
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">
                        Stage
                      </th>
                      <th
                        className="text-right px-4 py-3 text-sm font-medium text-charcoal cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('amount')}
                      >
                        Amount <SortIcon column="amount" />
                      </th>
                      <th
                        className="text-left px-4 py-3 text-sm font-medium text-charcoal cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('closeDate')}
                      >
                        Close Date <SortIcon column="closeDate" />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">
                        Owner
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="text-zeroe-blue hover:text-zeroe-blue-dark font-medium"
                          >
                            {deal.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal">
                          {deal.companyName || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                            {STAGE_LABELS[deal.stage]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal text-right font-mono">
                          {formatCurrency(deal.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal">
                          {formatDate(deal.closeDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal">
                          {deal.ownerName || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-sm text-slate-blue">
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-charcoal">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
