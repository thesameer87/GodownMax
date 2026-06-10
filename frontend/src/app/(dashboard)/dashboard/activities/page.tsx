'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-600 dark:text-green-400',
  UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
  LOGIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  BULK_IMPORT: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  CREATE_ORDER: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  REGISTER: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page],
    queryFn: () => api.get('/activities', { params: { page, limit: 50 } }).then(r => r.data),
  });

  const logs = (data?.data || []).filter((l: any) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = data?.pagination;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete audit trail of all system actions
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-2xl border p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, entities, users..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Log table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 skeleton rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/2" />
                  <div className="h-3 skeleton rounded w-1/3" />
                </div>
                <div className="h-4 skeleton rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {log.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{log.user?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{log.user?.role?.toLowerCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      )}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium capitalize">{log.entity.toLowerCase()}</p>
                      {log.entityId && (
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {log.entityId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="py-16 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No activity records found</p>
              </div>
            )}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
