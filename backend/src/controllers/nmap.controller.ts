/**
 * Nmap Controller
 * 
 * Handles network scanning requests using nmap
 */

import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Scan a host using nmap
 * POST /api/nmap/scan
 * Body: { host: string, flags?: string }
 */
export async function scanHost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { host, flags } = req.body;

    // Validate host input
    if (!host || typeof host !== 'string' || host.trim().length === 0) {
      res.status(400).json({ error: 'Host is required' });
      return;
    }

    // Sanitize host input to prevent command injection
    // Allow only alphanumeric, dots, hyphens, colons, and brackets (for IPv6)
    const sanitizedHost = host.trim().replace(/[^a-zA-Z0-9.\-:\[\]]/g, '');
    
    if (sanitizedHost !== host.trim()) {
      res.status(400).json({ error: 'Invalid host format' });
      return;
    }

    // Sanitize flags input
    let sanitizedFlags = '';
    if (flags && typeof flags === 'string' && flags.trim().length > 0) {
      // Allow common nmap flags: letters, numbers, hyphens, spaces, and common flag characters
      // This is a basic sanitization - in production, you might want stricter validation
      sanitizedFlags = flags.trim().replace(/[^a-zA-Z0-9\s\-]/g, '');
    }

    // Build nmap command
    // Always add -v (verbose) flag for better visibility of scan progress
    // If user provided flags, prepend -v to them, otherwise use -v alone
    const verboseFlag = '-v';
    const nmapCommand = sanitizedFlags 
      ? `nmap ${verboseFlag} ${sanitizedFlags} ${sanitizedHost}`
      : `nmap ${verboseFlag} ${sanitizedHost}`;

    console.log('Nmap scan request:', {
      host: sanitizedHost,
      flags: sanitizedFlags || 'none (default)',
      command: nmapCommand,
      user: req.user.id,
    });

    // Execute nmap command with extended timeout (5 minutes)
    // Some scans can take a while, especially on large networks
    const timeout = 300000; // 5 minutes (300000ms)
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(nmapCommand, { 
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      });

      const executionTime = Date.now() - startTime;

      // If there's stderr but no stdout, it might be an error
      if (stderr && !stdout) {
        console.error('Nmap stderr:', stderr);
        res.status(500).json({
          error: 'Nmap scan failed',
          details: stderr,
          executionTime,
        });
        return;
      }

      // Return scan results
      res.json({
        message: 'Scan completed successfully',
        host: sanitizedHost,
        flags: sanitizedFlags || 'none (default)',
        output: stdout || '',
        stderr: stderr || '',
        executionTime,
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      console.error('Nmap execution error:', error);

      // Check if nmap is installed
      if (error.message && (
        error.message.includes('nmap: command not found') ||
        error.message.includes('nmap: not found') ||
        error.code === 'ENOENT'
      )) {
        res.status(500).json({
          error: 'Nmap is not installed or not available',
          details: 'Please ensure nmap is installed on the server system',
          executionTime,
        });
        return;
      }

      // Handle timeout
      if (error.message && (error.message.includes('timed out') || error.code === 'ETIMEDOUT')) {
        res.status(408).json({
          error: 'Scan timed out',
          details: 'The scan took longer than 5 minutes. Try using more specific flags, scanning a smaller range, or using faster scan types (e.g., -F for fast scan).',
          executionTime,
        });
        return;
      }

      // Other errors
      res.status(500).json({
        error: 'Failed to execute nmap scan',
        details: error.message || 'Unknown error occurred',
        executionTime,
      });
    }
  } catch (error: any) {
    console.error('Scan host error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
