const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const trackReferral = require('../middleware/trackReferral');

const router = express.Router();

router.route('/').get(trackReferral, getProducts).post(protect, authorize('admin'), createProduct);
router
  .route('/:id')
  .get(trackReferral, getProduct)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

router.put('/:id/stock', protect, authorize('admin'), adjustStock);

module.exports = router;
