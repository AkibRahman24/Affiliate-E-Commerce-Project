const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    // Reference to affiliate
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    affiliateCode: {
      type: String,
      required: true,
      index: true,
    },

    // Reference to order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    orderNumber: String,

    // Commission calculation
    orderAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
    },

    // Tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'scheduled_for_payment', 'paid', 'rejected', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Timeline
    orderedAt: {
      type: Date,
      required: true,
    },
    approvedAt: Date,
    scheduledPaymentDate: Date,
    paidAt: Date,
    rejectionReason: String,
    refundReason: String,

    // Affiliate verification at commission time
    affiliateVerified: {
      type: Boolean,
      default: false,
    },
    orderVerified: {
      type: Boolean,
      default: false,
    },

    // Batch payment tracking
    paymentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentBatch',
      sparse: true,
    },

    // Refund tracking
    refund: {
      amount: Number,
      reason: String,
      processedAt: Date,
    },

    // Notes
    notes: String,
  },
  {
    timestamps: true,
    indexes: [
      { affiliateId: 1, status: 1 },
      { orderId: 1 },
      { status: 1 },
      { createdAt: -1 },
      { paidAt: -1, affiliateId: 1 },
    ],
  }
);

module.exports = mongoose.model('Commission', commissionSchema);
