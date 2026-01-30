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

interface HubSpotEngagement {
  id: string;
  properties: {
    hs_timestamp?: string;
    hs_createdate?: string;
    hs_lastmodifieddate?: string;
    hubspot_owner_id?: string;
    hs_body_preview?: string;
    hs_email_subject?: string;
    hs_email_direction?: string;
    hs_email_status?: string;
    hs_call_body?: string;
    hs_call_direction?: string;
    hs_call_duration?: string;
    hs_call_disposition?: string;
    hs_call_status?: string;
    hs_meeting_title?: string;
    hs_meeting_body?: string;
    hs_meeting_start_time?: string;
    hs_meeting_end_time?: string;
    hs_meeting_outcome?: string;
    hs_note_body?: string;
    hs_task_body?: string;
    hs_task_subject?: string;
    hs_task_status?: string;
    hs_task_priority?: string;
    [key: string]: string | undefined;
  };
}

interface HubSpotEngagementsResponse {
  results: HubSpotEngagement[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

export interface NormalizedEngagement {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  timestamp: string;
  subject?: string;
  body?: string;
  direction?: string;
  status?: string;
  duration?: number;
  outcome?: string;
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

  // Fetch engagements (activities) associated with a deal
  async getDealEngagements(dealId: string, limit = 50): Promise<NormalizedEngagement[]> {
    const engagementTypes = ['emails', 'calls', 'meetings', 'notes', 'tasks'];
    const allEngagements: NormalizedEngagement[] = [];

    for (const engagementType of engagementTypes) {
      try {
        const engagements = await this.getEngagementsForDeal(dealId, engagementType, limit);
        allEngagements.push(...engagements);
      } catch (error) {
        console.warn(`Failed to fetch ${engagementType} for deal ${dealId}:`, error);
      }
    }

    // Sort by timestamp descending (most recent first)
    allEngagements.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return allEngagements;
  }

  private async getEngagementsForDeal(
    dealId: string,
    engagementType: string,
    limit: number
  ): Promise<NormalizedEngagement[]> {
    // Get properties based on engagement type
    let properties: string[];
    switch (engagementType) {
      case 'emails':
        properties = ['hs_timestamp', 'hs_email_subject', 'hs_body_preview', 'hs_email_direction', 'hs_email_status'];
        break;
      case 'calls':
        properties = ['hs_timestamp', 'hs_call_body', 'hs_call_direction', 'hs_call_duration', 'hs_call_disposition', 'hs_call_status'];
        break;
      case 'meetings':
        properties = ['hs_timestamp', 'hs_meeting_title', 'hs_meeting_body', 'hs_meeting_start_time', 'hs_meeting_end_time', 'hs_meeting_outcome'];
        break;
      case 'notes':
        properties = ['hs_timestamp', 'hs_note_body'];
        break;
      case 'tasks':
        properties = ['hs_timestamp', 'hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_task_priority'];
        break;
      default:
        properties = ['hs_timestamp'];
    }

    const params = new URLSearchParams({
      limit: String(limit),
      properties: properties.join(','),
    });

    const response = await this.request<HubSpotEngagementsResponse>(
      `/crm/v3/objects/${engagementType}?${params.toString()}`
    );

    // Filter to only those associated with this deal
    // Use the associations API to get engagements linked to the deal
    const associatedEngagements: NormalizedEngagement[] = [];

    for (const engagement of response.results) {
      // Check if this engagement is associated with the deal
      try {
        const associations = await this.request<{ results: Array<{ toObjectId: string }> }>(
          `/crm/v4/objects/${engagementType}/${engagement.id}/associations/deals`
        );

        if (associations.results?.some(a => a.toObjectId === dealId)) {
          const normalized = this.normalizeEngagement(engagement, engagementType);
          if (normalized) {
            associatedEngagements.push(normalized);
          }
        }
      } catch {
        // Skip if we can't check associations
      }
    }

    return associatedEngagements;
  }

  // Alternative: Use search API to get engagements by deal association directly
  async getDealEngagementsViaSearch(dealId: string): Promise<NormalizedEngagement[]> {
    const engagementTypes = [
      { type: 'emails', properties: ['hs_timestamp', 'hs_email_subject', 'hs_body_preview', 'hs_email_direction'] },
      { type: 'calls', properties: ['hs_timestamp', 'hs_call_body', 'hs_call_direction', 'hs_call_duration', 'hs_call_disposition'] },
      { type: 'meetings', properties: ['hs_timestamp', 'hs_meeting_title', 'hs_meeting_body', 'hs_meeting_start_time', 'hs_meeting_outcome'] },
      { type: 'notes', properties: ['hs_timestamp', 'hs_note_body'] },
      { type: 'tasks', properties: ['hs_timestamp', 'hs_task_subject', 'hs_task_body', 'hs_task_status'] },
    ];

    const allEngagements: NormalizedEngagement[] = [];

    for (const { type, properties } of engagementTypes) {
      try {
        const response = await this.request<HubSpotEngagementsResponse>(
          `/crm/v3/objects/${type}/search`,
          {
            method: 'POST',
            body: JSON.stringify({
              filterGroups: [{
                filters: [{
                  propertyName: 'associations.deal',
                  operator: 'EQ',
                  value: dealId,
                }],
              }],
              properties,
              limit: 50,
              sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
            }),
          }
        );

        for (const engagement of response.results) {
          const normalized = this.normalizeEngagement(engagement, type);
          if (normalized) {
            allEngagements.push(normalized);
          }
        }
      } catch (error) {
        console.warn(`Search for ${type} failed, trying associations API:`, error);
        // Fall back to associations approach
        try {
          const assocResponse = await this.request<{ results: HubSpotEngagement[] }>(
            `/crm/v3/objects/deals/${dealId}/associations/${type}`
          );

          if (assocResponse.results) {
            for (const assoc of assocResponse.results) {
              // Fetch full engagement details
              try {
                const engagement = await this.request<HubSpotEngagement>(
                  `/crm/v3/objects/${type}/${(assoc as any).id || (assoc as any).toObjectId}?properties=${properties.join(',')}`
                );
                const normalized = this.normalizeEngagement(engagement, type);
                if (normalized) {
                  allEngagements.push(normalized);
                }
              } catch {
                // Skip individual engagement errors
              }
            }
          }
        } catch (assocError) {
          console.warn(`Associations fallback for ${type} also failed:`, assocError);
        }
      }
    }

    // Sort by timestamp descending (most recent first)
    allEngagements.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return allEngagements;
  }

  private normalizeEngagement(engagement: HubSpotEngagement, type: string): NormalizedEngagement | null {
    const timestamp = engagement.properties.hs_timestamp ||
                     engagement.properties.hs_createdate ||
                     engagement.properties.hs_meeting_start_time;

    if (!timestamp) return null;

    const baseEngagement = {
      id: engagement.id,
      timestamp,
    };

    switch (type) {
      case 'emails':
        return {
          ...baseEngagement,
          type: 'email',
          subject: engagement.properties.hs_email_subject,
          body: engagement.properties.hs_body_preview,
          direction: engagement.properties.hs_email_direction,
          status: engagement.properties.hs_email_status,
        };
      case 'calls':
        return {
          ...baseEngagement,
          type: 'call',
          body: engagement.properties.hs_call_body,
          direction: engagement.properties.hs_call_direction,
          duration: engagement.properties.hs_call_duration
            ? parseInt(engagement.properties.hs_call_duration)
            : undefined,
          status: engagement.properties.hs_call_disposition || engagement.properties.hs_call_status,
        };
      case 'meetings':
        return {
          ...baseEngagement,
          type: 'meeting',
          subject: engagement.properties.hs_meeting_title,
          body: engagement.properties.hs_meeting_body,
          outcome: engagement.properties.hs_meeting_outcome,
        };
      case 'notes':
        return {
          ...baseEngagement,
          type: 'note',
          body: engagement.properties.hs_note_body,
        };
      case 'tasks':
        return {
          ...baseEngagement,
          type: 'task',
          subject: engagement.properties.hs_task_subject,
          body: engagement.properties.hs_task_body,
          status: engagement.properties.hs_task_status,
        };
      default:
        return null;
    }
  }
}

export function createHubSpotClient(apiKey: string): HubSpotClient {
  return new HubSpotClient(apiKey);
}
