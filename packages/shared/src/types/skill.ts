export interface Skill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  prompt: string;
  isShared?: boolean;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  prompt?: string;
  isShared?: boolean;
}

export interface SkillListParams {
  includeShared?: boolean;
  search?: string;
}
