/**
 * Nmap Timeout Middleware
 * 
 * Sets extended timeout for nmap scan requests
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to set extended timeout for nmap scan requests
 * This allows scans to run for up to 6 minutes
 */
export function setNmapTimeout(req: Request, res: Response, next: NextFunction): void {
  // Set request timeout to 6 minutes (360000ms)
  // This is longer than the nmap command timeout (5 minutes)
  req.setTimeout(360000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        details: 'The request took longer than 6 minutes to complete',
      });
    }
  });

  // Set response timeout as well
  res.setTimeout(360000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Response timeout',
        details: 'The response took longer than 6 minutes to send',
      });
    }
  });

  next();
}
