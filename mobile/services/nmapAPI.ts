/**
 * Nmap API Service
 * 
 * Handles network scanning API calls using nmap
 */

import api from './api';

export interface NmapScanRequest {
  host: string;
  flags?: string;
}

export interface NmapScanResponse {
  message: string;
  host: string;
  flags: string;
  output: string;
  stderr?: string;
  executionTime: number;
}

export const nmapAPI = {
  /**
   * Scan a host using nmap
   * @param host - The host to scan (IP address, hostname, or CIDR range)
   * @param flags - Optional nmap flags (e.g., "-sS -p 80,443")
   * @returns Scan results including output and execution time
   */
  scanHost: async (host: string, flags?: string): Promise<NmapScanResponse> => {
    // Set extended timeout for nmap scans (5 minutes + buffer)
    const response = await api.post<NmapScanResponse>('/nmap/scan', {
      host,
      flags,
    }, {
      timeout: 330000, // 5.5 minutes (330 seconds) - slightly longer than backend timeout
    });
    return response.data;
  },
};
