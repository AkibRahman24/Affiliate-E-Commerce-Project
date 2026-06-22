const mongoose = require('mongoose');

const paymentBatchSchema = new mongoose.Schema(
  {
    // Batch reference
    batchNumber: {
      type: String,
      unique: true,
      required: true,
    },
    description: String,

    // Commissions in this batch
    commissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commission',
      },
    ],
    affiliateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Financial summary
    totalCommissions: {
      type: Number,
      default: 0,
    },
    affiliateCount: {
      type: Number,
      default: 0,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'processing', 'completed', 'failed'],
      default: 'draft',
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ['wire_transfer', 'ach', 'paypal', 'check', 'crypto'],
    },
    paymentReference: String,

    // Timeline
    scheduledDate: Date,
    processedAt: Date,
    completedAt: Date,

    // Admin tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  {
    timestamps: true,
    indexes: [
      { batchNumber: 1 },
      { status: 1 },
      { createdAt: -1 },
      { completedAt: -1 },
    ],
  }
);

module.exports = mongoose.model('PaymentBatch', paymentBatchSchema);
