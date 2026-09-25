import React from 'react';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Link href="/products" className="text-blue-600 hover:underline text-sm font-medium">
        &larr; Back to Products
      </Link>
      <ProductForm />
    </div>
  );
}
