import type { ApiResponse, LoginRequest, LoginResponse, User, ChangePasswordRequest, UserApiKeys, UpdateApiKeysRequest, Deal, DealListParams, DealListResponse, DealStage } from '@zeroe-pulse/shared';

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
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    return this.request<DealListResponse>(`/deals${query ? `?${query}` : ''}`);
  }

  async getDeal(id: string): Promise<ApiResponse<Deal>> {
    return this.request<Deal>(`/deals/${id}`);
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
}

export const api = new ApiClient();
