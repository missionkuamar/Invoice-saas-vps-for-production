// backend/src/routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  createAdmin,
  getUsers,
  updateUserRole,
  googleAuthCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
// ✅ GOOGLE ROUTE ADD KARO
router.post('/google', googleAuthCallback);
// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes
router.post('/create-admin', createAdmin);
router.get('/users', protect, getUsers);
router.put('/users/:id/role', protect, updateUserRole);

export default router;