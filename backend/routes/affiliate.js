const express = require('express');
const {
  getDashboardStats,
  getCommissions,
  getReferrals,
  getReferralLink,
  updateProfile,
  getPayoutHistory,
  requestPayout,
  getPerformanceMetrics,
  trackClick,
} = require('../controllers/affiliateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route — no auth required
router.post('/track-click', trackClick);

router.use(protect, authorize('affiliate'));

router.get('/dashboard', getDashboardStats);
router.get('/commissions', getCommissions);
router.get('/referrals', getReferrals);
router.get('/referral-link', getReferralLink);
router.put('/profile', updateProfile);
router.get('/payouts', getPayoutHistory);
router.post('/payout-request', requestPayout);
router.get('/metrics', getPerformanceMetrics);

module.exports = router;
