'use client'

import { useState } from 'react'
import { Brain, Loader2, Sparkles } from 'lucide-react'
import api from '@/lib/api'

export function AIInsightsCard() {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const quickQueries = [
    'Show products running low this week',
    'What are my top selling items?',
    'Predict next month revenue',
  ]

  const runQuery = async (q: string) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/query', { query: q })
      setResult(res.data.data?.answer || 'No result')
    } catch {
      setResult('AI query failed. Check your Gemini API key in .env')
    } finally {
      setLoading(false)
    }
  }

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
          <button
            key={q}
            onClick={() => runQuery(q)}
            disabled={loading}
            className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-accent transition flex items-center gap-2 disabled:opacity-50"
          >
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
        <div className="bg-purple-500/10 rounded-xl p-3 text-sm border border-purple-500/20">
          {result}
        </div>
      )}

      <a
        href="/dashboard/ai"
        className="mt-3 block text-center text-xs text-primary hover:underline"
      >
        Open full AI chat →
      </a>
    </div>
  )
}