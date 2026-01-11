/**
 * Nmap Routes
 * 
 * Routes for network scanning functionality using nmap
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { setNmapTimeout } from '../middleware/nmap-timeout.middleware';
import {
  scanHost,
} from '../controllers/nmap.controller';

const router = Router();

// All Nmap routes require authentication
router.use(authenticateToken);

// Set extended timeout for nmap scan requests
router.use(setNmapTimeout);

// Scan a host using nmap
router.post('/scan', scanHost);

export default router;
