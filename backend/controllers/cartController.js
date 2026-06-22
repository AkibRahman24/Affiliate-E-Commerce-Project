const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return next(new AppError('Product ID is required', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existing = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + quantity);
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }

    await cart.save();
    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity == null || quantity < 0) {
      return next(new AppError('Valid quantity is required', 400));
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const existing = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!existing) {
      return next(new AppError('Item not found in cart', 404));
    }

    if (quantity === 0) {
      cart.items.pull({ productId: existing.productId });
    } else {
      existing.quantity = Math.min(999, quantity);
    }

    await cart.save();
    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items.pull({ productId });
    await cart.save();
    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};
