export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hubspotToken?: string;
  confluenceToken?: string;
  createdAt: string;
  updatedAt: string;
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
