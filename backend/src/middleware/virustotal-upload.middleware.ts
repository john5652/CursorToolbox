/**
 * VirusTotal Upload Middleware
 * 
 * Handles file uploads for VirusTotal analysis
 * Accepts various file types for malware scanning
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
    cb(null, `virustotal-${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - accept most file types for VirusTotal scanning
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // VirusTotal accepts most file types, so we'll be permissive
  // But we'll still filter out obviously invalid types
  const allowedMimeTypes = [
    'application/octet-stream', // Binary files
    'application/x-msdownload', // Windows executables
    'application/x-executable', // Executables
    'application/x-sharedlib', // Shared libraries
  ];
  
  // Accept if mimetype is recognized or if it's octet-stream (fallback)
  const mimetype = file.mimetype || 'application/octet-stream';
  
  // Accept all files - VirusTotal will handle validation
  cb(null, true);
};

// Configure multer for VirusTotal file uploads
export const uploadForVirusTotal = multer({
  storage,
  limits: {
    fileSize: 32 * 1024 * 1024, // 32MB limit (VirusTotal free tier limit)
  },
  fileFilter,
});

// Middleware for single file upload for VirusTotal analysis
// Made optional - will only process if file is present
export const uploadVirusTotalFile = (req: any, res: any, next: any) => {
  // Only process file upload if Content-Type is multipart/form-data
  // Otherwise, skip multer and continue to next middleware
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    uploadForVirusTotal.single('file')(req, res, (err: any) => {
      if (err) {
        // If multer error, but it's just "no file", continue anyway
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 32MB' });
        }
        return next(err);
      }
      next();
    });
  } else {
    // No file upload, continue without multer
    next();
  }
};
