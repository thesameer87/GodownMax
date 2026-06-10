'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Warehouse, X, Loader2, MapPin, Package } from 'lucide-react';

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editItem ? api.put(`/warehouses/${editItem.id}`, data) : api.post('/warehouses', data),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      setModal(false);
      setForm({});
      setEditItem(null);
    },
  });

  const inputClass =
    'w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <p className="text-sm text-muted-foreground">
            {warehouses?.length || 0} locations
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setForm({}); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses?.map((w: any) => (
          <div
            key={w.id}
            className="bg-card rounded-2xl border p-5 hover:shadow-md transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditItem(w); setForm(w); setModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-accent transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold">{w.name}</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{w.code}</p>

            {(w.city || w.country) && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {[w.city, w.country].filter(Boolean).join(', ')}
              </div>
            )}

            <div className="mt-4 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-3.5 h-3.5" />
              {w._count?.inventoryItems || 0} product lines
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                w.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {w.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}

        {!warehouses?.length && (
          <div className="col-span-3 py-16 text-center">
            <Warehouse className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No warehouses configured</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editItem ? 'Edit' : 'New'} Warehouse</h2>
              <button onClick={() => setModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Warehouse Name *' },
                { key: 'code', label: 'Code (e.g. WH-NYC) *' },
                { key: 'address', label: 'Address' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1.5">{label}</label>
                  <input
                    className={inputClass}
                    value={form[key] || ''}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editItem ? 'Update' : 'Create'} Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
