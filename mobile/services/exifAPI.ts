/**
 * EXIF API Service
 * 
 * Handles EXIF metadata extraction API calls
 */

import api from './api';

export interface MetadataResponse {
  message: string;
  metadata: {
    [category: string]: {
      [key: string]: any;
    };
  };
  rawTags: {
    [key: string]: any;
  };
  fileInfo: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export const exifAPI = {
  /**
   * Extract metadata from file (server-side)
   */
  extractMetadata: async (uri: string, type: string, name: string): Promise<MetadataResponse> => {
    // For React Native, we need to handle file URIs properly
    const fileUri = uri.startsWith('file://') ? uri : uri;
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: type || 'application/octet-stream',
      name: name || 'file',
    } as any);

    const response = await api.post<MetadataResponse>('/exif/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => {
        return data; // Let axios handle FormData
      },
    });
    return response.data;
  },
};
