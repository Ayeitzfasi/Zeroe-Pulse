import { supabase } from '../lib/supabase.js';
import type { Deal, DealListParams, DealListResponse, DealStage } from '@zeroe-pulse/shared';
import type { NormalizedDeal } from '../integrations/hubspot.js';

interface DbDeal {
  id: string;
  hubspot_id: string;
  name: string;
  company_name: string | null;
  stage: DealStage;
  amount: number | null;
  close_date: string | null;
  owner_name: string | null;
  owner_id: string | null;
  analysis: Record<string, unknown> | null;
  properties: Record<string, unknown>;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

function mapDbDealToDeal(dbDeal: DbDeal): Deal {
  return {
    id: dbDeal.id,
    hubspotId: dbDeal.hubspot_id,
    name: dbDeal.name,
    companyName: dbDeal.company_name || '',
    stage: dbDeal.stage,
    amount: dbDeal.amount,
    closeDate: dbDeal.close_date,
    ownerName: dbDeal.owner_name,
    ownerId: dbDeal.owner_id,
    analysis: dbDeal.analysis as Deal['analysis'],
    lastSyncedAt: dbDeal.last_synced_at,
    createdAt: dbDeal.created_at,
    updatedAt: dbDeal.updated_at,
  };
}

export async function findAll(params: DealListParams = {}): Promise<DealListResponse> {
  const {
    page = 1,
    limit = 25,
    stage = 'all',
    search = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = params;

  const offset = (page - 1) * limit;

  // Map sortBy to database column names
  const sortColumnMap: Record<string, string> = {
    name: 'name',
    amount: 'amount',
    closeDate: 'close_date',
    updatedAt: 'updated_at',
  };
  const sortColumn = sortColumnMap[sortBy] || 'updated_at';

  // Build base query
  let query = supabase
    .from('deals')
    .select('*', { count: 'exact' });

  // Apply stage filter
  if (stage !== 'all') {
    query = query.eq('stage', stage);
  }

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  // Apply sorting
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching deals:', error);
    throw new Error('Failed to fetch deals');
  }

  const deals = (data || []).map((d) => mapDbDealToDeal(d as DbDeal));
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    deals,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function findById(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDbDealToDeal(data as DbDeal);
}

export async function findByHubspotId(hubspotId: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('hubspot_id', hubspotId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDbDealToDeal(data as DbDeal);
}

export async function upsertFromHubSpot(normalizedDeals: NormalizedDeal[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const deal of normalizedDeals) {
    const existingDeal = await findByHubspotId(deal.hubspotId);

    const dealData = {
      hubspot_id: deal.hubspotId,
      name: deal.name,
      company_name: deal.companyName,
      stage: deal.stage,
      amount: deal.amount,
      close_date: deal.closeDate,
      owner_name: deal.ownerName,
      owner_id: deal.ownerId,
      properties: deal.properties,
      last_synced_at: new Date().toISOString(),
    };

    if (existingDeal) {
      // Update existing deal
      const { error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('hubspot_id', deal.hubspotId);

      if (!error) {
        updated++;
      }
    } else {
      // Insert new deal
      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (!error) {
        created++;
      }
    }
  }

  return { created, updated };
}

export async function getStats(): Promise<{
  total: number;
  byStage: Record<DealStage, number>;
  totalValue: number;
}> {
  const { data, error } = await supabase
    .from('deals')
    .select('stage, amount');

  if (error || !data) {
    return {
      total: 0,
      byStage: {
        qualified: 0,
        discovery: 0,
        demo: 0,
        proposal: 0,
        negotiation: 0,
        closed_won: 0,
        closed_lost: 0,
      },
      totalValue: 0,
    };
  }

  const byStage: Record<DealStage, number> = {
    qualified: 0,
    discovery: 0,
    demo: 0,
    proposal: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };

  let totalValue = 0;

  for (const deal of data) {
    const stage = deal.stage as DealStage;
    if (stage in byStage) {
      byStage[stage]++;
    }
    if (deal.amount) {
      totalValue += parseFloat(deal.amount);
    }
  }

  return {
    total: data.length,
    byStage,
    totalValue,
  };
}
