'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, Calendar, ArrowUpRight, ArrowDownRight, Printer, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: salesData } = useQuery({
    queryKey: ['reports-sales', from, to],
    queryFn: () => api.get('/reports/sales', { params: { from, to } }).then(r => r.data.data),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => api.get('/reports/inventory').then(r => r.data.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: () => api.get('/dashboard/revenue', { params: { period: '30d' } }).then(r => r.data.data),
  });

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    let data: any[] = [];
    let filename = '';

    if (activeTab === 'sales' && salesData) {
      data = salesData.map((o: any) => ({
        'Order #': o.orderNumber,
        Customer: o.customer?.name || '',
        Total: o.total,
        Status: o.status,
        Date: format(new Date(o.createdAt), 'yyyy-MM-dd'),
      }));
      filename = 'sales-report.xlsx';
    } else if (activeTab === 'inventory' && inventoryData) {
      data = inventoryData.map((i: any) => ({
        Product: i.product?.name,
        SKU: i.product?.sku,
        Warehouse: i.warehouse?.name,
        Quantity: i.quantity,
        Available: i.availableQty,
        Reserved: i.reservedQty,
      }));
      filename = 'inventory-report.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('GodownMax - Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 32);
    doc.text(`Period: ${from} to ${to}`, 14, 40);

    if (activeTab === 'sales' && salesData) {
      autoTable(doc, {
        startY: 50,
        head: [['Order #', 'Customer', 'Total', 'Status', 'Date']],
        body: salesData.map((o: any) => [
          o.orderNumber, o.customer?.name || '—', formatCurrency(o.total), o.status,
          format(new Date(o.createdAt), 'yyyy-MM-dd')
        ]),
        styles: { fontSize: 8 },
      });
    }

    doc.save(`${activeTab}-report-${from}.pdf`);
  };

  // Process revenue chart data
  const revenueChart = revenueData?.byDate
    ? Object.entries(revenueData.byDate).slice(-14).map(([date, d]: any) => ({
        date: format(new Date(date), 'MMM d'),
        revenue: d.revenue,
        profit: d.profit,
      }))
    : [];

  // Category distribution from inventory
  const categoryDist = inventoryData
    ? Object.values(
        inventoryData.reduce((acc: any, item: any) => {
          const cat = item.product?.category?.name || 'Uncategorized';
          acc[cat] = acc[cat] || { name: cat, value: 0 };
          acc[cat].value += item.quantity;
          return acc;
        }, {})
      )
    : [];

  const totalRevenue = salesData?.reduce((s: number, o: any) => s + o.total, 0) || 0;
  const totalOrders = salesData?.length || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Data-driven insights for your business</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-card border rounded-xl text-sm hover:bg-accent transition">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-card rounded-2xl border p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm focus:outline-none" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-600' },
          { label: 'Total Orders', value: totalOrders.toString(), icon: Package, color: 'text-blue-600' },
          { label: 'Avg Order Value', value: formatCurrency(totalOrders ? (totalRevenue / totalOrders) : 0), icon: Package, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
              <Icon className={cn('w-8 h-8 opacity-20', color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[{ key: 'sales', label: 'Sales Report' }, { key: 'inventory', label: 'Inventory Report' }].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Daily Revenue & Profit</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Recent Orders</h3>
            <div className="overflow-y-auto max-h-56 space-y-2">
              {salesData?.slice(0, 10).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium font-mono text-xs">{o.orderNumber}</p>
                    <p className="text-muted-foreground">{o.customer?.name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(o.total)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(o.createdAt), 'MMM d')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Stock by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Inventory Levels</h3>
            <div className="overflow-y-auto max-h-56 space-y-2">
              {inventoryData?.slice(0, 15).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.warehouse?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">Available: {item.availableQty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
