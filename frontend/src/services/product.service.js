import api from './api';

const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    // return full wrapper so callers can access pagination metadata (page, totalPages, total, pageSize)
    return response.data;
  },

  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data.data;
  },

  updateProduct: async (id, updates) => {
    const response = await api.put(`/products/${id}`, updates);
    return response.data.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  adjustStock: async (id, stockAdded) => {
    const response = await api.put(`/products/${id}/stock`, { stockAdded });
    return response.data.data;
  },
};

export default productService;
