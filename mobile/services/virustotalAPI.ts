/**
 * VirusTotal API Service
 * 
 * Handles VirusTotal analysis API calls
 */

import api from './api';

export interface VirusTotalAnalysisRequest {
  input: string;
}

export interface VirusTotalFileUploadRequest {
  uri: string;
  type: string;
  name: string;
}

export interface VirusTotalAnalysisResponse {
  type: 'hash' | 'url' | 'file';
  input: string;
  results: {
    detectionRatio: string;
    totalEngines: number;
    positives: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    scanDate: number | null;
    status?: string;
    engines: Record<string, {
      category: string;
      result: string;
      method: string;
      engine_name: string;
    }>;
    sha256?: string;
    sha1?: string;
    md5?: string;
    fileType?: string;
    fileSize?: number;
    firstSeen?: number;
    lastSeen?: number;
    url?: string;
    title?: string;
  };
}

export const virustotalAPI = {
  /**
   * Analyze input (hash, URL, or file) - auto-detects type
   * @param input - Hash, URL, or file URI
   * @param fileInfo - Optional file info if input is a file
   * @returns Analysis results
   */
  analyze: async (
    input: string,
    fileInfo?: { uri: string; type: string; name: string }
  ): Promise<VirusTotalAnalysisResponse> => {
    // If fileInfo is provided, upload file
    if (fileInfo) {
      const formData = new FormData();
      formData.append('file', {
        uri: fileInfo.uri,
        type: fileInfo.type || 'application/octet-stream',
        name: fileInfo.name || 'file',
      } as any);

      const response = await api.post<VirusTotalAnalysisResponse>('/virustotal/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => {
          return data; // Let axios handle FormData
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response.data;
    }

    // Otherwise, send as JSON
    const response = await api.post<VirusTotalAnalysisResponse>('/virustotal/analyze', {
      input,
    }, {
      timeout: 30000, // 30 seconds for hash/URL lookups
    });
    return response.data;
  },

  /**
   * Analyze a file hash
   * @param hash - MD5, SHA-1, or SHA-256 hash
   * @returns Analysis results
   */
  analyzeHash: async (hash: string): Promise<VirusTotalAnalysisResponse> => {
    const response = await api.get<VirusTotalAnalysisResponse>('/virustotal/analyze/hash', {
      params: { hash },
      timeout: 30000,
    });
    return response.data;
  },

  /**
   * Analyze a URL
   * @param url - URL to analyze
   * @returns Analysis results
   */
  analyzeURL: async (url: string): Promise<VirusTotalAnalysisResponse> => {
    const response = await api.post<VirusTotalAnalysisResponse>('/virustotal/analyze/url', {
      input: url,
    }, {
      timeout: 30000,
    });
    return response.data;
  },

  /**
   * Analyze an uploaded file
   * @param uri - File URI
   * @param type - MIME type
   * @param name - File name
   * @returns Analysis results
   */
  analyzeFile: async (uri: string, type: string, name: string): Promise<VirusTotalAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: type || 'application/octet-stream',
      name: name || 'file',
    } as any);

    const response = await api.post<VirusTotalAnalysisResponse>('/virustotal/analyze/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => {
        return data; // Let axios handle FormData
      },
      timeout: 60000, // 60 seconds for file uploads
    });
    return response.data;
  },
};
