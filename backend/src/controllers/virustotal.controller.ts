/**
 * VirusTotal Controller
 * 
 * Handles VirusTotal API requests for hash, URL, and file analysis
 */

import { Request, Response } from 'express';
import fs from 'fs';
import FormData from 'form-data';
import { Readable } from 'stream';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_BASE = 'https://www.virustotal.com/api/v3';

/**
 * Detect input type (hash, URL, or file)
 */
function detectInputType(input: string): 'hash' | 'url' | 'unknown' {
  const trimmed = input.trim();
  
  // Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'url';
  }
  
  // Check if it's a hash
  // MD5: 32 hex characters
  // SHA-1: 40 hex characters
  // SHA-256: 64 hex characters
  const hashPattern = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
  if (hashPattern.test(trimmed)) {
    return 'hash';
  }
  
  return 'unknown';
}

/**
 * Analyze a file hash using VirusTotal
 * GET /api/virustotal/analyze?input={hash}
 */
export async function analyzeHash(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!VIRUSTOTAL_API_KEY) {
      res.status(500).json({ error: 'VirusTotal API key not configured' });
      return;
    }

    const { hash } = req.query;
    
    if (!hash || typeof hash !== 'string') {
      res.status(400).json({ error: 'Hash is required' });
      return;
    }

    const sanitizedHash = hash.trim().toLowerCase();
    
    // Validate hash format
    if (!/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(sanitizedHash)) {
      res.status(400).json({ error: 'Invalid hash format. Must be MD5 (32), SHA-1 (40), or SHA-256 (64) characters' });
      return;
    }

    console.log('VirusTotal hash lookup:', sanitizedHash);

    const response = await fetch(`${VIRUSTOTAL_API_BASE}/files/${sanitizedHash}`, {
      method: 'GET',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        res.status(404).json({ 
          error: 'File not found in VirusTotal database',
          details: 'This hash has not been analyzed yet'
        });
        return;
      }
      
      if (response.status === 429) {
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          details: 'VirusTotal free tier allows 4 requests per minute. Please wait before trying again.'
        });
        return;
      }

      res.status(response.status).json({ 
        error: 'VirusTotal API error',
        details: errorData.error?.message || `HTTP ${response.status}`
      });
      return;
    }

    const data = await response.json();
    
    // Extract relevant information
    const attributes = data.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};
    const results = attributes.last_analysis_results || {};
    
    res.json({
      type: 'hash',
      input: sanitizedHash,
      results: {
        detectionRatio: `${stats.malicious || 0}/${(stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0)}`,
        totalEngines: (stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0) + (stats.suspicious || 0),
        positives: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
        scanDate: attributes.last_analysis_date || null,
        engines: results,
        sha256: attributes.sha256 || sanitizedHash,
        sha1: attributes.sha1,
        md5: attributes.md5,
        fileType: attributes.type_description,
        fileSize: attributes.size,
        firstSeen: attributes.first_submission_date,
        lastSeen: attributes.last_submission_date,
      },
    });
  } catch (error: any) {
    console.error('VirusTotal hash analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze hash',
      details: error.message || 'Unknown error occurred'
    });
  }
}

/**
 * Analyze a URL using VirusTotal
 * POST /api/virustotal/analyze
 * Body: { input: string }
 */
export async function analyzeURL(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!VIRUSTOTAL_API_KEY) {
      res.status(500).json({ error: 'VirusTotal API key not configured' });
      return;
    }

    const { input } = req.body;
    
    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const sanitizedURL = input.trim();
    
    // Validate URL format
    if (!sanitizedURL.startsWith('http://') && !sanitizedURL.startsWith('https://')) {
      res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
      return;
    }

    console.log('VirusTotal URL analysis:', sanitizedURL);

    // Step 1: Submit URL for analysis
    const submitResponse = await fetch(`${VIRUSTOTAL_API_BASE}/urls`, {
      method: 'POST',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(sanitizedURL)}`,
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      
      if (submitResponse.status === 429) {
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          details: 'VirusTotal free tier allows 4 requests per minute. Please wait before trying again.'
        });
        return;
      }

      res.status(submitResponse.status).json({ 
        error: 'Failed to submit URL',
        details: errorData.error?.message || `HTTP ${submitResponse.status}`
      });
      return;
    }

    const submitData = await submitResponse.json();
    console.log('VirusTotal URL submit response:', JSON.stringify(submitData, null, 2));
    
    // VirusTotal returns the URL ID (hash-based identifier)
    const urlId = submitData.data?.id;

    if (!urlId) {
      res.status(500).json({ error: 'Failed to get URL analysis ID' });
      return;
    }

    // Step 2: Get analysis results
    // For VirusTotal API v3, the /urls endpoint expects the base64-encoded URL
    // But the ID returned is a hash. We need to base64 encode the original URL
    // and make it URL-safe (replace + with -, / with _, remove = padding)
    const base64Url = Buffer.from(sanitizedURL).toString('base64');
    const urlSafeBase64 = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const analysisResponse = await fetch(`${VIRUSTOTAL_API_BASE}/urls/${urlSafeBase64}`, {
      method: 'GET',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({}));
      console.error('VirusTotal URL analysis error:', {
        status: analysisResponse.status,
        statusText: analysisResponse.statusText,
        errorData,
        urlId,
        urlSafeBase64,
      });
      res.status(analysisResponse.status).json({ 
        error: 'Failed to get URL analysis results',
        details: errorData.error?.message || errorData.message || `HTTP ${analysisResponse.status}: ${analysisResponse.statusText}`
      });
      return;
    }

    const analysisData = await analysisResponse.json();
    const attributes = analysisData.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};
    const results = attributes.last_analysis_results || {};
    
    // Check if analysis is still queued
    if (attributes.status === 'queued' || !stats || Object.keys(stats).length === 0) {
      res.status(202).json({
        type: 'url',
        input: sanitizedURL,
        results: {
          detectionRatio: '0/0',
          totalEngines: 0,
          positives: 0,
          suspicious: 0,
          harmless: 0,
          undetected: 0,
          scanDate: null,
          engines: {},
          url: sanitizedURL,
          status: 'queued',
          message: 'URL is queued for analysis. Please try again in a few moments.',
        },
      });
      return;
    }
    
    res.json({
      type: 'url',
      input: sanitizedURL,
      results: {
        detectionRatio: `${stats.malicious || 0}/${(stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0)}`,
        totalEngines: (stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0) + (stats.suspicious || 0),
        positives: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
        scanDate: attributes.last_analysis_date || null,
        engines: results,
        url: sanitizedURL,
        title: attributes.title,
        firstSeen: attributes.first_submission_date,
        lastSeen: attributes.last_submission_date,
      },
    });
  } catch (error: any) {
    console.error('VirusTotal URL analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze URL',
      details: error.message || 'Unknown error occurred'
    });
  }
}

/**
 * Analyze an uploaded file using VirusTotal
 * POST /api/virustotal/analyze/file
 */
export async function analyzeFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!VIRUSTOTAL_API_KEY) {
      res.status(500).json({ error: 'VirusTotal API key not configured' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    console.log('VirusTotal file analysis:', {
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
    });

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      res.status(400).json({ error: 'Uploaded file not found' });
      return;
    }

    // Check file size (VirusTotal free tier: 32MB max)
    if (req.file.size > 32 * 1024 * 1024) {
      // Clean up file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
      res.status(400).json({ error: 'File too large. Maximum size is 32MB' });
      return;
    }

    try {
      // Upload file to VirusTotal
      const formData = new FormData();
      const fileStream = fs.createReadStream(req.file.path);
      formData.append('file', fileStream, {
        filename: req.file.originalname,
        contentType: req.file.mimetype || 'application/octet-stream',
      });

      const uploadResponse = await fetch(`${VIRUSTOTAL_API_BASE}/files`, {
        method: 'POST',
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file:', req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        
        if (uploadResponse.status === 429) {
          res.status(429).json({ 
            error: 'Rate limit exceeded',
            details: 'VirusTotal free tier allows 4 requests per minute. Please wait before trying again.'
          });
          return;
        }

        res.status(uploadResponse.status).json({ 
          error: 'Failed to upload file to VirusTotal',
          details: errorData.error?.message || `HTTP ${uploadResponse.status}`
        });
        return;
      }

      const uploadData = await uploadResponse.json();
      const analysisId = uploadData.data?.id;

      if (!analysisId) {
        res.status(500).json({ error: 'Failed to get file analysis ID' });
        return;
      }

      // Get analysis results
      const analysisResponse = await fetch(`${VIRUSTOTAL_API_BASE}/analyses/${analysisId}`, {
        method: 'GET',
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
        },
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        res.status(analysisResponse.status).json({ 
          error: 'Failed to get file analysis results',
          details: errorData.error?.message || `HTTP ${analysisResponse.status}`
        });
        return;
      }

      const analysisData = await analysisResponse.json();
      const attributes = analysisData.data?.attributes || {};
      const stats = attributes.stats || {};
      const results = attributes.results || {};
      
      res.json({
        type: 'file',
        input: req.file.originalname,
        results: {
          detectionRatio: `${stats.malicious || 0}/${(stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0)}`,
          totalEngines: (stats.malicious || 0) + (stats.undetected || 0) + (stats.harmless || 0) + (stats.suspicious || 0),
          positives: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          harmless: stats.harmless || 0,
          undetected: stats.undetected || 0,
          scanDate: attributes.date || null,
          status: attributes.status,
          engines: results,
          sha256: attributes.sha256,
          sha1: attributes.sha1,
          md5: attributes.md5,
        },
      });
    } catch (error: any) {
      // Clean up file even if upload fails
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }

      console.error('VirusTotal file analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze file',
        details: error.message || 'Unknown error occurred'
      });
    }
  } catch (error: any) {
    console.error('VirusTotal file analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze file',
      details: error.message || 'Unknown error occurred'
    });
  }
}

/**
 * Unified analyze endpoint that auto-detects input type
 * POST /api/virustotal/analyze
 * Body: { input: string } OR multipart/form-data with file
 */
export async function analyze(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // If file is uploaded, analyze as file
    if (req.file) {
      return analyzeFile(req, res);
    }

    // Otherwise, check body for input
    const { input } = req.body;
    
    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'Input is required. Provide a hash, URL, or upload a file' });
      return;
    }

    const inputType = detectInputType(input);

    if (inputType === 'hash') {
      // Redirect to hash analysis
      req.query.hash = input;
      return analyzeHash(req, res);
    } else if (inputType === 'url') {
      // Use URL analysis
      return analyzeURL(req, res);
    } else {
      res.status(400).json({ 
        error: 'Invalid input format',
        details: 'Input must be a hash (MD5/SHA-1/SHA-256), URL (http:// or https://), or a file upload'
      });
      return;
    }
  } catch (error: any) {
    console.error('VirusTotal analyze error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze input',
      details: error.message || 'Unknown error occurred'
    });
  }
}
