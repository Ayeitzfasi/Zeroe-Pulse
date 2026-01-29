import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import type { User, UserApiKeys, UpdateApiKeysRequest } from '@zeroe-pulse/shared';

const SALT_ROUNDS = 10;

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'user';
  hubspot_token: string | null;
  confluence_token: string | null;
  anthropic_api_key: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    hubspotToken: dbUser.hubspot_token || undefined,
    confluenceToken: dbUser.confluence_token || undefined,
    anthropicApiKey: dbUser.anthropic_api_key || undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

// Mask API key for display (show first 4 and last 4 characters)
function maskApiKey(key: string | null): string | null {
  if (!key || key.length < 12) return key ? '••••••••' : null;
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function findByEmail(email: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data as DbUser;
}

export async function findById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDbUserToUser(data as DbUser);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function updatePassword(
  userId: string,
  newPasswordHash: string
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newPasswordHash })
    .eq('id', userId);

  return !error;
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'user' = 'user'
): Promise<User | null> {
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      role,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating user:', error);
    return null;
  }

  return mapDbUserToUser(data as DbUser);
}

export async function getApiKeys(userId: string): Promise<UserApiKeys | null> {
  const { data, error } = await supabase
    .from('users')
    .select('hubspot_token, confluence_token, anthropic_api_key')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  // Return masked keys for display
  return {
    hubspotToken: maskApiKey(data.hubspot_token),
    confluenceToken: maskApiKey(data.confluence_token),
    anthropicApiKey: maskApiKey(data.anthropic_api_key),
  };
}

export async function updateApiKeys(
  userId: string,
  keys: UpdateApiKeysRequest
): Promise<boolean> {
  const updateData: Record<string, string | null> = {};

  // Only include keys that are being updated (not undefined)
  if (keys.hubspotToken !== undefined) {
    updateData.hubspot_token = keys.hubspotToken;
  }
  if (keys.confluenceToken !== undefined) {
    updateData.confluence_token = keys.confluenceToken;
  }
  if (keys.anthropicApiKey !== undefined) {
    updateData.anthropic_api_key = keys.anthropicApiKey;
  }

  if (Object.keys(updateData).length === 0) {
    return true; // Nothing to update
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  return !error;
}

export async function getAnthropicApiKey(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('anthropic_api_key')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.anthropic_api_key;
}
