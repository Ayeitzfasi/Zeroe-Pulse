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
  options: RequestInit = {}
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

  async sendMessage(conversationId: string, content: string) {
    return request<SendMessageResponse>('/conversations/' + conversationId + '/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Deals - find by HubSpot ID
  async getDealByHubspotId(hubspotId: string) {
    return request<{ deal: Deal }>('/deals/hubspot/' + hubspotId);
  },
};

export type { Message, Conversation, Deal, SendMessageResponse };
