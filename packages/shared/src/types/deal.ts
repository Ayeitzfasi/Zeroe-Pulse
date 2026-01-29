export interface Deal {
  id: string;
  hubspotId: string;
  name: string;
  companyName: string;
  stage: DealStage;
  amount: number | null;
  closeDate: string | null;
  ownerName: string | null;
  ownerId: string | null;
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
  stage?: DealStage | 'all';
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
