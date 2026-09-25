import Invoice from '../models/Invoice.js';
import { ScheduledEmail } from '../models/ScheduledEmail.js';
import {
  getInvoiceEmailHTML,
  getReminderEmailHTML,
  getOverdueEmailHTML,
  getPaymentConfirmationHTML,
  getCancellationEmailHTML,
  getRevisedEmailHTML,
  getBulkInvoiceEmailHTML,
  getRecurringInvoiceHTML,
  getProformaInvoiceHTML,
  getCreditNoteHTML
} from '../services/invoiceTemplates.js';
import { generateInvoicePDF } from '../services/pdfGenerator.js';
import mongoose from "mongoose";

import { checkEmailLimit } from '../middleware/emailLimit.js';
import { incrementEmailCount } from '../helpers/emailHelper.js';
import User from '../models/User.js';


const processEmailWithLimit = async (userId, emailData) => {
  const user = await User.findById(userId);
  
  // Check if user can send email
  const canSend = await user.canSendEmail();
  if (!canSend) {
    throw new Error(`Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`);
  }
  
  // Create scheduled email
  const scheduledEmail = await ScheduledEmail.create(emailData);
  
  // Increment email count
  await user.incrementEmailCount();
  
  return scheduledEmail;
};

// 1. Schedule Simple Email
export const scheduleEmail = async (req, res) => {
  try {

    // console.log('\n');
    // console.log('============================================');
    // console.log('📧 BACKEND: SCHEDULE EMAIL START');
    // console.log('============================================');

    // ============================================================
    // REQUEST DEBUG
    // ============================================================

    // console.log('\n📥 REQUEST BODY:');
    // console.log(req.body);

    // console.log('\n📥 REQUEST BODY JSON:');
    // console.log(
    //   JSON.stringify(req.body, null, 2)
    // );

    // console.log('\n👤 AUTH USER:');
    // console.log(req.user?._id);

    // console.log('\n🌍 SERVER ENVIRONMENT:');
    // console.log('NODE_ENV:', process.env.NODE_ENV);
    // console.log('Server Date:', new Date());
    // console.log(
    //   'Server ISO:',
    //   new Date().toISOString()
    // );

    // console.log(
    //   'Server timezone:',
    //   Intl.DateTimeFormat().resolvedOptions().timeZone
    // );

    // console.log(
    //   'Server timezone offset:',
    //   new Date().getTimezoneOffset()
    // );

    // ============================================================
    // GET REQUEST DATA
    // ============================================================

    const {
      toEmail,
      subject,
      message,
      scheduleTime,
    } = req.body;

    // console.log('\n📋 EXTRACTED DATA:');

    // console.log('toEmail:', toEmail);
    // console.log('subject:', subject);
    // console.log('message:', message);
    // console.log('scheduleTime:', scheduleTime);

    // console.log(
    //   'scheduleTime type:',
    //   typeof scheduleTime
    // );

    // ============================================================
    // VALIDATION
    // ============================================================

    // console.log('\n🔍 VALIDATING REQUEST...');

    if (
      !toEmail ||
      !subject ||
      !message ||
      !scheduleTime
    ) {

      // console.error(
      //   '❌ VALIDATION FAILED'
      // );

      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // console.log('✅ Validation passed');

    // ============================================================
    // DATE PARSING
    // ============================================================

    // console.log('\n🕐 DATE PARSING DEBUG');
    // console.log('Raw scheduleTime:', scheduleTime);

    const parsedScheduleTime =
      new Date(scheduleTime);

    // console.log(
    //   'Parsed Date object:',
    //   parsedScheduleTime
    // );

    // console.log(
    //   'Parsed ISO:',
    //   parsedScheduleTime.toISOString()
    // );

    // console.log(
    //   'Parsed local:',
    //   parsedScheduleTime.toString()
    // );

    // console.log(
    //   'Parsed locale:',
    //   parsedScheduleTime.toLocaleString()
    // );

    // console.log(
    //   'Parsed timestamp:',
    //   parsedScheduleTime.getTime()
    // );

    // console.log(
    //   'Current server time:',
    //   new Date()
    // );

    // console.log(
    //   'Current server ISO:',
    //   new Date().toISOString()
    // );

    // ============================================================
    // TIME DIFFERENCE
    // ============================================================

    const now = new Date();

    const differenceMs =
      parsedScheduleTime.getTime() -
      now.getTime();

    const differenceMinutes =
      differenceMs / (1000 * 60);

    // console.log('\n⏱️ SCHEDULE TIME DIFFERENCE:');

    // console.log(
    //   'Difference milliseconds:',
    //   differenceMs
    // );

    // console.log(
    //   'Difference minutes:',
    //   differenceMinutes
    // );

    // console.log(
    //   'Difference hours:',
    //   differenceMinutes / 60
    // );

    if (differenceMs < 0) {
      console.warn(
        '⚠️ WARNING: Scheduled time is already in the PAST!'
      );
    } else {
      // console.log(
      //   '✅ Scheduled time is in the FUTURE'
      // );
    }

    // ============================================================
    // INVALID DATE CHECK
    // ============================================================

    if (
      Number.isNaN(
        parsedScheduleTime.getTime()
      )
    ) {

      // console.error(
      //   '❌ INVALID SCHEDULE TIME'
      // );

      return res.status(400).json({
        success: false,
        message: 'Invalid schedule time',
      });
    }

    // console.log(
    //   '✅ Schedule time is valid'
    // );

    // ============================================================
    // USER FETCH
    // ============================================================

    // console.log('\n👤 FETCHING USER...');

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {

      // console.error(
      //   '❌ USER NOT FOUND'
      // );

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // console.log(
    //   '✅ User found:',
    //   user._id
    // );

    // ============================================================
    // EMAIL CREDIT CHECK
    // ============================================================

    // console.log('\n📊 EMAIL CREDIT CHECK');

    const canSend =
      await user.canSendEmail();

    // console.log(
    //   'Can send email:',
    //   canSend
    // );

    // console.log(
    //   'Plan:',
    //   user.subscription?.plan
    // );

    // console.log(
    //   'Email limit:',
    //   user.subscription?.limits?.emails?.total
    // );

    // console.log(
    //   'Email used:',
    //   user.subscription?.usage?.emails
    // );

    if (!canSend) {

      const emailLimit =
        user.subscription
          .limits
          .emails
          .total;

      const emailUsed =
        user.subscription
          .usage
          .emails;

      const remaining =
        Math.max(
          0,
          emailLimit - emailUsed
        );

      // console.error(
      //   '❌ EMAIL CREDIT LIMIT EXCEEDED'
      // );

      return res.status(403).json({
        success: false,

        message:
          `Email limit exceeded. You have used ${emailUsed} out of ${emailLimit} emails. Please upgrade your plan.`,

        data: {
          plan:
            user.subscription.plan,

          limit:
            emailLimit,

          used:
            emailUsed,

          remaining,

          startDate:
            user.subscription
              .currentPeriodStart,

          endDate:
            user.subscription
              .currentPeriodEnd,
        },
      });
    }

    // console.log(
    //   '✅ Email credit available'
    // );

    // ============================================================
    // CREATE DATABASE DOCUMENT
    // ============================================================

    // console.log(
    //   '\n💾 CREATING SCHEDULED EMAIL...'
    // );

    // console.log(
    //   'scheduleTime BEFORE MongoDB:',
    //   parsedScheduleTime
    // );

    // console.log(
    //   'scheduleTime ISO BEFORE MongoDB:',
    //   parsedScheduleTime.toISOString()
    // );

    const scheduledEmail =
      await ScheduledEmail.create({

        userId:
          req.user._id,

        toEmail,

        subject,

        message,

        scheduleTime:
          parsedScheduleTime,

      });

    // ============================================================
    // DATABASE RESULT
    // ============================================================

    // console.log(
    //   '\n✅ DATABASE DOCUMENT CREATED'
    // );

    // console.log(
    //   'MongoDB document:',
    //   scheduledEmail
    // );

    // console.log(
    //   'MongoDB _id:',
    //   scheduledEmail._id
    // );

    // console.log(
    //   'MongoDB scheduleTime:',
    //   scheduledEmail.scheduleTime
    // );

    // console.log(
    //   'MongoDB scheduleTime ISO:',
    //   scheduledEmail.scheduleTime.toISOString()
    // );

    // console.log(
    //   'MongoDB scheduleTime local:',
    //   scheduledEmail.scheduleTime.toString()
    // );

    // ============================================================
    // INCREMENT EMAIL USAGE
    // ============================================================

    // console.log(
    //   '\n📈 INCREMENTING EMAIL USAGE...'
    // );

    await user.incrementEmailCount();

    // console.log(
    //   '✅ Email usage incremented'
    // );

    // ============================================================
    // UPDATED STATS
    // ============================================================

    const emailLimit =
      user.subscription
        .limits
        .emails
        .total;

    const emailUsed =
      user.subscription
        .usage
        .emails;

    const emailRemaining =
      Math.max(
        0,
        emailLimit - emailUsed
      );

    const emailStats = {

      remaining:
        emailRemaining,

      used:
        emailUsed,

      limit:
        emailLimit,

      plan:
        user.subscription.plan,

      startDate:
        user.subscription
          .currentPeriodStart,

      endDate:
        user.subscription
          .currentPeriodEnd,
    };

    // console.log(
    //   '\n📊 UPDATED EMAIL STATS:'
    // );

    // console.log(emailStats);

    // // ============================================================
    // FINAL RESPONSE
    // ============================================================

    const responseData = {

      success: true,

      message:
        'Email scheduled successfully',

      data:
        scheduledEmail,

      emailStats,

    };

    // console.log(
    //   '\n📤 FINAL API RESPONSE:'
    // );

    // console.log(
    //   JSON.stringify(
    //     responseData,
    //     null,
    //     2
    //   )
    // );

    // console.log(
    //   '\n============================================'
    // );

    // console.log(
    //   '📧 BACKEND: SCHEDULE EMAIL END'
    // );

    // console.log(
    //   '============================================'
    // );

    return res.status(201).json(
      responseData
    );

  } catch (error) {

    // console.error('\n');
    // console.error(
    //   '============================================'
    // );

    // console.error(
    //   '❌ BACKEND SCHEDULE EMAIL ERROR'
    // );

    // console.error(
    //   '============================================'
    // );

    // console.error(
    //   'Error message:',
    //   error.message
    // );

    // console.error(
    //   'Error name:',
    //   error.name
    // );

    // console.error(
    //   'Error stack:',
    //   error.stack
    // );

    // console.error(
    //   'Request body:',
    //   req.body
    // );

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        'Failed to schedule email',

    });
  }
};

// 2. Send Invoice
export const sendInvoice = async (req, res) => {
  const requestId = `INV-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

  // console.log("\n");
  // console.log("====================================================");
  // console.log("📧 SEND INVOICE REQUEST START");
  // console.log("====================================================");
  // console.log("🆔 Request ID:", requestId);
  // console.log("⏰ Server Time:", new Date().toISOString());
  // console.log("🌍 Server Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
  // console.log("👤 User ID:", req.user?._id);
  // console.log("📦 Request Body:", {
  //   ...req.body,
  //   // Don't print potentially sensitive attachment contents
  //   attachments: Array.isArray(req.body?.attachments)
  //     ? `Array(${req.body.attachments.length})`
  //     : req.body?.attachments,
  // });

  try {
    // ============================================
    // 1. GET REQUEST DATA
    // ============================================

    const {
      invoiceId,
      scheduleTime,
      attachments = [],
    } = req.body;

    // console.log("\n📥 STEP 1 - REQUEST DATA");
    // console.log("--------------------------------------------");
    // console.log("📌 Invoice ID:", invoiceId);
    // console.log("📌 Schedule Time:", scheduleTime);
    // console.log(
    //   "📌 Attachments Count:",
    //   Array.isArray(attachments) ? attachments.length : "Invalid"
    // );

    // ============================================
    // 2. VALIDATE INVOICE ID
    // ============================================

    // console.log("\n🔍 STEP 2 - VALIDATING INVOICE ID");

    if (!invoiceId) {
      // console.error("❌ Invoice ID missing");

      return res.status(400).json({
        success: false,
        message: "Invoice id is required",
        requestId,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      // console.error("❌ Invalid Invoice ID:", invoiceId);

      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
        requestId,
      });
    }

    // console.log("✅ Invoice ID valid");

    // ============================================
    // 3. FIND INVOICE
    // ============================================

    // console.log("\n🔍 STEP 3 - FINDING INVOICE");

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      // console.error("❌ Invoice not found");
      // console.error("📌 Invoice ID:", invoiceId);
      // console.error("👤 User ID:", req.user._id);

      return res.status(404).json({
        success: false,
        message: "Invoice not found",
        requestId,
      });
    }

    // console.log("✅ Invoice found");
    // console.log("📌 Invoice Number:", invoice.invoiceNumber);
    // console.log("📌 Invoice Status:", invoice.status);
    // console.log("📌 Client Name:", invoice.client?.name);
    // console.log("📌 Client Email:", invoice.client?.email);

    // ============================================
    // 4. CLIENT EMAIL VALIDATION
    // ============================================

    // console.log("\n📧 STEP 4 - VALIDATING CLIENT EMAIL");

    if (!invoice.client?.email) {
      // console.error("❌ Client email missing");
      // console.error("📌 Invoice:", invoice.invoiceNumber);

      return res.status(400).json({
        success: false,
        message: "Client email is required",
        requestId,
      });
    }

    // console.log("✅ Client email available");

    // ============================================
    // 5. GET USER
    // ============================================

    // console.log("\n👤 STEP 5 - FETCHING USER");

    const user = await User.findById(req.user._id);

    if (!user) {
      // console.error("❌ User not found");
      // console.error("👤 User ID:", req.user._id);

      return res.status(404).json({
        success: false,
        message: "User not found",
        requestId,
      });
    }

    // console.log("✅ User found");
    // console.log("📌 User ID:", user._id);
    // console.log("📌 User Email:", user.email);
    // console.log("📌 Plan:", user.subscription?.plan);
    // console.log(
    //   "📌 Email Used:",
    //   user.subscription?.limits?.used
    // );
    // console.log(
    //   "📌 Email Monthly Limit:",
    //   user.subscription?.limits?.monthly
    // );

    // ============================================
    // 6. CHECK EMAIL LIMIT
    // ============================================

    // console.log("\n📊 STEP 6 - CHECKING EMAIL LIMIT");

    const canSend = await user.canSendEmail();

    // console.log("📊 Can Send Email:", canSend);

    if (!canSend) {
      // console.error("❌ EMAIL LIMIT EXCEEDED");

      // console.error("📌 Plan:", user.subscription?.plan);
      // console.error(
        // "📌 Used:",
        // user.subscription?.limits?.used
      // );
      // console.error(
      //   "📌 Limit:",
      //   user.subscription?.limits?.monthly
      // );

      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        requestId,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        },
      });
    }

    // console.log("✅ Email limit available");
    // console.log(
    //   "📊 Remaining:",
    //   user.getRemainingEmails()
    // );

    // ============================================
    // 7. VALIDATE SCHEDULE TIME
    // ============================================

    // console.log("\n🕐 STEP 7 - VALIDATING SCHEDULE TIME");

    let scheduledAt;

    if (scheduleTime) {
      // console.log("📥 Received Schedule Time:", scheduleTime);

      scheduledAt = new Date(scheduleTime);

      // console.log(
      //   "📅 Parsed Date:",
      //   scheduledAt.toString()
      // );

      // console.log(
      //   "🌍 UTC Date:",
      //   scheduledAt.toISOString()
      // );

      // console.log(
      //   "🔢 Timestamp:",
      //   scheduledAt.getTime()
      // );

      if (isNaN(scheduledAt.getTime())) {
        // console.error("❌ INVALID SCHEDULE TIME");
        // console.error("📥 Received:", scheduleTime);

        return res.status(400).json({
          success: false,
          message: "Invalid schedule time",
          requestId,
        });
      }

      // Prevent scheduling in the past
      if (scheduledAt.getTime() <= Date.now()) {
        // console.error("❌ SCHEDULE TIME IS IN THE PAST");

        // console.error(
        //   "📅 Scheduled:",
        //   scheduledAt.toISOString()
        // );

        // console.error(
        //   "⏰ Current:",
        //   new Date().toISOString()
        // );

        return res.status(400).json({
          success: false,
          message: "Schedule time must be in the future",
          requestId,
          data: {
            scheduleTime: scheduledAt.toISOString(),
            currentTime: new Date().toISOString(),
          },
        });
      }

      // console.log("✅ Schedule time is valid");
      // console.log(
      //   "⏰ Final UTC:",
      //   scheduledAt.toISOString()
      // );

    } else {
      scheduledAt = new Date();

      // console.log(
      //   "⚡ No schedule time provided."
      // );

      // console.log(
      //   "📤 Email will be queued immediately."
      // );

      // console.log(
      //   "⏰ Current UTC:",
      //   scheduledAt.toISOString()
      // );
    }

    // ============================================
    // 8. GENERATE PDF
    // ============================================

    // console.log("\n📄 STEP 8 - GENERATING INVOICE PDF");

    // console.log(
    //   "📌 Invoice:",
    //   invoice.invoiceNumber
    // );

    const pdfStartTime = Date.now();

    const pdfPath = await generateInvoicePDF(invoice);

    const pdfDuration = Date.now() - pdfStartTime;

    // console.log(
    //   "⏱️ PDF Generation Time:",
    //   `${pdfDuration}ms`
    // );

    // console.log("📄 PDF Path:", pdfPath);

    if (!pdfPath) {
      // console.error("❌ PDF GENERATION FAILED");

      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice PDF",
        requestId,
      });
    }

    // console.log("✅ PDF generated successfully");

    // ============================================
    // 9. CREATE ATTACHMENTS
    // ============================================

    // console.log("\n📎 STEP 9 - PREPARING ATTACHMENTS");

    const emailAttachments = [
      {
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ];

    // console.log("📎 Default Invoice PDF added");

    if (Array.isArray(attachments) && attachments.length > 0) {
      // console.log(
      //   "📎 Adding additional attachments:",
      //   attachments.length
      // );

      emailAttachments.push(...attachments);
    }

    // console.log(
    //   "📎 Total Attachments:",
    //   emailAttachments.length
    // );

    // ============================================
    // 10. CREATE SCHEDULED EMAIL
    // ============================================

    // console.log("\n💾 STEP 10 - CREATING SCHEDULED EMAIL");

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,

      toEmail: invoice.client.email,

      subject: `Invoice #${invoice.invoiceNumber} from ${
        req.user.name || "Your Company"
      }`,

      message: getInvoiceEmailHTML(invoice),

      scheduleTime: scheduledAt,

      attachments: emailAttachments,

      emailType: "invoice",

      invoiceId: invoice._id,
    });

    // console.log("✅ Scheduled email created");

    // console.log("📌 Scheduled Email ID:", scheduledEmail._id);
    // console.log("📌 Email Type:", scheduledEmail.emailType);
    // console.log("📌 To:", scheduledEmail.toEmail);

    // console.log(
    //   "📌 Schedule Time:",
    //   scheduledEmail.scheduleTime
    // );

  //   console.log(
  //     "🌍 Schedule Time UTC:",
  //     scheduledEmail.scheduleTime?.toISOString()
  //  );

    // ============================================
    // 11. INCREMENT EMAIL COUNT
    // ============================================

    // console.log("\n📊 STEP 11 - INCREMENTING EMAIL COUNT");

    const previousEmailUsed =
      user.subscription?.limits?.used;

    await user.incrementEmailCount();

    // console.log(
    //   "📊 Previous Used:",
    //   previousEmailUsed
    // );

    // console.log(
    //   "📊 New Used:",
    //   user.subscription?.limits?.used
    // );

    // console.log(
    //   "📊 Remaining:",
    //   user.getRemainingEmails()
    // );

    // ============================================
    // 12. UPDATE INVOICE STATUS
    // ============================================

    // console.log("\n🧾 STEP 12 - UPDATING INVOICE STATUS");

    const previousInvoiceStatus = invoice.status;

    invoice.status = "sent";

    await invoice.save();

    // console.log(
    //   "📌 Previous Status:",
    //   previousInvoiceStatus
    // );

    // console.log(
    //   "📌 New Status:",
    //   invoice.status
    // );

    // console.log("✅ Invoice updated");

    // ============================================
    // 13. SUCCESS RESPONSE
    // ============================================

    // console.log("\n");
    // console.log("====================================================");
    // console.log("✅ SEND INVOICE SUCCESS");
    // console.log("====================================================");

    // console.log("🆔 Request ID:", requestId);
    // console.log("📌 Invoice:", invoice.invoiceNumber);
    // console.log("📌 Scheduled Email:", scheduledEmail._id);
    // console.log("📧 To:", scheduledEmail.toEmail);
    // console.log(
    //   "⏰ Schedule:",
    //   scheduledEmail.scheduleTime?.toISOString()
    // );

    return res.status(201).json({
      success: true,

      message: scheduleTime
        ? "Invoice scheduled successfully"
        : "Invoice queued successfully",

      requestId,

      data: scheduledEmail,

      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      },
    });

  } catch (error) {

    // ============================================
    // GLOBAL ERROR HANDLER
    // ============================================

    // console.error("\n");
    // console.error("====================================================");
    // console.error("❌ SEND INVOICE FAILED");
    // console.error("====================================================");

    // console.error("🆔 Request ID:", requestId);
    // console.error("⏰ Time:", new Date().toISOString());

    // console.error("❌ Error Name:", error.name);
    // console.error("❌ Error Message:", error.message);
    // console.error("❌ Error Code:", error.code);
    // console.error("❌ Error Stack:", error.stack);

    // MongoDB specific information
    if (error.name === "ValidationError") {
      // console.error("📛 Mongoose Validation Error");

      if (error.errors) {
        Object.keys(error.errors).forEach((field) => {
          // console.error(
          //   `❌ ${field}:`,
          //   error.errors[field].message
          // );
        });
      }
    }

    if (error.name === "CastError") {
      // console.error("📛 Mongoose Cast Error");
      // console.error("📌 Path:", error.path);
      // console.error("📌 Value:", error.value);
    }

    if (error.code === 11000) {
      // console.error("📛 MongoDB Duplicate Key Error");
      // console.error("📌 Key:", error.keyValue);
    }

    // console.error("📦 Request Body:", {
    //   invoiceId: req.body?.invoiceId,
    //   scheduleTime: req.body?.scheduleTime,
    //   attachmentsCount: Array.isArray(req.body?.attachments)
    //     ? req.body.attachments.length
    //     : 0,
    // });

    // console.error("👤 User ID:", req.user?._id);

    // console.error("====================================================");
    // console.error("❌ END ERROR");
    // console.error("====================================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      requestId,
    });
  }
};

// 3. Payment Reminder ⏰
export const sendPaymentReminder = async (req, res) => {
  try {
    const { invoiceId, scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);

    const daysLeft = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: daysLeft >= 0
        ? `⏰ Reminder: Invoice #${invoice.invoiceNumber} due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
        : `⚠️ Invoice #${invoice.invoiceNumber} is overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`,
      message: getReminderEmailHTML(invoice, daysLeft),
      scheduleTime: scheduledAt,
      emailType: "reminder",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    return res.status(201).json({
      success: true,
      message: "Payment reminder scheduled successfully",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Payment Reminder Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// 4. Overdue Payment Alert 🚨
export const sendOverdueAlert = async (req, res) => {
  try {
    const { invoiceId, scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    let daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue < 0) daysOverdue = 0;

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `🚨 OVERDUE: Invoice #${invoice.invoiceNumber} - ${daysOverdue} Day${daysOverdue !== 1 ? "s" : ""} Overdue`,
      message: getOverdueEmailHTML(invoice, daysOverdue),
      scheduleTime: scheduledAt,
      emailType: "overdue",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    invoice.status = "overdue";
    await invoice.save();

    return res.status(201).json({
      success: true,
      message: "Overdue alert scheduled successfully",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Overdue Alert Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// 5. Payment Confirmation ✅
export const sendPaymentConfirmation = async (req, res) => {
  try {
    const { invoiceId, paymentDetails = {}, scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already marked as paid.",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    // console.log("user", user )
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.usage?.emails} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `✅ Payment Confirmed - Invoice #${invoice.invoiceNumber}`,
      message: getPaymentConfirmationHTML(invoice, paymentDetails),
      scheduleTime: scheduledAt,
      emailType: "confirmation",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    invoice.status = "paid";
    await invoice.save();

    return res.status(201).json({
      success: true,
      message: "Payment confirmation scheduled successfully.",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Payment Confirmation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// 6. Invoice Cancellation ❌
export const sendCancellation = async (req, res) => {
  try {
    const { invoiceId, reason = "No reason provided.", scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already cancelled.",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `❌ Invoice #${invoice.invoiceNumber} Cancelled`,
      message: getCancellationEmailHTML(invoice, reason),
      scheduleTime: scheduledAt,
      emailType: "cancellation",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    invoice.status = "cancelled";
    await invoice.save();

    return res.status(201).json({
      success: true,
      message: "Cancellation email scheduled successfully.",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Cancellation Email Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// 7. Invoice Updated/Revised 📝
export const sendRevisedInvoice = async (req, res) => {
  // console.log("\n================== sendRevisedInvoice ==================");
  // console.log("📥 Request Body:", JSON.stringify(req.body, null, 2));
  // console.log("👤 User:", req.user?._id);

  try {
    const { invoiceId, changes = [], scheduleTime } = req.body;

    // console.log("📌 Invoice ID:", invoiceId);
    // console.log("📌 Changes:", changes);
    // console.log("📌 Changes Type:", typeof changes);
    // console.log("📌 Is Array:", Array.isArray(changes));
    // console.log("📌 Schedule Time:", scheduleTime);

    // Validate Invoice ID
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
     // console.log("❌ Invalid Invoice ID");
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

   // console.log("🔍 Finding Invoice...");

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

  //  console.log("📄 Invoice:", invoice);

    if (!invoice) {
     // console.log("❌ Invoice Not Found");
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

   // console.log("📧 Client:", invoice.client);

    if (!invoice.client?.email) {
  //    console.log("❌ Client Email Missing");
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    ///console.log("📌 Invoice Status:", invoice.status);

    if (invoice.status === "cancelled") {
     // console.log("❌ Invoice Cancelled");
      return res.status(400).json({
        success: false,
        message: "Cancelled invoices cannot be revised.",
      });
    }

   // console.log("👤 Finding User...");

    const user = await User.findById(req.user._id);

   // console.log("👤 User Found:", !!user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //console.log("📬 Checking Email Limit...");

    const canSend = await user.canSendEmail();

   // console.log("📬 Can Send:", canSend);
   // console.log("📬 Remaining:", user.getRemainingEmails());

    if (!canSend) {
     // console.log("❌ Email Limit Exceeded");

      return res.status(403).json({
        success: false,
        message: "Email limit exceeded.",
      });
    }

    const scheduledAt = scheduleTime
      ? new Date(scheduleTime)
      : new Date();

   // console.log("⏰ Scheduled At:", scheduledAt);

    if (isNaN(scheduledAt.getTime())) {
     // console.log("❌ Invalid Schedule Time");

      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    //console.log("\n================ TEMPLATE DEBUG ================");

    // console.log("Changes Raw:", changes);
    // console.log("Changes Type:", typeof changes);
    // console.log("Is Array:", Array.isArray(changes));

    if (Array.isArray(changes)) {
     // console.log("Array Length:", changes.length);

      changes.forEach((item, index) => {
      //  console.log(`changes[${index}] =>`, item);
      });
    } else {
      // console.log("❌ changes is NOT an array");
    }

    // console.log("Generating HTML...");

    const html = getRevisedEmailHTML(invoice, changes);

    // console.log("✅ HTML Generated");
    // console.log("HTML Length:", html.length);

    // console.log("Creating Scheduled Email...");

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `📝 Revised Invoice #${invoice.invoiceNumber}`,
      message: html,
      scheduleTime: scheduledAt,
      emailType: "revised",
      invoiceId: invoice._id,
    });

    // console.log("✅ Scheduled Email Created");
   ////////////// console.log(scheduledEmail);

    // console.log("Increment Email Count...");

    await user.incrementEmailCount();

    // console.log("✅ Email Count Updated");

    // console.log("================ SUCCESS ================\n");

    return res.status(201).json({
      success: true,
      message: "Revised invoice scheduled successfully.",
      data: scheduledEmail,
    });

  } catch (error) {
    // console.log("\n================ ERROR ================");
    // console.error(error);
    // console.error(error.stack);

    if (req.body) {
      // console.log("Request Body:", JSON.stringify(req.body, null, 2));
      // console.log("Changes:", req.body.changes);
      // console.log("Changes Type:", typeof req.body.changes);
      // console.log("Is Array:", Array.isArray(req.body.changes));
    }

    // console.log("=======================================\n");

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Bulk Invoice to Multiple Clients 📨
export const sendBulkInvoices = async (req, res) => {
  try {
    const { invoices = [], scheduleTime } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoices array is required.",
      });
    }

    // Check email limit for each invoice
    const user = await User.findById(req.user._id);
    const remainingEmails = user.getRemainingEmails();
    
    if (remainingEmails < invoices.length) {
      return res.status(403).json({
        success: false,
        message: `Not enough email credits. You need ${invoices.length} emails but only ${remainingEmails} remaining.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: remainingEmails,
          required: invoices.length,
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time.",
      });
    }

    const scheduledEmails = [];
    const failedInvoices = [];

    for (const item of invoices) {
      try {
        if (!item.invoiceId || !mongoose.Types.ObjectId.isValid(item.invoiceId)) {
          failedInvoices.push({ invoiceId: item.invoiceId, reason: "Invalid invoice id" });
          continue;
        }

        const invoice = await Invoice.findOne({
          _id: item.invoiceId,
          user: req.user._id,
        });

        if (!invoice) {
          failedInvoices.push({ invoiceId: item.invoiceId, reason: "Invoice not found" });
          continue;
        }

        if (!invoice.client?.email) {
          failedInvoices.push({ invoiceId: invoice._id, reason: "Client email not found" });
          continue;
        }

        const pdfPath = await generateInvoicePDF(invoice);

        if (!pdfPath) {
          failedInvoices.push({ invoiceId: invoice._id, reason: "PDF generation failed" });
          continue;
        }

        const scheduledEmail = await ScheduledEmail.create({
          userId: req.user._id,
          toEmail: invoice.client.email,
          subject: `Invoice #${invoice.invoiceNumber} from ${req.user.name || "Your Company"}`,
          message: getBulkInvoiceEmailHTML(invoice),
          scheduleTime: scheduledAt,
          attachments: [{
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            path: pdfPath,
            contentType: "application/pdf",
          }],
          emailType: "invoice",
          invoiceId: invoice._id,
        });

        scheduledEmails.push(scheduledEmail);

        // Increment email count for each successful email
        await user.incrementEmailCount();

        invoice.status = "sent";
        await invoice.save();
      } catch (err) {
        // console.error(err);
        failedInvoices.push({
          invoiceId: item.invoiceId,
          reason: err.message,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `${scheduledEmails.length} invoice(s) scheduled successfully.`,
      successCount: scheduledEmails.length,
      failedCount: failedInvoices.length,
      scheduledEmails,
      failedInvoices,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Bulk Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// 9. Recurring Invoice 🔄
export const sendRecurringInvoice = async (req, res) => {
  try {
    const { invoiceId, cycle, scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const allowedCycles = ["daily", "weekly", "monthly", "quarterly", "yearly"];

    if (!cycle || !allowedCycles.includes(cycle.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Cycle must be one of: ${allowedCycles.join(", ")}`,
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled invoices cannot be scheduled as recurring.",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `🔄 Recurring Invoice #${invoice.invoiceNumber} - ${cycle}`,
      message: getRecurringInvoiceHTML(invoice, cycle),
      scheduleTime: scheduledAt,
      emailType: "recurring",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    return res.status(201).json({
      success: true,
      message: "Recurring invoice scheduled successfully.",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Recurring Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// 10. Proforma Invoice 📄
export const sendProformaInvoice = async (req, res) => {
  try {
    const { invoiceId, scheduleTime } = req.body;
    
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }
    
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    
    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }
    
    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled invoices cannot be sent as proforma invoices.",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `📄 Proforma Invoice #${invoice.invoiceNumber}`,
      message: getProformaInvoiceHTML(invoice),
      scheduleTime: scheduledAt,
      emailType: "proforma",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    return res.status(201).json({
      success: true,
      message: "Proforma invoice scheduled successfully.",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Proforma Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// 11. Credit Note 💳
export const sendCreditNote = async (req, res) => {
  try {
    const { invoiceId, creditAmount, reason = "Discount / Refund", scheduleTime } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    if (creditAmount === undefined || isNaN(creditAmount) || Number(creditAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid credit amount is required.",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue a credit note for a cancelled invoice.",
      });
    }

    if (Number(creditAmount) > Number(invoice.total)) {
      return res.status(400).json({
        success: false,
        message: "Credit amount cannot exceed invoice total.",
      });
    }

    // Check email limit
    const user = await User.findById(req.user._id);
    const canSend = await user.canSendEmail();
    
    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: `Email limit exceeded. You have used ${user.subscription.limits.used} out of ${user.subscription.limits.monthly} emails.`,
        data: {
          plan: user.subscription.plan,
          limit: user.subscription.limits.monthly,
          used: user.subscription.limits.used,
          remaining: user.getRemainingEmails(),
        }
      });
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule time",
      });
    }

    const scheduledEmail = await ScheduledEmail.create({
      userId: req.user._id,
      toEmail: invoice.client.email,
      subject: `💳 Credit Note for Invoice #${invoice.invoiceNumber}`,
      message: getCreditNoteHTML(invoice, creditAmount, reason),
      scheduleTime: scheduledAt,
      emailType: "credit_note",
      invoiceId: invoice._id,
    });

    // Increment email count
    await user.incrementEmailCount();

    return res.status(201).json({
      success: true,
      message: "Credit note scheduled successfully.",
      data: scheduledEmail,
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
        plan: user.subscription.plan,
      }
    });
  } catch (error) {
    // console.error("Credit Note Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// backend/src/controllers/emailController.js

// Get email stats summary
export const getEmailStatsSummary = async (req, res) => {
  try {
    const userId = req.user._id;
//console.log("userId : " ,userId)
    // Get counts by status
    const totalEmails = await ScheduledEmail.countDocuments({ userId });
    const pendingEmails = await ScheduledEmail.countDocuments({ 
      userId, 
      status: 'pending' 
    });
    const sentEmails = await ScheduledEmail.countDocuments({ 
      userId, 
      status: 'sent' 
    });
    const failedEmails = await ScheduledEmail.countDocuments({ 
      userId, 
      status: 'failed' 
    });

    // Get counts by email type
    const emailTypeStats = await ScheduledEmail.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: '$emailType', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly stats (last 12 months)
    const monthlyStats = await ScheduledEmail.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get user subscription info for email limits
    const user = await User.findById(userId);
    
    // Calculate remaining emails
    const remaining = user.getRemainingEmails ? user.getRemainingEmails() : 
      Math.max(0, (user.subscription?.limits?.monthly || 5) - (user.subscription?.limits?.used || 0));

    res.json({
      success: true,
      data: {
        total: totalEmails,
        pending: pendingEmails,
        sent: sentEmails,
        failed: failedEmails,
        byType: emailTypeStats,
        monthly: monthlyStats,
        usage: {
          plan: user.subscription?.plan || 'free',
          limit: user.subscription?.limits?.monthly || 5,
          used: user.subscription?.limits?.used || 0,
          remaining: remaining,
          resetDate: user.subscription?.limits?.resetDate || new Date()
        }
      }
    });

  } catch (error) {
    // console.error('Get Email Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get email usage stats only (simpler version)
export const getEmailStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Calculate remaining emails
    const remaining = user.getRemainingEmails ? user.getRemainingEmails() : 
      Math.max(0, (user.subscription?.limits?.monthly || 5) - (user.subscription?.limits?.used || 0));

    const stats = {
      plan: user.subscription?.plan || 'free',
      limit: user.subscription?.limits?.monthly || 5,
      used: user.subscription?.limits?.used || 0,
      remaining: remaining,
      resetDate: user.subscription?.limits?.resetDate || new Date(),
      percentage: user.subscription?.limits?.monthly ? 
        Math.round((user.subscription.limits.used / user.subscription.limits.monthly) * 100) : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    // console.error('Get Email Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
// Get all scheduled emails with search, filters & pagination
export const getMyEmails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      emailType = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Search by email, subject, invoice number, or client name
    if (search) {
      query.$or = [
        { toEmail: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        // Search in populated invoice fields
        ...(mongoose.Types.ObjectId.isValid(search) 
          ? [{ invoiceId: new mongoose.Types.ObjectId(search) }] 
          : [])
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by email type
    if (emailType) {
      query.emailType = emailType;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.scheduleTime = {};
      if (startDate) {
        query.scheduleTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.scheduleTime.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [emails, totalCount] = await Promise.all([
      ScheduledEmail.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'invoiceId',
          select: 'invoiceNumber clientName clientEmail total status dueDate'
        })
        .lean(),
      ScheduledEmail.countDocuments(query)
    ]);

    // Get email stats
    const user = await User.findById(req.user._id);
    const stats = {
      plan: user.subscription.plan,
      limit: user.subscription.limits.monthly,
      used: user.subscription.limits.used,
      remaining: user.getRemainingEmails(),
      resetDate: user.subscription.limits.resetDate,
    };

    res.json({
      success: true,
      data: emails,
      stats: stats,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: parseInt(page) * limitNum < totalCount,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        status,
        emailType,
        search,
        startDate,
        endDate,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    // console.error('Get My Emails Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get email by ID (for details view)
export const getEmailById = async (req, res) => {
  try {
    const email = await ScheduledEmail.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('invoiceId');

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get email stats summary
// export const getEmailStatsSummary = async (req, res) => {
//   try {
//     const totalEmails = await ScheduledEmail.countDocuments({ userId: req.user._id });
//     const pendingEmails = await ScheduledEmail.countDocuments({ 
//       userId: req.user._id, 
//       status: 'pending' 
//     });
//     const sentEmails = await ScheduledEmail.countDocuments({ 
//       userId: req.user._id, 
//       status: 'sent' 
//     });
//     const failedEmails = await ScheduledEmail.countDocuments({ 
//       userId: req.user._id, 
//       status: 'failed' 
//     });

//     // Group by email type
//     const emailTypeStats = await ScheduledEmail.aggregate([
//       { $match: { userId: req.user._id } },
//       { $group: { _id: '$emailType', count: { $sum: 1 } } },
//       { $sort: { count: -1 } }
//     ]);

//     // Group by month
//     const monthlyStats = await ScheduledEmail.aggregate([
//       { $match: { userId: req.user._id } },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$createdAt' },
//             month: { $month: '$createdAt' }
//           },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { '_id.year': -1, '_id.month': -1 } },
//       { $limit: 12 }
//     ]);

//     const user = await User.findById(req.user._id);

//     res.json({
//       success: true,
//       data: {
//         total: totalEmails,
//         pending: pendingEmails,
//         sent: sentEmails,
//         failed: failedEmails,
//         byType: emailTypeStats,
//         monthly: monthlyStats,
//         usage: {
//           plan: user.subscription.plan,
//           limit: user.subscription.limits.monthly,
//           used: user.subscription.limits.used,
//           remaining: user.getRemainingEmails(),
//           resetDate: user.subscription.limits.resetDate,
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// Delete scheduled email
export const deleteEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending'
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found or already sent'
      });
    }

    await email.deleteOne();

    // Get updated stats
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Email deleted successfully',
      emailStats: {
        remaining: user.getRemainingEmails(),
        used: user.subscription.limits.used,
        limit: user.subscription.limits.monthly,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get email usage stats
// export const getEmailStats = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
    
//     const stats = {
//       plan: user.subscription.plan,
//       limit: user.subscription.limits.monthly,
//       used: user.subscription.limits.used,
//       remaining: user.getRemainingEmails(),
//       resetDate: user.subscription.limits.resetDate,
//       percentage: Math.round((user.subscription.limits.used / user.subscription.limits.monthly) * 100),
//     };

//     res.json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };