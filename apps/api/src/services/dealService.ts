import { supabase } from '../lib/supabase.js';
import type { Deal, DealListParams, DealListResponse, DealStage, DealContact, DealCompany, HubSpotConfig } from '@zeroe-pulse/shared';
import type { NormalizedDeal } from '../integrations/hubspot.js';

interface DbDeal {
  id: string;
  hubspot_id: string;
  name: string;
  company_name: string | null;
  company_id: string | null;
  stage: DealStage;
  stage_label: string | null;
  hubspot_stage_id: string | null;
  pipeline_id: string | null;
  pipeline_name: string | null;
  amount: number | null;
  close_date: string | null;
  owner_name: string | null;
  owner_id: string | null;
  last_engagement_date: string | null;
  contacts: DealContact[];
  companies: DealCompany[];
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
    companyId: dbDeal.company_id || null,
    stage: dbDeal.stage,
    stageLabel: dbDeal.stage_label || dbDeal.stage,
    hubspotStageId: dbDeal.hubspot_stage_id,
    pipelineId: dbDeal.pipeline_id,
    pipelineName: dbDeal.pipeline_name,
    amount: dbDeal.amount,
    closeDate: dbDeal.close_date,
    ownerName: dbDeal.owner_name,
    ownerId: dbDeal.owner_id,
    lastEngagementDate: dbDeal.last_engagement_date,
    contacts: dbDeal.contacts || [],
    companies: dbDeal.companies || [],
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
    pipeline = 'all',
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

  // Apply pipeline filter (requires migration 004 for pipeline_id column)
  // Commented out until migration is run
  // if (pipeline !== 'all') {
  //   query = query.eq('pipeline_id', pipeline);
  // }

  // Apply stage filter - support both normalized stage and HubSpot stage ID
  if (stage !== 'all') {
    // Check if it's a HubSpot stage ID (typically numeric or UUID-like) or our normalized stage
    const normalizedStages = ['qualified', 'discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (normalizedStages.includes(stage)) {
      query = query.eq('stage', stage);
    } else {
      // Filter by HubSpot stage ID
      query = query.eq('hubspot_stage_id', stage);
    }
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
      company_id: deal.companyId,
      stage: deal.stage,
      stage_label: deal.stageLabel,
      hubspot_stage_id: deal.hubspotStageId,
      // Note: pipeline_id and pipeline_name columns need migration 004 to be run
      // pipeline_id: deal.pipelineId,
      // pipeline_name: deal.pipelineName,
      amount: deal.amount,
      close_date: deal.closeDate,
      owner_name: deal.ownerName,
      owner_id: deal.ownerId,
      last_engagement_date: deal.lastEngagementDate,
      contacts: deal.contacts,
      companies: deal.companies,
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
      } else {
        console.error('Error updating deal:', error);
      }
    } else {
      // Insert new deal
      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (!error) {
        created++;
      } else {
        console.error('Error creating deal:', error);
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

// Get distinct pipelines from synced deals for filtering
// Note: Requires migration 004 to add pipeline_id and pipeline_name columns
export async function getDistinctPipelines(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('pipeline_id, pipeline_name')
      .not('pipeline_id', 'is', null);

    if (error || !data) {
      return [];
    }

    // Get unique pipelines
    const pipelineMap = new Map<string, string>();
    for (const deal of data) {
      if (deal.pipeline_id && !pipelineMap.has(deal.pipeline_id)) {
        pipelineMap.set(deal.pipeline_id, deal.pipeline_name || deal.pipeline_id);
      }
    }

    return Array.from(pipelineMap.entries()).map(([id, name]) => ({ id, name }));
  } catch {
    // Column doesn't exist yet - migration not run
    return [];
  }
}

// HubSpot Config functions
export async function getHubSpotConfig(): Promise<HubSpotConfig | null> {
  const { data, error } = await supabase
    .from('hubspot_config')
    .select('*')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    portalId: data.portal_id,
    pipelineId: data.pipeline_id,
  };
}

export async function saveHubSpotConfig(config: HubSpotConfig & { pipelineName?: string }): Promise<void> {
  const existingConfig = await getHubSpotConfig();

  if (existingConfig) {
    await supabase
      .from('hubspot_config')
      .update({
        portal_id: config.portalId,
        pipeline_id: config.pipelineId,
        pipeline_name: config.pipelineName,
      })
      .eq('portal_id', existingConfig.portalId);
  } else {
    await supabase
      .from('hubspot_config')
      .insert({
        portal_id: config.portalId,
        pipeline_id: config.pipelineId,
        pipeline_name: config.pipelineName,
      });
  }
}

export async function deleteAllDeals(): Promise<void> {
  await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
