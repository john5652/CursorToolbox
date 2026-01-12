# Full-Stack Learning Web Application

A comprehensive full-stack learning project built with React, Node.js, Express, Prisma, and TypeScript.

## Tech Stack

### Frontend
- React 18+ with TypeScript
- React Router for routing
- Axios for API calls
- React Hook Form for form handling
- Tailwind CSS for styling
- Context API for state management

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite (development) / PostgreSQL (production)
- JWT for authentication
- bcrypt for password hashing
- multer for file uploads

## Project Structure

```
fullstack-learning-app/
├── frontend/          # React web frontend application
├── mobile/            # Expo React Native mobile app
├── backend/           # Express backend API
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=5001
NODE_ENV=development
UPLOAD_DIR="./uploads"
VIRUSTOTAL_API_KEY="your-virustotal-api-key-here"
```

4. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Mobile App Setup

The project includes a mobile app built with Expo and React Native. See the [Mobile Setup Guide](docs/MOBILE_SETUP.md) for detailed instructions.

**Quick Start:**

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

4. Start the Expo development server:
```bash
npm start
```

5. Scan the QR code with Expo Go app (iOS/Android) or press `i` for iOS Simulator / `a` for Android Emulator

**For detailed setup, dependencies, and build instructions, see:**
- **[How This App Works](docs/HOW_THIS_APP_WORKS.md)** - Complete guide for learners (START HERE!)
- [Mobile Setup Guide](docs/MOBILE_SETUP.md)
- [Dependencies Guide](docs/DEPENDENCIES.md)
- [Build Guide](docs/BUILD_GUIDE.md)
- [App Store Deployment](docs/APP_STORE_DEPLOYMENT.md)

## Mobile App Features

- ✅ User authentication (login/register)
- ✅ User profile management
- ✅ File to PDF conversion (client-side and server-side)
- ✅ Conversion history
- ✅ PDF sharing and downloading
- ✅ EXIF metadata extraction from files
- ✅ Network scanning with Nmap
- ✅ VirusTotal malware analysis (hash, URL, and file scanning)
- ✅ Mobile-optimized UI
- ✅ Cross-platform (iOS & Android)

## Development Phases

This project is built in phases:

1. ✅ **Phase 1:** Project Setup & Database
2. ⏳ **Phase 2:** Backend Authentication
3. ⏳ **Phase 3:** Frontend Authentication UI
4. ⏳ **Phase 4:** User Profile Management
5. ⏳ **Phase 5:** Blog Post System
6. ⏳ **Phase 6:** Upvoting System
7. ⏳ **Phase 7:** Polish & Additional Features

## Database Schema

- **User**: email, username, password (hashed), avatar
- **Post**: title, content, author relationship
- **Upvote**: many-to-many relationship between users and posts
- **Comment**: content, author, post relationship
- **FileConversion**: originalFile, fileType, pdfPath, method, user relationship (for mobile app)

## API Endpoints (To be implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `POST /api/users/me/avatar` - Upload avatar

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (protected)
- `PUT /api/posts/:id` - Update post (author only)
- `DELETE /api/posts/:id` - Delete post (author only)
- `POST /api/posts/:id/upvote` - Toggle upvote (protected)

### PDF Conversion (Mobile App)
- `POST /api/pdf/convert` - Convert file to PDF (protected)
- `GET /api/pdf/conversions` - Get user's conversion history (protected)
- `GET /api/pdf/:id` - Download converted PDF (protected)
- `DELETE /api/pdf/:id` - Delete conversion (protected)

### EXIF Metadata Extraction
- `POST /api/exif/extract` - Extract metadata from uploaded file (protected)

### Network Scanning (Nmap)
- `POST /api/nmap/scan` - Scan a host using nmap (protected)

### VirusTotal Analysis
- `POST /api/virustotal/analyze` - Analyze hash, URL, or file (auto-detects type) (protected)
- `GET /api/virustotal/analyze/hash?hash={hash}` - Analyze file hash (protected)
- `POST /api/virustotal/analyze/url` - Analyze URL (protected)
- `POST /api/virustotal/analyze/file` - Analyze uploaded file (protected)

## Learning Concepts

This project covers:
- JWT authentication flow
- Password hashing with bcrypt
- Database relationships (one-to-many, many-to-many)
- File uploads
- RESTful API design
- Protected routes
- Form validation
- State management with Context API

## License

ISC
