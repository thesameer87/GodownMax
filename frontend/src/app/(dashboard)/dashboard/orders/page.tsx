'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Package, Plus, Trash2, ExternalLink, Calendar, Search, Filter, Truck, FileText, ChevronRight, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  RETURNED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [orderType, setOrderType] = useState<'PURCHASE' | 'SALES'>('SALES');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form, setForm] = useState<any>({ items: [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 }] });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', type, status, page],
    queryFn: () => api.get('/orders', { params: { type, status, page, limit: 20 } }).then(r => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-simple'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/orders', data),
    onSuccess: () => { toast.success('Order created!'); qc.invalidateQueries({ queryKey: ['orders'] }); setCreateModal(false); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['orders'] }); },
  });

  const addItem = () => setForm((f: any) => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: 0, taxRate: 0 }] }));
  const removeItem = (i: number) => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, idx: number) => idx !== i) }));
  const updateItem = (i: number, field: string, val: any) => setForm((f: any) => ({
    ...f, items: f.items.map((item: any, idx: number) => idx === i ? { ...item, [field]: val } : item)
  }));

  const inputClass = "px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-full";
  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{pagination?.total || 0} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setOrderType('PURCHASE'); setCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-card border rounded-xl text-sm hover:bg-accent transition">
            <Truck className="w-4 h-4" /> Purchase Order
          </button>
          <button onClick={() => { setOrderType('SALES'); setCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Sales Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border p-4 flex gap-3 flex-wrap">
        <select value={type} onChange={e => setType(e.target.value)} className={cn(inputClass, 'w-auto')}>
          <option value="">All Types</option>
          <option value="SALES">Sales</option>
          <option value="PURCHASE">Purchase</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={cn(inputClass, 'w-auto')}>
          <option value="">All Statuses</option>
          {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Party</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      order.type === 'SALES' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30')}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.customer?.name || order.supplier?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreateModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">Create {orderType === 'SALES' ? 'Sales' : 'Purchase'} Order</h2>
              <button onClick={() => setCreateModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              {orderType === 'SALES' ? (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Customer</label>
                  <select className={inputClass} value={form.customerId || ''} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Supplier</label>
                  <select className={inputClass} value={form.supplierId || ''} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">Select supplier</option>
                    {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Order Items</label>
                  <button onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <select className={inputClass} value={item.productId} onChange={e => {
                          const prod = products?.find((p: any) => p.id === e.target.value);
                          updateItem(i, 'productId', e.target.value);
                          if (prod) updateItem(i, 'unitPrice', prod.sellingPrice);
                        }}>
                          <option value="">Product</option>
                          {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <input type="number" min="1" className={cn(inputClass, 'w-20')} placeholder="Qty"
                        value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                      <input type="number" step="0.01" className={cn(inputClass, 'w-24')} placeholder="Price"
                        value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="p-2 hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Discount (₹)</label>
                  <input type="number" min="0" step="0.01" className={inputClass} value={form.discount || ''}
                    onChange={e => setForm({ ...form, discount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Due Date</label>
                  <input type="date" className={inputClass} value={form.dueDate || ''}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea className={inputClass} rows={2} value={form.notes || ''}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(form.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(form.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0) - (form.discount || 0))}</span>
                </div>
              </div>

              <button onClick={() => createMutation.mutate({ ...form, type: orderType })}
                disabled={createMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-muted-foreground">{format(new Date(selectedOrder.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[selectedOrder.status])}>
                  {selectedOrder.status}
                </span>
                <select className="px-3 py-1.5 rounded-lg border text-sm bg-background"
                  value={selectedOrder.status}
                  onChange={e => { updateStatusMutation.mutate({ id: selectedOrder.id, status: e.target.value }); setSelectedOrder({ ...selectedOrder, status: e.target.value }); }}>
                  {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(selectedOrder.taxAmount || 0)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount || 0)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(selectedOrder.total || 0)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
