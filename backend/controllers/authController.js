const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.cookie('token', token, cookieOptions);

  const userData = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    affiliateCode: user.affiliateCode || null,
    pendingAffiliate: user.pendingAffiliate || false,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, bkashNumber } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return next(new AppError('Please provide required fields', 400));
    }

    const resolvedRole = ['customer', 'affiliate'].includes(role) ? role : 'customer';

    if (resolvedRole === 'affiliate' && !bkashNumber) {
      return next(new AppError('bKash number is required for affiliate payouts', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already registered', 400));
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      bkashNumber: bkashNumber ? bkashNumber.trim() : undefined,
      role: resolvedRole === 'affiliate' ? 'customer' : resolvedRole,
      pendingAffiliate: resolvedRole === 'affiliate',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.applyAffiliate = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found', 404));
    if (user.role !== 'customer') return next(new AppError('Only customers can apply for the affiliate program', 400));
    if (user.pendingAffiliate) return next(new AppError('Affiliate application is already pending', 400));

    const { bkashNumber } = req.body;
    if (!bkashNumber) return next(new AppError('bKash number is required for affiliate payouts', 400));

    user.pendingAffiliate = true;
    user.bkashNumber = bkashNumber.trim();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Affiliate application submitted. Awaiting admin approval.',
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};


