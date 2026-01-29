export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hubspotToken?: string;
  confluenceToken?: string;
  anthropicApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

// API keys configuration (masked for display)
export interface UserApiKeys {
  hubspotToken: string | null;
  confluenceToken: string | null;
  anthropicApiKey: string | null;
}

export interface UpdateApiKeysRequest {
  hubspotToken?: string | null;
  confluenceToken?: string | null;
  anthropicApiKey?: string | null;
}

export type UserRole = 'admin' | 'user';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
