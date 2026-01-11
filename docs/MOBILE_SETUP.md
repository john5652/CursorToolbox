# Mobile App Setup Guide

This guide will walk you through setting up and running the mobile app built with Expo and React Native.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Expo CLI**
   - Install globally: `npm install -g expo-cli`
   - Verify installation: `expo --version`

4. **Expo Go App** (for testing on physical devices)
   - iOS: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

5. **For iOS Development** (macOS only):
   - Xcode (from Mac App Store)
   - iOS Simulator (included with Xcode)

6. **For Android Development**:
   - Android Studio
   - Android SDK
   - Android Emulator

## Project Structure

```
mobile-app/
├── mobile/              # Expo React Native app
│   ├── app/            # Expo Router navigation
│   ├── components/     # Reusable components
│   ├── context/        # React Context (Auth)
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── package.json    # Dependencies
├── backend/            # Express backend API
└── docs/               # Documentation
```

## Step 1: Install Mobile App Dependencies

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

This will install all required packages including:
- Expo SDK
- React Native
- Navigation libraries
- File handling libraries
- PDF conversion libraries
- And more (see DEPENDENCIES.md for full list)

## Step 2: Configure Environment Variables

1. Create a `.env` file in the `mobile` directory:
```bash
cd mobile
touch .env
```

2. Add the following content:
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

**Important Notes:**
- For physical device testing, replace `localhost` with your computer's IP address
- Find your IP: 
  - macOS/Linux: `ifconfig | grep "inet "`
  - Windows: `ipconfig`
- Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:5001/api`

## Step 3: Set Up Backend

The mobile app requires the backend API to be running. Follow these steps:

1. Navigate to backend directory:
```bash
cd ../backend
```

2. Install backend dependencies (if not already done):
```bash
npm install
```

3. Set up environment variables:
   - Create `.env` file if it doesn't exist
   - Ensure it contains:
     ```env
     DATABASE_URL="file:./dev.db"
     JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
     JWT_EXPIRES_IN="7d"
     PORT=5001
     NODE_ENV=development
     UPLOAD_DIR="./uploads"
     ```

4. Run database migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the backend server:
```bash
npm run dev
```

The backend should now be running at `http://localhost:5001`

## Step 4: Run the Mobile App

### Option A: Using Expo Go (Recommended for Development)

1. Start the Expo development server:
```bash
cd mobile
npm start
```

2. Scan the QR code:
   - **iOS**: Use Camera app to scan QR code
   - **Android**: Use Expo Go app to scan QR code

3. The app will load on your device

### Option B: Using iOS Simulator (macOS only)

1. Start the Expo development server:
```bash
cd mobile
npm start
```

2. Press `i` to open iOS Simulator

### Option C: Using Android Emulator

1. Start Android Emulator from Android Studio

2. Start the Expo development server:
```bash
cd mobile
npm start
```

3. Press `a` to open Android Emulator

## Step 5: Testing the App

1. **Register a new account:**
   - Tap "Sign up" on the login screen
   - Enter email, username, and password
   - Tap "Create Account"

2. **Login:**
   - Enter your credentials
   - Tap "Login"

3. **Test PDF Conversion:**
   - Navigate to "Convert" tab
   - Tap "Pick Image" or "Pick Document"
   - Select a file
   - Choose conversion method (Device or Server)
   - Wait for conversion to complete
   - Share or download the PDF

4. **View Profile:**
   - Navigate to "Profile" tab
   - Update username
   - Change avatar

## Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Ensure backend is running
   - Check that API URL in `.env` is correct
   - For physical devices, use your computer's IP address instead of localhost

2. **"Module not found"**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

3. **"Expo Go app not connecting"**
   - Ensure phone and computer are on the same WiFi network
   - Try restarting Expo development server

4. **"Permission denied" errors**
   - Grant necessary permissions when prompted
   - Check app permissions in device settings

5. **Build errors**
   - Clear Expo cache: `expo start -c`
   - Clear Metro bundler cache: `npm start -- --reset-cache`

### Getting Help

- Check Expo documentation: [docs.expo.dev](https://docs.expo.dev)
- React Native documentation: [reactnative.dev](https://reactnative.dev)
- Expo forums: [forums.expo.dev](https://forums.expo.dev)

## Next Steps

- See BUILD_GUIDE.md for production builds
- See APP_STORE_DEPLOYMENT.md for app store submission
- See DEPENDENCIES.md for detailed dependency information
