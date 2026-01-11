/**
 * PDF Controller
 * 
 * Handles PDF conversion requests
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { convertDocumentToPDF, getSupportedMimeTypes } from '../utils/pdfConverter';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Convert uploaded file to PDF
 * POST /api/pdf/convert
 */
export async function convertToPDF(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Log file details for debugging
    console.log('File upload details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    });

    const supportedTypes = getSupportedMimeTypes();
    if (!supportedTypes.includes(req.file.mimetype)) {
      res.status(400).json({ 
        error: 'Unsupported file type',
        receivedType: req.file.mimetype,
        supportedTypes 
      });
      return;
    }

    // Convert file to PDF
    const pdfPath = await convertDocumentToPDF(
      req.file.path,
      req.file.originalname,
      req.file.mimetype
    );

    // Clean up the uploaded file after conversion
    try {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up uploaded file:', req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }
    
    // Save conversion record to database
    const conversion = await prisma.fileConversion.create({
      data: {
        userId: req.user.userId,
        originalFile: req.file.originalname, // Keep original filename
        fileType: req.file.mimetype,
        pdfPath,
        method: 'server',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'File converted to PDF successfully',
      conversion: {
        id: conversion.id,
        originalFile: conversion.originalFile,
        pdfPath: conversion.pdfPath,
        convertedAt: conversion.convertedAt,
        method: conversion.method,
      },
    });
  } catch (error: any) {
    console.error('Convert to PDF error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get user's conversion history
 * GET /api/pdf/conversions
 */
export async function getConversions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversions = await prisma.fileConversion.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: 'desc', // Use createdAt instead of convertedAt for ordering
      },
      select: {
        id: true,
        originalFile: true,
        fileType: true,
        pdfPath: true,
        convertedAt: true,
        method: true,
        createdAt: true,
      },
    });

    res.json({ conversions });
  } catch (error: any) {
    console.error('Get conversions error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Download converted PDF
 * GET /api/pdf/:id
 */
export async function getPDF(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const conversion = await prisma.fileConversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      res.status(404).json({ error: 'Conversion not found' });
      return;
    }

    // Check if user owns this conversion
    if (conversion.userId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Get full path to PDF file
    // pdfPath is stored as '/uploads/pdfs/filename.pdf'
    const relativePath = conversion.pdfPath.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    
    console.log('PDF download request:', {
      conversionId: id,
      storedPath: conversion.pdfPath,
      relativePath,
      fullPath,
      exists: fs.existsSync(fullPath)
    });
    
    if (!fs.existsSync(fullPath)) {
      console.error('PDF file not found at:', fullPath);
      res.status(404).json({ error: 'PDF file not found', path: conversion.pdfPath });
      return;
    }

    // Send PDF file
    const filename = conversion.originalFile.replace(/\.[^/.]+$/, '') + '.pdf';
    
    // Check file size to verify PDF was created properly
    const stats = fs.statSync(fullPath);
    console.log('Serving PDF:', {
      filename,
      size: stats.size,
      path: fullPath
    });
    
    // Verify file is not empty (should be larger than 55 bytes for a valid PDF)
    if (stats.size < 100) {
      console.error('PDF file is too small (possibly corrupt):', stats.size);
      res.status(500).json({ error: 'PDF file is corrupt or empty' });
      return;
    }
    
    // Use 'inline' instead of 'attachment' to allow viewing in browsers and iOS
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=0');
    
    // Use fs.createReadStream for more reliable file serving
    const fileStream = fs.createReadStream(fullPath);
    
    let streamEnded = false;
    let hasStreamError = false;
    
    fileStream.on('error', (error) => {
      console.error('Error streaming PDF file:', error);
      hasStreamError = true;
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading PDF file' });
      }
      // Don't delete file if there was an error reading it
    });
    
    fileStream.on('end', () => {
      streamEnded = true;
    });
    
    // Track when the response finishes successfully
    res.on('finish', () => {
      // Only delete if:
      // 1. Response was successful (status 200)
      // 2. Stream ended without error
      // 3. No stream errors occurred
      if (res.statusCode === 200 && streamEnded && !hasStreamError) {
        try {
          // Delete the PDF file after successful delivery to client
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Cleaned up PDF file after successful delivery:', fullPath);
          }
          
          // Also delete the database record since the file is gone
          prisma.fileConversion.delete({
            where: { id },
          }).catch((deleteError) => {
            console.warn('Failed to delete conversion record:', deleteError);
          });
        } catch (cleanupError) {
          console.warn('Failed to cleanup PDF file after delivery:', cleanupError);
        }
      } else {
        console.log('PDF file not deleted - response may have failed:', {
          statusCode: res.statusCode,
          streamEnded,
          hasStreamError
        });
      }
    });
    
    // Handle client disconnect - don't delete if client disconnected
    res.on('close', () => {
      if (!streamEnded && !res.headersSent) {
        console.log('Client disconnected before file could be sent');
      }
    });
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Delete conversion
 * DELETE /api/pdf/:id
 */
export async function deleteConversion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const conversion = await prisma.fileConversion.findUnique({
      where: { id },
    });

    // If conversion doesn't exist, it may have already been deleted after download
    // Return success to make this operation idempotent (safe to call multiple times)
    if (!conversion) {
      res.json({ message: 'Conversion already deleted or not found' });
      return;
    }

    // Check if user owns this conversion
    if (conversion.userId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Delete PDF file if it exists (may have already been deleted after download)
    const pdfPath = path.join(UPLOAD_DIR, conversion.pdfPath.replace('/uploads/', ''));
    if (fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (fileError) {
        console.warn('Failed to delete PDF file (may already be deleted):', fileError);
      }
    }

    // Delete database record
    try {
      await prisma.fileConversion.delete({
        where: { id },
      });
    } catch (deleteError: any) {
      // If record was already deleted (e.g., after download), that's okay
      if (deleteError.code === 'P2025') {
        // Prisma record not found error
        console.log('Conversion record already deleted');
      } else {
        throw deleteError;
      }
    }

    res.json({ message: 'Conversion deleted successfully' });
  } catch (error) {
    console.error('Delete conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
