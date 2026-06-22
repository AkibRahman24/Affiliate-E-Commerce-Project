const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Commission = require('../models/Commission');
const ReferralClick = require('../models/ReferralClick');
const PaymentBatch = require('../models/PaymentBatch');
const AppError = require('../utils/AppError');
const { DEFAULT_AFFILIATE_COMMISSION_RATE } = require('../utils/constants');

const syncOrderAffiliateCommissionStatus = async (orderId, status) => {
  if (!orderId) return;
  await Order.findByIdAndUpdate(orderId, { 'affiliateCommission.status': status });
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalAffiliates,
      totalCustomers,
      monthlyOrders,
      pendingCommissions,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'affiliate' }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Commission.countDocuments({ status: 'pending' }),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const monthlyRevenue = monthlyOrders.length > 0 ? monthlyOrders[0].total : 0;
    const monthlyOrderCount = monthlyOrders.length > 0 ? monthlyOrders[0].count : 0;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalAffiliates,
        totalCustomers,
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        monthlyOrderCount,
        pendingCommissions,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCommissionList = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { affiliateCode: searchRegex },
      ];
    }
    if (startDate || endDate) {
      const from = startDate ? new Date(startDate) : new Date(0);
      const to = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
      // Include commissions whose orderedAt falls in range, or fall back to createdAt
      filter.$or = [
        { orderedAt: { $gte: from, $lte: to } },
        { createdAt: { $gte: from, $lte: to } },
      ];
    }

    const total = await Commission.countDocuments(filter);
    const commissions = await Commission.find(filter)
      .populate('affiliateId', 'firstName lastName email affiliateCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const summaryAgg = await Commission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0],
            },
          },
          totalApprovedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0],
            },
          },
          totalScheduledAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'scheduled_for_payment'] }, '$commissionAmount', 0],
            },
          },
          totalPaidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0],
            },
          },
          totalRejectedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, '$commissionAmount', 0],
            },
          },
          totalRefundedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$commissionAmount', 0],
            },
          },
          totalCommissionAmount: { $sum: '$commissionAmount' },
        },
      },
    ]);

    // Group by the commission's orderedAt when available, otherwise fall back to createdAt
    const monthlyCommissionStats = await Commission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: { $ifNull: ['$orderedAt', '$createdAt'] },
            },
          },
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topAffiliates = await Commission.aggregate([
      { $match: filter },
      { $group: { _id: '$affiliateId', totalEarned: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
      { $sort: { totalEarned: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'affiliate',
        },
      },
      { $unwind: { path: '$affiliate', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalEarned: 1,
          count: 1,
          firstName: '$affiliate.firstName',
          lastName: '$affiliate.lastName',
          email: '$affiliate.email',
          affiliateCode: '$affiliate.affiliateCode',
        },
      },
    ]);

    const statusCountsAgg = await Commission.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = (statusCountsAgg || []).reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const summary = summaryAgg[0] || { totalPendingAmount: 0, totalPaidAmount: 0, totalCommissionAmount: 0 };

    res.status(200).json({
      success: true,
      count: commissions.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalPendingAmount: Number(summary.totalPendingAmount.toFixed(2)),
        totalApprovedAmount: Number((summary.totalApprovedAmount || 0).toFixed(2)),
        totalScheduledAmount: Number((summary.totalScheduledAmount || 0).toFixed(2)),
        totalPaidAmount: Number(summary.totalPaidAmount.toFixed(2)),
        totalRejectedAmount: Number((summary.totalRejectedAmount || 0).toFixed(2)),
        totalRefundedAmount: Number((summary.totalRefundedAmount || 0).toFixed(2)),
        totalCommissionAmount: Number(summary.totalCommissionAmount.toFixed(2)),
      },
      monthlyCommissionStats,
      topAffiliates,
      statusCounts,
      data: commissions,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPaymentBatch = async (req, res, next) => {
  try {
    const { description, commissionIds, paymentMethod, scheduledDate } = req.body;

    if (!commissionIds || commissionIds.length === 0) {
      return next(new AppError('Select at least one commission to include in the batch', 400));
    }

    const commissions = await Commission.find({
      _id: { $in: commissionIds },
      status: { $in: ['pending', 'approved'] },
    });

    if (commissions.length === 0) {
      return next(new AppError('No eligible commissions found', 400));
    }

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const affiliateIds = [...new Set(commissions.map((c) => c.affiliateId.toString()))];

    const batchNumber = `BATCH-${Date.now()}`;

    const batch = await PaymentBatch.create({
      batchNumber,
      description: description || `Batch payout - ${new Date().toLocaleDateString()}`,
      commissionIds: commissions.map((c) => c._id),
      affiliateIds,
      totalCommissions: Number(totalCommissions.toFixed(2)),
      affiliateCount: affiliateIds.length,
      status: 'draft',
      paymentMethod: paymentMethod || 'ach',
      scheduledDate: scheduledDate || null,
      createdBy: req.user._id,
    });

    await Commission.updateMany(
      { _id: { $in: commissions.map((c) => c._id) } },
      { $set: { status: 'scheduled_for_payment', paymentBatchId: batch._id } }
    );

    res.status(201).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentBatch = async (req, res, next) => {
  try {
    const batch = await PaymentBatch.findById(req.params.id)
      .populate('commissionIds')
      .populate('affiliateIds', 'firstName lastName email affiliateCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .lean();

    if (!batch) {
      return next(new AppError('Payment batch not found', 404));
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCommissionById = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('affiliateId', 'firstName lastName email affiliateCode')
      .populate('orderId', 'orderNumber total status')
      .lean();

    if (!commission) {
      return next(new AppError('Commission not found', 404));
    }

    res.status(200).json({
      success: true,
      data: commission,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveCommission = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return next(new AppError('Commission not found', 404));
    }

    if (commission.status !== 'pending') {
      return next(new AppError('Only pending commissions can be approved', 400));
    }

    commission.status = 'approved';
    commission.approvedAt = new Date();
    await commission.save();

    await syncOrderAffiliateCommissionStatus(commission.orderId, 'approved');

    await User.findByIdAndUpdate(commission.affiliateId, {
      $inc: { 'affiliateProfile.totalEarnings': commission.commissionAmount },
    });

    res.status(200).json({
      success: true,
      data: commission,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectCommission = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return next(new AppError('Commission not found', 404));
    }

    if (commission.status !== 'pending') {
      return next(new AppError('Only pending commissions can be rejected', 400));
    }

    commission.status = 'rejected';
    commission.rejectionReason = reason || 'Rejected by admin';
    await commission.save();

    await syncOrderAffiliateCommissionStatus(commission.orderId, 'rejected');

    await User.findByIdAndUpdate(commission.affiliateId, {
      $inc: { 'affiliateProfile.totalEarnings': -commission.commissionAmount },
    });

    res.status(200).json({
      success: true,
      data: commission,
    });
  } catch (error) {
    next(error);
  }
};

// Mark a single commission as paid (admin records external transfer outside system)
exports.markCommissionPaid = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return next(new AppError('Commission not found', 404));
    }

    // Only allow marking paid when commission is approved or scheduled for payment
    if (!['approved', 'scheduled_for_payment'].includes(commission.status)) {
      return next(new AppError('Only approved or scheduled commissions can be marked as paid', 400));
    }

    commission.status = 'paid';
    commission.paidAt = new Date();
    await commission.save();

    // Reflect status on order and increment affiliate paid tally
    await syncOrderAffiliateCommissionStatus(commission.orderId, 'paid');
    await User.findByIdAndUpdate(commission.affiliateId, {
      $inc: { 'affiliateProfile.totalCommissionPaid': commission.commissionAmount },
    });

    res.status(200).json({ success: true, data: commission });
  } catch (error) {
    next(error);
  }
};

// Schedule a single commission for payment (admin plans payout for one commission)
exports.scheduleCommission = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return next(new AppError('Commission not found', 404));
    }

    if (commission.status !== 'approved') {
      return next(new AppError('Only approved commissions can be scheduled for payment', 400));
    }

    commission.status = 'scheduled_for_payment';
    commission.scheduledPaymentDate = new Date();
    await commission.save();

    await syncOrderAffiliateCommissionStatus(commission.orderId, 'scheduled_for_payment');

    res.status(200).json({ success: true, data: commission });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive, pendingAffiliate } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (pendingAffiliate !== undefined) filter.pendingAffiliate = pendingAffiliate === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken')
      .lean();

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['isActive', 'isVerified', 'firstName', 'lastName', 'email'];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) updates[key] = req.body[key];
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    let user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveAffiliate = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.pendingAffiliate) {
      return next(new AppError('This user has no pending affiliate application', 400));
    }

    if (!user.bkashNumber) {
      return next(new AppError('bKash number is required for affiliate payouts. Ask the user to update their profile.', 400));
    }

    user.role = 'affiliate';
    user.pendingAffiliate = false;
    user.affiliateProfile.isActive = true;
    if (!user.affiliateCode) {
      user.generateAffiliateCode();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Affiliate application approved',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectAffiliate = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.pendingAffiliate) {
      return next(new AppError('This user has no pending affiliate application', 400));
    }

    user.pendingAffiliate = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Affiliate application rejected',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'admin') {
      return next(new AppError('Admin accounts cannot be deleted', 403));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customerId', 'firstName lastName email')
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

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'firstName lastName email')
      .populate('affiliateId', 'firstName lastName email affiliateCode')
      .populate({ path: 'items.productId', select: 'name image price category' })
      .lean();

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    for (const item of order.items) {
      if (item.productId && typeof item.productId === 'object') {
        const p = item.productId;
        if (!item.name && p.name) item.name = p.name;
        if (!item.image && p.image) item.image = p.image;
        if (!item.category && p.category) item.category = p.category;
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, carrier, adminNotes } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!valid.includes(status)) {
      return next(new AppError('Invalid order status', 400));
    }

    const currentOrder = await Order.findById(req.params.id);
    if (!currentOrder) {
      return next(new AppError('Order not found', 404));
    }

    const previousStatus = currentOrder.status;

    // Stock deduction on processing (only from pending to avoid double-deduction)
    if (status === 'processing' && previousStatus === 'pending') {
      for (const item of currentOrder.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        if (product.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for product "${product.name}". Cannot process order.`, 400));
        }
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
      }
    }

    // Stock restoration on cancellation or refund (only if stock was previously deducted)
    if ((status === 'cancelled' || status === 'refunded') && previousStatus !== 'pending' && previousStatus !== 'cancelled') {
      for (const item of currentOrder.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    // Commission handling: do not auto-approve on delivery. Approval is controlled by admin.
    let orderCommissionStatusUpdate;
    const affiliateCommissionUpdate = {};

    if (status === 'delivered' && previousStatus !== 'delivered' && currentOrder.affiliateId) {
      const existingCommission = await Commission.findOne({ orderId: currentOrder._id });
      if (!existingCommission) {
        const affiliate = await User.findById(currentOrder.affiliateId).select('affiliateProfile.commissionRate');
        const commissionRate = affiliate?.affiliateProfile?.commissionRate || DEFAULT_AFFILIATE_COMMISSION_RATE;
        const commissionAmount = Number(((currentOrder.total * commissionRate) / 100).toFixed(2));

        if (commissionAmount > 0) {
          await Commission.create({
            affiliateId: currentOrder.affiliateId,
            affiliateCode: currentOrder.affiliateCode,
            orderId: currentOrder._id,
            orderNumber: currentOrder.orderNumber,
            orderAmount: currentOrder.total,
            commissionRate,
            commissionAmount,
            status: 'pending',
            orderedAt: currentOrder.createdAt,
            affiliateVerified: true,
            orderVerified: true,
          });

          affiliateCommissionUpdate['affiliateCommission.commissionAmount'] = commissionAmount;
          affiliateCommissionUpdate['affiliateCommission.commissionPercentage'] = commissionRate;
          affiliateCommissionUpdate['affiliateCommission.status'] = 'pending';
        }
      }
    }

    if ((status === 'cancelled' || status === 'refunded') && previousStatus !== 'cancelled' && previousStatus !== 'refunded') {
      const commission = await Commission.findOne({ orderId: currentOrder._id });
      if (commission && ['pending', 'approved', 'scheduled_for_payment', 'paid'].includes(commission.status)) {

        const financialAdjustments = {};
        if (['approved', 'scheduled_for_payment', 'paid'].includes(commission.status)) {
          financialAdjustments['affiliateProfile.totalEarnings'] = -commission.commissionAmount;
        }
        if (commission.status === 'paid') {
          financialAdjustments['affiliateProfile.totalCommissionPaid'] = -commission.commissionAmount;
        }
        if (Object.keys(financialAdjustments).length > 0) {
          await User.findByIdAndUpdate(commission.affiliateId, { $inc: financialAdjustments });
        }

        commission.status = status === 'cancelled' ? 'rejected' : 'refunded';
        commission.refund = {
          amount: commission.commissionAmount,
          reason: `Order ${status} — cancelled via admin order status update`,
          processedAt: new Date(),
        };
        if (status === 'cancelled') {
          commission.rejectionReason = `Order cancelled — commission refunded. Order: ${currentOrder.orderNumber}`;
        }
        await commission.save();
        orderCommissionStatusUpdate = commission.status;
      }
    }

    const updates = { status };
    if (orderCommissionStatusUpdate) {
      updates['affiliateCommission.status'] = orderCommissionStatusUpdate;
    }
    if (Object.keys(affiliateCommissionUpdate).length > 0) {
      Object.assign(updates, affiliateCommissionUpdate);
    }
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (carrier) updates.carrier = carrier;
    if (adminNotes) updates.adminNotes = adminNotes;

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPaymentBatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const filter = {};
    if (status) filter.status = status;

    const total = await PaymentBatch.countDocuments(filter);
    const batches = await PaymentBatch.find(filter)
      .populate('affiliateIds', 'firstName lastName email affiliateCode')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      count: batches.length,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};

exports.completePaymentBatch = async (req, res, next) => {
  try {
    const batch = await PaymentBatch.findById(req.params.id);

    if (!batch) {
      return next(new AppError('Payment batch not found', 404));
    }

    if (batch.status !== 'draft') {
      return next(new AppError('Only draft batches can be completed', 400));
    }

    const commissions = await Commission.find({ _id: { $in: batch.commissionIds } });

    for (const c of commissions) {
      c.status = 'paid';
      c.paidAt = new Date();
      await c.save();
      await syncOrderAffiliateCommissionStatus(c.orderId, 'paid');
      await User.findByIdAndUpdate(c.affiliateId, {
        $inc: { 'affiliateProfile.totalCommissionPaid': c.commissionAmount },
      });
    }

    batch.status = 'completed';
    batch.processedAt = new Date();
    batch.completedAt = new Date();
    await batch.save();

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [revenueByMonth, topAffiliates, ordersByStatus, categoryBreakdown, summaryArr, commissionsPaidArr, totalClicksCount, affiliateSalesAgg] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Commission.aggregate([
        { $match: { status: { $in: ['paid', 'approved'] } } },
        { $group: { _id: '$affiliateId', totalEarned: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
        { $sort: { totalEarned: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'affiliate',
          },
        },
        { $unwind: { path: '$affiliate', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            totalEarned: 1,
            count: 1,
            firstName: '$affiliate.firstName',
            lastName: '$affiliate.lastName',
            email: '$affiliate.email',
            affiliateCode: '$affiliate.affiliateCode',
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$product.category',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            deliveredRevenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] } },
            pendingRevenue: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'shipped']] }, '$total', 0] } },
            cancelledRevenue: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, '$total', 0] } },
            deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          },
        },
      ]),
      Commission.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      // total referral clicks across site
      ReferralClick.countDocuments(),
      // affiliate-driven sales (delivered orders with affiliate)
      Order.aggregate([
        { $match: { status: 'delivered', affiliateId: { $ne: null } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $project: { productId: '$_id', units: 1, revenue: 1, name: '$product.name' } },
      ]),
    ]);

    const summary = summaryArr[0] || {};

    // affiliate revenue (delivered orders where affiliateId set)
    const affiliateRevenueAgg = await Order.aggregate([
      { $match: { status: 'delivered', affiliateId: { $ne: null } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]);
    const affiliateRevenue = (affiliateRevenueAgg[0] && affiliateRevenueAgg[0].revenue) ? affiliateRevenueAgg[0].revenue : 0;

    const totalClicks = totalClicksCount || 0;
    const totalConversions = await Order.countDocuments({ affiliateId: { $ne: null }, status: { $nin: ['cancelled', 'refunded'] } });
    const averageConversionRate = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenueByMonth,
        topAffiliates,
        ordersByStatus,
        categoryBreakdown,
        topAffiliateProducts: affiliateSalesAgg,
        summary: {
          deliveredRevenue: summary.deliveredRevenue || 0,
          pendingRevenue: summary.pendingRevenue || 0,
          cancelledRevenue: summary.cancelledRevenue || 0,
          deliveredOrders: summary.deliveredOrders || 0,
          cancelledOrders: summary.cancelledOrders || 0,
          affiliateCommissionsPaid: commissionsPaidArr[0]?.total || 0,
        },
        totalClicks,
        totalConversions,
        averageConversionRate,
        affiliateRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status, exportAll } = req.query;
    const pageNumber = Number(page) || 1;
    const pageSize = exportAll === 'true' ? 0 : (Number(limit) || 20);
    const skip = exportAll === 'true' ? 0 : (pageNumber - 1) * pageSize;

    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const total = await Order.countDocuments(filter);
    let query = Order.find(filter)
      .populate('customerId', 'firstName lastName email')
      .populate('affiliateId', 'firstName lastName email affiliateCode')
      .sort({ createdAt: -1 });

    if (!exportAll || exportAll !== 'true') {
      query = query.skip(skip);
    }
    if (pageSize > 0) {
      query = query.limit(pageSize);
    }

    const orders = await query.lean();

    const orderIds = orders.map((o) => o._id);
    const commissions = await Commission.find({ orderId: { $in: orderIds } }).lean();
    const commissionMap = {};
    for (const c of commissions) {
      commissionMap[c.orderId.toString()] = c;
    }

    const data = orders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      customer: o.customerId
        ? { name: `${o.customerId.firstName} ${o.customerId.lastName}`, email: o.customerId.email }
        : null,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      total: o.total,
      status: o.status,
      affiliate: o.affiliateId
        ? { name: `${o.affiliateId.firstName} ${o.affiliateId.lastName}`, code: o.affiliateId.affiliateCode, email: o.affiliateId.email }
        : null,
      commission: commissionMap[o._id.toString()]
        ? { amount: commissionMap[o._id.toString()].commissionAmount, status: commissionMap[o._id.toString()].status }
        : null,
      revenueCounted: o.status === 'delivered',
    }));

    if (exportAll === 'true') {
      return res.status(200).json({ success: true, data });
    }

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
