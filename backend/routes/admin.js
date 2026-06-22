const express = require('express');
const {
  getDashboardStats,
  getCommissionList,
  getCommissionById,
  approveCommission,
  rejectCommission,
  // new: mark single commission as paid (admin records external transfer)
  markCommissionPaid,
  scheduleCommission,
  createPaymentBatch,
  getPaymentBatch,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  approveAffiliate,
  rejectAffiliate,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getAllPaymentBatches,
  completePaymentBatch,
  getAnalytics,
  getSalesHistory,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/sales-history', getSalesHistory);

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/approve-affiliate', approveAffiliate);
router.put('/users/:id/reject-affiliate', rejectAffiliate);
router.delete('/users/:id', deleteUser);

router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/commissions', getCommissionList);
router.get('/commissions/:id', getCommissionById);
router.put('/commissions/:id/approve', approveCommission);
router.put('/commissions/:id/reject', rejectCommission);
// Admin records external transfer -> mark commission as paid in system
router.put('/commissions/:id/paid', markCommissionPaid);
// Schedule single commission for payment
router.put('/commissions/:id/schedule', scheduleCommission);

router.post('/payment-batches', createPaymentBatch);
router.get('/payment-batches', getAllPaymentBatches);
router.get('/payment-batches/:id', getPaymentBatch);
router.put('/payment-batches/:id/complete', completePaymentBatch);

module.exports = router;
