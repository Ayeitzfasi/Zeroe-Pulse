export interface SkillVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
}

// Source of the skill - how it was created
export type SkillSource = 'manual' | 'import' | 'ai_generated' | 'extension';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  prompt: string; // Full SKILL.md content (markdown)
  category: string | null;
  isShared: boolean;
  icon: string;
  variables: SkillVariable[];
  source: SkillSource;
  sourceFile: string | null; // Original filename if imported
  createdAt: string;
  updatedAt: string;
}

// Parsed frontmatter from SKILL.md
export interface SkillFrontmatter {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  variables?: SkillVariable[];
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  prompt: string;
  category?: string;
  isShared?: boolean;
  icon?: string;
  variables?: SkillVariable[];
  source?: SkillSource;
  sourceFile?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  prompt?: string;
  category?: string;
  isShared?: boolean;
  icon?: string;
  variables?: SkillVariable[];
}

// For importing .skill files
export interface ImportSkillRequest {
  fileContent: string; // Base64 encoded .skill file
  fileName: string;
}

export interface ImportSkillResponse {
  skill: Skill;
  parsedFrom: {
    name: string;
    description: string | null;
    contentLength: number;
  };
}

// For exporting skills
export interface ExportSkillResponse {
  fileName: string;
  content: string; // Base64 encoded .skill file
}

export interface SkillListParams {
  includeShared?: boolean;
  search?: string;
  category?: string;
}

export interface SkillListResponse {
  skills: Skill[];
  total: number;
}

export type SkillCategory =
  | 'sales'
  | 'analysis'
  | 'writing'
  | 'research'
  | 'communication'
  | 'other';

export const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'sales', label: 'Sales' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'writing', label: 'Writing' },
  { value: 'research', label: 'Research' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' },
];

export const SKILL_ICONS = [
  'sparkles',
  'document',
  'chart',
  'mail',
  'users',
  'lightbulb',
  'target',
  'clipboard',
  'search',
  'code',
];
