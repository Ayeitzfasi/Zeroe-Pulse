import type { DealStage } from '@zeroe-pulse/shared';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount?: string;
    closedate?: string;
    dealstage?: string;
    hubspot_owner_id?: string;
    hs_lastmodifieddate?: string;
    createdate?: string;
    [key: string]: string | undefined;
  };
  associations?: {
    companies?: {
      results: Array<{ id: string; type: string }>;
    };
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
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

export interface NormalizedDeal {
  hubspotId: string;
  name: string;
  companyName: string | null;
  stage: DealStage;
  amount: number | null;
  closeDate: string | null;
  ownerName: string | null;
  ownerId: string | null;
  properties: Record<string, string | undefined>;
}

// Map HubSpot deal stages to our stages
const STAGE_MAP: Record<string, DealStage> = {
  // Common HubSpot default stages
  'appointmentscheduled': 'qualified',
  'qualifiedtobuy': 'qualified',
  'presentationscheduled': 'demo',
  'decisionmakerboughtin': 'proposal',
  'contractsent': 'negotiation',
  'closedwon': 'closed_won',
  'closedlost': 'closed_lost',
  // Alternative mappings
  'qualified': 'qualified',
  'discovery': 'discovery',
  'demo': 'demo',
  'proposal': 'proposal',
  'negotiation': 'negotiation',
  'closed_won': 'closed_won',
  'closed_lost': 'closed_lost',
};

function mapStage(hubspotStage: string | undefined): DealStage {
  if (!hubspotStage) return 'qualified';
  const normalized = hubspotStage.toLowerCase().replace(/[^a-z]/g, '');
  return STAGE_MAP[normalized] || 'qualified';
}

export class HubSpotClient {
  private apiKey: string;

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

  async getDeals(limit = 100, after?: string): Promise<{ deals: HubSpotDeal[]; nextAfter?: string }> {
    const params = new URLSearchParams({
      limit: String(limit),
      properties: 'dealname,amount,closedate,dealstage,hubspot_owner_id,hs_lastmodifieddate,createdate',
      associations: 'companies',
    });

    if (after) {
      params.append('after', after);
    }

    const response = await this.request<HubSpotDealsResponse>(
      `/crm/v3/objects/deals?${params.toString()}`
    );

    return {
      deals: response.results,
      nextAfter: response.paging?.next?.after,
    };
  }

  async getAllDeals(): Promise<HubSpotDeal[]> {
    const allDeals: HubSpotDeal[] = [];
    let after: string | undefined;

    do {
      const { deals, nextAfter } = await this.getDeals(100, after);
      allDeals.push(...deals);
      after = nextAfter;
    } while (after);

    return allDeals;
  }

  async getCompany(companyId: string): Promise<HubSpotCompany | null> {
    try {
      return await this.request<HubSpotCompany>(
        `/crm/v3/objects/companies/${companyId}?properties=name`
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
    // Collect unique company and owner IDs
    const companyIds = new Set<string>();
    const ownerIds = new Set<string>();

    for (const deal of deals) {
      const companyAssoc = deal.associations?.companies?.results?.[0];
      if (companyAssoc) {
        companyIds.add(companyAssoc.id);
      }
      if (deal.properties.hubspot_owner_id) {
        ownerIds.add(deal.properties.hubspot_owner_id);
      }
    }

    // Fetch companies and owners in parallel
    const [companies, owners] = await Promise.all([
      Promise.all(Array.from(companyIds).map(id => this.getCompany(id))),
      Promise.all(Array.from(ownerIds).map(id => this.getOwner(id))),
    ]);

    // Create lookup maps
    const companyMap = new Map<string, string>();
    for (const company of companies) {
      if (company) {
        companyMap.set(company.id, company.properties.name || 'Unknown Company');
      }
    }

    const ownerMap = new Map<string, string>();
    for (const owner of owners) {
      if (owner) {
        const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email || 'Unknown';
        ownerMap.set(owner.id, name);
      }
    }

    // Normalize deals
    return deals.map(deal => {
      const companyId = deal.associations?.companies?.results?.[0]?.id;
      const ownerId = deal.properties.hubspot_owner_id;

      return {
        hubspotId: deal.id,
        name: deal.properties.dealname || 'Untitled Deal',
        companyName: companyId ? companyMap.get(companyId) || null : null,
        stage: mapStage(deal.properties.dealstage),
        amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
        closeDate: deal.properties.closedate || null,
        ownerName: ownerId ? ownerMap.get(ownerId) || null : null,
        ownerId: ownerId || null,
        properties: deal.properties,
      };
    });
  }

  async syncDeals(): Promise<NormalizedDeal[]> {
    const rawDeals = await this.getAllDeals();
    return this.normalizeDeals(rawDeals);
  }
}

export function createHubSpotClient(apiKey: string): HubSpotClient {
  return new HubSpotClient(apiKey);
}
