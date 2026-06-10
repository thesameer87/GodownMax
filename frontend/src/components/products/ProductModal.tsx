'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2, Package } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  hsnCode: z.string().optional(),
  unit: z.string().default('pcs'),
  minStockLevel: z.coerce.number().min(0).default(10),
  maxStockLevel: z.coerce.number().min(0).default(1000),
  reorderPoint: z.coerce.number().min(0).default(20),
  reorderQuantity: z.coerce.number().min(0).default(50),
  description: z.string().optional(),
  tags: z.string().optional(),
  warehouseId: z.string().optional(),
  initialStock: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: any;
  categories: any[];
  onSuccess: () => void;
}

export function ProductModal({ open, onClose, product, categories, onSuccess }: ProductModalProps) {
  const isEdit = !!product;

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
    enabled: open,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(r => r.data.data),
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'pcs', taxRate: 0, minStockLevel: 10, reorderPoint: 20 },
  });

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        tags: product.tags?.join(', '),
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
      });
    } else {
      reset({ unit: 'pcs', taxRate: 0, minStockLevel: 10, reorderPoint: 20 });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.put(`/products/${product.id}`, data) : api.post('/products', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      onSuccess();
      onClose();
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    mutation.mutate(payload);
  };

  if (!open) return null;

  const inputClass = "w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";
  const labelClass = "block text-sm font-medium mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Product Name *</label>
              <input {...register('name')} className={inputClass} placeholder="Enter product name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>SKU</label>
              <input {...register('sku')} className={inputClass} placeholder="Auto-generated if empty" />
            </div>

            <div>
              <label className={labelClass}>Barcode</label>
              <input {...register('barcode')} className={inputClass} placeholder="EAN/UPC barcode" />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select {...register('categoryId')} className={inputClass}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Supplier</label>
              <select {...register('supplierId')} className={inputClass}>
                <option value="">Select supplier</option>
                {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Cost Price (₹) *</label>
              <input {...register('costPrice')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
            </div>

            <div>
              <label className={labelClass}>Selling Price (₹) *</label>
              <input {...register('sellingPrice')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
            </div>

            <div>
              <label className={labelClass}>GST Rate (%) *</label>
              <input {...register('taxRate')} type="number" step="0.1" className={inputClass} placeholder="18" />
            </div>

            <div>
              <label className={labelClass}>HSN Code</label>
              <input {...register('hsnCode')} type="text" className={inputClass} placeholder="e.g. 8471" />
            </div>

            <div>
              <label className={labelClass}>Unit</label>
              <select {...register('unit')} className={inputClass}>
                {['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'dozen', 'm'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Min Stock Level</label>
              <input {...register('minStockLevel')} type="number" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Reorder Point</label>
              <input {...register('reorderPoint')} type="number" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Max Stock Level</label>
              <input {...register('maxStockLevel')} type="number" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Reorder Quantity</label>
              <input {...register('reorderQuantity')} type="number" className={inputClass} />
            </div>

            {!isEdit && (
              <>
                <div>
                  <label className={labelClass}>Warehouse (for initial stock)</label>
                  <select {...register('warehouseId')} className={inputClass}>
                    <option value="">Select warehouse</option>
                    {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Initial Stock Quantity</label>
                  <input {...register('initialStock')} type="number" min="0" className={inputClass} placeholder="0" />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className={labelClass}>Tags (comma separated)</label>
              <input {...register('tags')} className={inputClass} placeholder="electronics, premium, new" />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea {...register('description')} className={inputClass} rows={3} placeholder="Product description..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent transition">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
