'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ApiKeyFieldProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  maskedValue: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  isLoading: boolean;
  placeholder: string;
}

function ApiKeyField({
  label,
  description,
  icon,
  value,
  maskedValue,
  onChange,
  onSave,
  onClear,
  isLoading,
  placeholder,
}: ApiKeyFieldProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    onChange('');
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-charcoal">{label}</p>
          <p className="text-sm text-slate-blue mb-3">{description}</p>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input w-full text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!value.trim() || isLoading}
                  className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {maskedValue ? (
                <>
                  <code className="text-sm bg-slate-200 px-2 py-1 rounded font-mono">
                    {maskedValue}
                  </code>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-zeroe-blue hover:text-zeroe-blue-dark"
                  >
                    Update
                  </button>
                  <button
                    onClick={onClear}
                    disabled={isLoading}
                    className="text-sm text-coral hover:text-coral/80"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Add Key
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<{
    hubspotToken: string | null;
    confluenceToken: string | null;
    anthropicApiKey: string | null;
  }>({
    hubspotToken: null,
    confluenceToken: null,
    anthropicApiKey: null,
  });

  // Input values for new keys
  const [hubspotInput, setHubspotInput] = useState('');
  const [confluenceInput, setConfluenceInput] = useState('');
  const [anthropicInput, setAnthropicInput] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    const result = await api.getApiKeys();
    if (result.success && result.data) {
      setApiKeys(result.data);
    }
  };

  const saveApiKey = async (
    keyType: 'hubspotToken' | 'confluenceToken' | 'anthropicApiKey',
    value: string
  ) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await api.updateApiKeys({ [keyType]: value });

    if (result.success && result.data) {
      setApiKeys(result.data);
      setSuccess('API key saved successfully');
      // Clear input
      if (keyType === 'hubspotToken') setHubspotInput('');
      if (keyType === 'confluenceToken') setConfluenceInput('');
      if (keyType === 'anthropicApiKey') setAnthropicInput('');
    } else {
      setError(result.error?.message || 'Failed to save API key');
    }

    setIsLoading(false);
  };

  const clearApiKey = async (
    keyType: 'hubspotToken' | 'confluenceToken' | 'anthropicApiKey'
  ) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await api.updateApiKeys({ [keyType]: null });

    if (result.success && result.data) {
      setApiKeys(result.data);
      setSuccess('API key removed successfully');
    } else {
      setError(result.error?.message || 'Failed to remove API key');
    }

    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal">Settings</h1>
          <p className="text-slate-blue">Manage your account and integrations</p>
        </div>

        {error && (
          <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Profile Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zeroe-blue/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-zeroe-blue">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-charcoal">{user?.name}</p>
                <p className="text-sm text-slate-blue">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Role: {user?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-charcoal">Password</p>
                <p className="text-sm text-slate-blue">Change your account password</p>
              </div>
              <Link href="/settings/password" className="btn-secondary text-sm">
                Change Password
              </Link>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-charcoal mb-2">API Keys</h2>
          <p className="text-sm text-slate-blue mb-4">
            Add your own API keys to use with Zeroe Pulse AI. Your keys are encrypted and stored securely.
          </p>
          <div className="space-y-4">
            <ApiKeyField
              label="Anthropic (Claude AI)"
              description="Your Anthropic API key for Claude AI chat functionality"
              icon={
                <div className="w-10 h-10 bg-[#D4A574]/20 rounded-lg flex items-center justify-center">
                  <span className="text-[#D4A574] font-bold text-sm">AI</span>
                </div>
              }
              value={anthropicInput}
              maskedValue={apiKeys.anthropicApiKey}
              onChange={setAnthropicInput}
              onSave={() => saveApiKey('anthropicApiKey', anthropicInput)}
              onClear={() => clearApiKey('anthropicApiKey')}
              isLoading={isLoading}
              placeholder="sk-ant-api03-..."
            />

            <ApiKeyField
              label="HubSpot"
              description="Connect to sync deals, contacts, and company data"
              icon={
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">HS</span>
                </div>
              }
              value={hubspotInput}
              maskedValue={apiKeys.hubspotToken}
              onChange={setHubspotInput}
              onSave={() => saveApiKey('hubspotToken', hubspotInput)}
              onClear={() => clearApiKey('hubspotToken')}
              isLoading={isLoading}
              placeholder="pat-eu1-..."
            />

            <ApiKeyField
              label="Confluence"
              description="Search and retrieve documentation from your wiki"
              icon={
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">CF</span>
                </div>
              }
              value={confluenceInput}
              maskedValue={apiKeys.confluenceToken}
              onChange={setConfluenceInput}
              onSave={() => saveApiKey('confluenceToken', confluenceInput)}
              onClear={() => clearApiKey('confluenceToken')}
              isLoading={isLoading}
              placeholder="Your Confluence API token"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
