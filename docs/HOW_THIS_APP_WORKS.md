# How This App Works - Complete Guide for Learners

This guide explains how to start the app and how it works under the hood. Perfect for beginners learning full-stack mobile development!

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [How the App Works](#how-the-app-works)
3. [Architecture Overview](#architecture-overview)
4. [Key Concepts Explained](#key-concepts-explained)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start Guide

### Prerequisites

Before starting, make sure you have:
- Node.js 18+ installed
- npm installed (comes with Node.js)
- Expo Go app on your phone (iOS/Android)
- Backend and mobile app dependencies installed

### Step 1: Start the Backend Server

Open **Terminal** and run:

```bash
cd "/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/backend"
npm run dev
```

**What you should see:**
```
Server is running on http://localhost:5001
```

**What this does:**
- Starts the Express.js API server
- Makes the backend available at `http://localhost:5001`
- Handles authentication, user management, and PDF conversion
- **Keep this terminal window open!**

---

### Step 2: Start the Mobile App

Open a **new Terminal window** (or tab) and run:

```bash
cd "/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/mobile"
npm start
```

**What you should see:**
- A QR code displayed in the terminal
- Options: Press `i` for iOS, `a` for Android, `w` for web
- Metro bundler logs

**What this does:**
- Starts the Expo development server
- Bundles your React Native code
- Makes the app available for your device to connect

---

### Step 3: Connect Your Device

#### Option A: Physical Device (Recommended)

1. **Ensure your phone and computer are on the same Wi-Fi network**
2. Open **Expo Go** app on your phone
3. **Scan the QR code** from the terminal
4. The app will load on your device!

#### Option B: iOS Simulator (macOS only)

- In the terminal where `npm start` is running, press `i`
- The iOS Simulator will open automatically

#### Option C: Android Emulator

1. Start Android Emulator from Android Studio
2. In the terminal, press `a`
- The app will load in the emulator

---

## Quick Reference Commands

### Backend Server
```bash
cd "/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/backend"
npm run dev
```

### Mobile App
```bash
cd "/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/mobile"
npm start
```

### Stop Servers
Press `Ctrl+C` in the terminal where the server is running.

---

## How the App Works

### High-Level Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Mobile    │  HTTP   │   Backend    │  SQL    │  Database   │
│     App     │ ──────> │     API      │ ──────> │  (SQLite)   │
│  (React     │         │  (Express)  │         │  (Prisma)   │
│   Native)   │ <────── │              │ <────── │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. **Mobile App** (React Native) runs on your phone
2. **Backend API** (Express.js) runs on your computer
3. **Database** (SQLite) stores user data and file conversions
4. They communicate via HTTP requests (REST API)

---

## Architecture Overview

### Project Structure

```
mobile-app/
├── backend/              # API Server (Node.js + Express)
│   ├── src/
│   │   ├── controllers/  # Business logic (auth, users, PDF)
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, file upload
│   │   └── utils/        # Helpers (JWT, password, PDF)
│   └── prisma/           # Database schema & migrations
│
├── mobile/               # Mobile App (React Native + Expo)
│   ├── app/              # Screens (login, register, home, etc.)
│   ├── components/       # Reusable UI components
│   ├── context/          # Global state (authentication)
│   ├── services/         # API client (HTTP requests)
│   └── utils/            # Helpers (auth storage, PDF conversion)
│
└── docs/                 # Documentation
```

---

## Key Concepts Explained

### 1. Authentication Flow

**How login works:**

```
User enters email/password
    ↓
Mobile app sends POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Backend generates JWT token
    ↓
Mobile app stores token in AsyncStorage
    ↓
All future requests include token in header
```

**Key files:**
- `mobile/app/(auth)/login.tsx` - Login screen
- `backend/src/controllers/auth.controller.ts` - Login logic
- `mobile/context/AuthContext.tsx` - Manages auth state

**Security:**
- Passwords are **hashed** using bcrypt (never stored in plain text)
- JWT tokens expire after 7 days
- Tokens are stored securely in AsyncStorage

---

### 2. User Registration

**How registration works:**

```
User fills form (email, username, password)
    ↓
Mobile app validates input
    ↓
Mobile app sends POST /api/auth/register
    ↓
Backend checks for duplicates
    ↓
Backend hashes password
    ↓
Backend creates user in database
    ↓
Backend returns JWT token
    ↓
User is automatically logged in
```

**Validation rules:**
- Email must be valid format
- Username: 3-20 characters, letters/numbers/underscores only
- Password: minimum 6 characters

**Key files:**
- `mobile/app/(auth)/register.tsx` - Registration screen
- `backend/src/routes/auth.routes.ts` - Validation rules
- `backend/src/controllers/auth.controller.ts` - Registration logic

---

### 3. PDF Conversion

**How PDF conversion works:**

#### Client-Side (Device)
```
User selects image
    ↓
Mobile app reads image file
    ↓
pdf-lib converts image to PDF
    ↓
PDF saved to device storage
    ↓
User can share/download PDF
```

#### Server-Side
```
User selects file
    ↓
Mobile app uploads file to backend
    ↓
Backend receives file via multer
    ↓
Backend converts file using pdf-lib + sharp
    ↓
Backend saves PDF to uploads/pdfs/
    ↓
Backend stores conversion record in database
    ↓
Backend returns PDF path
    ↓
Mobile app can download/share PDF
```

**Key files:**
- `mobile/app/(tabs)/pdf-convert.tsx` - PDF conversion screen
- `mobile/utils/pdfConverter.ts` - Client-side conversion
- `backend/src/controllers/pdf.controller.ts` - Server-side conversion
- `backend/src/utils/pdfConverter.ts` - PDF conversion utilities

---

### 4. File Storage

**Where files are stored:**

- **Avatars**: `backend/uploads/` (served at `/uploads/avatar-123.jpg`)
- **PDFs**: `backend/uploads/pdfs/` (served at `/uploads/pdfs/file-123.pdf`)
- **Database**: `backend/prisma/dev.db` (SQLite file)

**How it works:**
- Files uploaded via `multer` middleware
- Files saved with unique names (timestamp + random number)
- File paths stored in database
- Files served as static assets via Express

---

### 5. EXIF Metadata Extraction

**How EXIF metadata extraction works:**

```
User selects file
    ↓
Mobile app uploads file to backend
    ↓
Backend receives file via multer
    ↓
Backend runs exiftool on file
    ↓
Backend parses exiftool output
    ↓
Backend organizes metadata by category
    ↓
Backend returns JSON metadata
    ↓
Mobile app displays formatted results
```

**Key files:**
- `mobile/app/(tabs)/exif-viewer.tsx` - EXIF viewer screen
- `mobile/services/exifAPI.ts` - API client for metadata extraction
- `backend/src/controllers/exif.controller.ts` - Server-side extraction logic
- `backend/src/middleware/exif-upload.middleware.ts` - File upload handling

**Metadata categories:**
- **File Information**: Filename, size, type, modification date
- **Image Information**: Dimensions, resolution, color depth, compression
- **Camera Settings**: Make, model, lens, focal length, aperture, shutter speed, ISO
- **GPS Location**: Latitude, longitude, altitude (if available)
- **Video Information**: Duration, frame rate, codec, bitrate
- **Audio Information**: Sample rate, channels, bitrate
- **Other**: Any additional metadata tags

**Dependencies:**
- **exiftool-vendored**: Node.js wrapper for exiftool
- **exiftool**: System command-line tool (must be installed on server)

**Note**: ExifTool must be installed on the server system. See BUILD_GUIDE.md for installation instructions.

---

### 6. Network Scanning (Nmap)

**How network scanning works:**

```
User enters host and optional flags
    ↓
Mobile app sends request to backend
    ↓
Backend validates and sanitizes input
    ↓
Backend executes nmap command
    ↓
Backend captures nmap output
    ↓
Backend returns scan results
    ↓
Mobile app displays formatted results
```

**Key files:**
- `mobile/app/(tabs)/nmap-scanner.tsx` - Nmap scanner screen
- `mobile/services/nmapAPI.ts` - API client for network scanning
- `backend/src/controllers/nmap.controller.ts` - Server-side scanning logic
- `backend/src/routes/nmap.routes.ts` - Nmap API routes

**Features:**
- Scan IP addresses, hostnames, or CIDR ranges
- Optional nmap flags for custom scan types
- Default scan (no flags) if flags are not provided
- Real-time scan output display
- Execution time tracking
- Error handling and timeout protection (30 seconds)

**Security considerations:**
- Input sanitization to prevent command injection
- Timeout protection to prevent long-running scans
- Authentication required for all scan requests
- Host and flags validation before execution

**Dependencies:**
- **nmap**: System command-line tool (must be installed on server)

**Note**: Nmap must be installed on the server system. See BUILD_GUIDE.md for installation instructions. Some scan types may require root/administrator privileges.

---

### 7. Navigation

**How navigation works:**

The app uses **Expo Router** (file-based routing):

```
app/
├── index.tsx              # Entry point (redirects based on auth)
├── (auth)/
│   ├── login.tsx         # Login screen
│   └── register.tsx      # Register screen
└── (tabs)/
    ├── home.tsx          # Home tab
    ├── pdf-convert.tsx   # Convert tab
    └── profile.tsx       # Profile tab
```

**Navigation flow:**
- Not logged in → `(auth)/login` or `(auth)/register`
- Logged in → `(tabs)/home`, `(tabs)/pdf-convert`, `(tabs)/profile`

**Key files:**
- `mobile/app/_layout.tsx` - Root layout with AuthProvider
- `mobile/app/index.tsx` - Routes based on authentication status

---

### 7. State Management

**How state is managed:**

The app uses **React Context API** for global state:

```javascript
// AuthContext provides:
- user: Current user data
- token: JWT token
- login(): Login function
- register(): Register function
- logout(): Logout function
- isAuthenticated: Boolean
```

**How it works:**
1. `AuthProvider` wraps the entire app
2. Any component can use `useAuth()` hook
3. When auth state changes, all components update automatically

**Key files:**
- `mobile/context/AuthContext.tsx` - Auth context implementation
- `mobile/utils/auth.ts` - AsyncStorage helpers

---

### 8. API Communication

**How the app talks to the backend:**

```javascript
// Example: Login request
axios.post('/api/auth/login', { email, password })
  .then(response => {
    // Success: Save token and user data
  })
  .catch(error => {
    // Error: Show error message
  });
```

**Request flow:**
1. Mobile app makes HTTP request via `axios`
2. Request interceptor adds JWT token to header
3. Backend receives request, validates token
4. Backend processes request, returns response
5. Response interceptor handles errors (401 = logout)

**Key files:**
- `mobile/services/api.ts` - Axios configuration
- `mobile/services/pdfAPI.ts` - PDF API functions

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user (requires auth)
- `PUT /api/users/me` - Update username (requires auth)
- `POST /api/users/me/avatar` - Upload avatar (requires auth)

### PDF Conversion
- `POST /api/pdf/convert` - Convert file to PDF (requires auth)
- `GET /api/pdf/conversions` - Get conversion history (requires auth)
- `GET /api/pdf/:id` - Download PDF (requires auth)
- `DELETE /api/pdf/:id` - Delete conversion (requires auth)

### EXIF Metadata Extraction
- `POST /api/exif/extract` - Extract metadata from uploaded file (requires auth)

### Health Check
- `GET /api/health` - Check if server is running

---

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String   // Hashed with bcrypt
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  conversions FileConversion[]
}
```

### FileConversion Model
```prisma
model FileConversion {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(...)
  originalFile String
  fileType    String
  pdfPath     String
  convertedAt DateTime @default(now())
  method      String   // "client" or "server"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Troubleshooting

### "Network request failed"
**Problem:** Mobile app can't reach backend

**Solutions:**
1. Make sure backend is running (`npm run dev` in backend folder)
2. Check that both devices are on same Wi-Fi network
3. Update `mobile/.env` to use your computer's IP instead of `localhost`:
   ```bash
   # Find your IP:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Update mobile/.env:
   EXPO_PUBLIC_API_URL=http://YOUR_IP:5001/api
   ```

### "Registration failed"
**Problem:** Can't create account

**Solutions:**
1. Check backend terminal for error messages
2. Ensure email is valid format
3. Username must be 3-20 characters, letters/numbers/underscores only
4. Password must be at least 6 characters
5. Email/username might already be taken

### "Cannot GET /"
**Problem:** Browser shows error when visiting `localhost:5001`

**Solution:** This is normal! The backend is an API server, not a website. Try `http://localhost:5001/api/health` instead.

### App won't load on device
**Problem:** Expo Go can't connect

**Solutions:**
1. Make sure Expo server is running (`npm start` in mobile folder)
2. Check QR code is visible in terminal
3. Ensure phone and computer are on same Wi-Fi
4. Try restarting Expo server: `npm start -- --clear`

### "EMFILE: too many open files"
**Problem:** File watching limit exceeded

**Solution:** Watchman is installed and should handle this. If it persists:
```bash
watchman watch-del '/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/mobile'
watchman watch-project '/Users/ellerion/Desktop/Cursor - Project 2 - Mobile App/mobile'
```

---

## Learning Resources

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev)

### Backend
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Docs](https://www.prisma.io/docs)

### Authentication
- [JWT.io](https://jwt.io) - Understand JWT tokens
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing

### PDF Conversion
- [pdf-lib](https://pdf-lib.js.org) - PDF creation library
- [sharp](https://sharp.pixelplumbing.com) - Image processing

---

## Next Steps

1. **Explore the code:** Read through the files mentioned in this guide
2. **Add features:** Try adding new functionality (e.g., file deletion)
3. **Customize UI:** Modify colors, fonts, layouts in the mobile app
4. **Deploy:** Follow `docs/APP_STORE_DEPLOYMENT.md` to publish your app

---

## Summary

This app demonstrates:
- ✅ Full-stack architecture (mobile + backend + database)
- ✅ User authentication with JWT
- ✅ File upload and processing
- ✅ PDF generation (client and server-side)
- ✅ State management with Context API
- ✅ RESTful API design
- ✅ Secure password storage
- ✅ Mobile-first UI design

Happy coding! 🚀
