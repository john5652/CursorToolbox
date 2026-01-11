/**
 * Authentication Controller
 * 
 * Handles user registration and login endpoints.
 * 
 * Key Security Practices:
 * 1. Password hashing: Never store plain text passwords
 * 2. Input validation: Validate all user input before processing
 * 3. Duplicate checking: Prevent duplicate emails/usernames
 * 4. JWT tokens: Generate tokens for authenticated sessions
 * 5. Error handling: Don't leak sensitive information in errors
 */

import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma'; // Centralized Prisma Client instance

/**
 * Register a new user
 * 
 * Endpoint: POST /api/auth/register
 * 
 * Process Flow:
 * 1. Validate input (email format, username length, password strength)
 * 2. Check for duplicate email
 * 3. Check for duplicate username
 * 4. Hash password using bcrypt
 * 5. Create user record in database
 * 6. Generate JWT token
 * 7. Return user data (without password) and token
 * 
 * Security Notes:
 * - Password is hashed before storing (see utils/password.ts)
 * - Password is never returned in response
 * - Email and username are checked for uniqueness
 * 
 * @param req - Express request object (contains email, username, password in body)
 * @param res - Express response object (used to send JSON response)
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Step 1: Validate input using express-validator
    // Checks: email format, username length/format, password length
    // Validation rules defined in routes/auth.routes.ts
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors (400 Bad Request)
      res.status(400).json({ errors: errors.array() });
      return; // Stop here if validation failed
    }

    // Extract data from request body
    const { email, username, password } = req.body;

    // Step 2: Check if email already exists
    // findUnique() uses the @unique constraint from schema
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      // Email already in use - return error
      // Note: Generic error message prevents email enumeration attacks
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    // Step 3: Check if username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      res.status(400).json({ error: 'Username is already taken.' });
      return;
    }

    // Step 4: Hash the password for secure storage
    // hashPassword() uses bcrypt with salt rounds = 10
    // Result: One-way hash that can't be reversed to get original password
    const hashedPassword = await hashPassword(password);

    // Step 5: Create user record in database
    // Prisma.create() generates SQL INSERT statement
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword, // Store hash, not plain password!
      },
      // select: Only return these fields (excludes password)
      // This ensures password hash never leaves the server
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        // password is NOT selected - never send password hash to client
      },
    });

    // Step 6: Generate JWT token for immediate login
    // Token contains: userId, email, username
    // Token expires in 7 days (configurable via JWT_EXPIRES_IN)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Step 7: Return success response with user data and token
    // Status 201 = Created (successful resource creation)
    res.status(201).json({
      message: 'User registered successfully',
      user, // User data (without password)
      token, // JWT token for authentication
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Registration error:', error);
    // Generic error message - don't leak internal details
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * Login an existing user
 * 
 * Endpoint: POST /api/auth/login
 * 
 * Process Flow:
 * 1. Validate input (email format, password required)
 * 2. Find user by email in database
 * 3. Compare provided password with stored hash
 * 4. If match: Generate JWT token and return user data
 * 5. If no match: Return generic error (prevents user enumeration)
 * 
 * Security Notes:
 * - Same error message for invalid email OR password (prevents enumeration)
 * - Password comparison uses bcrypt.compare() (timing-safe)
 * - Token generated only after successful password verification
 * 
 * @param req - Express request object (contains email, password in body)
 * @param res - Express response object
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Step 1: Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Extract credentials from request body
    const { email, password } = req.body;

    // Step 2: Find user by email
    // findUnique() uses the @unique constraint on email field
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Step 3: Check if user exists
    // Note: We return the same error message whether email is wrong OR password is wrong
    // This prevents attackers from discovering which emails are registered
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Step 4: Verify password
    // comparePassword() uses bcrypt to compare plain password with stored hash
    // bcrypt handles salt extraction and comparison automatically
    const isPasswordValid = await comparePassword(password, user.password);

    // Step 5: Check password validity
    // Same generic error message (security best practice)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Step 6: Password is correct! Generate JWT token
    // Token will be used for all subsequent authenticated requests
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Step 7: Return success response
    // Status 200 = OK (default for res.json())
    res.json({
      message: 'Login successful',
      user: {
        // Return user data (explicitly exclude password)
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token, // JWT token for authentication
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}
