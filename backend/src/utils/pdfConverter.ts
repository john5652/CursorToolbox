/**
 * PDF Conversion Utilities
 * 
 * Server-side PDF conversion logic using pdf-lib and sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import heicConvert from 'heic-convert';
import PDFDocumentKit from 'pdfkit';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const PDF_DIR = path.join(UPLOAD_DIR, 'pdfs');

// Ensure PDF directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Convert image file to PDF
 * 
 * @param filePath - Path to the image file
 * @param originalName - Original filename
 * @returns Path to the created PDF file
 */
export async function convertImageToPDF(
  filePath: string,
  originalName: string
): Promise<string> {
  try {
    // Read image file
    const imageBuffer = fs.readFileSync(filePath);
    
    // Process image with sharp (resize if needed, convert format)
    // Sharp automatically handles HEIC/HEIF and converts to a format pdf-lib can use
    let processedImage: Buffer;
    try {
      // Detect format and handle accordingly
      const metadata = await sharp(imageBuffer).metadata();
      console.log('Image metadata:', { 
        format: metadata.format, 
        width: metadata.width, 
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels 
      });
      
      // Check if it's HEIC/HEIF - convert using heic-convert
      if (metadata.format === 'heic' || metadata.format === 'heif') {
        console.log('Converting HEIC to JPEG...');
        
        try {
          // Convert HEIC to JPEG using heic-convert
          const jpegBuffer = await heicConvert({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 0.9
          });
          
          console.log('HEIC conversion successful, processing JPEG...');
          
          // Process with Sharp - keep as JPEG for iOS compatibility
          processedImage = await sharp(Buffer.from(jpegBuffer))
            .resize(2480, 3508, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90, mozjpeg: true }) // Use mozjpeg for better compatibility
            .toBuffer();
        } catch (heicError: any) {
          console.error('HEIC conversion error:', heicError);
          throw new Error(`Failed to convert HEIC image: ${heicError.message}. This may indicate a corrupted HEIC file.`);
        }
      } else {
        // For all other formats, keep as JPEG for iOS compatibility
        processedImage = await sharp(imageBuffer)
          .resize(2480, 3508, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
      }
        
    } catch (sharpError: any) {
      console.error('Sharp processing error:', sharpError);
      console.error('Error details:', {
        message: sharpError.message,
        code: sharpError.code,
        name: sharpError.name
      });
      
      // Check if it's a HEIC/HEIF format support issue
      if (sharpError.message?.includes('heif') || 
          sharpError.message?.includes('heic') || 
          sharpError.message?.includes('decoding plugin') ||
          sharpError.message?.includes('bad seek')) {
        throw new Error(`HEIC/HEIF format not supported. Convert to JPEG in Photos app first:\n1. Open Photos\n2. Select image\n3. Share → Save as JPEG\n4. Then upload the JPEG`);
      }
      
      // Re-throw with original error message
      throw new Error(`Image processing failed: ${sharpError.message || 'Unknown error'}`);
    }

    // Get image dimensions from Sharp metadata for pdfkit fallback
    const imageMetadata = await sharp(processedImage).metadata();
    const imageWidth = imageMetadata.width || 2480;
    const imageHeight = imageMetadata.height || 3508;

    // Use pdfkit directly for better iOS compatibility
    console.log('Creating PDF with pdfkit for iOS compatibility...');
    
    const pdfFileName = `${path.basename(originalName, path.extname(originalName))}-${Date.now()}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFileName);

    // Create PDF with pdfkit
    const doc = new PDFDocumentKit({
      size: 'A4',
      layout: 'portrait',
      margin: 0
    });

    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => {
      buffers.push(chunk);
    });
    
    // A4 dimensions in points
    const pageWidth = 595;
    const pageHeight = 842;

    // Calculate scale to fit image on A4 page
    const scaleX = pageWidth / imageWidth;
    const scaleY = pageHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    // Center image on page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    console.log('pdfkit dimensions:', {
      originalSize: { width: imageWidth, height: imageHeight },
      scale,
      scaledSize: { width: scaledWidth, height: scaledHeight },
      position: { x, y },
      processedImageSize: processedImage.length
    });

    // Add image to PDF - pdfkit can accept Buffer directly
    try {
      doc.image(processedImage, x, y, { 
        width: scaledWidth, 
        height: scaledHeight
      });
      console.log('Image added to PDF');
    } catch (imageError: any) {
      console.error('Error adding image to PDF:', imageError);
      throw new Error(`Failed to add image to PDF: ${imageError.message}`);
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF creation timeout after 10 seconds'));
      }, 10000); // 10 second timeout
      
      doc.on('end', () => {
        clearTimeout(timeout);
        try {
          const pdfBuffer = Buffer.concat(buffers);
          fs.writeFileSync(pdfPath, pdfBuffer);
          const pdfSize = fs.statSync(pdfPath).size;
          console.log('pdfkit PDF saved successfully:', { 
            size: pdfSize, 
            path: pdfPath,
            bufferSize: pdfBuffer.length,
            fileExists: fs.existsSync(pdfPath)
          });
          resolve();
        } catch (writeError: any) {
          reject(new Error(`Failed to write PDF: ${writeError.message}`));
        }
      });
      
      doc.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Verify the file was written
    const stats = fs.statSync(pdfPath);
    console.log('Final PDF verification:', {
      size: stats.size,
      path: pdfPath,
      readable: true
    });
    
    // Return the path (pdfFileName is already defined above)
    return `/uploads/pdfs/${pdfFileName}`;
  } catch (error: any) {
    console.error('Error converting image to PDF:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`Failed to convert image to PDF: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Convert document file to PDF (placeholder for future implementation)
 * Currently supports images only
 * 
 * @param filePath - Path to the document file
 * @param originalName - Original filename
 * @param mimeType - MIME type of the file
 * @returns Path to the created PDF file
 */
export async function convertDocumentToPDF(
  filePath: string,
  originalName: string,
  mimeType: string
): Promise<string> {
  // Check if it's an image
  if (mimeType.startsWith('image/')) {
    return convertImageToPDF(filePath, originalName);
  }
  
  // For other document types, we would use libraries like:
  // - mammoth for DOCX
  // - pdf-parse for existing PDFs
  // - etc.
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Get supported MIME types for conversion
 */
export function getSupportedMimeTypes(): string[] {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    // Future: 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', etc.
  ];
}
