const express = require('express');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getCart).post(addItem);
router.route('/:productId').put(updateItem).delete(removeItem);

module.exports = router;
