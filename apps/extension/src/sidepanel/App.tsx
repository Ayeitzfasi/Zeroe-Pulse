import { useState, useEffect, useCallback } from 'react';

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  id: string | null;
  name: string | null;
}

const WEB_URL = 'http://localhost:3000';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<HubSpotContext | null>(null);

  const checkAuth = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
      setIsAuthenticated(!!response?.token);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for context updates and auth changes
    const listener = (message: { type: string; context?: HubSpotContext; token?: string }) => {
      if (message.type === 'HUBSPOT_CONTEXT_UPDATE' && message.context) {
        setContext(message.context);
      }
      if (message.type === 'AUTH_TOKEN_UPDATED') {
        setIsAuthenticated(!!message.token);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [checkAuth]);

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_AUTH_TOKEN' }, () => {
      setIsAuthenticated(false);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <div className="h-1.5 w-24 bg-zeroe-gradient rounded-full mb-4 animate-pulse" />
        <p className="text-slate-blue text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <div className="h-1.5 w-24 bg-zeroe-gradient rounded-full mb-4" />
        <h1 className="text-xl font-heading font-bold text-charcoal mb-2">
          Zeroe Pulse AI
        </h1>
        <p className="text-slate-blue text-sm text-center mb-4">
          Sign in to use the extension
        </p>
        <a
          href={`${WEB_URL}/login?extension=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          Sign In
        </a>
        <p className="text-xs text-slate-400 mt-4 text-center px-4">
          After signing in, click "Sync to Extension" on the dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-8 bg-zeroe-gradient rounded-full" />
            <span className="font-heading font-bold text-charcoal">
              Pulse AI
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-coral hover:text-coral/80"
          >
            Sign Out
          </button>
        </div>
        {context?.name && (
          <div className="mt-2 text-sm text-slate-blue">
            {context.type}: <span className="font-medium">{context.name}</span>
          </div>
        )}
      </header>

      {/* Chat area placeholder */}
      <main className="flex-1 p-4">
        <div className="text-center text-slate-blue text-sm">
          <p>Chat interface coming in Phase 6</p>
          {context?.type ? (
            <p className="mt-2">
              Context detected: {context.type} #{context.id}
            </p>
          ) : (
            <p className="mt-2">
              Navigate to a HubSpot deal, contact, or company to see context
            </p>
          )}
        </div>
      </main>

      {/* Input placeholder */}
      <footer className="border-t border-slate-200 p-3 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about this deal..."
            className="input text-sm"
            disabled
          />
          <button className="btn-primary text-sm" disabled>
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
