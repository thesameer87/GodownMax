'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Brain, Send, Loader2, TrendingUp, Package, BarChart3, Zap, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }

const QUICK_PROMPTS = [
  { label: 'Low stock this week', query: 'Which products will run out of stock this week?' },
  { label: 'Top sellers', query: 'What are my top 5 selling products this month?' },
  { label: 'Restock needed', query: 'Which products should I reorder immediately?' },
  { label: 'Revenue forecast', query: 'Predict next month\'s revenue based on current trends.' },
  { label: 'Slow movers', query: 'Which products have been selling very slowly?' },
  { label: 'Profit analysis', query: 'What is my current inventory profit margin?' },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your GodownMax assistant. I can help you with inventory analysis, demand prediction, restock suggestions, and sales forecasting. What would you like to know?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'forecast' | 'restock' | 'optimize'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;
    const userMsg: Message = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { message: query, history });
      const aiMsg: Message = { role: 'assistant', content: res.data.data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your Gemini API key configuration.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by GPT-4o mini</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: 'chat', label: 'Chat', icon: Sparkles },
          { key: 'forecast', label: 'Forecast', icon: TrendingUp },
          { key: 'restock', label: 'Restock', icon: Package },
          { key: 'optimize', label: 'Optimize', icon: Zap },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Quick prompts */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Queries</h3>
            {QUICK_PROMPTS.map(({ label, query }) => (
              <button key={label} onClick={() => sendMessage(query)} disabled={loading}
                className="w-full text-left px-4 py-3 rounded-xl bg-card border hover:bg-accent hover:border-primary/30 text-sm transition-all group">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-500" />
                  <span className="font-medium">{label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-3 bg-card rounded-2xl border shadow-sm flex flex-col" style={{ height: '60vh' }}>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <Brain className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                  )}
                  <div className={cn('max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm')}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Ask about inventory, sales, forecasts..."
                  className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
                <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && <SalesForecastTab />}
      {activeTab === 'restock' && <RestockTab />}
      {activeTab === 'optimize' && <OptimizeTab />}
    </div>
  );
}

function SalesForecastTab() {
  const [period, setPeriod] = useState('30d');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-forecast', period],
    queryFn: () => api.get('/ai/sales-forecast', { params: { period } }).then(r => r.data.data),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-3 flex items-center justify-between">
        <h3 className="font-semibold">AI Sales Forecast</h3>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-1.5 rounded-lg border bg-background text-sm">
            <option value="7d">Next 7 days</option>
            <option value="30d">Next 30 days</option>
            <option value="90d">Next 90 days</option>
          </select>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg border hover:bg-accent transition"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="lg:col-span-3 py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : data ? (
        <>
          {[
            { label: 'Forecasted Revenue', value: `$${Number(data.forecastedRevenue || 0).toLocaleString()}`, color: 'text-green-600' },
            { label: 'Growth Rate', value: `${data.growthRate || 0}%`, color: 'text-blue-600' },
            { label: 'Confidence Interval', value: data.confidenceInterval || 'N/A', color: 'text-purple-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
            </div>
          ))}
          {data.insights && (
            <div className="lg:col-span-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-sm">AI Insights</span>
              </div>
              <p className="text-sm leading-relaxed">{data.insights}</p>
            </div>
          )}
          {data.seasonalFactors && (
            <div className="lg:col-span-3 bg-card rounded-2xl border p-5">
              <h4 className="font-semibold text-sm mb-3">Seasonal Factors</h4>
              <p className="text-sm text-muted-foreground">{typeof data.seasonalFactors === 'string' ? data.seasonalFactors : JSON.stringify(data.seasonalFactors)}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function RestockTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-restock'],
    queryFn: () => api.get('/ai/restock-suggestions').then(r => r.data.data),
  });

  const priorityColor = (p: string) =>
    p === 'HIGH' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
    p === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
    'text-green-600 bg-green-50 dark:bg-green-900/20';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Restock Suggestions</h3>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg border hover:bg-accent transition"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {isLoading ? (
        <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {data?.suggestions?.map((item: any, i: number) => (
            <div key={i} className="bg-card rounded-xl border p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{item.action}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold">{item.recommendedQty} units</p>
                  <p className="text-xs text-muted-foreground">{item.daysUntilStockout}d until stockout</p>
                </div>
                <span className={cn('px-2 py-1 rounded-lg text-xs font-bold uppercase', priorityColor(item.priority))}>
                  {item.priority}
                </span>
              </div>
            </div>
          ))}
          {data?.summary && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm">{data.summary}</div>
          )}
        </div>
      )}
    </div>
  );
}

function OptimizeTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-optimize'],
    queryFn: () => api.get('/ai/inventory-optimization').then(r => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Inventory Optimization</h3>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg border hover:bg-accent transition"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {isLoading ? (
        <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: '📦 Overstocked Items', items: data.overstocked },
            { title: '⚠️ Understocked Items', items: data.understocked },
            { title: '💤 Dead Stock', items: data.deadStock },
          ].map(({ title, items }) => (
            <div key={title} className="bg-card rounded-2xl border p-5">
              <h4 className="font-semibold mb-3">{title}</h4>
              {items?.length ? (
                <ul className="space-y-2">
                  {items.slice(0, 5).map((item: any, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{typeof item === 'string' ? item : (item.name || JSON.stringify(item))}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">None identified</p>}
            </div>
          ))}
          <div className="bg-card rounded-2xl border p-5">
            <h4 className="font-semibold mb-1">Potential Savings</h4>
            <p className="text-3xl font-bold text-green-600">${Number(data.totalPotentialSavings || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">By optimizing overstock levels</p>
          </div>
          {data.recommendations && (
            <div className="md:col-span-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-sm">AI Recommendations</span>
              </div>
              <div className="text-sm space-y-2">
                {Array.isArray(data.recommendations) ? data.recommendations.map((r: string, i: number) => (
                  <p key={i} className="text-muted-foreground">• {r}</p>
                )) : <p className="text-muted-foreground">{data.recommendations}</p>}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
