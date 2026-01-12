# Dependencies Guide

This document lists all dependencies required for the mobile app and backend, along with installation instructions.

## Mobile App Dependencies

### Core Dependencies

#### expo (~51.0.0)
- **Purpose**: Core Expo framework for React Native development
- **Installation**: `npm install expo@~51.0.0`
- **Why**: Provides the foundation for Expo apps, handles native modules, and development tools

#### expo-router (~3.5.0)
- **Purpose**: File-based routing for Expo apps
- **Installation**: `npm install expo-router@~3.5.0`
- **Why**: Simplifies navigation with file-based routing (similar to Next.js)

#### react (18.2.0) & react-native (0.74.0)
- **Purpose**: Core React and React Native libraries
- **Installation**: Included automatically with Expo
- **Why**: Essential for building React Native components

### File Handling

#### expo-document-picker (~12.0.0)
- **Purpose**: Pick documents from device storage
- **Installation**: `npm install expo-document-picker@~12.0.0`
- **Why**: Allows users to select files (images, documents) from their device

#### expo-image-picker (~15.0.0)
- **Purpose**: Pick images from gallery or camera
- **Installation**: `npm install expo-image-picker@~15.0.0`
- **Why**: Provides native image selection with camera support

#### expo-file-system (~17.0.0)
- **Purpose**: File system operations
- **Installation**: `npm install expo-file-system@~17.0.0`
- **Why**: Read/write files, manage file paths, necessary for PDF operations

#### expo-sharing (~12.0.0)
- **Purpose**: Share files with other apps
- **Installation**: `npm install expo-sharing@~12.0.0`
- **Why**: Allows users to share converted PDFs via email, messaging, etc.

### Storage & State

#### @react-native-async-storage/async-storage (1.23.1)
- **Purpose**: Persistent key-value storage (replaces localStorage)
- **Installation**: `npm install @react-native-async-storage/async-storage@1.23.1`
- **Why**: Stores authentication tokens and user data persistently

### Networking

#### axios (^1.6.2)
- **Purpose**: HTTP client for API calls
- **Installation**: `npm install axios@^1.6.2`
- **Why**: Makes API requests to backend, handles authentication headers

### PDF Conversion

#### pdf-lib (^1.17.1)
- **Purpose**: Client-side PDF creation and manipulation
- **Installation**: `npm install pdf-lib@^1.17.1`
- **Why**: Converts images to PDF on the device (client-side conversion)

### UI Components

#### @expo/vector-icons (^14.0.0)
- **Purpose**: Icon library (Ionicons, MaterialIcons, etc.)
- **Installation**: `npm install @expo/vector-icons@^14.0.0`
- **Why**: Provides icons for navigation tabs and UI elements

#### react-native-safe-area-context (4.10.1)
- **Purpose**: Handle safe areas (notches, status bars)
- **Installation**: Included with Expo Router
- **Why**: Ensures UI doesn't overlap with system UI

#### react-native-screens (~3.31.0)
- **Purpose**: Native screen components
- **Installation**: Included with Expo Router
- **Why**: Optimizes screen rendering performance

### Development Dependencies

#### @babel/core (^7.24.0)
- **Purpose**: JavaScript compiler
- **Installation**: Included with Expo
- **Why**: Transpiles modern JavaScript/TypeScript

#### typescript (^5.3.3)
- **Purpose**: TypeScript compiler
- **Installation**: `npm install --save-dev typescript@^5.3.3`
- **Why**: Provides type safety and better developer experience

#### @types/react (~18.2.79)
- **Purpose**: TypeScript types for React
- **Installation**: `npm install --save-dev @types/react@~18.2.79`
- **Why**: TypeScript support for React components

## Backend Dependencies

### Core

#### express (^4.18.2)
- **Purpose**: Web framework for Node.js
- **Installation**: `npm install express@^4.18.2`
- **Why**: Handles HTTP requests, routing, middleware

#### typescript (^5.3.3)
- **Purpose**: TypeScript compiler
- **Installation**: `npm install --save-dev typescript@^5.3.3`
- **Why**: Type safety for backend code

### Database

#### @prisma/client (^5.7.1) & prisma (^5.7.1)
- **Purpose**: Database ORM and migration tool
- **Installation**: `npm install @prisma/client@^5.7.1 prisma@^5.7.1 --save-dev`
- **Why**: Type-safe database access, migrations, schema management

### Authentication

#### jsonwebtoken (^9.0.2)
- **Purpose**: JWT token creation and verification
- **Installation**: `npm install jsonwebtoken@^9.0.2`
- **Why**: Secure authentication tokens

#### bcrypt (^5.1.1)
- **Purpose**: Password hashing
- **Installation**: `npm install bcrypt@^5.1.1`
- **Why**: Securely hash passwords before storing

### File Handling

#### multer (^1.4.5-lts.1)
- **Purpose**: File upload middleware
- **Installation**: `npm install multer@^1.4.5-lts.1`
- **Why**: Handles multipart/form-data file uploads

#### form-data (^4.0.5)
- **Purpose**: Form data handling for HTTP requests
- **Installation**: `npm install form-data@^4.0.5`
- **Why**: Required for VirusTotal file uploads and other multipart/form-data requests

### PDF Conversion

#### pdf-lib (^1.17.1)
- **Purpose**: PDF creation and manipulation
- **Installation**: `npm install pdf-lib@^1.17.1`
- **Why**: Server-side PDF generation

#### sharp (^0.33.0)
- **Purpose**: High-performance image processing
- **Installation**: `npm install sharp@^0.33.0`
- **Why**: Resize, convert, and optimize images before PDF conversion

### EXIF Metadata Extraction

#### exiftool-vendored (^24.0.0)
- **Purpose**: Node.js wrapper for ExifTool command-line utility
- **Installation**: `npm install exiftool-vendored@^24.0.0`
- **Why**: Extracts metadata and EXIF data from images, videos, documents, and other file types
- **Note**: Requires ExifTool to be installed on the system (see below)

#### exiftool (System Dependency)
- **Purpose**: Command-line tool for reading and writing metadata in files
- **Installation** (System-level, not npm):
  - **macOS**: `brew install exiftool`
  - **Linux (Debian/Ubuntu)**: `sudo apt-get install libimage-exiftool-perl`
  - **Linux (RHEL/CentOS)**: `sudo yum install perl-Image-ExifTool`
  - **Windows**: Download from [exiftool.org](https://exiftool.org/) and add to PATH
- **Why**: Core tool that extracts metadata from files. The `exiftool-vendored` package is a Node.js wrapper that requires this system tool to be installed.
- **Important**: Must be installed on the server system where the backend runs. This is not an npm package.

### Network Scanning

#### nmap (System Dependency)
- **Purpose**: Network exploration and security auditing tool
- **Installation** (System-level, not npm):
  - **macOS**: `brew install nmap`
  - **Linux (Debian/Ubuntu)**: `sudo apt-get install nmap`
  - **Linux (RHEL/CentOS)**: `sudo yum install nmap`
  - **Windows**: Download from [nmap.org](https://nmap.org/download.html) and add to PATH
- **Why**: Core tool for network scanning, port scanning, and service detection. Used by the backend to perform network scans based on user requests.
- **Important**: Must be installed on the server system where the backend runs. This is not an npm package.
- **Note**: Nmap requires appropriate permissions to perform certain scan types. Some scans may require root/administrator privileges.

### VirusTotal Malware Analysis

#### form-data (^4.0.5)
- **Purpose**: Form data handling for HTTP requests
- **Installation**: `npm install form-data@^4.0.5`
- **Why**: Required for uploading files to VirusTotal API

#### VirusTotal API Key (Environment Variable)
- **Purpose**: API key for VirusTotal malware analysis service
- **Setup**: 
  1. Sign up for a free account at [virustotal.com](https://www.virustotal.com)
  2. Get your API key from the API section of your account
  3. Add to backend `.env` file: `VIRUSTOTAL_API_KEY=your_key_here`
- **Why**: Required for analyzing files, URLs, and hashes for malware
- **Important**: 
  - Free tier allows 4 requests per minute
  - API key must be stored in backend `.env` file (never expose to mobile app)
  - Never commit API keys to version control

### Utilities

#### cors (^2.8.5)
- **Purpose**: Cross-Origin Resource Sharing
- **Installation**: `npm install cors@^2.8.5`
- **Why**: Allows mobile app to make requests to backend

#### dotenv (^16.3.1)
- **Purpose**: Environment variable management
- **Installation**: `npm install dotenv@^16.3.1`
- **Why**: Loads environment variables from .env file

#### express-validator (^7.0.1)
- **Purpose**: Request validation
- **Installation**: `npm install express-validator@^7.0.1`
- **Why**: Validates and sanitizes user input

## Installation Commands

### Mobile App
```bash
cd mobile
npm install
```

### Backend
```bash
cd backend
npm install
```

## Version Compatibility

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Expo SDK**: 51.x
- **React Native**: 0.74.x
- **TypeScript**: 5.3.x

## Updating Dependencies

### Check for updates:
```bash
npm outdated
```

### Update all dependencies:
```bash
npm update
```

### Update specific package:
```bash
npm install package-name@latest
```

## Security Notes

- Always keep dependencies up to date
- Review security advisories: `npm audit`
- Fix vulnerabilities: `npm audit fix`
- Never commit `.env` files
- Use environment variables for sensitive data

## Troubleshooting

### Installation Issues

1. **"Permission denied"**
   - Use `sudo` (not recommended) or fix npm permissions
   - Better: Use a Node version manager (nvm)

2. **"Module not found"**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

3. **Native module build errors**
   - Ensure you have build tools installed
   - macOS: Xcode Command Line Tools
   - Linux: build-essential
   - Windows: Visual Studio Build Tools

4. **Sharp installation issues**
   - Sharp requires native compilation
   - May need Python and build tools
   - See: https://sharp.pixelplumbing.com/install

5. **ExifTool not found**
   - Ensure ExifTool is installed on the system (not just npm package)
   - Verify installation: `exiftool -ver` (should show version number)
   - Check PATH includes ExifTool location
   - On macOS/Linux: `which exiftool` should show path
   - See BUILD_GUIDE.md for installation instructions

6. **Nmap not found**
   - Ensure Nmap is installed on the system (not just npm package)
   - Verify installation: `nmap --version` (should show version number)
   - Check PATH includes Nmap location
   - On macOS/Linux: `which nmap` should show path
   - See BUILD_GUIDE.md for installation instructions
   - **Note**: Some nmap scan types require root/administrator privileges. Ensure the backend has appropriate permissions if needed.

7. **VirusTotal API key not configured**
   - Ensure `VIRUSTOTAL_API_KEY` is set in backend `.env` file
   - Verify the API key is valid and active
   - Check backend server logs for API key errors
   - Free tier has rate limits (4 requests/minute) - wait if you hit the limit
   - See BUILD_GUIDE.md for API key setup instructions
