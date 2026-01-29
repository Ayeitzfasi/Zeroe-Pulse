import type { DealStage } from '@zeroe-pulse/shared';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount?: string;
    closedate?: string;
    dealstage?: string;
    pipeline?: string;
    hubspot_owner_id?: string;
    hs_lastmodifieddate?: string;
    createdate?: string;
    notes_last_updated?: string;
    hs_latest_meeting_activity?: string;
    hs_sales_email_last_replied?: string;
    hs_last_sales_activity_date?: string;
    [key: string]: string | undefined;
  };
  associations?: {
    companies?: {
      results: Array<{ id: string; type: string }>;
    };
    contacts?: {
      results: Array<{ id: string; type: string }>;
    };
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    [key: string]: string | undefined;
  };
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    jobtitle?: string;
    [key: string]: string | undefined;
  };
}

interface HubSpotOwner {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface HubSpotDealsResponse {
  results: HubSpotDeal[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

interface HubSpotPipeline {
  id: string;
  label: string;
  stages: Array<{
    id: string;
    label: string;
    displayOrder: number;
  }>;
}

interface HubSpotPipelinesResponse {
  results: HubSpotPipeline[];
}

interface HubSpotPortalInfo {
  portalId: number;
}

export interface NormalizedContact {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
}

export interface NormalizedCompany {
  id: string;
  name: string;
  domain: string | null;
}

export interface NormalizedDeal {
  hubspotId: string;
  name: string;
  companyName: string | null;
  companyId: string | null;
  stage: DealStage;
  stageLabel: string;
  hubspotStageId: string | null;
  amount: number | null;
  closeDate: string | null;
  ownerName: string | null;
  ownerId: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  lastEngagementDate: string | null;
  contacts: NormalizedContact[];
  companies: NormalizedCompany[];
  properties: Record<string, string | undefined>;
}

export class HubSpotClient {
  private apiKey: string;
  private stageMap: Map<string, { label: string; appStage: DealStage }> = new Map();
  private pipelineMap: Map<string, string> = new Map(); // pipelineId -> pipelineName
  private portalId: number | null = null;
  private currentPipelineName: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${HUBSPOT_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`HubSpot API error: ${response.status} - ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async getPortalId(): Promise<number> {
    if (this.portalId) return this.portalId;

    const info = await this.request<HubSpotPortalInfo>('/account-info/v3/details');
    this.portalId = info.portalId;
    return this.portalId;
  }

  async getPipelines(): Promise<HubSpotPipeline[]> {
    const response = await this.request<HubSpotPipelinesResponse>(
      '/crm/v3/pipelines/deals'
    );
    return response.results;
  }

  async getPipelineStages(pipelineId: string): Promise<Map<string, { label: string; appStage: DealStage }>> {
    const pipelines = await this.getPipelines();
    const pipeline = pipelines.find(p => p.id === pipelineId);

    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Store pipeline name for current sync
    this.currentPipelineName = pipeline.label;

    // Build pipeline map for all pipelines
    for (const p of pipelines) {
      this.pipelineMap.set(p.id, p.label);
    }

    const stageMap = new Map<string, { label: string; appStage: DealStage }>();

    // Map pipeline stages to app stages based on label keywords
    for (const stage of pipeline.stages) {
      const labelLower = stage.label.toLowerCase();
      let appStage: DealStage = 'qualified';

      if (labelLower.includes('qualified') || labelLower.includes('lead')) {
        appStage = 'qualified';
      } else if (labelLower.includes('discovery')) {
        appStage = 'discovery';
      } else if (labelLower.includes('demo') || labelLower.includes('presentation')) {
        appStage = 'demo';
      } else if (labelLower.includes('proposal') || labelLower.includes('quote')) {
        appStage = 'proposal';
      } else if (labelLower.includes('negotiation') || labelLower.includes('contract')) {
        appStage = 'negotiation';
      } else if (labelLower.includes('won') || labelLower.includes('closed won')) {
        appStage = 'closed_won';
      } else if (labelLower.includes('lost') || labelLower.includes('closed lost')) {
        appStage = 'closed_lost';
      }

      stageMap.set(stage.id, { label: stage.label, appStage });
    }

    this.stageMap = stageMap;
    return stageMap;
  }

  getPipelineName(pipelineId: string): string | null {
    return this.pipelineMap.get(pipelineId) || this.currentPipelineName;
  }

  async getDeals(pipelineId: string, limit = 100, after?: string): Promise<{ deals: HubSpotDeal[]; nextAfter?: string }> {
    const properties = [
      'dealname',
      'amount',
      'closedate',
      'dealstage',
      'pipeline',
      'hubspot_owner_id',
      'hs_lastmodifieddate',
      'createdate',
      'notes_last_updated',
      'hs_latest_meeting_activity',
      'hs_sales_email_last_replied',
      'hs_last_sales_activity_date',
    ].join(',');

    const params = new URLSearchParams({
      limit: String(limit),
      properties,
      associations: 'companies,contacts',
    });

    if (after) {
      params.append('after', after);
    }

    const response = await this.request<HubSpotDealsResponse>(
      `/crm/v3/objects/deals?${params.toString()}`
    );

    // Filter by pipeline
    const filteredDeals = response.results.filter(
      deal => deal.properties.pipeline === pipelineId
    );

    return {
      deals: filteredDeals,
      nextAfter: response.paging?.next?.after,
    };
  }

  async getAllDeals(pipelineId: string): Promise<HubSpotDeal[]> {
    const allDeals: HubSpotDeal[] = [];
    let after: string | undefined;
    let iterations = 0;
    const maxIterations = 50; // Safety limit

    do {
      const { deals, nextAfter } = await this.getDeals(pipelineId, 100, after);
      allDeals.push(...deals);
      after = nextAfter;
      iterations++;

      // Log progress
      console.log(`Fetched ${allDeals.length} deals so far...`);
    } while (after && iterations < maxIterations);

    return allDeals;
  }

  async getCompany(companyId: string): Promise<HubSpotCompany | null> {
    try {
      return await this.request<HubSpotCompany>(
        `/crm/v3/objects/companies/${companyId}?properties=name,domain`
      );
    } catch {
      return null;
    }
  }

  async getContact(contactId: string): Promise<HubSpotContact | null> {
    try {
      return await this.request<HubSpotContact>(
        `/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,jobtitle`
      );
    } catch {
      return null;
    }
  }

  async getOwner(ownerId: string): Promise<HubSpotOwner | null> {
    try {
      return await this.request<HubSpotOwner>(`/crm/v3/owners/${ownerId}`);
    } catch {
      return null;
    }
  }

  async normalizeDeals(deals: HubSpotDeal[]): Promise<NormalizedDeal[]> {
    // Collect unique company, contact, and owner IDs
    const companyIds = new Set<string>();
    const contactIds = new Set<string>();
    const ownerIds = new Set<string>();

    for (const deal of deals) {
      // Get all company associations
      if (deal.associations?.companies?.results) {
        for (const company of deal.associations.companies.results) {
          companyIds.add(company.id);
        }
      }
      // Get all contact associations
      if (deal.associations?.contacts?.results) {
        for (const contact of deal.associations.contacts.results) {
          contactIds.add(contact.id);
        }
      }
      if (deal.properties.hubspot_owner_id) {
        ownerIds.add(deal.properties.hubspot_owner_id);
      }
    }

    console.log(`Fetching ${companyIds.size} companies, ${contactIds.size} contacts, ${ownerIds.size} owners...`);

    // Fetch all data in parallel with batching for large datasets
    const batchFetch = async <T>(ids: string[], fetcher: (id: string) => Promise<T | null>): Promise<Map<string, T>> => {
      const results = new Map<string, T>();
      const batchSize = 10; // Concurrent requests limit
      const idArray = Array.from(ids);

      for (let i = 0; i < idArray.length; i += batchSize) {
        const batch = idArray.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(id => fetcher(id)));
        batch.forEach((id, idx) => {
          if (batchResults[idx]) {
            results.set(id, batchResults[idx]!);
          }
        });
      }
      return results;
    };

    const [companyMap, contactMap, ownerMap] = await Promise.all([
      batchFetch(Array.from(companyIds), id => this.getCompany(id)),
      batchFetch(Array.from(contactIds), id => this.getContact(id)),
      batchFetch(Array.from(ownerIds), id => this.getOwner(id)),
    ]);

    // Normalize deals
    return deals.map(deal => {
      const companyAssocs = deal.associations?.companies?.results || [];
      const contactAssocs = deal.associations?.contacts?.results || [];
      const ownerId = deal.properties.hubspot_owner_id;
      const stageInfo = this.stageMap.get(deal.properties.dealstage || '');

      // Get primary company (first one)
      const primaryCompanyId = companyAssocs[0]?.id;
      const primaryCompany = primaryCompanyId ? companyMap.get(primaryCompanyId) : null;

      // Get owner name
      const owner = ownerId ? ownerMap.get(ownerId) : null;
      const ownerName = owner
        ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email || null
        : null;

      // Build companies list
      const companies: NormalizedCompany[] = companyAssocs
        .map(assoc => {
          const company = companyMap.get(assoc.id);
          if (!company) return null;
          return {
            id: company.id,
            name: company.properties.name || 'Unknown Company',
            domain: company.properties.domain || null,
          };
        })
        .filter((c): c is NormalizedCompany => c !== null);

      // Build contacts list
      const contacts: NormalizedContact[] = contactAssocs
        .map(assoc => {
          const contact = contactMap.get(assoc.id);
          if (!contact) return null;
          const name = [contact.properties.firstname, contact.properties.lastname]
            .filter(Boolean)
            .join(' ') || contact.properties.email || 'Unknown Contact';
          return {
            id: contact.id,
            name,
            email: contact.properties.email || null,
            jobTitle: contact.properties.jobtitle || null,
          };
        })
        .filter((c): c is NormalizedContact => c !== null);

      // Determine last engagement date (most recent activity)
      const engagementDates = [
        deal.properties.hs_last_sales_activity_date,
        deal.properties.hs_latest_meeting_activity,
        deal.properties.hs_sales_email_last_replied,
        deal.properties.notes_last_updated,
      ].filter(Boolean) as string[];

      const lastEngagementDate = engagementDates.length > 0
        ? engagementDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null;

      const dealPipelineId = deal.properties.pipeline || null;

      return {
        hubspotId: deal.id,
        name: deal.properties.dealname || 'Untitled Deal',
        companyName: primaryCompany?.properties.name || null,
        companyId: primaryCompanyId || null,
        stage: stageInfo?.appStage || 'qualified',
        stageLabel: stageInfo?.label || deal.properties.dealstage || 'Unknown',
        hubspotStageId: deal.properties.dealstage || null,
        amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
        closeDate: deal.properties.closedate || null,
        ownerName,
        ownerId: ownerId || null,
        pipelineId: dealPipelineId,
        pipelineName: dealPipelineId ? this.getPipelineName(dealPipelineId) : null,
        lastEngagementDate,
        contacts,
        companies,
        properties: deal.properties,
      };
    });
  }

  async syncDeals(pipelineId: string): Promise<NormalizedDeal[]> {
    // First, load the stage mappings for this pipeline
    await this.getPipelineStages(pipelineId);

    // Then fetch and normalize deals
    const rawDeals = await this.getAllDeals(pipelineId);
    console.log(`Found ${rawDeals.length} deals in pipeline ${pipelineId}`);

    return this.normalizeDeals(rawDeals);
  }
}

export function createHubSpotClient(apiKey: string): HubSpotClient {
  return new HubSpotClient(apiKey);
}
