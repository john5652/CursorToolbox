/**
 * Express Server Setup
 * 
 * This is the main entry point for the backend API server.
 * It sets up Express, configures middleware, and registers all routes.
 * 
 * Server Architecture:
 * - Express.js: Web framework for Node.js
 * - RESTful API: Routes organized by resource (auth, users, posts, comments)
 * - Middleware: Functions that run before route handlers (CORS, JSON parsing, auth)
 * - Controllers: Handle business logic for each route
 * - Prisma: Database ORM for type-safe database queries
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import pdfRoutes from './routes/pdf.routes';
import exifRoutes from './routes/exif.routes';
import nmapRoutes from './routes/nmap.routes';
import virustotalRoutes from './routes/virustotal.routes';

// Load environment variables from .env file
// These are sensitive values like database URL, JWT secret, etc.
dotenv.config();

// Create Express application instance
const app = express();

// Server configuration from environment variables
const PORT = process.env.PORT || 5001; // Port server listens on
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'; // Directory for uploaded files

// Set server timeout to 6 minutes (360000ms) to allow long-running nmap scans
// This is longer than the nmap command timeout (5 minutes)
app.timeout = 360000;

/**
 * MIDDLEWARE SETUP
 * 
 * Middleware functions run in order for every request.
 * They can modify the request/response or end the request early.
 */

// CORS (Cross-Origin Resource Sharing)
// Allows frontend (running on different port) to make requests to this API
// Without this, browser would block requests due to same-origin policy
app.use(cors());

// Parse JSON request bodies
// Converts JSON strings in request body to JavaScript objects
// Example: { "email": "user@example.com" } → req.body.email = "user@example.com"
app.use(express.json());

// Parse URL-encoded request bodies (form data)
// Handles data sent as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images and PDFs)
// Makes files in /uploads directory accessible via URL
// Example: http://localhost:5001/uploads/avatar-123.jpg
// Example: http://localhost:5001/uploads/pdfs/converted-123.pdf
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

/**
 * ROUTE REGISTRATION
 * 
 * Routes are organized by resource:
 * - /api/auth: Authentication (login, register) - Public
 * - /api/users: User operations (profile, avatar) - Protected
 * - /api/pdf: PDF conversion operations - Protected
 * - /api/exif: EXIF metadata extraction operations - Protected
 * - /api/nmap: Network scanning operations using nmap - Protected
 */

// Health check endpoint - useful for monitoring/deployment
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Authentication routes (public - no auth required)
// POST /api/auth/register - Create new user account
// POST /api/auth/login - Login and get JWT token
app.use('/api/auth', authRoutes);

// User routes (protected - require authentication)
// GET /api/users/me - Get current user profile
// PUT /api/users/me - Update username
// POST /api/users/me/avatar - Upload avatar
app.use('/api/users', userRoutes);

// PDF routes (protected)
// POST /api/pdf/convert - Convert file to PDF
// GET /api/pdf/conversions - Get user's conversion history
// GET /api/pdf/:id - Download converted PDF
// DELETE /api/pdf/:id - Delete conversion
app.use('/api/pdf', pdfRoutes);

// EXIF routes (protected)
// POST /api/exif/extract - Extract metadata from uploaded file
app.use('/api/exif', exifRoutes);

// Nmap routes (protected)
// POST /api/nmap/scan - Scan a host using nmap
app.use('/api/nmap', nmapRoutes);

// VirusTotal routes (protected)
// POST /api/virustotal/analyze - Analyze hash, URL, or file (auto-detects type)
// GET /api/virustotal/analyze/hash?hash={hash} - Analyze hash
// POST /api/virustotal/analyze/url - Analyze URL
// POST /api/virustotal/analyze/file - Analyze uploaded file
app.use('/api/virustotal', virustotalRoutes);

/**
 * START SERVER
 * 
 * Listen on specified port and log when server is ready
 */
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server timeout set to 6 minutes for long-running operations`);
});

// Set server timeout to 6 minutes (360000ms) for long-running requests like nmap scans
server.timeout = 360000;
server.keepAliveTimeout = 360000;
server.headersTimeout = 360000;
