const express = require('express');
const {
  register,
  login,
  logout,
  applyAffiliate,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/apply-affiliate', protect, applyAffiliate);

module.exports = router;
