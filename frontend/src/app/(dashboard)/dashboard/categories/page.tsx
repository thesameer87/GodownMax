'use client';

// Categories Page
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag, X, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', icon: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem ? api.put(`/categories/${editItem.id}`, data) : api.post('/categories', data),
    onSuccess: () => { toast.success(editItem ? 'Category updated' : 'Category created'); qc.invalidateQueries({ queryKey: ['categories'] }); setModal(false); setEditItem(null); setForm({ name: '', description: '', color: '#3B82F6', icon: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['categories'] }); },
  });

  const inputClass = "w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-sm text-muted-foreground mt-1">{categories?.length || 0} categories</p></div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '', color: '#3B82F6', icon: '' }); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat: any) => (
          <div key={cat.id} className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                  {cat.icon || <Tag className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat._count?.products || 0} products</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditItem(cat); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#3B82F6', icon: cat.icon || '' }); setModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-accent transition"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(cat.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
              </div>
            </div>
            {cat.description && <p className="text-sm text-muted-foreground mt-3">{cat.description}</p>}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editItem ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium block mb-1.5">Name *</label><input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1.5">Description</label><textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1.5">Icon (emoji)</label><input className={inputClass} value={form.icon} placeholder="📦" onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1.5">Color</label><input type="color" className="w-full h-10 rounded-xl border cursor-pointer" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editItem ? 'Update' : 'Create'} Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
