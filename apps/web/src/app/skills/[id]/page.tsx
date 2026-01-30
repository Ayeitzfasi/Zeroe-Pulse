'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Skill } from '@zeroe-pulse/shared';
import { SKILL_CATEGORIES, SKILL_ICONS } from '@zeroe-pulse/shared';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Created manually',
  import: 'Imported from file',
  ai_generated: 'AI Generated',
  extension: 'Created from extension',
};

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // View mode: 'rendered' or 'raw'
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    loadSkill();
  }, [id]);

  const loadSkill = async () => {
    setIsLoading(true);
    setError('');

    const result = await api.getSkill(id);

    if (result.success && result.data) {
      setSkill(result.data);
      setName(result.data.name);
      setDescription(result.data.description || '');
      setPrompt(result.data.prompt);
      setCategory(result.data.category || '');
      setIcon(result.data.icon);
      setIsShared(result.data.isShared);
    } else {
      setError(result.error?.message || 'Failed to load skill');
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const result = await api.updateSkill(id, {
      name,
      description: description || undefined,
      prompt,
      category: category || undefined,
      icon,
      isShared,
    });

    if (result.success && result.data) {
      setSkill(result.data);
      setIsEditing(false);
      setSuccessMessage('Skill saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError(result.error?.message || 'Failed to save skill');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description || '');
      setPrompt(skill.prompt);
      setCategory(skill.category || '');
      setIcon(skill.icon);
      setIsShared(skill.isShared);
    }
    setIsEditing(false);
    setError('');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError('');

    const result = await api.exportSkill(id);

    if (result.success && result.data) {
      // Create download link
      const blob = new Blob(
        [Uint8Array.from(atob(result.data.content), c => c.charCodeAt(0))],
        { type: 'application/zip' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage('Skill exported successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError(result.error?.message || 'Failed to export skill');
    }

    setIsExporting(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 mx-auto text-zeroe-blue" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-blue mt-2">Loading skill...</p>
        </div>
      </AppLayout>
    );
  }

  if (!skill) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-charcoal mb-2">Skill not found</h3>
          <p className="text-slate-blue mb-4">{error || 'The skill you are looking for does not exist.'}</p>
          <Link href="/skills" className="btn-primary">
            Back to Skills
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/skills"
              className="p-2 text-slate-400 hover:text-charcoal transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-charcoal">
                {isEditing ? 'Edit Skill' : skill.name}
              </h1>
              <p className="text-slate-blue">
                {isEditing ? 'Update your skill' : skill.description || 'No description'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-secondary flex items-center gap-2"
                  title="Export as .skill file"
                >
                  {isExporting ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  Export
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="card space-y-6">
          {isEditing ? (
            <>
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1">
                  Name <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Category & Icon Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-charcoal mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select category...</option>
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="icon" className="block text-sm font-medium text-charcoal mb-1">
                    Icon
                  </label>
                  <select
                    id="icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="input w-full"
                  >
                    {SKILL_ICONS.map((iconName) => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-charcoal mb-1">
                  Skill Content (Markdown) <span className="text-coral">*</span>
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input w-full h-96 font-mono text-sm"
                  required
                />
              </div>

              {/* Shared Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zeroe-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zeroe-blue"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-charcoal">Share with team</span>
                  <p className="text-xs text-slate-blue">Make this skill visible to all users</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name || !prompt}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {skill.category && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      {skill.category}
                    </span>
                  )}
                  {skill.isShared && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Shared
                    </span>
                  )}
                  {skill.source && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {SOURCE_LABELS[skill.source] || skill.source}
                    </span>
                  )}
                  {skill.sourceFile && (
                    <span className="text-xs text-slate-400">
                      ({skill.sourceFile})
                    </span>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('rendered')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'rendered'
                        ? 'bg-zeroe-blue text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Rendered
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-zeroe-blue text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Raw
                  </button>
                </div>
              </div>

              {/* Skill Content */}
              <div>
                {viewMode === 'rendered' ? (
                  <div className="prose prose-slate max-w-none prose-headings:font-heading prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-code:text-zeroe-blue prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-table:text-sm prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {skill.prompt}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="p-4 bg-slate-50 rounded-lg text-sm text-charcoal font-mono whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto">
                    {skill.prompt}
                  </pre>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 text-sm text-slate-blue">
                <p>Created: {new Date(skill.createdAt).toLocaleDateString()}</p>
                <p>Last updated: {new Date(skill.updatedAt).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
