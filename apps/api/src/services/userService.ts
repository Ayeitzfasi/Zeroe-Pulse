import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import type { User } from '@zeroe-pulse/shared';

const SALT_ROUNDS = 10;

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'user';
  hubspot_token: string | null;
  confluence_token: string | null;
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
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
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
