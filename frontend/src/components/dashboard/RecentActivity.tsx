'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, Brain, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';

export function RecentActivity({ activities }: { activities: any[] }) {
  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-500',
    UPDATE: 'bg-blue-500',
    DELETE: 'bg-red-500',
    LOGIN: 'bg-purple-500',
    BULK_IMPORT: 'bg-yellow-500',
    CREATE_ORDER: 'bg-indigo-500',
  };

  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest system events</p>
        </div>
        <Activity className="w-4 h-4 text-muted-foreground" />
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${actionColors[a.action] || 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{a.user?.name}</span>{' '}
                  <span className="text-muted-foreground">
                    {a.action.toLowerCase().replace('_', ' ')} {a.entity.toLowerCase()}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AIInsightsCard() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quickQueries = [
    'Show products running low this week',
    'What are my top selling items?',
    'Predict next month revenue',
  ];

  const runQuery = async (q: string) => {
    setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/query', { query: q });
      setResult(res.data.data?.answer || 'No result');
    } catch {
      setResult('AI query failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Ask anything about inventory</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {quickQueries.map((q) => (
          <button key={q} onClick={() => runQuery(q)}
            className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-accent transition flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            {q}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          AI is thinking...
        </div>
      )}

      {result && (
        <div className="bg-purple-500/10 rounded-xl p-3 text-sm text-foreground border border-purple-500/20">
          {result}
        </div>
      )}

      <a href="/dashboard/ai" className="mt-3 block text-center text-xs text-primary hover:underline">
        Open full AI chat →
      </a>
    </div>
  );
}
