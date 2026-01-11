/**
 * PDF Upload Middleware
 * 
 * Handles file uploads for PDF conversion
 * Accepts images and documents
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - allow images and common document types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images (including HEIC/HEIF - we'll convert them server-side)
  const imageTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  // Allow documents (for future expansion)
  const docTypes = /pdf|doc|docx|txt|csv/;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isImageExt = imageTypes.test(ext);
  const isDocExt = docTypes.test(ext);
  
  const mimetype = file.mimetype.startsWith('image/') || 
                   file.mimetype.includes('pdf') ||
                   file.mimetype.includes('document') ||
                   file.mimetype.includes('text') ||
                   file.mimetype.includes('csv') ||
                   file.mimetype === 'image/heic' ||
                   file.mimetype === 'image/heif';

  if ((isImageExt || isDocExt) && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Supported: JPEG, PNG, GIF, WebP, HEIC, PDF, DOCX, TXT, CSV'));
  }
};

// Configure multer for PDF conversion
export const uploadForPDF = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDF conversion
  },
  fileFilter,
});

// Middleware for single file upload for PDF conversion
export const uploadPDFFile = uploadForPDF.single('file');
