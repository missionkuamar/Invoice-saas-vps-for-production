// backend/src/controllers/subscriptionController.js

import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Affiliate from '../models/Affiliate.js';
import AffiliateReferral from '../models/AffiliateReferral.js';
import razorpay from '../config/razorpay.js';
import crypto from 'crypto';

// ============================================================
// PLAN CREDITS
// ============================================================

export const PLAN_CREDITS = {
  free: {
    invoices: 10,
    emails: 10,
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
// PLAN RANK
// ============================================================

const PLAN_RANK = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

// ============================================================
// TRANSACTION TYPE
// ============================================================

const getTransactionType = (
  previousPlan,
  newPlan,
  hasActiveSubscription
) => {
  if (!hasActiveSubscription) {
    return 'new';
  }

  if (previousPlan === newPlan) {
    return 'renewal';
  }

  if (
    PLAN_RANK[newPlan] >
    PLAN_RANK[previousPlan]
  ) {
    return 'upgrade';
  }

  return 'downgrade';
};

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================

export const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,

    invoiceLimit: 100,
    emailLimit: 100,

    durationDays: 30,

    features: [
      '100 invoices/month',
      '100 email reminders/month',
      'Unlimited clients',
      'Basic invoice templates',
      'Payment tracking',
      'Invoice management',
      'Email support',
    ],
  },

  {
    id: 'pro',
    name: 'Pro',
    price: 499,

    invoiceLimit: 250,
    emailLimit: 250,

    durationDays: 30,

    features: [
      '250 invoices/month',
      '250 email reminders/month',
      'Unlimited clients',
      'Advanced invoice templates',
      'Payment tracking',
      'Automatic payment reminders',
      'Invoice management',
      'Priority support',
    ],
  },

  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1199,

    invoiceLimit: 1000,
    emailLimit: 1000,

    durationDays: 30,

    features: [
      '1000 invoices/month',
      '1000 email reminders/month',
      'Unlimited clients',
      'Team accounts',
      'Advanced invoice templates',
      'Payment tracking',
      'Automatic payment reminders',
      'Priority support',
    ],
  },
];

// ============================================================
// FIND PLAN
// ============================================================

export const findPlanById = (planId) => {
  return plans.find(
    (plan) => plan.id === planId
  );
};

// ============================================================
// GET ALL PLANS API
// ============================================================

// GET /api/subscriptions/plans

export const getPlans = (req, res) => {
  return res.status(200).json({
    success: true,
    data: plans,
  });
};

// ============================================================
// GET SINGLE PLAN
// ============================================================

export const getPlan = (planId) => {
  return findPlanById(planId);
};

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

// POST /api/subscriptions/create-order

export const createOrder = async (req, res) => {
  try {
    // console.log('\n========================================');
    // console.log('🚀 CREATE ORDER START');
    // console.log('========================================');

    const {
      plan,
    } = req.body;

    // console.log(
    //   '📥 Request body:',
    //   req.body
    // );

    // console.log(
    //   '📦 Requested plan:',
    //   plan
    // );

    // ========================================================
    // USER ID
    // ========================================================

    const userId =
      req.user?._id ||
      req.user?.id;

    // console.log(
    //   '👤 User ID:',
    //   userId
    // );

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found',
      });
    }

    // console.log(
    //   '👤 User found:',
    //   {
    //     id: user._id,
    //     email: user.email,
    //     currentPlan:
    //       user.subscription?.plan ||
    //       'free',
    //     subscriptionStatus:
    //       user.subscription?.status ||
    //       'inactive',
    //   }
    // );

    // ========================================================
    // FIND PLAN
    // ========================================================

    const selectedPlan =
      findPlanById(plan);

    // console.log(
    //   '📋 Selected plan:',
    //   selectedPlan
    // );

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid plan selected',
      });
    }

    // ========================================================
    // CURRENT PLAN
    // ========================================================

    const currentPlan =
      user.subscription?.plan ||
      'free';

    const subscriptionStatus =
      user.subscription?.status ||
      'inactive';

    // ========================================================
    // SAME ACTIVE PLAN
    // ========================================================

    if (
      currentPlan ===
      selectedPlan.id &&
      subscriptionStatus ===
      'active'
    ) {
      return res.status(400).json({
        success: false,
        message:
          `You already have an active ${selectedPlan.name} subscription.`,
      });
    }

    // ========================================================
    // RAZORPAY ORDER
    // ========================================================

    const options = {
      amount:
        Math.round(
          selectedPlan.price * 100
        ),

      currency: 'INR',

      receipt:
        `receipt_${Date.now()}_${userId}`,

      payment_capture: 1,

      notes: {
        userId:
          userId.toString(),

        plan:
          selectedPlan.id,

        userEmail:
          user.email || '',

        currentPlan,
      },
    };

    // console.log(
    //   '💳 Razorpay order options:',
    //   JSON.stringify(
    //     options,
    //     null,
    //     2
    //   )
    // );

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const order =
      await razorpay.orders.create(
        options
      );

    // console.log(
    //   '✅ Razorpay order created:',
    //   order.id
    // );

    // ========================================================
    // RESPONSE
    // ========================================================
    //
    // IMPORTANT:
    // orderId same rakha hai because
    // old frontend isi ko use karta hai.
    // ========================================================

    const responseData = {
      orderId:
        order.id,

      amount:
        order.amount,

      currency:
        order.currency,

      key:
        process.env.RAZORPAY_KEY_ID,

      plan:
        selectedPlan.id,

      currentPlan,
    };

    // console.log(
    //   '📤 Sending order data:',
    //   responseData
    // );

    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {

    // console.error(
    //   '❌ CREATE ORDER ERROR:',
    //   error
    // );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to create Razorpay order',
    });
  }
};

// ============================================================
// VERIFY PAYMENT
// ============================================================

// POST /api/subscriptions/verify-payment

// ============================================================
// VERIFY PAYMENT
// POST /api/subscriptions/verify-payment
// ============================================================

export const verifyPayment = async (req, res) => {
  try {
    // console.log('\n========================================');
    // console.log('🔐 VERIFY PAYMENT START');
    // console.log('========================================');

    // ========================================================
    // REQUEST DATA
    // ========================================================

    const {
      orderId,
      paymentId,
      signature,
      plan,
    } = req.body;

    const userId =
      req.user?._id ||
      req.user?.id;

    // console.log('📥 Verify payment request:', {
    //   orderId,
    //   paymentId,
    //   signature,
    //   plan,
    //   userId,
    // });

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID is required',
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay payment ID is required',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay signature is required',
      });
    }

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // ========================================================
    // FIND PLAN
    // ========================================================

    const selectedPlan = findPlanById(plan);

  //  console.log('📋 Selected plan:', selectedPlan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected',
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // console.log('👤 User found:', {
    //   id: user._id,
    //   email: user.email,
    //   currentPlan:
    //     user.subscription?.plan || 'free',
    //   subscriptionStatus:
    //     user.subscription?.status || 'inactive',
    // });

    // ========================================================
    // CURRENT / PREVIOUS PLAN
    // ========================================================

    const previousPlan =
      user.subscription?.plan || 'free';

    const hasActiveSubscription =
      user.subscription?.status === 'active' &&
      user.subscription?.endDate &&
      new Date(user.subscription.endDate) > new Date();

    const transactionType =
      getTransactionType(
        previousPlan,
        selectedPlan.id,
        hasActiveSubscription
      );

  //  console.log('📊 Transaction type:', transactionType);

    // ========================================================
    // VERIFY RAZORPAY SIGNATURE
    // ========================================================

    const body =
      orderId + '|' + paymentId;

    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest('hex');

    const isSignatureValid =
      expectedSignature === signature;

   // console.log('🔐 Signature valid:', isSignatureValid);

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid Razorpay payment signature',
      });
    }

    // ========================================================
    // FETCH RAZORPAY ORDER
    // ========================================================

    const razorpayOrder =
      await razorpay.orders.fetch(orderId);

    // console.log('🧾 Razorpay order:', {
    //   id: razorpayOrder.id,
    //   amount: razorpayOrder.amount,
    //   currency: razorpayOrder.currency,
    //   status: razorpayOrder.status,
    //   notes: razorpayOrder.notes,
    // });

    // ========================================================
    // VERIFY ORDER USER
    // ========================================================

    if (
      razorpayOrder.notes?.userId &&
      razorpayOrder.notes.userId !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Payment order does not belong to this user',
      });
    }

    // ========================================================
    // VERIFY ORDER PLAN
    // ========================================================

    if (
      razorpayOrder.notes?.plan &&
      razorpayOrder.notes.plan !== selectedPlan.id
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment plan mismatch',
      });
    }

    // ========================================================
    // VERIFY PAYMENT AMOUNT
    // ========================================================

    const expectedAmount =
      Math.round(selectedPlan.price * 100);

    if (
      Number(razorpayOrder.amount) !==
      expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch',
      });
    }

    // ========================================================
    // DUPLICATE PAYMENT CHECK
    // ========================================================

    const alreadyProcessed =
      Array.isArray(user.subscription?.history) &&
      user.subscription.history.some(
        (item) =>
          item.razorpayPaymentId === paymentId
      );

    if (alreadyProcessed) {
      // console.log(
      //   '⚠️ Payment already processed:',
      //   paymentId
      // );

      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: {
          plan:
            user.subscription?.plan ||
            'free',

          status:
            user.subscription?.status ||
            'inactive',

          subscription:
            user.subscription,

          remainingCredits:
            typeof user.getRemainingCredits ===
              'function'
              ? user.getRemainingCredits()
              : null,
        },
      });
    }

    // ========================================================
    // SUBSCRIPTION START / END DATE
    // ========================================================

    const startDate = new Date();

    const endDate = new Date();

    endDate.setDate(
      endDate.getDate() +
      selectedPlan.durationDays
    );   


    // only for tesing purpose 5 minutes ke lye 
    // const endDate = new Date(startDate);
    // endDate.setMinutes(endDate.getMinutes() + 5);

    
    // ========================================================
    // PLAN CREDITS
    // ========================================================

    const credits =
      PLAN_CREDITS[selectedPlan.id];

    if (!credits) {
      return res.status(400).json({
        success: false,
        message:
          'Plan credit configuration not found',
      });
    }

    //console.log('🎟️ Credits:', credits);

    // ========================================================
    // CREATE / UPDATE USER SUBSCRIPTION
    // ========================================================

    if (!user.subscription) {
      user.subscription = {};
    }

    // ========================================================
    // BASIC SUBSCRIPTION DATA
    // ========================================================

    user.subscription.plan =
      selectedPlan.id;

    user.subscription.status =
      'active';

    user.subscription.startDate =
      startDate;

    user.subscription.endDate =
      endDate;

    user.subscription.razorpaySubscriptionId =
      paymentId;

    // ========================================================
    // SUBSCRIPTION LIMITS
    // ========================================================

    if (!user.subscription.limits) {
      user.subscription.limits = {};
    }

    if (!user.subscription.limits.invoices) {
      user.subscription.limits.invoices = {};
    }

    if (!user.subscription.limits.emails) {
      user.subscription.limits.emails = {};
    }

    // ========================================================
    // RESET MONTHLY CREDITS
    // ========================================================

    user.subscription.limits.invoices.total =
      credits.invoices;

    user.subscription.limits.invoices.used =
      0;

    user.subscription.limits.emails.total =
      credits.emails;

    user.subscription.limits.emails.used =
      0;

    // ========================================================
    // LEGACY USAGE RESET
    // ========================================================

    if (user.subscription.usage) {
      user.subscription.usage.invoices = 0;
      user.subscription.usage.emails = 0;
    }

    user.subscription.used = 0;

    // ========================================================
    // CURRENT BILLING PERIOD
    // ========================================================

    user.subscription.currentPeriodStart =
      startDate;

    user.subscription.currentPeriodEnd =
      endDate;

    user.subscription.resetDate =
      endDate;

    // ========================================================
    // SUBSCRIPTION HISTORY
    // ========================================================

    if (
      !Array.isArray(
        user.subscription.history
      )
    ) {
      user.subscription.history = [];
    }

    user.subscription.history.push({
      plan:
        selectedPlan.id,

      startDate,

      endDate,

      invoicesAdded:
        credits.invoices,

      emailsAdded:
        credits.emails,

      razorpayPaymentId:
        paymentId,

      razorpayOrderId:
        orderId,

      amount:
        selectedPlan.price,

      transactionType,

      previousPlan,

      createdAt:
        new Date(),
    });

    // ========================================================
    // SAVE USER
    //
    // IMPORTANT:
    // Save BEFORE affiliate commission.
    // This prevents duplicate processing if something fails.
    // ========================================================

    await user.save();

    // console.log(
    //   '✅ User subscription saved successfully'
    // );

    // ========================================================
    // SAVE SUBSCRIPTION DOCUMENT
    // ========================================================

    let subscription = null;

    try {
      subscription =
        await Subscription.create({
          user:
            user._id,

          plan:
            selectedPlan.id,

          razorpaySubscriptionId:
            paymentId,

          status:
            'active',

          startDate,

          endDate,

          currentPeriodStart:
            startDate,

          currentPeriodEnd:
            endDate,

          invoiceLimit:
            credits.invoices,

          emailLimit:
            credits.emails,

          invoicesUsed:
            0,

          emailsUsed:
            0,

          amount:
            selectedPlan.price,

          transactionType,
        });

      // console.log(
      //   '✅ Subscription document created:',
      //   subscription._id
      // );

    } catch (subscriptionError) {

      // console.error(
      //   '⚠️ Subscription document save error:',
      //   subscriptionError.message
      // );

      // Don't fail successful payment
      // because user subscription is already saved.
    }

    // ========================================================
    // AFFILIATE COMMISSION
    // ========================================================

    let affiliateData = {
      earned: false,
      commission: 0,
      rate: 0,
      commissionType: null,
      message:
        'No affiliate referral found',
    };

    try {
      // console.log(
      //   '\n💰 AFFILIATE COMMISSION CHECK'
      // );

      // ======================================================
      // FIND REFERRAL
      // ======================================================

      const referral =
        await AffiliateReferral.findOne({
          referredUser: user._id,
        }).sort({
          createdAt: -1,
        });

      if (!referral) {

        // console.log(
        //   'ℹ️ No affiliate referral found'
        // );

      } else {

        // console.log(
        //   '🔗 Referral found:',
        //   referral._id
        // );

        // ====================================================
        // FIND AFFILIATE
        // ====================================================

        const affiliate =
          await Affiliate.findById(
            referral.affiliate
          );

        if (!affiliate) {

          // console.log(
          //   '⚠️ Affiliate not found:',
          //   referral.affiliate
          // );

          affiliateData.message =
            'Affiliate not found';

        } else if (
          affiliate.status !== 'active'
        ) {

          // console.log(
          //   '⚠️ Affiliate is not active:',
          //   affiliate.status
          // );

          affiliateData.message =
            'Affiliate is not active';

        } else {

          // ==================================================
          // COMMISSION TYPE
          // ==================================================

          const commissionType =
            affiliate.commissionType ||
            'one_time';

          const commissionRate =
            Number(
              affiliate.commissionRate || 10
            );

          // ==================================================
          // PREVENT DUPLICATE COMMISSION
          //
          // If same payment already credited,
          // don't credit again.
          // ==================================================

          const alreadyCreditedForPayment =
            referral.lastPaymentId ===
            paymentId;

          if (alreadyCreditedForPayment) {

            // console.log(
            //   '⚠️ Affiliate commission already credited for payment:',
            //   paymentId
            // );

            affiliateData.message =
              'Affiliate commission already credited';

          } else {

            // ==================================================
            // ONE TIME / RECURRING CHECK
            // ==================================================

            const alreadyHadCommission =
              Number(
                referral.commissionCount || 0
              ) > 0;

            const shouldPayCommission =
              commissionType ===
                'recurring'
                ? true
                : !alreadyHadCommission;

            // ==================================================
            // ONE TIME ALREADY PAID
            // ==================================================

            if (!shouldPayCommission) {

              // console.log(
              //   'ℹ️ One-time affiliate commission already paid'
              // );

              affiliateData = {
                earned: false,

                commission: 0,

                rate:
                  commissionRate,

                commissionType,

                message:
                  'One-time commission already credited',

                affiliateCode:
                  affiliate.affiliateCode,

                commissionCount:
                  referral.commissionCount,
              };

            } else {

              // ==============================================
              // CALCULATE COMMISSION
              // ==============================================

              const commissionAmount =
                Number(
                  (
                    selectedPlan.price *
                    commissionRate /
                    100
                  ).toFixed(2)
                );

              // console.log(
              //   '💰 Commission:',
              //   {
              //     plan:
              //       selectedPlan.id,

              //     amount:
              //       selectedPlan.price,

              //     rate:
              //       commissionRate,

              //     commission:
              //       commissionAmount,

              //     type:
              //       commissionType,
              //   }
              // );

              // ==============================================
              // UPDATE REFERRAL
              // ==============================================

              referral.status =
                'subscribed';

              referral.subscriptionPlan =
                selectedPlan.id;

              referral.subscriptionAmount =
                selectedPlan.price;

              referral.subscriptionStartDate =
                startDate;

              referral.subscriptionEndDate =
                endDate;

              // Current/latest commission
              referral.commission =
                commissionAmount;

              // Lifetime commission
              referral.totalCommissionPaid =
                (
                  referral.totalCommissionPaid ||
                  0
                ) + commissionAmount;

              referral.lastCommissionDate =
                new Date();

              referral.lastPaymentId =
                paymentId;

              referral.commissionCount =
                (
                  referral.commissionCount ||
                  0
                ) + 1;

              referral.isRecurring =
                commissionType ===
                'recurring';

              if (!referral.convertedAt) {
                referral.convertedAt =
                  new Date();
              }

              await referral.save();

              // console.log(
              //   '✅ Referral commission data saved'
              // );

              // ==============================================
              // UPDATE AFFILIATE
              // ==============================================

              affiliate.totalEarnings =
                (
                  affiliate.totalEarnings ||
                  0
                ) + commissionAmount;

              // Only count conversion once
              if (!alreadyHadCommission) {

                affiliate.totalConversions =
                  (
                    affiliate.totalConversions ||
                    0
                  ) + 1;
              }

              // ==============================================
              // MONTHLY EARNINGS
              // ==============================================

              if (
                !Array.isArray(
                  affiliate.monthlyEarnings
                )
              ) {
                affiliate.monthlyEarnings = [];
              }

              const now =
                new Date();

              // 1-12
              const currentMonth =
                now.getMonth() + 1;

              const currentYear =
                now.getFullYear();

              const monthlyEarning =
                affiliate.monthlyEarnings.find(
                  (item) =>
                    item.month ===
                    currentMonth &&
                    item.year ===
                    currentYear
                );

              if (monthlyEarning) {

                monthlyEarning.amount =
                  (
                    monthlyEarning.amount ||
                    0
                  ) + commissionAmount;

              } else {

                affiliate.monthlyEarnings.push({
                  month:
                    currentMonth,

                  year:
                    currentYear,

                  amount:
                    commissionAmount,
                });
              }

              await affiliate.save();

              // console.log(
              //   '✅ Affiliate earnings updated'
              // );

              // ==============================================
              // AFFILIATE RESPONSE DATA
              // ==============================================

              affiliateData = {
                earned: true,

                commission:
                  commissionAmount,

                rate:
                  commissionRate,

                commissionType,

                message:
                  `Commission credited: ₹${commissionAmount}`,

                affiliateCode:
                  affiliate.affiliateCode,

                referralName:
                  user.name,

                referralEmail:
                  user.email,

                referralStatus:
                  referral.status,

                commissionCount:
                  referral.commissionCount,

                totalAffiliateEarnings:
                  affiliate.totalEarnings,
              };
            }
          }
        }
      }

    } catch (affiliateError) {

      // console.error(
      //   '❌ Affiliate commission error:',
      //   affiliateError
      // );

      // IMPORTANT:
      // Affiliate failure should NOT
      // cancel successful payment.
      affiliateData = {
        earned: false,

        commission: 0,

        message:
          'Subscription successful, but affiliate commission processing failed',
      };
    }

    // ========================================================
    // REMAINING CREDITS
    // ========================================================

    let remainingCredits = {
      invoices:
        credits.invoices,

      emails:
        credits.emails,

      plan:
        selectedPlan.id,

      isActive:
        true,

      endDate,
    };

    if (
      typeof user.getRemainingCredits ===
      'function'
    ) {
      remainingCredits =
        user.getRemainingCredits();
    }

    // ========================================================
    // FINAL LOG
    // ========================================================

    // console.log(
    //   '\n========================================'
    // );

    // console.log(
    //   '✅ PAYMENT VERIFIED SUCCESSFULLY'
    // );

    // console.log(
    //   '📊 Subscription:',
    //   {
    //     plan:
    //       selectedPlan.id,

    //     transactionType,

    //     previousPlan,

    //     startDate,

    //     endDate,

    //     amount:
    //       selectedPlan.price,
    //   }
    // );

    // console.log(
    //   '💰 Affiliate:',
    //   affiliateData
    // );

    // console.log(
    //   '========================================\n'
    // );

    // ========================================================
    // FINAL RESPONSE
    //
    // IMPORTANT:
    // ONLY ONE RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        'Payment verified and subscription activated successfully',

      data: {
        plan:
          selectedPlan.id,

        transactionType,

        previousPlan,

        status:
          'active',

        startDate,

        endDate,

        amount:
          selectedPlan.price,

        subscriptionId:
          subscription?._id || null,

        remainingCredits,

        affiliate:
          affiliateData,
      },
    });

  } catch (error) {

    // console.error(
    //   '\n❌ VERIFY PAYMENT ERROR:',
    //   error
    // );

    // console.error(
    //   'Stack:',
    //   error.stack
    // );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Payment verification failed',
    });
  }
};

// ============================================================
// CANCEL SUBSCRIPTION
// ============================================================

// POST /api/subscriptions/cancel

export const cancelSubscription =
  async (req, res) => {

    try {

      const userId =
        req.user?._id ||
        req.user?.id;

      const user =
        await User.findById(
          userId
        );

      if (
        !user ||
        user.subscription?.status !==
        'active'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'No active subscription to cancel',
        });
      }

      user.subscription.status =
        'cancelled';

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          'Subscription cancelled successfully',
      });

    } catch (error) {

      // console.error(
      //   'Cancel subscription error:',
      //   error
      // );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ============================================================
// GET CURRENT SUBSCRIPTION
// ============================================================

// GET /api/subscriptions/current

export const getCurrentSubscription =
  async (req, res) => {

    try {

      const userId =
        req.user?._id ||
        req.user?.id;

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            'User not found',
        });
      }

      return res.status(200).json({
        success: true,

        data:
          user.subscription || {
            plan: 'free',
            status: 'inactive',
          },
      });

    } catch (error) {

      // console.error(
      //   'Get subscription error:',
      //   error
      // );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };