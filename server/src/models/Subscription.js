import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({

  // ============================================================
  // USER
  // ============================================================

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ============================================================
  // PLAN
  // ============================================================

  plan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    required: true,
  },

  // ============================================================
  // RAZORPAY
  // ============================================================

  razorpaySubscriptionId: {
    type: String,
    required: true,
  },

  // ============================================================
  // STATUS
  // ============================================================

  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active',
  },

  // ============================================================
  // SUBSCRIPTION DATES
  // ============================================================

  startDate: {
    type: Date,
    default: Date.now,
  },

  endDate: {
    type: Date,
    required: true,
  },

  // ============================================================
  // CURRENT BILLING PERIOD
  // ============================================================
  // Example:
  //
  // 1 Sep → 30 Sep
  //
  // Next:
  //
  // 1 Oct → 31 Oct
  //
  // Ye fields subscription record ko clearly define karenge.

  currentPeriodStart: {
    type: Date,
  },

  currentPeriodEnd: {
    type: Date,
  },

  // ============================================================
  // PLAN LIMITS
  // ============================================================
  // Is subscription ke time kitna quota mila tha.

  invoiceLimit: {
    type: Number,
    default: 0,
  },

  emailLimit: {
    type: Number,
    default: 0,
  },

  // ============================================================
  // USAGE
  // ============================================================
  // Is billing period mein kitna use hua.

  invoicesUsed: {
    type: Number,
    default: 0,
  },

  emailsUsed: {
    type: Number,
    default: 0,
  },

  // ============================================================
  // PAYMENT AMOUNT
  // ============================================================

  amount: {
    type: Number,
    required: true,
  },

  // ============================================================
  // PAYMENT TYPE
  // ============================================================
  // New subscription / upgrade / renewal etc.

  transactionType: {
    type: String,
    enum: [
      'new',
      'upgrade',
      'downgrade',
      'renewal',
    ],
    default: 'new',
  },

  // ============================================================
  // CREATED AT
  // ============================================================

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

export default mongoose.model(
  'Subscription',
  subscriptionSchema
);