# Firebase Setup Guide for Multiplayer

This guide will help you set up Firebase for real multiplayer functionality.

## Current Status

Your app is currently using a **demo multiplayer system** that works with localStorage. This means:
- ✅ Players can join games using campaign codes
- ✅ Real-time updates work within the same browser
- ✅ Messages are synchronized
- ❌ Games don't persist between browser sessions
- ❌ Players can't join from different devices/browsers

## Setting Up Firebase for Production

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "MythSeeker" (or your preferred name)
4. Follow the setup wizard

### 2. Enable Realtime Database

1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose a location (pick the closest to your users)
4. Start in test mode (we'll secure it later)

### 3. Get Your Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register your app with a nickname like "MythSeeker Web"
5. Copy the configuration object

### 4. Update Your Firebase Config

Replace the demo config in `src/firebase.ts` with your real config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 5. Switch to Real Firebase

In `src/App.tsx`, change all instances of `demoMultiplayerService` to `multiplayerService`:

```typescript
// Replace this:
import { demoMultiplayerService } from './demoMultiplayer';

// With this:
import { multiplayerService } from './multiplayer';

// And update all service calls:
// demoMultiplayerService.createGame() → multiplayerService.createGame()
// demoMultiplayerService.joinGame() → multiplayerService.joinGame()
// etc.
```

### 6. Set Up Security Rules

In Firebase Realtime Database, go to "Rules" and add:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['code', 'theme', 'players'])"
      }
    }
  }
}
```

## Testing Multiplayer

### Method 1: Multiple Browser Windows
1. Open your app in two different browser windows
2. Create a campaign in one window
3. Copy the campaign code
4. Join the campaign in the second window

### Method 2: Different Devices
1. Deploy your app to GitHub Pages
2. Open the app on different devices
3. Use the campaign code to join

### Method 3: Share with Friends
1. Share your GitHub Pages URL
2. Have friends join using your campaign code

## Features That Will Work

Once Firebase is set up, you'll have:

- ✅ **Real-time multiplayer**: Players join from anywhere
- ✅ **Persistent games**: Games survive browser restarts
- ✅ **Live chat**: Messages appear instantly for all players
- ✅ **Player status**: See who's online/offline
- ✅ **Campaign codes**: Easy sharing and joining
- ✅ **Host controls**: Only host can start the game

## Troubleshooting

### Common Issues

1. **"Permission denied"**: Check Firebase security rules
2. **"Database not found"**: Make sure Realtime Database is enabled
3. **"Config error"**: Verify your Firebase config is correct
4. **"Players not syncing"**: Check network connectivity

### Debug Mode

Add this to see what's happening:

```typescript
// In your browser console:
console.log('Active games:', demoMultiplayerService.getActiveGames());
```

## Next Steps

1. Set up Firebase following this guide
2. Test with multiple devices
3. Consider adding authentication for private games
4. Add more advanced features like combat synchronization

## Demo Mode Benefits

The current demo mode is perfect for:
- Development and testing
- Single-player experiences
- Offline play
- Quick prototyping

You can keep both systems and switch between them based on your needs! 