/**
 * EXIF Upload Middleware
 * 
 * Handles file uploads for EXIF metadata extraction
 * Accepts a wide variety of file types since exiftool can extract metadata from many formats
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
    cb(null, `exif-${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - accept most file types since exiftool can handle many formats
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images
  const imageTypes = /jpeg|jpg|png|gif|webp|heic|heif|tiff|tif|bmp|svg/;
  // Allow videos
  const videoTypes = /mp4|mov|avi|mkv|wmv|flv|webm|m4v|3gp/;
  // Allow documents
  const docTypes = /pdf|doc|docx|txt|csv|xls|xlsx|ppt|pptx|rtf/;
  // Allow audio
  const audioTypes = /mp3|wav|flac|aac|m4a|ogg|wma/;
  // Allow other common formats
  const otherTypes = /zip|rar|7z|tar|gz/;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isImageExt = imageTypes.test(ext);
  const isVideoExt = videoTypes.test(ext);
  const isDocExt = docTypes.test(ext);
  const isAudioExt = audioTypes.test(ext);
  const isOtherExt = otherTypes.test(ext);
  
  // Accept if extension matches or mimetype is recognized
  const mimetype = file.mimetype.startsWith('image/') || 
                   file.mimetype.startsWith('video/') ||
                   file.mimetype.startsWith('audio/') ||
                   file.mimetype.includes('pdf') ||
                   file.mimetype.includes('document') ||
                   file.mimetype.includes('text') ||
                   file.mimetype.includes('csv') ||
                   file.mimetype.includes('spreadsheet') ||
                   file.mimetype.includes('presentation') ||
                   file.mimetype === 'image/heic' ||
                   file.mimetype === 'image/heif' ||
                   file.mimetype === 'application/zip' ||
                   file.mimetype === 'application/x-rar-compressed' ||
                   file.mimetype === 'application/octet-stream'; // Fallback for unknown types

  if ((isImageExt || isVideoExt || isDocExt || isAudioExt || isOtherExt) && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Supported: Images, Videos, Documents, Audio, Archives'));
  }
};

// Configure multer for EXIF extraction
export const uploadForEXIF = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (larger than PDF since videos can be large)
  },
  fileFilter,
});

// Middleware for single file upload for EXIF extraction
export const uploadEXIFFile = uploadForEXIF.single('file');
