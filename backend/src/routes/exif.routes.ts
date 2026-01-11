/**
 * EXIF Routes
 * 
 * Routes for EXIF metadata extraction functionality
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadEXIFFile } from '../middleware/exif-upload.middleware';
import {
  extractMetadata,
} from '../controllers/exif.controller';

const router = Router();

// All EXIF routes require authentication
router.use(authenticateToken);

// Extract metadata from uploaded file
router.post('/extract', uploadEXIFFile, extractMetadata);

export default router;
