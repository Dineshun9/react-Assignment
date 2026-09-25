'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/services/product';

interface ProductStoreContextType {
  addedProducts: Product[];
  editedProducts: Record<string, Product>;
  deletedProductIds: string[];
  addProductToStore: (product: Product) => void;
  editProductInStore: (id: string, product: Product) => void;
  deleteProductFromStore: (id: string) => void;
  applyLocalMutations: (products: Product[]) => Product[];
  applyLocalMutationToSingle: (product: Product) => Product | null;
}

const ProductStoreContext = createContext<ProductStoreContextType | undefined>(undefined);

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [addedProducts, setAddedProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<Record<string, Product>>({});
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);

  const addProductToStore = (product: Product) => {
    // Generate a pseudo-ID for newly added products if API didn't provide a unique one
    const newProduct = { ...product, id: product.id || Date.now() };
    setAddedProducts((prev) => [newProduct, ...prev]);
  };

  const editProductInStore = (id: string, product: Product) => {
    setEditedProducts((prev) => ({ ...prev, [id]: product }));
  };

  const deleteProductFromStore = (id: string) => {
    setDeletedProductIds((prev) => [...prev, id.toString()]);
  };

  // Applies mutations to a list of products (for the dashboard)
  const applyLocalMutations = (products: Product[]) => {
    let result = [...addedProducts, ...products];
    
    // Apply edits
    result = result.map(p => {
      if (editedProducts[p.id.toString()]) {
        return { ...p, ...editedProducts[p.id.toString()] };
      }
      return p;
    });

    // Apply deletions
    result = result.filter(p => !deletedProductIds.includes(p.id.toString()));

    // Deduplicate by ID just in case
    const uniqueMap = new Map();
    result.forEach(p => uniqueMap.set(p.id, p));
    
    return Array.from(uniqueMap.values());
  };

  // Applies mutations to a single product (for details page)
  const applyLocalMutationToSingle = (product: Product): Product | null => {
    if (deletedProductIds.includes(product.id.toString())) {
      return null;
    }
    if (editedProducts[product.id.toString()]) {
      return { ...product, ...editedProducts[product.id.toString()] };
    }
    return product;
  };

  return (
    <ProductStoreContext.Provider
      value={{
        addedProducts,
        editedProducts,
        deletedProductIds,
        addProductToStore,
        editProductInStore,
        deleteProductFromStore,
        applyLocalMutations,
        applyLocalMutationToSingle,
      }}
    >
      {children}
    </ProductStoreContext.Provider>
  );
}

export function useProductStore() {
  const context = useContext(ProductStoreContext);
  if (context === undefined) {
    throw new Error('useProductStore must be used within a ProductStoreProvider');
  }
  return context;
}
