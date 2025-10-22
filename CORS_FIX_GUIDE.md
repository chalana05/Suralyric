# CORS Fix Guide for Suralyric

## Changes Made

### 1. Server-side CORS Configuration (server.js)
- ✅ Enhanced CORS middleware with explicit methods and headers
- ✅ Added explicit preflight request handler
- ✅ Configured to allow credentials

### 2. Frontend API Calls
- ✅ Updated LoginForm.jsx to include `credentials: 'include'`
- ✅ Updated BandLyricsSync.jsx to include `credentials: 'include'`

## Deployment Steps

### 1. Deploy Server Changes to Railway

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Fix CORS configuration for production"
   git push
   ```

2. **Verify Railway Environment Variables:**
   - `CLIENT_URL=https://suralyric.netlify.app`
   - `JWT_SECRET=your-secure-jwt-secret-key`
   - `NODE_ENV=production`

### 2. Rebuild and Deploy Frontend to Netlify

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Push changes to trigger automatic deployment
   - Or manually deploy the build folder

### 3. Test the Application

1. **Visit:** `https://suralyric.netlify.app`
2. **Login with:**
   - Username: `itweera`
   - Password: `itweera321`
3. **Check browser console** for any remaining errors

## Troubleshooting

### If CORS errors persist:

1. **Check Railway logs:**
   - Go to your Railway dashboard
   - Check the logs for any server errors

2. **Verify environment variables:**
   - Ensure `CLIENT_URL` is set to `https://suralyric.netlify.app`
   - Ensure `JWT_SECRET` is set

3. **Test server directly:**
   - Visit `https://web-production-d2029.up.railway.app/api/health`
   - Should return JSON with status "OK"

4. **Check Network tab:**
   - Open browser dev tools
   - Look for preflight OPTIONS requests
   - Verify response headers include CORS headers

### Common Issues:

- **Environment variables not set:** Railway might not have the correct environment variables
- **Server not restarted:** Railway might need to restart the server
- **Cache issues:** Clear browser cache and try again

## Files Modified

- `server.js` - Enhanced CORS configuration
- `src/components/LoginForm.jsx` - Added credentials to fetch
- `src/components/BandLyricsSync.jsx` - Added credentials to fetch

## Next Steps

After deployment:
1. Test login functionality
2. Test file upload functionality
3. Verify WebSocket connections work
4. Check that all API endpoints respond correctly
