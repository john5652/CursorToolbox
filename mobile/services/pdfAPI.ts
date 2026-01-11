/**
 * PDF API Service
 * 
 * Handles PDF conversion API calls
 */

import api from './api';

export interface FileConversion {
  id: string;
  originalFile: string;
  fileType: string;
  pdfPath: string;
  convertedAt: string;
  method: string;
  createdAt: string;
}

export interface ConversionResponse {
  message: string;
  conversion: {
    id: string;
    originalFile: string;
    pdfPath: string;
    convertedAt: string;
    method: string;
  };
}

export interface ConversionsResponse {
  conversions: FileConversion[];
}

export const pdfAPI = {
  /**
   * Convert file to PDF (server-side)
   */
  convertToPDF: async (uri: string, type: string, name: string): Promise<ConversionResponse> => {
    // For React Native, we need to handle file URIs properly
    // Remove file:// prefix if present for FormData
    const fileUri = uri.startsWith('file://') ? uri : uri;
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: type || 'image/jpeg',
      name: name || 'image.jpg',
    } as any);

    const response = await api.post<ConversionResponse>('/pdf/convert', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => {
        return data; // Let axios handle FormData
      },
    });
    return response.data;
  },

  /**
   * Get user's conversion history
   */
  getConversions: async (): Promise<ConversionsResponse> => {
    const response = await api.get<ConversionsResponse>('/pdf/conversions');
    return response.data;
  },

  /**
   * Get PDF download URL
   */
  getPDFUrl: (conversionId: string): string => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';
    // Remove '/api' from the URL since we need the full server URL
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}/api/pdf/${conversionId}`;
  },

  /**
   * Delete conversion
   */
  deleteConversion: async (conversionId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/pdf/${conversionId}`);
    return response.data;
  },
};
