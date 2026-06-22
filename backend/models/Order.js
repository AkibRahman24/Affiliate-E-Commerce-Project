const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Order reference
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Affiliate referral
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true, // Null if not an affiliate purchase
    },
    affiliateCode: {
      type: String,
      sparse: true,
    },

    // Order items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: '',
        },
        category: {
          type: String,
          default: '',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],

    // Pricing breakdown
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },

    // Commission calculation (calculated at order time)
    affiliateCommission: {
      commissionAmount: {
        type: Number,
        default: 0,
      },
      commissionPercentage: Number,
      status: {
        type: String,
        enum: ['pending', 'approved', 'scheduled_for_payment', 'paid', 'rejected', 'refunded'],
        default: 'pending',
      },
    },

    // Shipping
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    trackingNumber: String,
    carrier: String,

    // Payment
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: String,

    // Order status
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    // Notes
    customerNotes: String,
    adminNotes: String,

    // Refund
    refund: {
      amount: Number,
      reason: String,
      requestedAt: Date,
      approvedAt: Date,
      processedAt: Date,
    },
  },
  {
    timestamps: true,
    indexes: [
      { orderNumber: 1 },
      { customerId: 1 },
      { affiliateId: 1, sparse: true },
      { affiliateCode: 1, sparse: true },
      { status: 1 },
      { paymentStatus: 1 },
      { createdAt: -1 },
      { 'affiliateCommission.status': 1 },
    ],
  }
);

// Generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.isModified('orderNumber') && this.orderNumber) return next();

  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  this.orderNumber = `ORD-${timestamp}-${random}`;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
