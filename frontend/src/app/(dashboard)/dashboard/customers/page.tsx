'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, UserCheck, X, Loader2, ShoppingBag } from 'lucide-react';

export default function CustomersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editItem ? api.put(`/customers/${editItem.id}`, data) : api.post('/customers', data),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['customers'] });
      setModal(false);
      setForm({});
      setEditItem(null);
    },
  });

  const inputClass =
    'w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

  const fields = [
    { key: 'name', label: 'Customer Name *', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'gstin', label: 'GSTIN', type: 'text' },
    { key: 'creditLimit', label: 'Credit Limit (₹)', type: 'number' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers?.length || 0} customers</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setForm({}); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">City</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credit Limit</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers?.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-sm font-semibold text-green-600">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹{(c.creditLimit || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      {c._count?.orders || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditItem(c); setForm(c); setModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers?.length && (
            <div className="py-16 text-center">
              <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No customers yet</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editItem ? 'Edit' : 'New'} Customer</h2>
              <button onClick={() => setModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {fields.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1.5">{label}</label>
                  <input
                    type={type}
                    className={inputClass}
                    value={form[key] || ''}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.notes || ''}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editItem ? 'Update' : 'Create'} Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
