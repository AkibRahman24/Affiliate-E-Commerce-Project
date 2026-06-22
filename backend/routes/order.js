const express = require('express');
const { checkout, getOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/', getOrders);

module.exports = router;
