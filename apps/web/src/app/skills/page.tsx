'use client';

import { AppLayout } from '@/components/layout';

export default function SkillsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Skills</h1>
            <p className="text-slate-blue">Create and manage reusable AI prompts</p>
          </div>
          <button className="btn-primary" disabled>
            Create Skill
          </button>
        </div>

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
            <h3 className="text-lg font-medium text-charcoal mb-2">No skills created</h3>
            <p className="text-slate-blue mb-4">
              Skills are reusable AI prompts that help you automate common tasks like summarizing meetings or generating follow-up emails.
            </p>
            <p className="text-sm text-slate-400">Coming in Phase 4</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
