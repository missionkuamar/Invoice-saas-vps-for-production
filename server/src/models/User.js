// backend/src/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================================
// PLAN CONFIGURATION
// ============================================================

// Paid plans are monthly plans.
// Free plan does not expire.

//kese kaam ka nhi hai
const PLAN_DURATION_DAYS = {
  free: null,
  basic: 30,
  pro: 30,
  enterprise: 30,
};

// ============================================================
// PLAN LIMITS
// ============================================================

const PLAN_LIMITS = {
  free: {
    invoices: 5,
    emails: 5,
  },

  basic: {
    invoices: 100,
    emails: 100,
  },

  pro: {
    invoices: 250,
    emails: 250,
  },

  enterprise: {
    invoices: 1000,
    emails: 1000,
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

const getNextBillingDate = (date = new Date()) => {
  const nextDate = new Date(date);

  nextDate.setMonth(nextDate.getMonth() + 1);

  return nextDate;
};

// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minlength: 6,
    select: false,
  },

  googleId: {
    type: String,
    default: null,
  },

  picture: {
    type: String,
    default: '',
  },

  provider: {
    type: String,
    default: 'local',
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'admin',
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  // ============================================================
  // SUBSCRIPTION
  // ============================================================

  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'cancelled'],
      default: 'active',
    },

    startDate: Date,

    endDate: Date,

    razorpaySubscriptionId: String,

    // ==========================================================
    // EXISTING LIMITS
    // ==========================================================
    // IMPORTANT:
    // Ye fields delete nahi kiye gaye.
    // Ab ye CURRENT BILLING PERIOD ke limit/usage ko represent
    // karenge instead of lifetime cumulative credits.

    limits: {
      invoices: {
        total: {
          type: Number,
          default: 5,
        },

        used: {
          type: Number,
          default: 0,
        },
      },

      emails: {
        total: {
          type: Number,
          default: 5,
        },

        used: {
          type: Number,
          default: 0,
        },
      },
    },

    // ==========================================================
    // NEW: CURRENT BILLING PERIOD
    // ==========================================================

    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },

    currentPeriodEnd: {
      type: Date,
      default: () => getNextBillingDate(new Date()),
    },

    // ==========================================================
    // NEW: CURRENT PERIOD USAGE
    // ==========================================================
    //
    // Ye monthly/current billing period ka usage hai.
    //
    // Example:
    //
    // Basic:
    // invoices limit = 100
    // invoices used  = 73
    //
    // Next billing period:
    // invoices used = 0
    //
    // IMPORTANT:
    // Actual invoices database se delete nahi honge.
    // Sirf usage counter reset hoga.
    //

    usage: {
      invoices: {
        type: Number,
        default: 0,
      },

      emails: {
        type: Number,
        default: 0,
      },
    },

    // ==========================================================
    // EXISTING PLAN HISTORY
    // ==========================================================

    history: [
      {
        plan: String,

        startDate: Date,

        endDate: Date,

        invoicesAdded: Number,

        emailsAdded: Number,

        razorpayPaymentId: String,

        amount: Number,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==========================================================
    // LEGACY FIELDS
    // ==========================================================
    // Delete nahi kiye.
    // Existing code compatibility ke liye rakhe gaye hain.

    monthly: Number,

    used: {
      type: Number,
      default: 0,
    },

    resetDate: {
      type: Date,

      default: () => {
        const date = new Date();

        date.setMonth(date.getMonth() + 1);

        date.setDate(1);

        date.setHours(0, 0, 0, 0);

        return date;
      },
    },
  },

  // ============================================================
  // COMPANY
  // ============================================================

  company: {
    name: String,

    address: String,

    phone: String,

    gst: String,
  },

  // ============================================================
  // STATS
  // ============================================================

  // stats: {
  //   totalInvoices: {
  //     type: Number,
  //     default: 0,
  //   },

  //   totalRevenue: {
  //     type: Number,
  //     default: 0,
  //   },

  //   lastActive: Date,
  // },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================================
// SUBSCRIPTION ACTIVE CHECK
// ============================================================

userSchema.methods.isSubscriptionActive = function () {
  // Free plan never expires
  if (this.subscription.plan === 'free') {
    return true;
  }

  const now = new Date();

  const periodEnd =
    this.subscription.currentPeriodEnd;

  if (!periodEnd) {
    return false;
  }

  if (now >= periodEnd) {
    this.subscription.status = 'expired';
    return false;
  }

  return this.subscription.status === 'active';
};

// ============================================================
// BILLING PERIOD CHECK
// ============================================================

userSchema.methods.isCurrentBillingPeriodActive = function () {
  const now = new Date();

  const start = this.subscription.currentPeriodStart;

  const end = this.subscription.currentPeriodEnd;

  if (!start || !end) {
    return false;
  }

  return now >= start && now < end;
};

// ============================================================
// RESET CURRENT PERIOD USAGE
// ============================================================

userSchema.methods.resetCurrentPeriodUsage = async function () {
  const now = new Date();

  this.subscription.usage.invoices = 0;

  this.subscription.usage.emails = 0;

  this.subscription.limits.invoices.used = 0;

  this.subscription.limits.emails.used = 0;

  this.subscription.used = 0;

  this.subscription.currentPeriodStart = now;

  this.subscription.currentPeriodEnd = getNextBillingDate(now);

  this.subscription.resetDate = this.subscription.currentPeriodEnd;

  await this.save();

  return this;
};

// ============================================================
// ENSURE CURRENT BILLING PERIOD
// ============================================================

userSchema.methods.ensureCurrentBillingPeriod = async function () {
  const now = new Date();

  const currentPeriodEnd = this.subscription.currentPeriodEnd;

  // If no billing period exists
  if (!currentPeriodEnd) {
    this.subscription.currentPeriodStart = now;

    this.subscription.currentPeriodEnd = getNextBillingDate(now);

    this.subscription.usage.invoices = 0;

    this.subscription.usage.emails = 0;

    this.subscription.limits.invoices.used = 0;

    this.subscription.limits.emails.used = 0;

    this.subscription.used = 0;

    this.subscription.resetDate =
      this.subscription.currentPeriodEnd;

    await this.save();

    return this;
  }

  // Current period still active
  if (now < currentPeriodEnd) {
    return this;
  }

  // Current period expired
  this.subscription.usage.invoices = 0;

  this.subscription.usage.emails = 0;

  this.subscription.limits.invoices.used = 0;

  this.subscription.limits.emails.used = 0;

  this.subscription.used = 0;

  this.subscription.currentPeriodStart = now;

  this.subscription.currentPeriodEnd = getNextBillingDate(now);

  this.subscription.resetDate =
    this.subscription.currentPeriodEnd;

  await this.save();

  return this;
};

// ============================================================
// INVOICE CREDIT CHECK
// ============================================================

userSchema.methods.canCreateInvoice = async function () {
  const now = new Date();
//user.subscription.endDate =
     // endDate;
  const periodEnd = this.subscription.currentPeriodEnd;

  // Paid plan expired
  if (
    this.subscription.plan !== 'free' &&
    (!periodEnd || now >= periodEnd)
  ) {
    this.subscription.plan = 'free';
    this.subscription.status = 'active';

    this.subscription.limits.invoices.total = 5;
    this.subscription.limits.emails.total = 5;

    await this.save();

    return true; // Free plan can create invoices within its limit
  }

  // Subscription inactive
  if (
    this.subscription.plan !== 'free' &&
    this.subscription.status !== 'active'
  ) {
    return false;
  }

  const invoiceLimit =
    this.subscription.limits.invoices.total;

  const invoiceUsed =
    this.subscription.usage.invoices;

  return invoiceUsed < invoiceLimit;
};

// ============================================================
// INVOICE COUNT INCREMENT
// ============================================================

userSchema.methods.incrementInvoiceCount = async function () {
  // Make sure current billing period is valid
  await this.ensureCurrentBillingPeriod();

  // New current-period usage
  this.subscription.usage.invoices += 1;

  // Existing field sync
  this.subscription.limits.invoices.used =
    this.subscription.usage.invoices;

  // Existing legacy field sync
  this.subscription.used += 1;

  await this.save();

  return this;
};

// ============================================================
// EMAIL CREDIT CHECK
// ============================================================

userSchema.methods.canSendEmail = async function () {
  // Make sure current billing period is valid
  await this.ensureCurrentBillingPeriod();

  // Check subscription
  if (!this.isSubscriptionActive()) {
    return false;
  }

  const emailLimit =
    this.subscription.limits.emails.total;

  const emailUsed =
    this.subscription.usage.emails;

  return emailUsed < emailLimit;
};

// ============================================================
// EMAIL COUNT INCREMENT
// ============================================================

userSchema.methods.incrementEmailCount = async function () {
  // Make sure current billing period is valid
  await this.ensureCurrentBillingPeriod();

  // Current period usage
  this.subscription.usage.emails += 1;

  // Existing field sync
  this.subscription.limits.emails.used =
    this.subscription.usage.emails;

  // Existing legacy field sync
  this.subscription.used += 1;

  await this.save();

  return this;
};

// ============================================================
// REMAINING EMAILS
// ============================================================

userSchema.methods.getRemainingEmails = function () {
  const emailLimit =
    this.subscription.limits.emails.total;

  const emailUsed =
    this.subscription.usage.emails;

  return Math.max(
    0,
    emailLimit - emailUsed
  );
};

// ============================================================
// ADD / ACTIVATE SUBSCRIPTION
// ============================================================
//
// IMPORTANT:
//
// Old system:
// Basic 100
// + Pro 250
// = 350
//
// NEW SYSTEM:
// Basic -> Pro
//
// Current usage preserve hoga if upgrade same billing period.
//
// Example:
//
// Basic:
// 73 / 100
//
// Upgrade Pro:
//
// 73 / 250
//
// New billing period:
//
// 0 / 250
//

userSchema.methods.addCredits = async function (
  plan,
  paymentId,
  amount
) {
  const limits = getPlanLimits(plan);

  if (!limits) {
    throw new Error('Invalid plan');
  }

  const now = new Date();

  const existingPlan =
    this.subscription.plan || 'free';

  const hasActiveSubscription =
    this.subscription.status === 'active' &&
    this.subscription.currentPeriodStart &&
    this.subscription.currentPeriodEnd &&
    now < this.subscription.currentPeriodEnd;

  const isSameBillingPeriod =
    hasActiveSubscription;

  // ==========================================================
  // Determine usage
  // ==========================================================

  let currentInvoiceUsage = 0;

  let currentEmailUsage = 0;

  if (isSameBillingPeriod) {
    // Existing usage preserve
    currentInvoiceUsage =
      this.subscription.usage?.invoices || 0;

    currentEmailUsage =
      this.subscription.usage?.emails || 0;
  } else {
    // New billing period
    currentInvoiceUsage = 0;

    currentEmailUsage = 0;
  }

  // ==========================================================
  // Dates
  // ==========================================================

  const startDate = now;

  const endDate = getNextBillingDate(now);

  // ==========================================================
  // Update subscription
  // ==========================================================

  this.subscription.plan = plan;

  this.subscription.status = 'active';

  this.subscription.startDate = startDate;

  this.subscription.endDate = endDate;

  this.subscription.currentPeriodStart =
    isSameBillingPeriod
      ? this.subscription.currentPeriodStart
      : startDate;

  this.subscription.currentPeriodEnd =
    isSameBillingPeriod
      ? this.subscription.currentPeriodEnd
      : endDate;

  this.subscription.razorpaySubscriptionId =
    paymentId;

  // ==========================================================
  // Update CURRENT PERIOD limits
  // ==========================================================

  this.subscription.limits.invoices.total =
    limits.invoices;

  this.subscription.limits.emails.total =
    limits.emails;

  // ==========================================================
  // Preserve / reset usage
  // ==========================================================

  this.subscription.usage.invoices =
    currentInvoiceUsage;

  this.subscription.usage.emails =
    currentEmailUsage;

  // Sync existing fields
  this.subscription.limits.invoices.used =
    currentInvoiceUsage;

  this.subscription.limits.emails.used =
    currentEmailUsage;

  // Legacy field
  this.subscription.used =
    currentInvoiceUsage + currentEmailUsage;

  // Legacy reset date
  this.subscription.resetDate =
    this.subscription.currentPeriodEnd;

  // ==========================================================
  // PLAN HISTORY
  // ==========================================================

  this.subscription.history.push({
    plan,

    startDate,

    endDate,

    invoicesAdded: limits.invoices,

    emailsAdded: limits.emails,

    razorpayPaymentId: paymentId,

    amount,
  });

  await this.save();

  return this;
};

// ============================================================
// REMAINING CREDITS
// ============================================================

userSchema.methods.getRemainingCredits = function () {
  const invoiceLimit =
    this.subscription.limits.invoices.total;

  const invoiceUsed =
    this.subscription.usage.invoices;

  const emailLimit =
    this.subscription.limits.emails.total;

  const emailUsed =
    this.subscription.usage.emails;

  return {
    invoices: Math.max(
      0,
      invoiceLimit - invoiceUsed
    ),

    emails: Math.max(
      0,
      emailLimit - emailUsed
    ),

    plan: this.subscription.plan,

    isActive: this.isSubscriptionActive(),

    startDate:
      this.subscription.currentPeriodStart,

    endDate:
      this.subscription.currentPeriodEnd,

    invoiceLimit,

    invoiceUsed,

    emailLimit,

    emailUsed,
  };
};

// ============================================================
// PASSWORD HASH
// ============================================================

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    12
  );

  this.updatedAt = Date.now();

  next();
});

// ============================================================
// AUTO EXPIRE CHECK
// ============================================================

userSchema.pre('save', function (next) {
  if (
    this.subscription.plan !== 'free' &&
    this.subscription.endDate
  ) {
    if (new Date() > this.subscription.endDate) {
      this.subscription.status = 'expired';
    }
  }

  this.updatedAt = Date.now();

  next();
});

// ============================================================
// PASSWORD COMPARE
// ============================================================

userSchema.methods.comparePassword =
  async function (candidatePassword) {
    return await bcrypt.compare(
      candidatePassword,
      this.password
    );
  };

// ============================================================
// EXPORT
// ============================================================

export default mongoose.model(
  'User',
  userSchema
);