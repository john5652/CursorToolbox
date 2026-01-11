/**
 * Authentication Middleware
 * 
 * This middleware protects routes that require authentication.
 * It runs before the route handler to verify the user is logged in.
 * 
 * How it works:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token is valid and not expired
 * 3. If valid: Adds user info to req.user and continues to route handler
 * 4. If invalid: Returns 401 Unauthorized error
 * 
 * Usage in routes:
 * router.post('/posts', authenticateToken, createPost)
 *                    ↑ This middleware runs first
 * 
 * When this middleware succeeds, req.user contains:
 * - userId: User's ID from database
 * - email: User's email
 * - username: User's username
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { JWTPayload } from '../utils/jwt';

/**
 * Extend Express Request type to include user property
 * This tells TypeScript that req.user exists and has the JWTPayload shape
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload; // User info added by authenticateToken middleware
    }
  }
}

/**
 * Authentication middleware - verifies JWT token on protected routes
 * 
 * Flow:
 * 1. Client sends request with Authorization: "Bearer <token>" header
 * 2. Middleware extracts token from header
 * 3. Verifies token signature and expiration
 * 4. If valid: Attaches user info to req.user, calls next() to continue
 * 5. If invalid: Returns 401 error, stops request
 * 
 * @param req - Express request object (contains headers, body, etc.)
 * @param res - Express response object (used to send responses)
 * @param next - Function to call to continue to next middleware/route handler
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get Authorization header from request
  // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers.authorization;
  
  // Extract the token part from "Bearer <token>" format
  let token = extractTokenFromHeader(authHeader);

  // If no token in header, check query parameter (for WebView support)
  // This allows URLs like /api/pdf/123?token=xyz to work in WebView
  if (!token && req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  // No token provided - user is not authenticated
  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return; // Stop here, don't continue to route handler
  }

  // Verify token is valid and not expired
  // Returns user data if valid, null if invalid/expired
  const payload = verifyToken(token);

  // Token is invalid or expired
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return; // Stop here, don't continue to route handler
  }

  // Token is valid! Attach user information to request object
  // Now the route handler can access req.user.userId, req.user.email, etc.
  req.user = payload;
  
  // Call next() to continue to the actual route handler
  // The route handler will now have access to req.user
  next();
}
