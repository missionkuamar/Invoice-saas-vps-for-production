markdown
# InvoicePro - SaaS Invoice Generator

A complete SaaS platform for generating professional invoices with user, admin, moderator, and affiliate roles. Features subscription plans, email reminders, and 10% affiliate commission system.

## 🚀 Project Repository
[GitHub Repo](https://github.com/missionkuamar/Invoice-Saas_with-Email)

## 📋 Features

### 👤 User Roles
- **Admin** - Full control over users, invoices, payments, and system settings
- **Moderator** - Manage invoices, users, and content moderation
- **Affiliate** - Refer users and earn 10% commission on subscriptions
- **User** - Create and manage invoices, subscribe to plans

### 📄 Invoice Management
- Create professional invoices with multiple templates
- Add company and client details
- Add items with quantity, rate, and tax
- Generate and download PDF invoices
- Invoice tracking and history

### 💰 Subscription Plans

| Plan | Price | Invoices/Month | Features |
|------|-------|----------------|----------|
| **Free** | ₹0 | 5 | Basic invoice creation, 1 template |
| **Basic** | ₹499/month | 50 | PDF export, 3 templates, Email support |
| **Pro** | ₹999/month | 200 | Analytics, 5 templates, Priority support, Custom branding |
| **Enterprise** | ₹2999/month | Unlimited | API access, White-label, Dedicated support, Custom features |

### How Subscription Works
1. User signs up with Free plan (5 free invoices)
2. User chooses a plan (Basic/Pro/Enterprise)
3. Payment via Razorpay
4. Subscription activated immediately
5. User can create invoices based on their plan limits
6. Monthly renewal - automatic payment
7. Email reminder sent 5 days before renewal
8. If payment fails, plan downgraded to Free

### 🤝 Affiliate Program
- **10% commission** on every referral subscription
- Example: If you refer someone who buys Pro plan (₹999), you earn ₹99
- If they buy Enterprise (₹2999), you earn ₹299
- Recurring commission - you earn every month they stay subscribed
- Custom affiliate links with tracking
- Withdraw earnings via Bank/UPI/PayPal (minimum ₹500)

### 📧 Email System
- **Invoice Reminder** - 3 days before due date
- **Subscription Reminder** - 5 days before renewal
- **Welcome Email** - New user registration
- **Payment Confirmation** - After successful payment
- **Affiliate Commission** - "You earned ₹XX from referral"

## 🛠️ Tech Stack

### Backend
- **Node.js + Express.js** - Server
- **MongoDB** - Database
- **JWT** - Authentication
- **Razorpay** - Payment gateway
- **Cloudinary** - Image upload
- **Nodemailer** - Email system
- **Node-cron** - Email scheduling

### Frontend
- **React.js** - UI
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 📁 Project Structure
invoice-saas/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── models/
│ │ ├── controllers/
│ │ ├── routes/
│ │ ├── middleware/
│ │ ├── cron/
│ │ └── server.js
│ ├── .env
│ └── package.json
└── frontend/
├── src/
│ ├── components/
│ ├── pages/
│ └── store/
├── .env
└── package.json

text

## ⚡ Installation

### Backend Setup

```bash
# Clone repository
git clone https://github.com/missionkuamar/Invoice-Saas_with-Email.git
cd Invoice-Saas_with-Email/backend

# Install dependencies
npm install

# Create .env file
touch .env
Add these environment variables in .env:

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoice_saas
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_SECRET_KEY=admin_secret_key_here

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Session
SESSION_SECRET=your_session_secret_here
Start backend:

bash
npm run dev
Frontend Setup
bash
cd ../frontend
npm install

# Create .env file
touch .env
Add in .env:

env
VITE_API_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
Start frontend:

bash
npm run dev
🔌 API Endpoints
Authentication
text
POST   /api/auth/register      - Register user
POST   /api/auth/login         - Login user
GET    /api/auth/profile       - Get profile
PUT    /api/auth/profile       - Update profile
Invoices
text
GET    /api/invoices           - Get all invoices
POST   /api/invoices           - Create invoice
GET    /api/invoices/:id       - Get single invoice
PUT    /api/invoices/:id       - Update invoice
DELETE /api/invoices/:id       - Delete invoice
Subscriptions
text
GET    /api/subscriptions/plans - Get all plans
POST   /api/subscriptions/order - Create Razorpay order
POST   /api/subscriptions/verify - Verify payment
POST   /api/subscriptions/cancel - Cancel subscription
GET    /api/subscriptions/status - Check subscription status
Affiliate
text
POST   /api/affiliate/join     - Join affiliate program
GET    /api/affiliate/dashboard - Get dashboard stats
POST   /api/affiliate/links    - Create affiliate link
GET    /api/affiliate/links    - Get all links
POST   /api/affiliate/withdraw - Request withdrawal
GET    /api/affiliate/withdrawals - Get withdrawal history
Admin
text
GET    /api/admin/stats        - Dashboard stats
GET    /api/admin/users        - Get all users
PUT    /api/admin/users/:id    - Update user role
DELETE /api/admin/users/:id    - Delete user
GET    /api/admin/withdrawals  - Get all withdrawals
PUT    /api/admin/withdrawals/:id - Process withdrawal
Email Reminders (Scheduled)
text
# Runs automatically via cron job every day at 9 AM
GET    /api/email/reminders    - Get all reminders
POST   /api/email/send-manual  - Send manual reminder
📧 Email Reminders System
Scheduled Tasks (Runs daily at 9 AM)
Invoice Due Reminder

Checks invoices due in 3 days

Sends email to client and user

Subscription Renewal

Checks subscriptions expiring in 5 days

Sends renewal reminder with payment link

Payment Confirmation

Sent immediately after successful payment

Includes invoice/download link

Affiliate Commission

Sent when referral completes payment

"You earned ₹XX from referral"

👥 User Roles Explained
Admin
Full access to everything

Manage users (change roles, delete)

Process affiliate withdrawals

View all invoices and analytics

Send notifications

Moderator
Manage invoices (view, edit, delete)

View all users (can't delete)

Approve/reject affiliate requests

Send notifications

Affiliate
Generate referral links

Track clicks and referrals

View earnings dashboard

Request withdrawals (min ₹500)

10% commission on referrals

User (Regular)
Create and manage own invoices

Subscribe to plans

View own profile

Manage company details

💳 Payment Flow
text
1. User visits subscription page
2. Selects plan (Basic/Pro/Enterprise)
3. Clicks "Subscribe"
4. Razorpay payment popup opens
5. User completes payment
6. Backend verifies payment
7. Subscription activated in database
8. Email confirmation sent to user
9. Affiliate gets commission (if referred)
10. Subscription auto-renews monthly
11. Email reminder sent 5 days before renewal
🏦 Affiliate Withdrawal Process
text
1. Affiliate earns commissions from referrals
2. Dashboard shows total earnings
3. Affiliate requests withdrawal (min ₹500)
4. Admin receives notification
5. Admin reviews and approves
6. Admin processes payment
7. Affiliate receives payment
8. Status updated to "Completed"
🚀 Deployment
Backend (Render)
bash
# Push to GitHub
# Connect to Render
# Add environment variables in Render dashboard
# Deploy
Frontend (Vercel)
bash
npm run build
# Deploy dist folder to Vercel
# Add environment variables
📦 Key Dependencies
Backend
text
express, mongoose, bcryptjs, jsonwebtoken,
razorpay, cloudinary, nodemailer, node-cron,
cors, dotenv
Frontend
text
react, react-redux, @reduxjs/toolkit,
react-router-dom, axios, tailwindcss
🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open Pull Request

📄 License
MIT License

👨‍💻 Author
Mission Kumar

GitHub: @missionkuamar

Repository: Invoice-Saas_with-Email

⭐ Star this repository if you found it helpful!

text

**Key changes made:**
1. ✅ Removed "Live Demo" (since not available)
2. ✅ Explained subscription plans in simple terms with a table
3. ✅ Added "How Subscription Works" section with step-by-step flow
4. ✅ Explained 10% affiliate commission with examples
5. ✅ Simple and clean for interview understanding
