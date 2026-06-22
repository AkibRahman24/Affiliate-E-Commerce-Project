import api from './api';

const affiliateService = {
  // Get affiliate dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/affiliate/dashboard');
    return response.data;
  },

  // Get affiliate commissions
  getCommissions: async (filters = {}) => {
    const response = await api.get('/affiliate/commissions', { params: filters });
    return response.data;
  },

  // Get referral link
  getReferralLink: async (productId) => {
    const params = productId ? { productId } : {};
    const response = await api.get('/affiliate/referral-link', { params });
    return response.data;
  },

  // Get payout history
  getPayoutHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/affiliate/payouts', { params: { page, limit } });
    return response.data;
  },

  // Request payout
  requestPayout: async (amount, payoutMethod) => {
    const response = await api.post('/affiliate/payout-request', { amount, payoutMethod });
    return response.data;
  },

  // Track a referral click
  trackClick: async (affiliateCode, productId) => {
    const response = await api.post('/affiliate/track-click', { affiliateCode, productId });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (dateRange = {}) => {
    const response = await api.get('/affiliate/metrics', { params: dateRange });
    return response.data;
  },
};

export default affiliateService;
