// User roles
const ROLES = {
  CUSTOMER: 'customer',
  AFFILIATE: 'affiliate',
  ADMIN: 'admin',
};

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Commission statuses
const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SCHEDULED_FOR_PAYMENT: 'scheduled_for_payment',
  PAID: 'paid',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
};

// Payment batch statuses
const BATCH_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Payment methods
const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

// Affiliate payout methods
const PAYOUT_METHODS = {
  WIRE_TRANSFER: 'wire_transfer',
  ACH: 'ach',
  PAYPAL: 'paypal',
  CHECK: 'check',
  CRYPTO: 'crypto',
};

// Product categories
const CATEGORIES = ['tws', 'headphones', 'powerbanks', 'smart_watch'];

// Commission holding period (days before affiliate can receive payment)
const COMMISSION_HOLDING_PERIOD = 30;

// Default affiliate commission rate
const DEFAULT_AFFILIATE_COMMISSION_RATE = 2; // 2%

// Tax rate (simplified - in production, use state-based rates)
const TAX_RATE = 0.08; // 8%

module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  COMMISSION_STATUS,
  BATCH_STATUS,
  PAYMENT_METHODS,
  PAYOUT_METHODS,
  CATEGORIES,
  COMMISSION_HOLDING_PERIOD,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  TAX_RATE,
};
