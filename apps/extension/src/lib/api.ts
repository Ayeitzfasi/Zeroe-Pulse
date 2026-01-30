// API client for Chrome extension

const API_BASE = 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
      resolve(response?.token || null);
    });
  });
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  if (!token) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }

  try {
    const response = await fetch(API_BASE + endpoint, {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { code: 'ERROR', message: 'Request failed' },
      };
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error; // Re-throw abort errors to handle cancellation
    }
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
    };
  }
}

// Types
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  type: 'general' | 'deal' | 'skill_creation';
  dealId: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  generatedSkill?: {
    name: string;
    description: string;
    content: string;
  };
}

interface Deal {
  id: string;
  hubspotId: string;
  name: string;
  companyName: string;
  stage: string;
  stageLabel: string;
  amount: number | null;
  closeDate: string | null;
}

interface Contact {
  hubspotId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
}

interface Company {
  hubspotId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
}

// API methods
export const api = {
  // Get current user
  async getMe() {
    return request<{ id: string; email: string; name: string }>('/auth/me');
  },

  // Conversations
  async createConversation(data: {
    type: 'general' | 'deal' | 'skill_creation';
    dealId?: string;
  }) {
    return request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConversation(id: string) {
    return request<Conversation>('/conversations/' + id);
  },

  async getConversations(params: {
    type?: string;
    dealId?: string;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.append('type', params.type);
    if (params.dealId) searchParams.append('dealId', params.dealId);
    if (params.limit) searchParams.append('limit', String(params.limit));

    return request<{ conversations: Conversation[]; total: number }>(
      '/conversations?' + searchParams.toString()
    );
  },

  async sendMessage(conversationId: string, content: string, signal?: AbortSignal) {
    return request<SendMessageResponse>(
      '/conversations/' + conversationId + '/messages',
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      signal
    );
  },

  // Deals - find by HubSpot ID
  async getDealByHubspotId(hubspotId: string) {
    return request<{ deal: Deal }>('/deals/hubspot/' + hubspotId);
  },

  // Contacts - fetch from HubSpot and find associated deal
  async getContactByHubspotId(hubspotId: string) {
    return request<{ contact: Contact; associatedDeal: Deal | null }>(
      '/hubspot/contacts/' + hubspotId
    );
  },

  // Companies - fetch from HubSpot and find associated deal
  async getCompanyByHubspotId(hubspotId: string) {
    return request<{ company: Company; associatedDeal: Deal | null }>(
      '/hubspot/companies/' + hubspotId
    );
  },

  // HubSpot Actions
  async createTask(data: {
    subject: string;
    body?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    associatedObjectType: 'deal' | 'contact' | 'company';
    associatedObjectId: string;
  }) {
    return request<{ taskId: string }>('/hubspot/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createNote(data: {
    body: string;
    associatedObjectType: 'deal' | 'contact' | 'company';
    associatedObjectId: string;
  }) {
    return request<{ noteId: string }>('/hubspot/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Skills
interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  prompt: string;
  isShared: boolean;
  source: 'manual' | 'import' | 'ai_generated' | 'extension';
  createdAt: string;
  updatedAt: string;
}

export const skillsApi = {
  async createSkill(data: {
    name: string;
    description?: string;
    prompt: string;
    isShared?: boolean;
    source?: 'manual' | 'import' | 'ai_generated' | 'extension';
  }) {
    return request<Skill>('/skills', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        source: data.source || 'extension',
      }),
    });
  },

  async getSkills() {
    return request<{ skills: Skill[]; total: number }>('/skills');
  },
};

export type { Message, Conversation, Deal, Contact, Company, SendMessageResponse, Skill };
