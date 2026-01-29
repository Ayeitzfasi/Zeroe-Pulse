import { Router } from 'express';
import { z } from 'zod';
import * as userService from '../services/userService.js';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateApiKeysSchema = z.object({
  hubspotToken: z.string().nullable().optional(),
  confluenceToken: z.string().nullable().optional(),
  anthropicApiKey: z.string().nullable().optional(),
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    // Find user by email
    const dbUser = await userService.findByEmail(email);
    if (!dbUser) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const isValid = await userService.verifyPassword(password, dbUser.password_hash);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    });

    // Return user data (without password) and token
    const user = await userService.findById(dbUser.id);

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/change-password
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const { currentPassword, newPassword } = validation.data;
    const userId = req.user!.userId;

    // Get user with password hash
    const dbUser = await userService.findByEmail(req.user!.email);
    if (!dbUser) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Verify current password
    const isValid = await userService.verifyPassword(currentPassword, dbUser.password_hash);
    if (!isValid) {
      throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    // Hash and update new password
    const newPasswordHash = await userService.hashPassword(newPassword);
    const updated = await userService.updatePassword(userId, newPasswordHash);

    if (!updated) {
      throw new AppError(500, 'UPDATE_FAILED', 'Failed to update password');
    }

    res.json({
      success: true,
      data: {
        message: 'Password updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await userService.findById(req.user!.userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/api-keys - Get masked API keys
router.get('/api-keys', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const apiKeys = await userService.getApiKeys(req.user!.userId);

    if (!apiKeys) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /auth/api-keys - Update API keys
router.put('/api-keys', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = updateApiKeysSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const updated = await userService.updateApiKeys(req.user!.userId, validation.data);

    if (!updated) {
      throw new AppError(500, 'UPDATE_FAILED', 'Failed to update API keys');
    }

    // Return the updated (masked) keys
    const apiKeys = await userService.getApiKeys(req.user!.userId);

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
