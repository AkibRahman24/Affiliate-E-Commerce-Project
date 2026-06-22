const Order = require('../models/Order');
const Product = require('../models/Product');
const Commission = require('../models/Commission');
const User = require('../models/User');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const { DEFAULT_AFFILIATE_COMMISSION_RATE, TAX_RATE } = require('../utils/constants');
const { buildImageUrl } = require('./productController');

const generateOrderNumber = () => {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `ORD-${ts}-${rand}`;
};

exports.checkout = async (req, res, next) => {
  try {
    const { items, fullName, email, address, city, postalCode, paymentMethod, affiliateCode, trackedProductId } = req.body;

    if (!items || items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    const productCache = {};

    for (const item of items) {
      if (!productCache[item.productId]) {
        const product = await Product.findById(item.productId).select('stock name image category');
        if (!product) {
          return next(new AppError(`Product "${item.name || item.productId}" not found`, 404));
        }
        productCache[item.productId] = product;
      }
      const cached = productCache[item.productId];
      if (cached.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for "${cached.name}". Available: ${cached.stock}, requested: ${item.quantity}`, 400));
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const orderItems = items.map((item) => {
      const cached = productCache[item.productId];
      return {
        productId: cached?._id || item.productId,
        name: cached?.name || item.name || 'Product',
        image: cached?.image ? buildImageUrl(req, cached.image) : (item.image || ''),
        category: cached?.category || '',
        quantity: item.quantity,
        price: item.price,
        subtotal: Number((item.price * item.quantity).toFixed(2)),
      };
    });

    let affiliateId = null;
    let commissionAmount = 0;
    let affiliate = null;

    if (affiliateCode) {
      affiliate = await User.findOne({ affiliateCode: affiliateCode.toUpperCase(), role: 'affiliate' });
      if (affiliate) {
        affiliateId = affiliate._id;
        const buyerEmail = email || req.user.email;

        // ── SELF-REFERRAL FRAUD CHECKS ──
        const isSelfReferral = affiliate._id.equals(req.user._id);
        const isSameEmail = affiliate.email === buyerEmail;

        if (isSelfReferral || isSameEmail) {
          commissionAmount = 0;
          affiliateId = null;
          affiliate = null;
        } else {
          const rate = affiliate.affiliateProfile?.commissionRate || DEFAULT_AFFILIATE_COMMISSION_RATE;

          if (trackedProductId) {
            const trackedItem = items.find((i) => i.productId === trackedProductId || i.productId.toString() === trackedProductId);
            if (trackedItem) {
              const itemSubtotal = trackedItem.price * trackedItem.quantity;
              commissionAmount = Number(((itemSubtotal * rate) / 100).toFixed(2));
            }
          }

          if (!commissionAmount) {
            commissionAmount = Number(((total * rate) / 100).toFixed(2));
          }
        }
      }
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId: req.user._id,
      affiliateId,
      affiliateCode: affiliateCode ? affiliateCode.toUpperCase() : undefined,
      items: orderItems,
      subtotal,
      tax,
      total,
      shippingAddress: {
        firstName: (fullName || req.user.firstName).split(' ')[0],
        lastName: (fullName || req.user.firstName).split(' ').slice(1).join(' ') || '',
        email: email || req.user.email,
        phone: req.body.phone || '',
        street: address || '',
        city: city || '',
        state: req.body.state || '',
        postalCode: postalCode || '',
        country: req.body.country || '',
      },
      paymentMethod: (paymentMethod && ['cash_on_delivery'].includes(paymentMethod)) ? paymentMethod : 'cash_on_delivery',
      paymentStatus: 'pending',
      status: 'pending',
    });

    // Commission is only earned once the order is delivered, not on pending/processing/shipped orders.

    await Cart.deleteOne({ userId: req.user._id });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const filter = { customerId: req.user._id };
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate({ path: 'items.productId', select: 'name image price category' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId && typeof item.productId === 'object') {
          const p = item.productId;
          if (!item.name && p.name) item.name = p.name;
          if (!item.image && p.image) item.image = p.image;
          if (!item.category && p.category) item.category = p.category;
        }
      }
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
