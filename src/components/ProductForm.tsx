'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, productService } from '@/services/product';
import { useProductStore } from '@/contexts/ProductStoreContext';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const { addProductToStore, editProductInStore } = useProductStore();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || '',
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    rating: initialData?.rating || 0,
    description: initialData?.description || '',
    thumbnail: initialData?.thumbnail || 'https://dummyjson.com/image/150',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        // Edit flow
        const updated = await productService.updateProduct(initialData.id.toString(), formData);
        // Apply optimistic local update (in case API doesn't persist)
        editProductInStore(initialData.id.toString(), { ...initialData, ...updated, ...formData });
        router.push(`/products/${initialData.id}`);
      } else {
        // Add flow
        const payload = { ...formData, images: [formData.thumbnail] };
        const added = await productService.addProduct(payload);
        // Apply optimistic local update
        addProductToStore({ ...payload, ...added, id: added.id || Date.now() });
        router.push('/products');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
          {isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
