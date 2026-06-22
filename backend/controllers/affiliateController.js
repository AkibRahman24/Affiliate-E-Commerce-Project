const Commission = require('../models/Commission');
const Order = require('../models/Order');
const User = require('../models/User');
const ReferralClick = require('../models/ReferralClick');
const AppError = require('../utils/AppError');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const affiliateId = req.user._id;
    const affiliateCode = req.user.affiliateCode;

    // Total clicks (use affiliateId or affiliateCode fallback)
    const totalClicks = await ReferralClick.countDocuments({ $or: [{ affiliateId }, { affiliateCode }] });

    // Orders attributable to this affiliate (exclude cancelled/refunded for 'totalOrders')
    const totalOrders = await Order.countDocuments({ affiliateId, status: { $nin: ['cancelled', 'refunded'] } });

    // Delivered (successful) orders and sales revenue
    const deliveredOrders = await Order.countDocuments({ affiliateId, status: 'delivered' });
    const salesAgg = await Order.aggregate([
      { $match: { affiliateId, status: 'delivered' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const salesRevenue = (salesAgg[0] && salesAgg[0].revenue) ? Number(salesAgg[0].revenue.toFixed(2)) : 0;

    // Commissions breakdown
    const commAgg = await Commission.aggregate([
      { $match: { affiliateId } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$commissionAmount' },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0] } },
          approvedAmount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0] } },
          paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0] } },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const comm = commAgg[0] || { totalEarned: 0, pendingAmount: 0, approvedAmount: 0, paidAmount: 0, totalCount: 0 };

    const conversionRate = totalClicks > 0 ? Number(((deliveredOrders / totalClicks) * 100).toFixed(2)) : 0;

    const totalEarnings = Number((comm.totalEarned || 0).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        totalClicks,
        totalOrders,
        deliveredOrders,
        conversionRate,
        salesRevenue,
        commissionEarned: totalEarnings,
        totalEarnings,
        pendingAmount: Number((comm.pendingAmount || 0).toFixed(2)),
        approvedAmount: Number((comm.approvedAmount || 0).toFixed(2)),
        paidAmount: Number((comm.paidAmount || 0).toFixed(2)),
        totalCommissions: comm.totalCount || 0,
        commissionRate: req.user.affiliateProfile?.commissionRate || 2,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCommissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const filter = { affiliateId: req.user._id };
    if (status) filter.status = status;

    const total = await Commission.countDocuments(filter);
    const commissions = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('orderId', 'items')
      .lean();

    const data = commissions.map((c) => ({
      ...c,
      products: c.orderId?.items?.map((i) => i.name).filter(Boolean) || [],
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const filter = { affiliateId: req.user._id };
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

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

exports.getReferralLink = async (req, res, next) => {
  try {
    const code = req.user.affiliateCode;
    if (!code) {
      return next(new AppError('No affiliate code assigned. Contact support.', 400));
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { productId } = req.query;

    let referralLink;
    if (productId) {
      referralLink = `${baseUrl}/products/${productId}?ref=${code}`;
    } else {
      referralLink = `${baseUrl}/products?ref=${code}`;
    }

    res.status(200).json({
      success: true,
      data: {
        affiliateCode: code,
        referralLink,
        rawCode: code,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['companyName', 'taxId', 'bio', 'website', 'socialMedia'];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) {
        updates[`affiliateProfile.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.status(200).json({
      success: true,
      data: {
        affiliateProfile: user.affiliateProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPayoutHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const filter = { affiliateId: req.user._id, status: 'paid' };
    const total = await Commission.countDocuments(filter);
    const paid = await Commission.find(filter)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      count: paid.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: paid,
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPayout = async (req, res, next) => {
  try {
    const { amount, payoutMethod } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError('Valid payout amount is required', 400));
    }

    const pending = await Commission.find({
      affiliateId: req.user._id,
      status: 'pending',
    });

    const pendingTotal = pending.reduce((sum, c) => sum + c.commissionAmount, 0);
    if (amount > pendingTotal) {
      return next(new AppError('Requested amount exceeds pending commission balance', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Payout request submitted for review',
      data: {
        requestedAmount: amount,
        payoutMethod: payoutMethod || 'ach',
        pendingBalance: pendingTotal,
        status: 'pending_approval',
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const affiliateId = req.user._id;

    const affiliateCode = req.user.affiliateCode;

    // clicks, orders, delivered
    const [clicksCount, ordersCount, deliveredCount] = await Promise.all([
      ReferralClick.countDocuments({ $or: [{ affiliateId }, { affiliateCode }] }),
      Order.countDocuments({ affiliateId, status: { $nin: ['cancelled', 'refunded'] } }),
      Order.countDocuments({ affiliateId, status: 'delivered' }),
    ]);

    const commissions = await Commission.find({ affiliateId }).lean();

    const totalEarnings = commissions
      .filter((c) => ['paid', 'approved'].includes(c.status))
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const conversionRate = clicksCount > 0 ? Number(((deliveredCount / clicksCount) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalReferrals: ordersCount,
        totalCommissions: commissions.length,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        conversionRate,
        commissionRate: req.user.affiliateProfile?.commissionRate || 2,
        clicks: clicksCount,
        deliveredOrders: deliveredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.trackClick = async (req, res, next) => {
  try {
    const { affiliateCode, productId } = req.body;

    if (!affiliateCode) {
      return res.status(200).json({ success: true });
    }

    const code = affiliateCode.toUpperCase();

    const isDuplicate = await ReferralClick.isDuplicate(code, req.ip);
    if (isDuplicate) {
      return res.status(200).json({ success: true, dedup: true });
    }

    const affiliate = await User.findOne({ affiliateCode: code, role: 'affiliate' }).select('_id').lean();

    await ReferralClick.create({
      affiliateCode: code,
      affiliateId: affiliate?._id || null,
      productId: productId || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || '',
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
