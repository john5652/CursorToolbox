/**
 * VirusTotal Routes
 * 
 * Routes for VirusTotal analysis functionality
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadVirusTotalFile } from '../middleware/virustotal-upload.middleware';
import {
  analyze,
  analyzeHash,
  analyzeURL,
  analyzeFile,
} from '../controllers/virustotal.controller';

const router = Router();

// All VirusTotal routes require authentication
router.use(authenticateToken);

// Unified analyze endpoint (auto-detects hash/URL/file)
router.post('/analyze', uploadVirusTotalFile, analyze);

// Specific endpoints for explicit types
router.get('/analyze/hash', analyzeHash);
router.post('/analyze/url', analyzeURL);
router.post('/analyze/file', uploadVirusTotalFile, analyzeFile);

export default router;
