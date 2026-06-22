const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // Don't return by default
    },

    // Role-based access
    role: {
      type: String,
      enum: ['customer', 'affiliate', 'admin'],
      default: 'customer',
    },

    // Profile
    avatar: String,
    phoneNumber: String,
    bkashNumber: {
      type: String,
      trim: true,
      match: [/^01\d{9}$/, 'bKash number must start with 01 and be 11 digits long'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,

    // Affiliate-specific
    affiliateCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null values for non-affiliates
      uppercase: true,
    },
    affiliateProfile: {
      // Affiliate can become active by completing profile
      isActive: {
        type: Boolean,
        default: false,
      },
      commissionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 2, // 2% default commission (matches constants.DEFAULT_AFFILIATE_COMMISSION_RATE)
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      totalCommissionPaid: {
        type: Number,
        default: 0,
      },
      bankDetails: {
        accountHolder: String,
        accountNumber: String,
        routingNumber: String,
        bankName: String,
        verified: Boolean,
      },
      companyName: String,
      taxId: String,
      bio: String,
      website: String,
      socialMedia: {
        twitter: String,
        facebook: String,
        instagram: String,
      },
    },

    // Address
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpiry: Date,

    // Activity tracking
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Affiliate application
    pendingAffiliate: {
      type: Boolean,
      default: false,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { email: 1 },
      { affiliateCode: 1, sparse: true },
      { role: 1 },
    ],
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate affiliate code
userSchema.methods.generateAffiliateCode = function () {
  this.affiliateCode = `AFF-${this._id.toString().slice(-8).toUpperCase()}`;
  return this.affiliateCode;
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
