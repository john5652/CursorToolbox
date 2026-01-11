# App Store Deployment Guide

Complete guide for deploying the File to PDF Converter app to iOS App Store and Google Play Store.

## Prerequisites Checklist

- [ ] Expo account created
- [ ] EAS CLI installed and logged in
- [ ] Apple Developer account ($99/year) - for iOS
- [ ] Google Play Developer account ($25 one-time) - for Android
- [ ] App icons and splash screens created
- [ ] Backend API deployed and accessible
- [ ] App tested thoroughly on devices

## Part 1: iOS App Store Deployment

### Step 1: Prepare App Store Connect

1. **Create App ID:**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Certificates, Identifiers & Profiles
   - Create new App ID matching your bundle identifier

2. **Create App in App Store Connect:**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - My Apps → + → New App
   - Fill in:
     - Platform: iOS
     - Name: File to PDF Converter
     - Primary Language: English
     - Bundle ID: Select your App ID
     - SKU: Unique identifier (e.g., filetopdf-001)

### Step 2: Prepare App Assets

#### Required Screenshots

Create screenshots for all required sizes:

- **iPhone 6.7" Display** (iPhone 14 Pro Max):
  - 1290 x 2796 pixels
  - 3-10 screenshots

- **iPhone 6.5" Display** (iPhone 11 Pro Max):
  - 1242 x 2688 pixels
  - 3-10 screenshots

- **iPhone 5.5" Display** (iPhone 8 Plus):
  - 1242 x 2208 pixels
  - 3-10 screenshots

#### App Icon

- 1024 x 1024 pixels
- PNG format
- No transparency
- No rounded corners (Apple adds them)

#### App Preview Video (Optional)

- 15-30 seconds
- Show app functionality
- Various sizes required

### Step 3: Build and Upload

1. **Build for App Store:**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

   Or manually:
   - Download `.ipa` from EAS
   - Use Transporter app or Xcode to upload

### Step 4: Complete App Store Listing

1. **App Information:**
   - Name: File to PDF Converter
   - Subtitle: Convert files to PDF quickly
   - Category: Productivity
   - Content Rights: Your own content

2. **Pricing and Availability:**
   - Price: Free
   - Availability: All countries (or select)

3. **App Privacy:**
   - Data Collection: Declare what you collect
   - For this app:
     - User Content (files uploaded)
     - Identifiers (user ID)
     - Usage Data (optional)

4. **Version Information:**
   - What's New: Describe updates
   - Description: App description
   - Keywords: pdf, converter, file, document
   - Support URL: Your support page
   - Marketing URL (optional)

5. **App Review Information:**
   - Contact Information
   - Demo Account (if needed)
   - Notes: Explain app functionality

### Step 5: Submit for Review

1. **Add Build:**
   - Version → Build → Select your build

2. **Complete All Sections:**
   - Ensure all required fields are filled
   - Red/yellow indicators show what's missing

3. **Submit:**
   - Click "Submit for Review"
   - App enters "Waiting for Review" status

### Step 6: Review Process

- **Timeline:** Usually 24-48 hours
- **Status Updates:** Check App Store Connect
- **If Rejected:**
  - Read rejection reasons
  - Fix issues
  - Resubmit

## Part 2: Google Play Store Deployment

### Step 1: Create App in Play Console

1. **Go to Play Console:**
   - [play.google.com/console](https://play.google.com/console)

2. **Create App:**
   - Create app → Fill in:
     - App name: File to PDF Converter
     - Default language: English
     - App or game: App
     - Free or paid: Free

### Step 2: Prepare Store Listing

#### App Icon

- 512 x 512 pixels
- PNG format
- No transparency

#### Feature Graphic

- 1024 x 500 pixels
- Showcase your app

#### Screenshots

- Phone: At least 2, up to 8
  - Minimum: 320px
  - Maximum: 3840px
  - Aspect ratio: 16:9 or 9:16
- Tablet (optional): Same requirements

#### Short Description

- 80 characters max
- Example: "Convert images and documents to PDF format quickly and easily"

#### Full Description

- 4000 characters max
- Describe features, benefits
- Include keywords

### Step 3: Build and Upload

1. **Build for Play Store:**
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

2. **Create Release:**
   - Play Console → Production → Create release
   - Upload AAB file (not APK)
   - Add release notes

3. **Or use EAS Submit:**
   ```bash
   eas submit --platform android
   ```

### Step 4: Complete Store Listing

1. **Store Listing:**
   - App name
   - Short description
   - Full description
   - Graphics (icon, screenshots, feature graphic)
   - Categorization
   - Contact details

2. **Content Rating:**
   - Complete questionnaire
   - Get rating certificate

3. **Privacy Policy:**
   - Required URL
   - Must explain data collection

4. **Target Audience:**
   - Age groups
   - Content guidelines

### Step 5: Set Up App Content

1. **App Access:**
   - Declare if app requires login
   - Provide test credentials if needed

2. **Ads:**
   - Declare if app shows ads

3. **Content Rating:**
   - Complete IARC questionnaire

4. **Data Safety:**
   - Declare data collection
   - Security practices
   - Data sharing

### Step 6: Submit for Review

1. **Review Checklist:**
   - All sections completed
   - No errors or warnings

2. **Submit:**
   - Click "Submit for review"
   - App enters review process

### Step 7: Review Process

- **Timeline:** Usually 1-3 days
- **Status:** Check Play Console
- **If Rejected:**
  - Address issues
  - Resubmit

## Post-Deployment

### Monitoring

1. **Analytics:**
   - App Store Connect Analytics (iOS)
   - Google Play Console Analytics (Android)

2. **Reviews:**
   - Respond to user reviews
   - Address common issues

3. **Crashes:**
   - Set up crash reporting (Sentry, etc.)
   - Monitor and fix issues

### Updates

1. **Version Bump:**
   - Update version in `app.json`
   - iOS: Increment build number
   - Android: Increment version code

2. **Build and Submit:**
   - Follow same process
   - Update release notes

## Common Issues and Solutions

### iOS

1. **"Missing Compliance"**
   - Answer export compliance questions
   - Usually "No" for most apps

2. **"Invalid Binary"**
   - Check bundle identifier matches
   - Verify certificates

3. **"Guideline Violations"**
   - Read guidelines carefully
   - Address specific issues

### Android

1. **"Target API Level"**
   - Ensure targeting latest Android version
   - Update in `app.json`

2. **"Privacy Policy Missing"**
   - Add privacy policy URL
   - Must be accessible

3. **"Content Rating Required"**
   - Complete IARC questionnaire
   - Get rating certificate

## Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

## Checklist Before Submission

### iOS
- [ ] App tested on multiple devices
- [ ] All features working
- [ ] Icons and screenshots ready
- [ ] Privacy policy URL ready
- [ ] App description written
- [ ] Keywords selected
- [ ] Support URL provided
- [ ] Build uploaded successfully
- [ ] All App Store Connect sections completed

### Android
- [ ] App tested on multiple devices
- [ ] All features working
- [ ] Icons and graphics ready
- [ ] Privacy policy URL ready
- [ ] App description written
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] AAB uploaded successfully
- [ ] All Play Console sections completed

Good luck with your submission! 🚀
