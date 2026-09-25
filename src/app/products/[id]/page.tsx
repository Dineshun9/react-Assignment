'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { productService, Product } from '@/services/product';
import { useProductStore } from '@/contexts/ProductStoreContext';
import Link from 'next/link';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { applyLocalMutationToSingle, deleteProductFromStore } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // If it's a newly added product, it won't exist on API, but we can check store later.
    // For simplicity, we just try to fetch, if fail and it's local, we could catch it.
    // Here we assume mostly it's fetched. (Ideally we'd check store first).
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getProduct(unwrappedParams.id);
        if (isMounted) {
          const mutated = applyLocalMutationToSingle(data);
          setProduct(mutated);
          if (!mutated) {
            setError('Product not found (or was deleted).');
          }
        }
      } catch (err) {
        if (isMounted) {
          // If 404, say not found. 
          setError('Product not found.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [unwrappedParams.id, applyLocalMutationToSingle]);

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      // In a real app we'd await API delete, DummyJSON might just return ok
      await productService.deleteProduct(product.id.toString());
      deleteProductFromStore(product.id.toString());
      router.push('/products');
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span></div>;
  }

  if (error || !product) {
    return (
      <div className="bg-white p-12 rounded-lg text-center shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/products" className="text-blue-600 hover:underline">
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/products" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Products
        </Link>
        <div className="space-x-3">
          <Link 
            href={`/products/${product.id}/edit`}
            className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Edit
          </Link>
          <button 
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-50 p-6 flex flex-col items-center justify-center border-r border-gray-200">
            <img src={product.thumbnail} alt={product.title} className="max-w-full h-auto object-contain max-h-64" />
          </div>
          <div className="md:w-2/3 p-8">
            <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold mb-1">
              {product.category}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500 flex items-center">
                ⭐ <span className="ml-1 font-medium">{product.rating}</span>
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Stock: {product.stock}
              </span>
            </div>
            
            <div className="prose prose-sm text-gray-600 mb-8">
              <p>{product.description}</p>
            </div>

            {/* Displaying additional images if available */}
            {product.images && product.images.length > 1 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gallery</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {product.images.map((img, i) => (
                    <img key={i} src={img} alt={`Gallery ${i}`} className="w-24 h-24 object-contain bg-gray-50 border border-gray-200 rounded" />
                  ))}
                </div>
              </div>
            )}
            {/* Displaying Reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {product.reviews.map((review: { reviewerName: string, rating: number, comment: string, date: string }, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{review.reviewerName}</span>
                        <span className="text-sm text-yellow-500">
                          {Array.from({ length: review.rating }).map((_, j) => '⭐').join('')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete &quot;{product.title}&quot;? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
