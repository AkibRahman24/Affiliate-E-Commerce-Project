const mongoose = require('mongoose');

const DEDUP_WINDOW_MINUTES = 30; // only count unique clicks every 30 minutes
const TTL_DAYS = 90;

const referralClickSchema = new mongoose.Schema(
  {
    affiliateCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    indexes: [
      { affiliateCode: 1, ip: 1 },
      { createdAt: -1 },
    ],
  }
);

referralClickSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: TTL_DAYS * 24 * 60 * 60 }
);

referralClickSchema.statics.isDuplicate = async function (affiliateCode, ip) {
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000);
  const existing = await this.findOne({
    affiliateCode: affiliateCode.toUpperCase(),
    ip,
    createdAt: { $gte: windowStart },
  });
  return !!existing;
};

module.exports = mongoose.model('ReferralClick', referralClickSchema);
