/**
 * Password Hashing Utilities using bcrypt
 * 
 * IMPORTANT: Never store passwords in plain text!
 * 
 * bcrypt is a password hashing function that:
 * 1. Adds a random "salt" to each password before hashing
 * 2. Makes it computationally expensive to crack (slows down brute force attacks)
 * 3. Produces a different hash each time (even for same password) due to salt
 * 
 * How it works:
 * - Registration: User provides password → Hash it → Store hash in database
 * - Login: User provides password → Hash it → Compare with stored hash
 * 
 * Security features:
 * - One-way function: Can't reverse hash to get original password
 * - Salt: Prevents rainbow table attacks
 * - Cost factor (saltRounds): Makes hashing slower, harder to brute force
 */

import bcrypt from 'bcrypt';

/**
 * Hash a plain text password for secure storage
 * 
 * This function converts a plain text password into a secure hash.
 * The hash can be stored in the database, but the original password cannot be recovered from it.
 * 
 * Process:
 * 1. Takes plain text password (e.g., "mypassword123")
 * 2. Generates random salt (unique random data)
 * 3. Combines password + salt
 * 4. Hashes the combination using bcrypt algorithm
 * 5. Returns hash like: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
 * 
 * saltRounds = 10 means:
 * - 2^10 = 1024 iterations of the hashing algorithm
 * - Higher number = more secure but slower
 * - 10 is a good balance for most applications
 * 
 * @param password - Plain text password from user input
 * @returns Hashed password string to store in database
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Cost factor - higher = more secure but slower
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a stored hash during login
 * 
 * Process:
 * 1. Takes plain text password from login form
 * 2. Takes hashed password from database
 * 3. bcrypt.compare() extracts the salt from the hash
 * 4. Hashes the plain password with the same salt
 * 5. Compares the two hashes
 * 
 * Why this works:
 * - The hash stored in DB contains the salt used originally
 * - bcrypt.compare() knows how to extract and use that salt
 * - Same password + same salt = same hash
 * 
 * @param password - Plain text password from login form
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // bcrypt.compare() handles salt extraction and comparison automatically
  return await bcrypt.compare(password, hashedPassword);
}
