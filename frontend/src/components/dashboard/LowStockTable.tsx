'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LowStockTableProps {
  products: any[];
}

export function LowStockTable({ products }: LowStockTableProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Low Stock Alerts</h3>
          <p className="text-sm text-muted-foreground">{products.length} products need attention</p>
        </div>
        <Link href="/dashboard/inventory" className="text-xs text-primary hover:underline">View all</Link>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">All products have sufficient stock</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const pct = Math.min(100, (p.totalStock / p.reorderPoint) * 100);
            const color = pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <span className={cn('text-xs font-bold', pct < 30 ? 'text-red-500' : 'text-yellow-600')}>
                      {p.totalStock} left
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Reorder at {p.reorderPoint} units</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
