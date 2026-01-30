import { useState } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: TaskData | NoteData) => Promise<void>;
  type: 'task' | 'note';
  recordName: string;
}

interface TaskData {
  subject: string;
  body: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface NoteData {
  body: string;
}

export function ActionModal({ isOpen, onClose, onConfirm, type, recordName }: ActionModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (type === 'task') {
        if (!subject.trim()) {
          throw new Error('Task subject is required');
        }
        await onConfirm({ subject, body, dueDate, priority });
      } else {
        if (!body.trim()) {
          throw new Error('Note content is required');
        }
        await onConfirm({ body });
      }
      // Reset form and close
      setSubject('');
      setBody('');
      setDueDate('');
      setPriority('MEDIUM');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubject('');
      setBody('');
      setDueDate('');
      setPriority('MEDIUM');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-charcoal">
              {type === 'task' ? 'Create Task' : 'Log Note'}
            </h3>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Record context */}
          <div className="mb-4 p-2 bg-slate-50 rounded text-xs text-slate-600">
            <span className="font-medium">Record:</span> {recordName}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {type === 'task' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter task subject..."
                    className="input text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="input text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {type === 'task' ? 'Description' : 'Note Content *'}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={type === 'task' ? 'Add task details...' : 'Enter note content...'}
                className="input text-sm min-h-[80px]"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-2 bg-coral/10 border border-coral/20 rounded text-coral text-xs">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-secondary text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  type === 'task' ? 'Create Task' : 'Log Note'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export type { TaskData, NoteData };
