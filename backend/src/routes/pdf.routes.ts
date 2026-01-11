/**
 * PDF Routes
 * 
 * Routes for PDF conversion functionality
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadPDFFile } from '../middleware/pdf-upload.middleware';
import {
  convertToPDF,
  getConversions,
  getPDF,
  deleteConversion,
} from '../controllers/pdf.controller';

const router = Router();

// All PDF routes require authentication
router.use(authenticateToken);

// Convert file to PDF
router.post('/convert', uploadPDFFile, convertToPDF);

// Get user's conversion history
router.get('/conversions', getConversions);

// Download converted PDF
router.get('/:id', getPDF);

// Delete conversion
router.delete('/:id', deleteConversion);

export default router;
