/**
 * EXIF Controller
 * 
 * Handles EXIF metadata extraction requests using exiftool
 */

import { Request, Response } from 'express';
import { exiftool } from 'exiftool-vendored';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Extract metadata from uploaded file using exiftool
 * POST /api/exif/extract
 */
export async function extractMetadata(req: Request, res: Response): Promise<void> {
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
    console.log('EXIF extraction request:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    });

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      res.status(400).json({ error: 'Uploaded file not found' });
      return;
    }

    try {
      // Extract metadata using exiftool
      // exiftool-vendored automatically handles the exiftool binary
      const tags = await exiftool.read(req.file.path);

      // Clean up the uploaded file after processing
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file:', req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      // Format the metadata for better readability
      // Convert the tags object to a more structured format
      const formattedMetadata: Record<string, any> = {};
      
      // Group metadata by category
      const metadata: Record<string, any> = {
        file: {},
        image: {},
        camera: {},
        gps: {},
        video: {},
        audio: {},
        other: {},
      };

      // Process each tag
      for (const [key, value] of Object.entries(tags)) {
        const keyLower = key.toLowerCase();
        
        // File information
        if (keyLower.includes('filename') || keyLower.includes('filesize') || 
            keyLower.includes('filetype') || keyLower.includes('mimetype') ||
            keyLower.includes('directory') || keyLower.includes('modifydate')) {
          metadata.file[key] = value;
        }
        // Image information
        else if (keyLower.includes('image') || keyLower.includes('width') || 
                 keyLower.includes('height') || keyLower.includes('resolution') ||
                 keyLower.includes('color') || keyLower.includes('bit') ||
                 keyLower.includes('compression') || keyLower.includes('orientation')) {
          metadata.image[key] = value;
        }
        // Camera information
        else if (keyLower.includes('camera') || keyLower.includes('make') || 
                 keyLower.includes('model') || keyLower.includes('lens') ||
                 keyLower.includes('focal') || keyLower.includes('aperture') ||
                 keyLower.includes('shutter') || keyLower.includes('iso') ||
                 keyLower.includes('exposure') || keyLower.includes('flash')) {
          metadata.camera[key] = value;
        }
        // GPS information
        else if (keyLower.includes('gps') || keyLower.includes('latitude') || 
                 keyLower.includes('longitude') || keyLower.includes('altitude') ||
                 keyLower.includes('location')) {
          metadata.gps[key] = value;
        }
        // Video information
        else if (keyLower.includes('video') || keyLower.includes('duration') ||
                 keyLower.includes('frame') || keyLower.includes('codec') ||
                 keyLower.includes('bitrate') || keyLower.includes('fps')) {
          metadata.video[key] = value;
        }
        // Audio information
        else if (keyLower.includes('audio') || keyLower.includes('sample') ||
                 keyLower.includes('channel') || keyLower.includes('bitrate')) {
          metadata.audio[key] = value;
        }
        // Everything else
        else {
          metadata.other[key] = value;
        }
      }

      // Remove empty categories
      const cleanedMetadata: Record<string, any> = {};
      for (const [category, values] of Object.entries(metadata)) {
        if (Object.keys(values).length > 0) {
          cleanedMetadata[category] = values;
        }
      }

      // Also include raw tags for completeness
      res.json({
        message: 'Metadata extracted successfully',
        metadata: cleanedMetadata,
        rawTags: tags, // Include raw tags for advanced users
        fileInfo: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (exifError: any) {
      // Clean up file even if exiftool fails
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }

      console.error('Exiftool error:', exifError);
      
      // Check if exiftool is available
      if (exifError.message && exifError.message.includes('exiftool')) {
        res.status(500).json({ 
          error: 'ExifTool is not installed or not available',
          details: 'Please ensure exiftool is installed on the server system'
        });
        return;
      }

      res.status(500).json({ 
        error: 'Failed to extract metadata',
        details: exifError.message || 'Unknown error occurred'
      });
    }
  } catch (error: any) {
    console.error('Extract metadata error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
