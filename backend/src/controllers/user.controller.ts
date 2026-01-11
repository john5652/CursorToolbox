import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma'; // Centralized Prisma Client instance

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Get current user profile
 * GET /api/users/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update current user's username
 * PUT /api/users/me
 */
export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username } = req.body;

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== req.user.userId) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { username },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Username updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Upload avatar for current user
 * POST /api/users/me/avatar
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { avatar: true },
    });

    // Delete old avatar if it exists
    if (user?.avatar) {
      const oldAvatarPath = path.join(UPLOAD_DIR, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar path (relative to uploads directory)
    const avatarPath = `/uploads/${req.file.filename}`;

    // Update user with new avatar path
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
