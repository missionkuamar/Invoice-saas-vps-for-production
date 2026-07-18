InvoicePro - Complete SaaS Invoice Generator
🚀 Overview
InvoicePro is a complete SaaS (Software as a Service) platform for generating professional invoices with multiple templates, subscription management, affiliate marketing, and admin dashboard. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

✨ Features
🎯 Core Features
✅ User Authentication - JWT-based login/register system

✅ Invoice Generation - 5+ professional invoice templates

✅ Subscription Plans - Basic, Pro, Enterprise with Razorpay integration

✅ Company Profile - Manage company details, logo, tax settings

✅ Affiliate Program - Referral system with commission tracking

✅ Withdrawal System - Affiliates can withdraw earnings

✅ Admin Panel - Full control over users, invoices, withdrawals

✅ Notifications - Real-time admin and user notifications

✅ Responsive Design - Works on all devices

📄 Invoice Templates
Standard - Classic, clean design for all businesses

Modern - Purple gradient, contemporary design

Minimal - Simple, lightweight, focus on content

Professional - Corporate style, formal layout

Creative - Colorful, artistic design for creative agencies

💰 Subscription Plans
Plan	Price	Features
Free	₹0	5 invoices/month
Basic	₹499	50 invoices/month, PDF export
Pro	₹999	200 invoices/month, Analytics, Custom branding
Enterprise	₹2999	Unlimited invoices, API access, White-label
👥 Affiliate Program
✅ Earn 10% commission on referrals

✅ Create custom affiliate links

✅ Track clicks, referrals, and conversions

✅ Withdraw earnings via Bank/UPI/PayPal

✅ Real-time affiliate dashboard

🛠️ Tech Stack
Backend
Node.js - Runtime environment

Express.js - Web framework

MongoDB - Database

Mongoose - ODM

JWT - Authentication

Razorpay - Payment gateway

Cloudinary - Image upload

Nodemailer - Email notifications

Frontend
React - UI framework

Redux Toolkit - State management

Tailwind CSS - Styling

Vite - Build tool

React Router DOM - Routing

React Hook Form - Form handling

React Hot Toast - Notifications

Date-fns - Date formatting

📁 Project Structure
text
invoice-saas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── razorpay.js
│   │   │   └── cloudinary.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Invoice.js
│   │   │   ├── Subscription.js
│   │   │   ├── Affiliate.js
│   │   │   ├── AffiliateReferral.js
│   │   │   ├── AffiliateWithdrawal.js
│   │   │   ├── Notification.js
│   │   │   └── Company.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── subscriptionController.js
│   │   │   ├── affiliateController.js
│   │   │   ├── affiliateWithdrawalController.js
│   │   │   ├── adminController.js
│   │   │   └── notificationController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   ├── subscriptionRoutes.js
│   │   │   ├── affiliateRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── invoices/
│   │   │   └── subscription/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── affiliate/
│   │   ├── store/
│   │   │   └── slices/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── README.md
🚀 Installation
Prerequisites
Node.js (v16+)

MongoDB

npm or yarn

Backend Setup
Clone the repository

bash
git clone https://github.com/yourusername/invoice-saas.git
cd invoice-saas/backend
Install dependencies

bash
npm install
Create .env file

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoice_saas
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET_KEY=your_admin_secret_key
SESSION_SECRET=your_session_secret
Create admin user

bash
node src/scripts/createAdmin.js
Run the server

bash
npm run dev
Frontend Setup
Navigate to frontend

bash
cd ../frontend
Install dependencies

bash
npm install
Create .env file

env
VITE_API_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
Run the frontend

bash
npm run dev
🎯 API Endpoints
Authentication
text
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
GET    /api/auth/profile        - Get user profile
PUT    /api/auth/profile        - Update user profile
Invoices
text
GET    /api/invoices            - Get all invoices
POST   /api/invoices            - Create invoice
GET    /api/invoices/:id        - Get single invoice
PUT    /api/invoices/:id        - Update invoice
DELETE /api/invoices/:id        - Delete invoice
Subscriptions
text
GET    /api/subscriptions/plans - Get all plans
POST   /api/subscriptions/create-order - Create Razorpay order
POST   /api/subscriptions/verify - Verify payment
POST   /api/subscriptions/cancel - Cancel subscription
Affiliate
text
POST   /api/affiliate/join      - Join affiliate program
GET    /api/affiliate/dashboard - Get affiliate dashboard
POST   /api/affiliate/links     - Create affiliate link
GET    /api/affiliate/links     - Get all links
POST   /api/affiliate/withdraw  - Request withdrawal
GET    /api/affiliate/withdrawals - Get withdrawal history
Admin
text
GET    /api/admin/stats         - Dashboard stats
GET    /api/admin/users         - Get all users
PUT    /api/admin/users/:id     - Update user
DELETE /api/admin/users/:id     - Delete user
GET    /api/admin/withdrawals   - Get all withdrawals
PUT    /api/admin/withdrawals/:id - Update withdrawal
🎨 UI Routes
Path	Page	Access
/	Dashboard	Authenticated
/login	Login	Public
/register	Register	Public
/dashboard	Dashboard	User
/invoices	Invoices	User
/create-invoice	Create Invoice	User
/subscription	Subscription Plans	User
/affiliate	Affiliate Dashboard	User
/affiliate/withdrawals	Withdrawals	User
/settings	Settings	User
/admin/dashboard	Admin Dashboard	Admin
/admin/users	Users	Admin
/admin/withdrawals	Withdrawals	Admin
/admin/notifications	Notifications	Admin
💳 Payment Integration
Razorpay Setup
Create account on Razorpay

Get API keys from dashboard

Add keys to .env file

Test mode: Use test keys first

Subscription Flow






🏦 Withdrawal System
Affiliate Withdrawal Process







Payment Methods Supported
🏦 Bank Transfer

📱 UPI

💳 PayPal

💰 Razorpay Payout

🔐 Admin Access
Creating Admin User
bash
# Run the admin creation script
node backend/src/scripts/createAdmin.js

# Or use API
POST /api/auth/create-admin
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "admin123456",
  "secretKey": "your_admin_secret_key"
}
Admin Features
✅ View all users

✅ Manage user roles

✅ View all invoices

✅ Process withdrawal requests

✅ View notifications

✅ System monitoring

📊 Database Schema
User
javascript
{
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  subscription: {
    plan: String,
    status: String,
    startDate: Date,
    endDate: Date
  },
  company: {
    name: String,
    address: String,
    phone: String,
    gst: String
  }
}
Invoice
javascript
{
  user: ObjectId,
  invoiceNumber: String,
  client: {
    name: String,
    email: String,
    phone: String,
    address: String,
    gst: String
  },
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    taxRate: Number
  }],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: String,
  issueDate: Date,
  dueDate: Date
}
Affiliate
javascript
{
  user: ObjectId,
  affiliateCode: String,
  commissionRate: Number,
  totalEarnings: Number,
  totalReferrals: Number,
  totalConversions: Number,
  monthlyEarnings: [{
    month: Number,
    year: Number,
    amount: Number
  }]
}
🚀 Deployment
Backend Deployment (Vercel/Heroku)
bash
# Build for production
npm run build

# Set environment variables
# Deploy to your hosting platform
Frontend Deployment (Vercel/Netlify)
bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
📝 Environment Variables
Backend (.env)
env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET_KEY=your_admin_secret_key
SESSION_SECRET=your_session_secret
Frontend (.env)
env
VITE_API_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
🧪 Testing
Backend Testing
bash
# Run tests
npm test
Frontend Testing
bash
# Run tests
npm test
📄 License
This project is licensed under the MIT License.

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📞 Contact
Email: support@invoicepro.com

Website: https://invoicepro.com

GitHub: https://github.com/yourusername/invoice-saas

🙏 Acknowledgments
Razorpay - Payment Gateway

Cloudinary - Image Storage

MongoDB - Database

React - Frontend Framework

Tailwind CSS - Styling

📸 Screenshots
Dashboard
https://screenshots/dashboard.png

Invoice Generator
https://screenshots/invoice.png

Affiliate Dashboard
https://screenshots/affiliate.png

Admin Panel
https://screenshots/admin.png

Subscription Plans
https://screenshots/subscription.png

Made with ❤️ by InvoicePro Team