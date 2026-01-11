# Build Guide

This guide explains how to build the mobile app for production and prepare it for app store submission.

## Prerequisites

1. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Apple Developer Account** (for iOS)
   - Required for App Store submission
   - Cost: $99/year
   - Sign up at [developer.apple.com](https://developer.apple.com)

3. **Google Play Developer Account** (for Android)
   - Required for Play Store submission
   - Cost: $25 one-time
   - Sign up at [play.google.com/console](https://play.google.com/console)

4. **ExifTool** (for backend server)
   - Required for EXIF metadata extraction feature
   - **macOS**: `brew install exiftool`
   - **Linux (Debian/Ubuntu)**: `sudo apt-get install libimage-exiftool-perl`
   - **Linux (RHEL/CentOS)**: `sudo yum install perl-Image-ExifTool`
   - **Windows**: Download from [exiftool.org](https://exiftool.org/) and add to PATH
   - **Note**: ExifTool is a system dependency, not an npm package. It must be installed on the server system where the backend runs.

5. **Nmap** (for backend server)
   - Required for network scanning feature
   - **macOS**: `brew install nmap`
   - **Linux (Debian/Ubuntu)**: `sudo apt-get install nmap`
   - **Linux (RHEL/CentOS)**: `sudo yum install nmap`
   - **Windows**: Download from [nmap.org](https://nmap.org/download.html) and add to PATH
   - **Note**: Nmap is a system dependency, not an npm package. It must be installed on the server system where the backend runs.

## Step 1: Configure App Metadata

### Update app.json

Edit `mobile/app.json` and update:

```json
{
  "expo": {
    "name": "File to PDF Converter",
    "slug": "file-to-pdf-converter",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.filetopdfconverter",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.filetopdfconverter",
      "versionCode": 1
    }
  }
}
```

**Important**: Change `com.yourcompany` to your actual company/developer identifier.

### Add App Icons

1. Create app icons:
   - iOS: 1024x1024px PNG
   - Android: 1024x1024px PNG (adaptive icon)

2. Place icons in `mobile/assets/`:
   - `icon.png` - Main icon (1024x1024)
   - `adaptive-icon.png` - Android adaptive icon (foreground)

3. Update `app.json`:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### Add Splash Screen

1. Create splash screen image (1242x2436px recommended)

2. Place in `mobile/assets/splash.png`

3. Already configured in `app.json`

## Step 2: Configure EAS Build

### Initialize EAS (if not already done)

```bash
cd mobile
eas build:configure
```

This creates/updates `eas.json` with build profiles.

### Update eas.json

Ensure `eas.json` contains:

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourcompany.filetopdfconverter"
      },
      "android": {
        "package": "com.yourcompany.filetopdfconverter"
      }
    }
  }
}
```

## Step 3: Build for iOS

### Development Build (for testing)

```bash
cd mobile
eas build --platform ios --profile development
```

### Production Build

```bash
cd mobile
eas build --platform ios --profile production
```

### Build Options

- **Build on EAS servers** (recommended): Cloud builds, no local setup needed
- **Local build**: Requires Xcode and macOS

### iOS Build Process

1. EAS will prompt for Apple credentials
2. Creates/updates provisioning profiles
3. Builds the app
4. Provides download link

### Download and Install

1. Download `.ipa` file from EAS dashboard
2. Install via:
   - **TestFlight**: Upload to App Store Connect
   - **Ad Hoc**: Install directly on registered devices
   - **App Store**: Submit for review

## Step 4: Build for Android

### Development Build

```bash
cd mobile
eas build --platform android --profile development
```

### Production Build

```bash
cd mobile
eas build --platform android --profile production
```

### Android Build Process

1. EAS builds APK or AAB
2. Provides download link

### Download and Install

1. Download `.apk` or `.aab` file
2. Install APK directly on Android devices
3. Upload AAB to Google Play Console for Play Store

## Step 5: Environment Variables for Production

### Update .env

```env
EXPO_PUBLIC_API_URL=https://your-production-api.com/api
```

### Configure in EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-api.com/api
```

## Step 6: App Store Submission

### iOS (App Store)

1. **Prepare App Store Connect listing:**
   - App name, description, keywords
   - Screenshots (various sizes)
   - Privacy policy URL
   - Support URL

2. **Upload build:**
   ```bash
   eas submit --platform ios
   ```

3. **Complete submission in App Store Connect:**
   - Fill out all required information
   - Submit for review

### Android (Google Play)

1. **Prepare Play Console listing:**
   - App name, description, graphics
   - Screenshots
   - Privacy policy URL

2. **Upload build:**
   ```bash
   eas submit --platform android
   ```

3. **Complete submission in Play Console:**
   - Fill out store listing
   - Submit for review

## Step 7: Update Backend for Production

### Environment Variables

Update backend `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="strong-random-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5001
NODE_ENV=production
UPLOAD_DIR="./uploads"
```

### Install System Dependencies on Production Server

**Important**: ExifTool and Nmap must be installed on your production server for the EXIF Viewer and Nmap Scanner features to work.

- **Heroku**: Add buildpack or use Docker with dependencies pre-installed
- **Railway**: Install via Dockerfile or use system package manager
- **AWS/DigitalOcean**: Install via package manager (apt/yum) or Docker
- **Docker**: Add to Dockerfile:
  ```dockerfile
  RUN apt-get update && apt-get install -y libimage-exiftool-perl nmap
  ```

### Deploy Backend

Options:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **AWS/DigitalOcean**: Use PM2 or Docker
- **Vercel/Netlify**: For serverless (may need adjustments)

### Update Mobile App API URL

Update production `.env` or EAS secrets to point to production backend.

## Build Profiles Explained

### Development
- Includes development tools
- Easier debugging
- Not for app store

### Preview
- Production-like build
- For internal testing
- Can be distributed via TestFlight/Internal Testing

### Production
- Optimized build
- For app store submission
- Minified and optimized

## Troubleshooting

### Build Failures

1. **"Missing credentials"**
   - Run `eas build:configure` again
   - Ensure Apple/Google accounts are linked

2. **"Invalid bundle identifier"**
   - Check `app.json` bundle identifier
   - Ensure it matches your developer account

3. **"Build timeout"**
   - Large builds may timeout
   - Try again or use local builds

### Common Issues

1. **Icons not showing**
   - Ensure icons are correct size
   - Clear build cache: `eas build --clear-cache`

2. **App crashes on launch**
   - Check environment variables
   - Verify API URL is correct
   - Check logs: `expo logs`

3. **Permissions not working**
   - Verify `app.json` permissions
   - Check device settings

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build App
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive
```

## Best Practices

1. **Version Management**
   - Increment version in `app.json` for each release
   - Use semantic versioning (1.0.0 → 1.0.1)

2. **Testing**
   - Test on real devices before submission
   - Test all features thoroughly
   - Check on different screen sizes

3. **Security**
   - Never commit `.env` files
   - Use EAS secrets for sensitive data
   - Review app permissions

4. **Performance**
   - Optimize images before including
   - Minimize bundle size
   - Test on slower devices

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
