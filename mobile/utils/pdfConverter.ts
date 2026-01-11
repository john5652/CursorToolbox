/**
 * Client-side PDF Converter
 * 
 * Uses pdf-lib to convert images to PDF on the device
 */

import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Base64 decode helper (polyfill for React Native)
 * React Native doesn't have atob/btoa built-in
 * This is a simple implementation - for production, consider using 'base64-js' library
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Base64 character set
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const base64Data = base64.replace(/[^A-Za-z0-9\+\/]/g, '');
  const bufferLength = base64Data.length * 0.75;
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < base64Data.length; i += 4) {
    const encoded1 = lookup[base64Data.charCodeAt(i)];
    const encoded2 = lookup[base64Data.charCodeAt(i + 1)];
    const encoded3 = lookup[base64Data.charCodeAt(i + 2)];
    const encoded4 = lookup[base64Data.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}

/**
 * Uint8Array to base64 helper
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }

  return result;
}

/**
 * Convert image URI to PDF (client-side)
 * 
 * @param imageUri - URI of the image file
 * @param filename - Original filename
 * @returns URI of the created PDF file
 */
export async function convertImageToPDFClient(
  imageUri: string,
  filename: string
): Promise<string> {
  try {
    // Read image file as base64 using the legacy API
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const imageBytes = base64ToUint8Array(base64);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Try to embed as PNG first, then JPEG
    let image;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      try {
        image = await pdfDoc.embedJpg(imageBytes);
      } catch (error) {
        throw new Error('Unsupported image format. Please use PNG or JPEG.');
      }
    }

    // Add page (A4 size)
    const page = pdfDoc.addPage([595, 842]);
    
    // Calculate dimensions to fit page
    const imageDims = image.scale(1);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    
    // Scale image to fit page if needed
    const scale = Math.min(
      pageWidth / imageDims.width,
      pageHeight / imageDims.height,
      1 // Don't scale up
    );
    
    const scaledWidth = imageDims.width * scale;
    const scaledHeight = imageDims.height * scale;
    
    // Center image
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    
    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert Uint8Array to base64 for saving
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);
    
    // Save to file system
    const pdfFilename = `${filename.replace(/\.[^/.]+$/, '')}-${Date.now()}.pdf`;
    const pdfUri = `${FileSystem.cacheDirectory}${pdfFilename}`;
    
    await FileSystem.writeAsStringAsync(pdfUri, pdfBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return pdfUri;
  } catch (error: any) {
    console.error('Error converting image to PDF:', error);
    throw new Error(error.message || 'Failed to convert image to PDF');
  }
}

/**
 * Check if file type can be converted client-side
 * HEIC/HEIF files must use server-side conversion
 * Note: iOS often reports HEIC files as 'image/jpeg', so we disable
 * client-side conversion for all files to ensure reliability
 */
export function canConvertClientSide(mimeType: string): boolean {
  // Disable client-side conversion entirely
  // Reason: iOS disguises HEIC as JPEG, causing pdf-lib to fail
  // Server-side conversion with heic-convert is more reliable
  return false;
  
  // Original logic (kept for reference):
  // if (!mimeType.startsWith('image/')) {
  //   return false;
  // }
  // const unsupportedTypes = ['image/heic', 'image/heif'];
  // return !unsupportedTypes.includes(mimeType.toLowerCase());
}
