'use client';

import React, { useEffect, useState, use } from 'react';
import ProductForm from '@/components/ProductForm';
import { productService, Product } from '@/services/product';
import { useProductStore } from '@/contexts/ProductStoreContext';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { applyLocalMutationToSingle } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchProduct = async () => {
      try {
        const data = await productService.getProduct(unwrappedParams.id);
        if (isMounted) {
          const mutated = applyLocalMutationToSingle(data);
          setProduct(mutated);
          if (!mutated) {
            setError('Product not found (or was deleted).');
          }
        }
      } catch {
        if (isMounted) setError('Product not found.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [unwrappedParams.id, applyLocalMutationToSingle]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span></div>;
  }

  if (error || !product) {
    return (
      <div className="bg-white p-12 rounded-lg text-center shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Not Found</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/products" className="text-blue-600 hover:underline">
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/products/${product.id}`} className="text-blue-600 hover:underline text-sm font-medium">
        &larr; Back to Details
      </Link>
      <ProductForm initialData={product} isEdit />
    </div>
  );
}
