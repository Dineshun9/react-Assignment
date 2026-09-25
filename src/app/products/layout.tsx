'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProductStoreProvider } from '@/contexts/ProductStoreContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
      </div>
    );
  }

  if (!user) {
    return null; // The AuthContext handles the redirect
  }

  return (
    <ProductStoreProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={user.image} 
                  alt={user.username} 
                  className="h-8 w-8 rounded-full bg-gray-200"
                />
                <span className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProductStoreProvider>
  );
}
