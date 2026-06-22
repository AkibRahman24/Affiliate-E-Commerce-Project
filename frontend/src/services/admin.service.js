import api from './api';

const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  getSalesHistory: async (params = {}) => {
    const res = await api.get('/admin/sales-history', { params });
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getUser: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  approveAffiliate: async (id) => {
    const res = await api.put(`/admin/users/${id}/approve-affiliate`);
    return res.data;
  },

  rejectAffiliate: async (id) => {
    const res = await api.put(`/admin/users/${id}/reject-affiliate`);
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  getOrder: async (id) => {
    const res = await api.get(`/admin/orders/${id}`);
    return res.data;
  },

  updateOrderStatus: async (id, data) => {
    const res = await api.put(`/admin/orders/${id}/status`, data);
    return res.data;
  },

  getCommissions: async (params = {}) => {
    const res = await api.get('/admin/commissions', { params });
    return res.data;
  },

  getCommission: async (id) => {
    const res = await api.get(`/admin/commissions/${id}`);
    return res.data;
  },

  approveCommission: async (id) => {
    const res = await api.put(`/admin/commissions/${id}/approve`);
    return res.data;
  },

  rejectCommission: async (id, reason) => {
    const res = await api.put(`/admin/commissions/${id}/reject`, { reason });
    return res.data;
  },

  getPaymentBatches: async (params = {}) => {
    const res = await api.get('/admin/payment-batches', { params });
    return res.data;
  },

  getPaymentBatch: async (id) => {
    const res = await api.get(`/admin/payment-batches/${id}`);
    return res.data;
  },

  createPaymentBatch: async (data) => {
    const res = await api.post('/admin/payment-batches', data);
    return res.data;
  },

  completePaymentBatch: async (id) => {
    const res = await api.put(`/admin/payment-batches/${id}/complete`);
    return res.data;
  },

  scheduleCommission: async (id) => {
    const res = await api.put(`/admin/commissions/${id}/schedule`);
    return res.data;
  },

  markCommissionPaid: async (id) => {
    const res = await api.put(`/admin/commissions/${id}/paid`);
    return res.data;
  },
};

export default adminService;
