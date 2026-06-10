'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Download, Upload, QrCode,
  Edit2, Trash2, AlertTriangle, Package, MoreHorizontal
} from 'lucide-react';
import { ProductModal } from '@/components/products/ProductModal';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import { cn, formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filter, setFilter] = useState(''); // 'lowStock' | 'outOfStock'
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, categoryId, filter, page],
    queryFn: () => api.get('/products', {
      params: { search, categoryId, page, limit: 20, lowStock: filter === 'lowStock', outOfStock: filter === 'outOfStock' }
    }).then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); },
  });

  const handleExport = async () => {
    const res = await api.get('/products/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'products.xlsx'; a.click();
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('file', file);
    try {
      const res = await api.post('/products/bulk-import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { created, errors } = res.data.data;
      toast.success(`Imported ${created} products${errors.length ? `, ${errors.length} errors` : ''}`);
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch { toast.error('Import failed'); }
  };

  const handleQR = async (id: string) => {
    const res = await api.get(`/products/${id}/qr`);
    const link = document.createElement('a');
    link.href = res.data.data.qrCode;
    link.download = `product-qr-${id}.png`;
    link.click();
  };

  const products = data?.data || [];
  const pagination = data?.pagination;

  const stockBadge = (product: any) => {
    const stock = product.totalStock ?? 0;
    if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">Out of Stock</span>;
    if (stock <= product.reorderPoint) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">Low Stock</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">In Stock</span>;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination?.total || 0} total products
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-card hover:bg-accent cursor-pointer text-sm transition">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleBulkImport} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-card hover:bg-accent text-sm transition">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setEditProduct(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU, barcode..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none">
          <option value="">All Categories</option>
          {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none">
          <option value="">All Stock Levels</option>
          <option value="lowStock">Low Stock</option>
          <option value="outOfStock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} />
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.tags?.length > 0 && (
                            <p className="text-xs text-muted-foreground">{p.tags.slice(0, 2).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3">
                      {p.category ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: p.category.color + '20', color: p.category.color }}>
                          {p.category.name}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.totalStock ?? 0}</td>
                    <td className="px-4 py-3">{stockBadge(p)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => handleQR(p.id)} title="Generate QR"
                          className="p-1.5 rounded-lg hover:bg-accent transition">
                          <QrCode className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => { setEditProduct(p); setModalOpen(true); }} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-accent transition">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => {
                          if (confirm('Delete this product?')) deleteMutation.mutate(p.id);
                        }} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition">Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition">Next</button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        product={editProduct}
        categories={categories || []}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['products'] })}
      />
    </div>
  );
}
