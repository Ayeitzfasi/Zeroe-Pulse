import Anthropic from '@anthropic-ai/sdk';
import type { Message, ConversationType } from '@zeroe-pulse/shared';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// System prompts for different conversation types
const SYSTEM_PROMPTS: Record<ConversationType, string> = {
  general: `You are a helpful AI assistant for Zeroe.io, a sales enablement platform. You help users with:
- Understanding their deals and sales pipeline
- Analyzing customer interactions and meeting notes
- Drafting emails, proposals, and follow-up content
- Providing insights on deal health and next steps

Be concise, professional, and focused on actionable insights. When you don't have enough context, ask clarifying questions.`,

  deal: `You are a helpful AI assistant for Zeroe.io, specialized in sales deal analysis. You have access to deal information from HubSpot including:
- Deal details (name, amount, stage, close date)
- Associated contacts and companies
- Deal properties and custom fields

Help the user understand the deal, identify risks and opportunities, suggest next steps, and draft relevant content. Use the deal context provided to give specific, actionable advice.

When analyzing deals, consider:
- BANT (Budget, Authority, Need, Timeline)
- MEDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)
- Deal velocity and engagement patterns`,

  skill_creation: `You are a helpful AI assistant for creating Claude Skills. A skill is a reusable AI prompt/workflow that can be used within the Zeroe.io platform.

Skills are stored as markdown files with YAML frontmatter. The format is:
\`\`\`
---
name: skill-name
description: Brief description of what the skill does
---

# Skill Title

Full documentation of the skill including:
- What it does
- How to use it
- Any API endpoints or integrations
- Examples
\`\`\`

Help users create skills by:
1. Understanding what they want to accomplish
2. Gathering requirements through questions
3. Drafting the skill content
4. Refining based on feedback

When the user is satisfied, output the final skill in a code block with the proper format so it can be saved.

IMPORTANT: When the skill is complete and ready to save, wrap the final skill content in a special marker:
<skill_ready>
---
name: skill-name
description: Description here
---
# Skill content here...
</skill_ready>

This marker indicates the skill is ready to be saved to the system.`,
};

// Build context string from deal data
export function buildDealContext(deal: {
  name: string;
  amount: number | null;
  stage: string;
  stageName?: string;
  closeDate: string | null;
  companyName?: string;
  contacts?: Array<{ name: string; email: string; title?: string }>;
  properties?: Record<string, unknown>;
}): string {
  const lines: string[] = [
    '## Deal Context',
    `**Deal Name:** ${deal.name}`,
    `**Stage:** ${deal.stageName || deal.stage}`,
  ];

  if (deal.amount) {
    lines.push(`**Amount:** $${deal.amount.toLocaleString()}`);
  }
  if (deal.closeDate) {
    lines.push(`**Expected Close:** ${new Date(deal.closeDate).toLocaleDateString()}`);
  }
  if (deal.companyName) {
    lines.push(`**Company:** ${deal.companyName}`);
  }

  if (deal.contacts && deal.contacts.length > 0) {
    lines.push('', '**Contacts:**');
    deal.contacts.forEach(contact => {
      const title = contact.title ? ` (${contact.title})` : '';
      lines.push(`- ${contact.name}${title}: ${contact.email}`);
    });
  }

  return lines.join('\n');
}

// Build context string from skill data
export function buildSkillContext(skills: Array<{ name: string; description?: string; prompt: string }>): string {
  if (skills.length === 0) return '';

  const lines: string[] = ['## Available Skills for Reference'];

  skills.forEach(skill => {
    lines.push(`### ${skill.name}`);
    if (skill.description) {
      lines.push(skill.description);
    }
    lines.push('```');
    lines.push(skill.prompt.slice(0, 500) + (skill.prompt.length > 500 ? '...' : ''));
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
}

// Convert our Message format to Anthropic format
function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  return messages
    .filter(m => m.role !== 'system') // System messages go in system param
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

export interface ChatOptions {
  conversationType: ConversationType;
  messages: Message[];
  context?: string; // Additional context to prepend
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  // For skill creation - extracted skill if ready
  extractedSkill?: {
    name: string;
    description: string;
    content: string;
  };
}

// Main chat function
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const { conversationType, messages, context } = options;

  // Build system prompt with context
  let systemPrompt = SYSTEM_PROMPTS[conversationType];
  if (context) {
    systemPrompt = `${systemPrompt}\n\n${context}`;
  }

  // Call Claude
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: toAnthropicMessages(messages),
  });

  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  const content = textContent ? textContent.text : '';

  // Check for skill_ready marker in skill creation mode
  let extractedSkill: ChatResponse['extractedSkill'];
  if (conversationType === 'skill_creation') {
    const skillMatch = content.match(/<skill_ready>([\s\S]*?)<\/skill_ready>/);
    if (skillMatch) {
      const skillContent = skillMatch[1].trim();
      // Parse frontmatter
      const frontmatterMatch = skillContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const [, yaml, body] = frontmatterMatch;
        const nameMatch = yaml.match(/name:\s*(.+)/);
        const descMatch = yaml.match(/description:\s*(.+)/);
        extractedSkill = {
          name: nameMatch ? nameMatch[1].trim() : 'New Skill',
          description: descMatch ? descMatch[1].trim() : '',
          content: skillContent,
        };
      }
    }
  }

  return {
    content,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    extractedSkill,
  };
}

// Simple completion for one-off tasks
export async function complete(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt || 'You are a helpful assistant.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent ? textContent.text : '';
}

// Generate a title for a conversation based on the first message
export async function generateTitle(firstMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 50,
    system: 'Generate a short, concise title (max 6 words) for a conversation that starts with the following message. Return only the title, no quotes or punctuation.',
    messages: [{ role: 'user', content: firstMessage }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent ? textContent.text.trim() : 'New Conversation';
}
