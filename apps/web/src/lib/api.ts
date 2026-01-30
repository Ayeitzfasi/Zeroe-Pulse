import type { ApiResponse, LoginRequest, LoginResponse, User, ChangePasswordRequest, UserApiKeys, UpdateApiKeysRequest, Deal, DealListParams, DealListResponse, DealStage, HubSpotPipeline, HubSpotConfig, Skill, SkillListParams, SkillListResponse, CreateSkillRequest, UpdateSkillRequest, ImportSkillRequest, ImportSkillResponse, ExportSkillResponse, Conversation, ConversationWithMessages, ConversationListParams, ConversationListResponse, CreateConversationRequest, SendMessageRequest, SendMessageResponse } from '@zeroe-pulse/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' },
      };
    }

    return {
      success: true,
      data: data.data,
    };
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (result.success && result.data) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiKeys(): Promise<ApiResponse<UserApiKeys>> {
    return this.request<UserApiKeys>('/auth/api-keys');
  }

  async updateApiKeys(data: UpdateApiKeysRequest): Promise<ApiResponse<UserApiKeys>> {
    return this.request<UserApiKeys>('/auth/api-keys', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Deals API
  async getDeals(params: DealListParams = {}): Promise<ApiResponse<DealListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.stage) searchParams.set('stage', params.stage);
    if (params.pipeline) searchParams.set('pipeline', params.pipeline);
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    return this.request<DealListResponse>(`/deals${query ? `?${query}` : ''}`);
  }

  async getDeal(id: string): Promise<ApiResponse<{ deal: Deal; hubspotConfig: HubSpotConfig | null }>> {
    return this.request<{ deal: Deal; hubspotConfig: HubSpotConfig | null }>(`/deals/${id}`);
  }

  async getDistinctPipelines(): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    return this.request<Array<{ id: string; name: string }>>('/deals/filters/pipelines');
  }

  async getDealStats(): Promise<ApiResponse<{
    total: number;
    byStage: Record<DealStage, number>;
    totalValue: number;
  }>> {
    return this.request<{
      total: number;
      byStage: Record<DealStage, number>;
      totalValue: number;
    }>('/deals/stats');
  }

  async getHubSpotConfig(): Promise<ApiResponse<HubSpotConfig | null>> {
    return this.request<HubSpotConfig | null>('/deals/config');
  }

  async saveHubSpotConfig(config: HubSpotConfig & { pipelineName?: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/deals/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getHubSpotPipelines(): Promise<ApiResponse<{
    portalId: number;
    pipelines: HubSpotPipeline[];
  }>> {
    return this.request<{
      portalId: number;
      pipelines: HubSpotPipeline[];
    }>('/deals/pipelines');
  }

  async syncDeals(): Promise<ApiResponse<{
    message: string;
    totalFetched: number;
    created: number;
    updated: number;
  }>> {
    return this.request<{
      message: string;
      totalFetched: number;
      created: number;
      updated: number;
    }>('/deals/sync', {
      method: 'POST',
    });
  }

  async deleteAllDeals(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/deals', {
      method: 'DELETE',
    });
  }

  // Skills API
  async getSkills(params: SkillListParams = {}): Promise<ApiResponse<SkillListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.includeShared !== undefined) searchParams.set('includeShared', String(params.includeShared));
    if (params.search) searchParams.set('search', params.search);
    if (params.category) searchParams.set('category', params.category);

    const query = searchParams.toString();
    return this.request<SkillListResponse>(`/skills${query ? `?${query}` : ''}`);
  }

  async getSkill(id: string): Promise<ApiResponse<Skill>> {
    return this.request<Skill>(`/skills/${id}`);
  }

  async createSkill(data: CreateSkillRequest): Promise<ApiResponse<Skill>> {
    return this.request<Skill>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: UpdateSkillRequest): Promise<ApiResponse<Skill>> {
    return this.request<Skill>(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/skills/${id}`, {
      method: 'DELETE',
    });
  }

  async importSkill(data: ImportSkillRequest): Promise<ApiResponse<ImportSkillResponse>> {
    return this.request<ImportSkillResponse>('/skills/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportSkill(id: string): Promise<ApiResponse<ExportSkillResponse>> {
    return this.request<ExportSkillResponse>(`/skills/${id}/export`);
  }

  // Conversations API
  async getConversations(params: ConversationListParams = {}): Promise<ApiResponse<ConversationListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.dealId) searchParams.set('dealId', params.dealId);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<ConversationListResponse>(`/conversations${query ? `?${query}` : ''}`);
  }

  async getConversation(id: string): Promise<ApiResponse<ConversationWithMessages>> {
    return this.request<ConversationWithMessages>(`/conversations/${id}`);
  }

  async createConversation(data: CreateConversationRequest): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(conversationId: string, data: SendMessageRequest, signal?: AbortSignal): Promise<ApiResponse<SendMessageResponse>> {
    return this.request<SendMessageResponse>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      signal
    );
  }

  async deleteConversation(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
