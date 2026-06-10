'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Truck, X, Loader2, Star } from 'lucide-react';

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem ? api.put(`/suppliers/${editItem.id}`, data) : api.post('/suppliers', data),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal(false); setForm({}); setEditItem(null); },
  });

  const inputClass = "w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const fields = [
    { key: 'name', label: 'Company Name *', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'gstin', label: 'GSTIN', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Suppliers</h1><p className="text-sm text-muted-foreground">{suppliers?.length || 0} suppliers</p></div>
        <button onClick={() => { setEditItem(null); setForm({}); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers?.map((s: any) => (
          <div key={s.id} className="bg-card rounded-2xl border p-5 hover:shadow-md transition group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <button onClick={() => { setEditItem(s); setForm(s); setModal(true); }}
                className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition">
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <h3 className="font-semibold">{s.name}</h3>
            {s.email && <p className="text-sm text-muted-foreground mt-1">{s.email}</p>}
            {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-sm font-medium">{s.rating || 'N/A'}</span>
              </div>
              <div className="text-xs text-muted-foreground">{s._count?.products || 0} products</div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editItem ? 'Edit' : 'New'} Supplier</h2>
              <button onClick={() => setModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {fields.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1.5">{label}</label>
                  <input type={type} className={inputClass} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea className={inputClass} rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editItem ? 'Update' : 'Create'} Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
