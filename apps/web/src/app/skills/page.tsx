'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Skill, SkillListParams } from '@zeroe-pulse/shared';
import { SKILL_CATEGORIES } from '@zeroe-pulse/shared';

const ICON_MAP: Record<string, React.ReactNode> = {
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  mail: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  target: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  code: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  import: { label: 'Imported', className: 'bg-purple-100 text-purple-700' },
  ai_generated: { label: 'AI Generated', className: 'bg-blue-100 text-blue-700' },
  extension: { label: 'From Extension', className: 'bg-orange-100 text-orange-700' },
};

function SkillCard({ skill, onDelete }: { skill: Skill; onDelete: (id: string) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-zeroe-blue/10 rounded-lg text-zeroe-blue">
          {ICON_MAP[skill.icon] || ICON_MAP.sparkles}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/skills/${skill.id}`}
                className="text-lg font-medium text-charcoal hover:text-zeroe-blue transition-colors"
              >
                {skill.name}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {skill.isShared && (
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Shared
                  </span>
                )}
                {skill.source && skill.source !== 'manual' && SOURCE_BADGES[skill.source] && (
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${SOURCE_BADGES[skill.source].className}`}>
                    {SOURCE_BADGES[skill.source].label}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`/skills/${skill.id}`}
                className="p-2 text-slate-400 hover:text-zeroe-blue transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-slate-400 hover:text-coral transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-blue mt-1 line-clamp-2">
            {skill.description || 'No description'}
          </p>
          {skill.category && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
              {skill.category}
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-heading font-bold text-charcoal mb-4">
              Delete Skill?
            </h2>
            <p className="text-slate-blue mb-6">
              Are you sure you want to delete &quot;{skill.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(skill.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [includeShared, setIncludeShared] = useState(true);

  // Import state
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadSkills = async () => {
    setIsLoading(true);
    setError('');

    const params: SkillListParams = {
      includeShared,
      search,
    };
    if (category !== 'all') {
      params.category = category;
    }

    const result = await api.getSkills(params);

    if (result.success && result.data) {
      setSkills(result.data.skills);
    } else {
      setError(result.error?.message || 'Failed to load skills');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadSkills();
  }, [search, category, includeShared]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (id: string) => {
    const result = await api.deleteSkill(id);
    if (result.success) {
      setSkills(skills.filter(s => s.id !== id));
    } else {
      setError(result.error?.message || 'Failed to delete skill');
    }
  };

  // File import handlers
  const handleFileImport = useCallback(async (file: File) => {
    if (!file.name.endsWith('.skill')) {
      setError('Please upload a .skill file');
      return;
    }

    setIsImporting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = (e.target?.result as string).split(',')[1];

        const result = await api.importSkill({
          fileContent: base64Content,
          fileName: file.name,
        });

        if (result.success && result.data) {
          setSuccessMessage(`Successfully imported "${result.data.skill.name}"`);
          // Navigate to the imported skill
          router.push(`/skills/${result.data.skill.id}`);
        } else {
          setError(result.error?.message || 'Failed to import skill');
        }
        setIsImporting(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsImporting(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to import skill');
      setIsImporting(false);
    }
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  }, [handleFileImport]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [handleFileImport]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Skills</h1>
            <p className="text-slate-blue">Create and manage reusable AI prompts</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
              disabled={isImporting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <Link href="/skills/new" className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Skill
            </Link>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".skill"
            onChange={handleFileInputChange}
            className="hidden"
          />
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

        {/* Import Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging
              ? 'border-zeroe-blue bg-zeroe-blue/5'
              : 'border-slate-200 hover:border-slate-300'
            }
            ${isImporting ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {isImporting ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-zeroe-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-slate-blue">Importing skill...</span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-slate-blue">
                Drag and drop a <span className="font-medium">.skill</span> file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-zeroe-blue hover:underline font-medium"
                >
                  browse
                </button>
              </p>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input w-full pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input min-w-[150px]"
            >
              <option value="all">All Categories</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Include Shared Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeShared}
                onChange={(e) => setIncludeShared(e.target.checked)}
                className="w-4 h-4 text-zeroe-blue border-slate-300 rounded focus:ring-zeroe-blue"
              />
              <span className="text-sm text-charcoal">Show shared skills</span>
            </label>
          </div>
        </div>

        {/* Skills Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 mx-auto text-zeroe-blue" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-blue mt-2">Loading skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="card">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="text-lg font-medium text-charcoal mb-2">No skills found</h3>
              <p className="text-slate-blue mb-4">
                {search || category !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first skill or import an existing one to get started.'}
              </p>
              {!search && category === 'all' && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Skill
                  </button>
                  <Link href="/skills/new" className="btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Skill
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
