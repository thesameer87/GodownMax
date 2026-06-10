'use client';

import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colorMap;
  trend?: number;
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, color, trend, description }: StatsCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {typeof trend === 'number' && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend).toFixed(1)}% vs last period
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
