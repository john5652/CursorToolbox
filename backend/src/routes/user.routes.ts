import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getCurrentUser,
  updateCurrentUser,
  uploadAvatar,
} from '../controllers/user.controller';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Protected routes (require authentication)
router.use(authenticateToken);

// Validation rules for username update
const updateUsernameValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
];

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's username
 * @access  Private
 */
router.put('/me', updateUsernameValidation, updateCurrentUser);

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload avatar for current user
 * @access  Private
 */
router.post('/me/avatar', uploadAvatarMiddleware, uploadAvatar);

export default router;
