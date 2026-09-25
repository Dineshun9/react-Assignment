import axiosInstance from '@/lib/axios';

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetProductsParams {
  limit?: number;
  skip?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const productService = {
  getProducts: async (params: GetProductsParams, signal?: AbortSignal): Promise<ProductsResponse> => {
    let url = '/products';
    
    // The API cannot search and filter by category at the same time.
    // If search is provided, we use the search endpoint.
    // If category is provided (and no search), we use the category endpoint.
    if (params.search) {
      url = '/products/search';
    } else if (params.category) {
      url = `/products/category/${params.category}`;
    }

    const queryParams: Record<string, string | number> = {
      limit: params.limit || 10,
      skip: params.skip || 0,
      // Pass the delay param to test race conditions
      delay: 0,
    };

    if (params.search) {
      queryParams.q = params.search;
    }

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
      queryParams.order = params.order || 'asc';
    }

    const response = await axiosInstance.get(url, { params: queryParams, signal });
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    // The DummyJSON API returns categories as an array of objects or strings depending on the endpoint.
    // Let's use the category list endpoint and map it to strings.
    const response = await axiosInstance.get('/products/categories');
    return response.data.map((c: { slug: string } | string) => typeof c === 'string' ? c : c.slug);
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  addProduct: async (data: Omit<Product, 'id'>): Promise<Product> => {
    const response = await axiosInstance.post('/products/add', data);
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await axiosInstance.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<{ id: number, isDeleted: boolean, deletedOn: string }> => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },
};
