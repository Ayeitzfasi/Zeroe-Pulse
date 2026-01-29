import type { ApiResponse, LoginRequest, LoginResponse, User, ChangePasswordRequest, UserApiKeys, UpdateApiKeysRequest, Deal, DealListParams, DealListResponse, DealStage, HubSpotPipeline, HubSpotConfig } from '@zeroe-pulse/shared';

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
    options: RequestInit = {}
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
}

export const api = new ApiClient();
