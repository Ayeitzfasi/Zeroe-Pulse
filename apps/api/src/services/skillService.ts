import { supabase } from '../lib/supabase.js';
import type {
  Skill,
  SkillListParams,
  SkillListResponse,
  CreateSkillRequest,
  UpdateSkillRequest,
  SkillVariable,
  SkillSource,
  SkillFrontmatter,
  ImportSkillResponse,
  ExportSkillResponse
} from '@zeroe-pulse/shared';
import JSZip from 'jszip';

interface DbSkill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  category: string | null;
  is_shared: boolean;
  icon: string;
  variables: SkillVariable[];
  source: SkillSource;
  source_file: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbSkillToSkill(dbSkill: DbSkill): Skill {
  return {
    id: dbSkill.id,
    userId: dbSkill.user_id,
    name: dbSkill.name,
    description: dbSkill.description,
    prompt: dbSkill.prompt,
    category: dbSkill.category,
    isShared: dbSkill.is_shared,
    icon: dbSkill.icon || 'sparkles',
    variables: dbSkill.variables || [],
    source: dbSkill.source || 'manual',
    sourceFile: dbSkill.source_file,
    createdAt: dbSkill.created_at,
    updatedAt: dbSkill.updated_at,
  };
}

// Parse YAML frontmatter from SKILL.md content
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter, use first heading as name
    const headingMatch = content.match(/^#\s+(.+)$/m);
    return {
      frontmatter: {
        name: headingMatch ? headingMatch[1].trim() : 'Untitled Skill',
      },
      body: content,
    };
  }

  const [, yamlContent, body] = match;
  const frontmatter: SkillFrontmatter = { name: 'Untitled Skill' };

  // Simple YAML parsing (supports basic key: value pairs)
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      switch (key) {
        case 'name':
          frontmatter.name = value;
          break;
        case 'description':
          frontmatter.description = value;
          break;
        case 'category':
          frontmatter.category = value;
          break;
        case 'icon':
          frontmatter.icon = value;
          break;
      }
    }
  }

  return { frontmatter, body };
}

// Generate SKILL.md content from a skill
function generateSkillMarkdown(skill: Skill): string {
  const frontmatter = [
    '---',
    `name: ${skill.name}`,
  ];

  if (skill.description) {
    frontmatter.push(`description: ${skill.description}`);
  }
  if (skill.category) {
    frontmatter.push(`category: ${skill.category}`);
  }
  if (skill.icon && skill.icon !== 'sparkles') {
    frontmatter.push(`icon: ${skill.icon}`);
  }

  frontmatter.push('---', '');

  // If prompt already has frontmatter, extract just the body
  const { body } = parseFrontmatter(skill.prompt);

  return frontmatter.join('\n') + body;
}

export async function findAll(userId: string, params: SkillListParams = {}): Promise<SkillListResponse> {
  const {
    includeShared = true,
    search = '',
    category,
  } = params;

  // Build query - get user's own skills
  let query = supabase
    .from('skills')
    .select('*', { count: 'exact' });

  // Filter by user's own skills OR shared skills
  if (includeShared) {
    query = query.or(`user_id.eq.${userId},is_shared.eq.true`);
  } else {
    query = query.eq('user_id', userId);
  }

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply category filter
  if (category) {
    query = query.eq('category', category);
  }

  // Order by name
  query = query.order('name', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching skills:', error);
    throw new Error('Failed to fetch skills');
  }

  const skills = (data || []).map((d) => mapDbSkillToSkill(d as DbSkill));

  return {
    skills,
    total: count || 0,
  };
}

export async function findById(id: string, userId: string): Promise<Skill | null> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const skill = mapDbSkillToSkill(data as DbSkill);

  // Check if user has access (own skill or shared)
  if (skill.userId !== userId && !skill.isShared) {
    return null;
  }

  return skill;
}

export async function create(userId: string, data: CreateSkillRequest): Promise<Skill> {
  const skillData = {
    user_id: userId,
    name: data.name,
    description: data.description || null,
    prompt: data.prompt,
    category: data.category || null,
    is_shared: data.isShared || false,
    icon: data.icon || 'sparkles',
    variables: data.variables || [],
    source: data.source || 'manual',
    source_file: data.sourceFile || null,
  };

  const { data: newSkill, error } = await supabase
    .from('skills')
    .insert(skillData)
    .select()
    .single();

  if (error || !newSkill) {
    console.error('Error creating skill:', error);
    throw new Error('Failed to create skill');
  }

  return mapDbSkillToSkill(newSkill as DbSkill);
}

export async function update(id: string, userId: string, data: UpdateSkillRequest): Promise<Skill | null> {
  // First check if user owns this skill
  const existing = await supabase
    .from('skills')
    .select('user_id')
    .eq('id', id)
    .single();

  if (existing.error || !existing.data) {
    return null;
  }

  if (existing.data.user_id !== userId) {
    throw new Error('You can only update your own skills');
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.prompt !== undefined) updateData.prompt = data.prompt;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isShared !== undefined) updateData.is_shared = data.isShared;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.variables !== undefined) updateData.variables = data.variables;

  const { data: updatedSkill, error } = await supabase
    .from('skills')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !updatedSkill) {
    console.error('Error updating skill:', error);
    throw new Error('Failed to update skill');
  }

  return mapDbSkillToSkill(updatedSkill as DbSkill);
}

export async function remove(id: string, userId: string): Promise<boolean> {
  // First check if user owns this skill
  const existing = await supabase
    .from('skills')
    .select('user_id')
    .eq('id', id)
    .single();

  if (existing.error || !existing.data) {
    return false;
  }

  if (existing.data.user_id !== userId) {
    throw new Error('You can only delete your own skills');
  }

  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting skill:', error);
    return false;
  }

  return true;
}

// Import a .skill file (ZIP containing SKILL.md)
export async function importSkillFile(userId: string, fileContent: string, fileName: string): Promise<ImportSkillResponse> {
  try {
    // Decode base64 content
    const buffer = Buffer.from(fileContent, 'base64');

    // Parse ZIP file
    const zip = await JSZip.loadAsync(buffer);

    // Find SKILL.md file (could be in root or in a folder)
    let skillMdContent: string | null = null;
    let skillFolderName: string | null = null;

    for (const [path, file] of Object.entries(zip.files)) {
      if (path.endsWith('SKILL.md') && !file.dir) {
        skillMdContent = await file.async('text');
        // Extract folder name if present
        const parts = path.split('/');
        if (parts.length > 1) {
          skillFolderName = parts[0];
        }
        break;
      }
    }

    if (!skillMdContent) {
      throw new Error('No SKILL.md file found in the uploaded .skill file');
    }

    // Parse frontmatter
    const { frontmatter, body } = parseFrontmatter(skillMdContent);

    // Create skill in database
    const skill = await create(userId, {
      name: frontmatter.name || skillFolderName || 'Imported Skill',
      description: frontmatter.description,
      prompt: skillMdContent, // Store full content including frontmatter
      category: frontmatter.category,
      icon: frontmatter.icon || 'sparkles',
      source: 'import',
      sourceFile: fileName,
    });

    return {
      skill,
      parsedFrom: {
        name: frontmatter.name || skillFolderName || 'Imported Skill',
        description: frontmatter.description || null,
        contentLength: body.length,
      },
    };
  } catch (error) {
    console.error('Error importing skill file:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to import skill file');
  }
}

// Export a skill as .skill file (ZIP containing SKILL.md)
export async function exportSkillFile(id: string, userId: string): Promise<ExportSkillResponse> {
  const skill = await findById(id, userId);

  if (!skill) {
    throw new Error('Skill not found');
  }

  // Generate SKILL.md content
  const skillMdContent = generateSkillMarkdown(skill);

  // Create ZIP file
  const zip = new JSZip();
  const folderName = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  zip.file(`${folderName}/SKILL.md`, skillMdContent);

  // Generate ZIP as base64
  const zipContent = await zip.generateAsync({ type: 'base64' });

  return {
    fileName: `${folderName}.skill`,
    content: zipContent,
  };
}
