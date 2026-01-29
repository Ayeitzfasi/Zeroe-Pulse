export interface DealContact {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
}

export interface DealCompany {
  id: string;
  name: string;
  domain: string | null;
}

export interface Deal {
  id: string;
  hubspotId: string;
  name: string;
  companyName: string;
  companyId: string | null;
  stage: DealStage;
  stageLabel: string;
  hubspotStageId?: string | null;
  pipelineId?: string | null;
  pipelineName?: string | null;
  amount: number | null;
  closeDate: string | null;
  ownerName: string | null;
  ownerId: string | null;
  lastEngagementDate: string | null;
  contacts: DealContact[];
  companies: DealCompany[];
  analysis: DealAnalysis | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | 'qualified'
  | 'discovery'
  | 'demo'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface DealAnalysis {
  bant: BANTAnalysis;
  medic: MEDICAnalysis;
  healthScore: HealthScore;
  nextSteps: string[];
  risks: string[];
  generatedAt: string;
}

export interface BANTAnalysis {
  budget: AnalysisItem;
  authority: AnalysisItem;
  need: AnalysisItem;
  timeline: AnalysisItem;
}

export interface MEDICAnalysis {
  metrics: AnalysisItem;
  economicBuyer: AnalysisItem;
  decisionCriteria: AnalysisItem;
  decisionProcess: AnalysisItem;
  identifyPain: AnalysisItem;
  champion: AnalysisItem;
}

export interface AnalysisItem {
  status: HealthScore;
  summary: string;
  evidence: string[];
}

export type HealthScore = 'green' | 'yellow' | 'red' | 'unknown';

export interface DealListParams {
  page?: number;
  limit?: number;
  // Accepts normalized stage, 'all', or HubSpot stage ID
  stage?: DealStage | 'all' | string;
  // Filter by pipeline ID, or 'all' for all pipelines
  pipeline?: string;
  search?: string;
  sortBy?: 'name' | 'amount' | 'closeDate' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HubSpotPipeline {
  id: string;
  label: string;
  stages: Array<{
    id: string;
    label: string;
  }>;
}

export interface HubSpotConfig {
  portalId: number;
  pipelineId: string;
}
