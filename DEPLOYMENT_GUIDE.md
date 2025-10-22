# Suralyric Deployment Guide

## Issues Fixed

✅ **CORS Configuration**: Updated server to allow requests from `https://suralyric.netlify.app`
✅ **API Endpoints**: Updated React app to use Railway production URL instead of localhost
✅ **Environment Variables**: Created utility functions for better URL management

## Deployment Steps

### 1. Railway Server Deployment

1. **Deploy your server to Railway** (if not already done)
2. **Get your Railway URL** - it will look like `https://your-app-name.railway.app`
3. **Set Environment Variables in Railway**:
   - `CLIENT_URL=https://suralyric.netlify.app`
   - `JWT_SECRET=your-secure-jwt-secret-key`
   - `NODE_ENV=production`

### 2. Update React App Configuration

1. **Replace Railway URL**: In `src/utils/api.js`, replace `YOUR_RAILWAY_URL` with your actual Railway URL:
   ```javascript
   // Change this line:
   return 'https://YOUR_RAILWAY_URL.railway.app';
   
   // To your actual Railway URL:
   return 'https://your-actual-railway-url.railway.app';
   ```

2. **Alternative: Set Environment Variable** (Recommended):
   - In your Netlify build settings, add environment variable:
   - `REACT_APP_SERVER_URL=https://your-actual-railway-url.railway.app`

### 3. Rebuild and Redeploy

1. **Build the React app**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Push changes to your repository
   - Netlify will automatically rebuild and deploy

## Environment Variables Summary

### Railway Server Environment Variables:
- `CLIENT_URL=https://suralyric.netlify.app`
- `JWT_SECRET=your-secure-jwt-secret-key`
- `NODE_ENV=production`

### Netlify Environment Variables (Optional):
- `REACT_APP_SERVER_URL=https://your-railway-url.railway.app`

## Testing

After deployment:
1. Visit `https://suralyric.netlify.app`
2. Try logging in with credentials:
   - Username: `itweera`
   - Password: `itweera321`
3. Check browser console for any remaining errors

## Troubleshooting

If you still see CORS errors:
1. Verify Railway environment variables are set correctly
2. Check that your Railway URL is correct in the React app
3. Ensure both services are running and accessible

## Files Modified

- `server.js` - Updated CORS configuration
- `src/utils/api.js` - New utility file for URL management
- `src/components/LoginForm.jsx` - Updated to use new API utility
- `src/components/BandLyricsSync.jsx` - Updated to use new API utility
