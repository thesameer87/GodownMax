'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Warehouse, ArrowRightLeft, TrendingUp, TrendingDown, Plus, X, Loader2 } from 'lucide-react';
import { SkeletonTable } from '@/components/shared/SkeletonCard';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState('');
  const [adjustModal, setAdjustModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', warehouseId],
    queryFn: () => api.get('/inventory', { params: { warehouseId, limit: 50 } }).then(r => r.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(r => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-simple'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/adjust', data),
    onSuccess: () => { toast.success('Stock adjusted'); qc.invalidateQueries({ queryKey: ['inventory'] }); setAdjustModal(false); setForm({}); },
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/transfer', data),
    onSuccess: () => { toast.success('Stock transferred'); qc.invalidateQueries({ queryKey: ['inventory'] }); setTransferModal(false); setForm({}); },
  });

  const items = data?.data || [];

  const inputClass = "w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time stock levels across all warehouses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdjustModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-card border rounded-xl text-sm hover:bg-accent transition">
            <Plus className="w-4 h-4" /> Adjust Stock
          </button>
          <button onClick={() => setTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition">
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
        </div>
      </div>

      {/* Warehouse filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setWarehouseId('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${!warehouseId ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent'}`}>
          All Warehouses
        </button>
        {warehouses?.map((w: any) => (
          <button key={w.id} onClick={() => setWarehouseId(w.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${warehouseId === w.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent'}`}>
            {w.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? <SkeletonTable rows={8} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Warehouse</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Reserved</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Available</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => {
                  const pct = item.product?.reorderPoint ? (item.quantity / item.product.reorderPoint) * 100 : 100;
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.product?.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.warehouse?.name}</td>
                      <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.reservedQty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{item.availableQty}</td>
                      <td className="px-4 py-3">
                        {item.quantity === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 font-medium">Out of Stock</span>
                        ) : pct <= 50 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 font-medium">Low Stock</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 font-medium">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="py-16 text-center">
                <Warehouse className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No inventory records found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAdjustModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Adjust Stock</h2>
              <button onClick={() => setAdjustModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Product</label>
                <select className={inputClass} value={form.productId || ''} onChange={e => setForm({ ...form, productId: e.target.value })}>
                  <option value="">Select product</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Warehouse</label>
                <select className={inputClass} value={form.warehouseId || ''} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
                  <option value="">Select warehouse</option>
                  {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Type</label>
                <select className={inputClass} value={form.type || 'IN'} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Quantity</label>
                <input type="number" min="1" className={inputClass} value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea className={inputClass} rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button onClick={() => adjustMutation.mutate(form)} disabled={adjustMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {adjustMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransferModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Transfer Stock</h2>
              <button onClick={() => setTransferModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Product</label>
                <select className={inputClass} value={form.productId || ''} onChange={e => setForm({ ...form, productId: e.target.value })}>
                  <option value="">Select product</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">From Warehouse</label>
                <select className={inputClass} value={form.fromWarehouseId || ''} onChange={e => setForm({ ...form, fromWarehouseId: e.target.value })}>
                  <option value="">Select source</option>
                  {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">To Warehouse</label>
                <select className={inputClass} value={form.toWarehouseId || ''} onChange={e => setForm({ ...form, toWarehouseId: e.target.value })}>
                  <option value="">Select destination</option>
                  {warehouses?.filter((w: any) => w.id !== form.fromWarehouseId).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Quantity</label>
                <input type="number" min="1" className={inputClass} value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea className={inputClass} rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button onClick={() => transferMutation.mutate(form)} disabled={transferMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {transferMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Transfer Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
