'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LowStockTable } from '@/components/dashboard/LowStockTable';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import {
  Package, AlertTriangle, XCircle, DollarSign,
  TrendingUp, ShoppingCart, Warehouse
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 w-48 skeleton rounded-lg mb-2" />
          <div className="h-4 w-72 skeleton rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your inventory and sales performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={s?.totalProducts || 0}
          icon={Package}
          color="blue"
          trend={+5}
        />
        <StatsCard
          title="Low Stock Alerts"
          value={s?.lowStockCount || 0}
          icon={AlertTriangle}
          color="yellow"
          description="Need reordering soon"
        />
        <StatsCard
          title="Out of Stock"
          value={s?.outOfStockCount || 0}
          icon={XCircle}
          color="red"
          description="Require immediate action"
        />
        <StatsCard
          title="Inventory Value"
          value={formatCurrency(s?.inventoryValue || 0)}
          icon={DollarSign}
          color="green"
          description={`Retail: ${formatCurrency(s?.retailValue || 0)}`}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(s?.revenue?.current || 0)}
          icon={TrendingUp}
          color="purple"
          trend={s?.revenue?.growth}
          description="vs last month"
        />
        <StatsCard
          title="Orders This Month"
          value={s?.orders?.total || 0}
          icon={ShoppingCart}
          color="blue"
          description={`${s?.orders?.pending || 0} pending`}
        />
        <StatsCard
          title="Potential Profit"
          value={formatCurrency(s?.potentialProfit || 0)}
          icon={Warehouse}
          color="green"
          description="Retail - Cost value"
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={data?.salesGraph || []} />
        </div>
        <AIInsightsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockTable products={data?.lowStockProducts || []} />
        <RecentActivity activities={data?.recentActivities || []} />
      </div>
    </div>
  );
}
