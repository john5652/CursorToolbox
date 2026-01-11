/**
 * JWT (JSON Web Token) Utilities
 * 
 * JWT is used for stateless authentication. Instead of storing sessions on the server,
 * we encode user information in a token that the client sends with each request.
 * 
 * How it works:
 * 1. User logs in → Server generates JWT token with user info
 * 2. Client stores token (localStorage) → Sends token in Authorization header
 * 3. Server verifies token on protected routes → Extracts user info from token
 * 
 * Benefits:
 * - Stateless: No server-side session storage needed
 * - Scalable: Works across multiple servers
 * - Secure: Token is signed with secret key, can't be tampered with
 */

import jwt from 'jsonwebtoken';

// JWT_SECRET: Used to sign and verify tokens. Must be kept secret!
// In production, this should be a strong random string stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// JWT_EXPIRES_IN: How long the token is valid (e.g., "7d" = 7 days)
// When token expires, user must login again to get a new token
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Interface for the data stored in the JWT token
 * This is what gets encoded and sent to the client
 */
export interface JWTPayload {
  userId: string;    // User's unique ID from database
  email: string;    // User's email
  username: string; // User's username
}

/**
 * Generate a JWT token for a user
 * 
 * This function creates a JWT token containing user information.
 * The token is used to authenticate the user on subsequent requests.
 * 
 * Process:
 * 1. Takes user data (userId, email, username)
 * 2. Signs it with JWT_SECRET using jwt.sign()
 * 3. Returns a token string that looks like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * The token contains:
 * - Header: Algorithm and token type
 * - Payload: User data (userId, email, username)
 * - Signature: Ensures token hasn't been tampered with
 * 
 * @param payload - User data to encode in the token
 * @returns JWT token string that client will store and send with requests
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // Token expiration time (e.g., "7d" = 7 days)
  });
}

/**
 * Verify and decode a JWT token from incoming requests
 * 
 * Process:
 * 1. Takes token string from Authorization header
 * 2. Verifies signature using JWT_SECRET
 * 3. Checks if token is expired
 * 4. Returns decoded user data if valid, null if invalid/expired
 * 
 * This is called on every protected route to ensure the user is authenticated
 * 
 * @param token - JWT token string from Authorization header
 * @returns Decoded token payload (user info) or null if invalid/expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // jwt.verify() will throw an error if:
    // - Token signature doesn't match (tampered with)
    // - Token is expired
    // - Token format is invalid
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract the actual token from the Authorization header
 * 
 * Authorization header format: "Bearer <token>"
 * Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * This function:
 * 1. Splits the header by space
 * 2. Checks if it starts with "Bearer"
 * 3. Returns just the token part
 * 
 * @param authHeader - Authorization header value from request
 * @returns Token string or null if format is invalid
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Split "Bearer <token>" into ["Bearer", "<token>"]
  const parts = authHeader.split(' ');
  
  // Must have exactly 2 parts and first part must be "Bearer"
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  // Return the actual token (second part)
  return parts[1];
}
