const User = require('../models/User');
const ReferralClick = require('../models/ReferralClick');

const trackReferral = async (req, res, next) => {
  try {
    const ref = req.query.ref;
    if (!ref) return next();

    const code = ref.toUpperCase();

    const isDuplicate = await ReferralClick.isDuplicate(code, req.ip);
    if (isDuplicate) return next();

    const affiliate = await User.findOne({ affiliateCode: code, role: 'affiliate' }).select('_id').lean();

    const productId = req.params?.id || null;

    await ReferralClick.create({
      affiliateCode: code,
      affiliateId: affiliate?._id || null,
      productId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || '',
    });
  } catch {
  }

  next();
};

module.exports = trackReferral;
