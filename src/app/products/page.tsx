'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { productService, Product, ProductsResponse } from '@/services/product';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductStore } from '@/contexts/ProductStoreContext';
import Link from 'next/link';

// We wrap the main content in a component to use `useSearchParams` within a Suspense boundary 
// which is required by Next.js for client components using searchParams.
function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract values from URL with fallbacks
  const urlPage = parseInt(searchParams.get('page') || '1');
  const page = isNaN(urlPage) || urlPage < 1 ? 1 : urlPage;
  const urlLimit = parseInt(searchParams.get('limit') || '10');
  const limit = [10, 20, 50].includes(urlLimit) ? urlLimit : 10;
  
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc';

  // Local state for immediate input feedback (search)
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Data fetching state
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Update URL function
  const updateURL = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach(key => {
      if (newParams[key] === null || newParams[key] === '') {
        params.delete(key);
      } else {
        params.set(key, newParams[key] as string);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync debounced search to URL and reset page
  useEffect(() => {
    if (debouncedSearch !== search) {
      updateURL({ q: debouncedSearch, page: '1', category: null }); // Clear category when searching
    }
  }, [debouncedSearch, search]);

  // Fetch Categories once
  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch Products when URL params change
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchProducts = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const skip = (page - 1) * limit;
        const result = await productService.getProducts({
          limit,
          skip,
          search,
          category,
          sortBy,
          order
        }, abortController.signal);
        
        if (isMounted) {
          setData(result);
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'CanceledError' || error.message === 'canceled') {
          // Ignore canceled requests
          return;
        }
        if (isMounted) {
          setError('Failed to fetch products. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();
    
    return () => { 
      isMounted = false; 
      abortController.abort();
    };
  }, [page, limit, search, category, sortBy, order]);

  // Use the global store to override data with optimistic updates
  const { applyLocalMutations } = useProductStore();
  
  // Calculate final products array for display
  const displayProducts = data ? applyLocalMutations(data.products) : [];
  // Approximate total adjusting for local deletions/additions
  const displayTotal = data ? data.total + (displayProducts.length - data.products.length) : 0;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    // Clear search when filtering by category
    setSearchInput('');
    updateURL({ category: newCategory, page: '1', q: null });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      updateURL({ sortBy: null, order: null });
    } else {
      const [newSortBy, newOrder] = value.split('-');
      updateURL({ sortBy: newSortBy, order: newOrder });
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateURL({ limit: e.target.value, page: '1' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <Link 
          href="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          
          <select
            value={category}
            onChange={handleCategoryChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.replace('-', ' ')}</option>
            ))}
          </select>

          <select
            value={sortBy ? `${sortBy}-${order}` : ''}
            onChange={handleSortChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 md:w-48"
          >
            <option value="">Default Sort</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="title-asc">Title (A-Z)</option>
          </select>
        </div>
        
        {search && category && (
           <p className="text-sm text-yellow-600">Note: The API does not support simultaneous search and category filtering. Category filter was cleared.</p>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-lg text-center border border-red-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => updateURL({})}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center p-12">
          <span className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></span>
        </div>
      ) : !data || displayProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-lg text-center shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
          <button 
            onClick={() => { setSearchInput(''); updateURL({ q: null, category: null, page: '1' }); }}
            className="text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table view (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <img className="h-10 w-10 object-contain" src={product.thumbnail} alt="" />
                        </div>
                        <div className="ml-4 max-w-[200px] truncate">
                          <div className="text-sm font-medium text-gray-900 truncate" title={product.title}>{product.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ⭐ {product.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/products/${product.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card view (hidden on desktop) */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {displayProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
                <div className="flex items-start space-x-4">
                  <img src={product.thumbnail} alt={product.title} className="w-20 h-20 object-contain bg-gray-50 rounded" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">⭐ {product.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                  <Link href={`/products/${product.id}`} className="text-sm text-blue-600 font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => updateURL({ page: (page - 1).toString() })}
                disabled={page <= 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => updateURL({ page: (page + 1).toString() })}
                disabled={page * limit >= displayTotal}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + (displayProducts.length > 0 ? 1 : 0)}</span> to <span className="font-medium">{Math.min(page * limit, displayTotal)}</span> of{' '}
                  <span className="font-medium">{displayTotal}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="limit" className="text-sm text-gray-600">Per page:</label>
                  <select
                    id="limit"
                    value={limit}
                    onChange={handleLimitChange}
                    className="border-gray-300 rounded-md text-sm text-gray-900 py-1 pl-2 pr-6 border"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => updateURL({ page: (page - 1).toString() })}
                    disabled={page <= 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <span>&larr; Prev</span>
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                    {page}
                  </span>
                  
                  <button
                    onClick={() => updateURL({ page: (page + 1).toString() })}
                    disabled={page * limit >= displayTotal}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <span>Next &rarr;</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Dashboard...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
