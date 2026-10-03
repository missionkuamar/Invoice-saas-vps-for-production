// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
// backend/src/server.js - Add these routes
import notificationRoutes from './routes/notificationRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import adminWithdrawalRoutes from './routes/adminWithdrawalRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import invoiceEmailRoutes from './routes/invoiceEmailRoutes.js';
import { startScheduler } from './services/scheduler.js';


dotenv.config();

const app = express();

// ✅ ES Module fix for __dirname
const __dirname = path.resolve();
// ✅ Load environment variables


// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ============ MIDDLEWARE ============

// Session middleware - MUST BE BEFORE ROUTES
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 30 * 24 * 60 * 60, // 30 days
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://invoicehub.fun',
  'https://www.invoicehub.fun',
  'https://invoicehub-fun-frontend-dmye.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // console.log('CORS Origin:', origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // console.log('❌ CORS BLOCKED:', origin);
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
// server.js / index.js
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ important!
    maxAge: 24 * 60 * 60 * 1000,
  }
}));
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});
// Static files
app.use('/uploads', express.static('uploads'));

// ============ ROUTES ============

// IMPORTANT: Public affiliate redirect route MUST be BEFORE other routes
// This handles /r/:slug redirects
app.get('/r/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { ref } = req.query;

    console.log("\n");
    console.log("==============================================");
    console.log("🌐 GET /r/:slug HIT");
    console.log("==============================================");

    console.log("📍 Full URL:", req.originalUrl);
    console.log("📍 Method:", req.method);
    console.log("📍 Slug:", slug);
    console.log("📍 Ref:", ref);
    console.log("📍 IP:", req.ip);
    console.log(
      "📍 User-Agent:",
      req.headers["user-agent"]
    );

    console.log(
      "🍪 Session ID:",
      req.sessionID || "NO SESSION"
    );

    console.log(
      "🍪 Session affiliateReferral:",
      req.session?.affiliateReferral || "NONE"
    );

    console.log(
      "📦 Importing trackAffiliateClick..."
    );

    const {
      trackAffiliateClick
    } = await import(
      './controllers/affiliateController.js'
    );

    console.log(
      "✅ trackAffiliateClick imported"
    );

    console.log(
      "🚀 Calling trackAffiliateClick..."
    );

    return trackAffiliateClick(req, res);

  } catch (error) {

    console.error(
      "\n❌ AFFILIATE ROUTE ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "URL:",
      req.originalUrl
    );

    console.error(
      "Params:",
      req.params
    );

    console.error(
      "Query:",
      req.query
    );

    return res.redirect('/');
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/affiliate', withdrawalRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/invoices', invoiceEmailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// ============ ERROR HANDLING ============

// 404 handler - Must be after all routes
// app.use((req, res) => {
//   console.log('404 Not Found:', req.method, req.url);
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.method} ${req.url} not found`,
//   });
// });

// Error handling middleware - Must be last
// app.use((err, req, res, next) => {
//   console.error('Error:', err.stack);
//   res.status(500).json({
//     success: false,
//     message: err.message || 'Something went wrong!',
//   });
// });

// Serve static files from the 'client/dist' folder

////app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Catch-all route to serve index.html for frontend React app (This should be last)
// app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  startScheduler();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
  console.log(`🔗 Affiliate links: http://localhost:${PORT}/r/:slug`);
});
