# Environment Setup Guide

## Firebase Configuration

To enable multiplayer features, you need to set up Firebase environment variables.

### 1. Create a `.env` file

Create a `.env` file in the root directory of your project with the following variables:

```env
# Firebase Configuration
# Replace these with your actual Firebase project values
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Development mode - set to true to enable demo mode when Firebase is not configured
VITE_USE_DEMO_MODE=true
```

### 2. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps"
5. Click the web icon (</>)
6. Register your app with a nickname like "MythSeeker Web"
7. Copy the configuration values to your `.env` file

### 3. Current Status

The app is currently running in **demo mode** because Firebase configuration is missing. This means:

✅ **Single-player features work**
✅ **Local storage persistence**
✅ **AI Dungeon Master works**
❌ **Multiplayer features disabled**
❌ **Cross-device synchronization disabled**

### 4. Demo Mode Benefits

Demo mode is perfect for:
- Development and testing
- Single-player experiences
- Offline play
- Quick prototyping

### 5. Enable Multiplayer

Once you add the Firebase configuration:

1. Restart your development server
2. The multiplayer features will automatically enable
3. You'll see "Firebase connected" in the console
4. Multiplayer campaigns will work across devices

### 6. Troubleshooting

If you see "Firebase configuration missing" warnings:
- Check that your `.env` file exists in the root directory
- Verify all environment variables are set
- Restart your development server after making changes
- Check the browser console for specific missing keys

### 7. Security Note

The `.env` file is already in `.gitignore` to prevent committing sensitive keys to version control. Never commit your actual Firebase keys to a public repository. 