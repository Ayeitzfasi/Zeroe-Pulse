'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLayout } from '@/components/layout';
import { ChatPanel } from '@/components/chat';
import { api } from '@/lib/api';
import type { Message } from '@zeroe-pulse/shared';

type CreationMode = 'guided' | 'freeform';

export default function NewSkillPage() {
  const router = useRouter();

  const [mode, setMode] = useState<CreationMode>('freeform');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedSkill, setGeneratedSkill] = useState<{
    name: string;
    description: string;
    content: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing conversation if resuming
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, []);

  const loadConversation = async (id: string) => {
    const result = await api.getConversation(id);
    if (result.success && result.data) {
      setMessages(result.data.messages);
    }
  };

  const handleConversationCreated = (id: string) => {
    setConversationId(id);
  };

  const handleSkillGenerated = (skill: { name: string; description: string; content: string }) => {
    setGeneratedSkill(skill);
    setShowPreview(true);
  };

  const handleSaveSkill = async () => {
    if (!generatedSkill) return;

    setIsSaving(true);
    setError('');

    const result = await api.createSkill({
      name: generatedSkill.name,
      description: generatedSkill.description,
      prompt: generatedSkill.content,
      source: 'ai_generated',
    });

    if (result.success && result.data) {
      router.push(`/skills/${result.data.id}`);
    } else {
      setError(result.error?.message || 'Failed to save skill');
      setIsSaving(false);
    }
  };

  const getPlaceholder = () => {
    if (mode === 'guided') {
      return 'Describe what kind of skill you want to create...';
    }
    return 'Describe your skill idea in detail, or just start chatting...';
  };

  const getInitialSystemMessage = (): string => {
    if (mode === 'guided') {
      return `I'll help you create a Claude skill step by step. Let's start with the basics:

**What would you like this skill to do?**

For example:
- "Summarize meeting notes with action items"
- "Generate follow-up emails after sales calls"
- "Analyze competitor positioning"

Tell me about your use case and I'll guide you through creating the skill.`;
    }
    return `I'm ready to help you create a skill. You can:

1. **Describe what you want** - Tell me about your use case and I'll help build the skill
2. **Paste an example** - Share an example of input/output and I'll create a skill for it
3. **Iterate together** - We can refine the skill through conversation

When the skill is ready, I'll format it properly so you can save it.`;
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
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
              <h1 className="text-xl font-heading font-bold text-charcoal">Create Skill with AI</h1>
              <p className="text-sm text-slate-blue">Chat with Claude to build your skill</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setMode('freeform')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'freeform'
                    ? 'bg-zeroe-blue text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Freeform
              </button>
              <button
                onClick={() => setMode('guided')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'guided'
                    ? 'bg-zeroe-blue text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Guided
              </button>
            </div>

            {generatedSkill && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary text-sm"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <div className={`flex-1 flex flex-col ${showPreview && generatedSkill ? 'w-1/2' : 'w-full'}`}>
            {/* Mode Description */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-sm text-slate-600">
                {mode === 'guided' ? (
                  <>
                    <span className="font-medium">Guided mode:</span> I'll ask questions to help you build the skill step by step.
                  </>
                ) : (
                  <>
                    <span className="font-medium">Freeform mode:</span> Describe your skill idea and we'll iterate together.
                  </>
                )}
              </p>
            </div>

            {/* Welcome message for new conversations */}
            {messages.length === 0 && (
              <div className="px-6 py-4">
                <div className="bg-slate-100 rounded-lg p-4">
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {getInitialSystemMessage()}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Chat */}
            <ChatPanel
              conversationId={conversationId}
              conversationType="skill_creation"
              initialMessages={messages}
              onConversationCreated={handleConversationCreated}
              onSkillGenerated={handleSkillGenerated}
              placeholder={getPlaceholder()}
              className="flex-1"
            />
          </div>

          {/* Preview Panel */}
          {showPreview && generatedSkill && (
            <div className="w-1/2 border-l border-slate-200 flex flex-col bg-white relative">
              {/* Sticky header */}
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-200 bg-white">
                <h2 className="font-heading font-bold text-charcoal truncate">{generatedSkill.name}</h2>
                <p className="text-sm text-slate-blue truncate">{generatedSkill.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pb-24">
                <div className="prose prose-slate max-w-none prose-headings:font-heading prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-code:text-zeroe-blue prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedSkill.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Floating Save Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
                <button
                  onClick={handleSaveSkill}
                  disabled={isSaving}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving Skill...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Skill
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
