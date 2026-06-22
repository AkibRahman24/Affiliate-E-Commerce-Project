import api from './api';

const orderService = {
  checkout: async (payload) => {
    const response = await api.post('/orders/checkout', payload);
    return response.data;
  },

  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
};

export default orderService;
