# Railway Deployment Guide

## Quick Fix for Current Issues

### 1. **PDF-Parse Error Fix**
- ✅ Replaced `pdf-parse` with `pdfjs-dist` (Railway-compatible)
- ✅ Updated PDF text extraction logic

### 2. **404 Login Error Fix**
- ✅ Fixed API route handling in production
- ✅ Added proper error handling for missing API endpoints

### 3. **Railway Configuration Updates**
- ✅ Changed builder from DOCKERFILE to NIXPACKS
- ✅ Added health check configuration
- ✅ Updated restart policy

## Deployment Steps

### Step 1: Update Dependencies
```bash
npm install
```

### Step 2: Set Environment Variables in Railway
Go to your Railway project dashboard and add these environment variables:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
CLIENT_URL=https://suralyric.netlify.app
REACT_APP_SERVER_URL=https://your-railway-app-name.up.railway.app
```

### Step 3: Deploy
Railway will automatically:
1. Install dependencies
2. Build the React app (`npm run build`)
3. Start the server (`npm run production`)

## Key Changes Made

### Server.js Updates
- ✅ Replaced `pdf-parse` with `pdfjs-dist`
- ✅ Added better error handling
- ✅ Fixed API route conflicts with React routing
- ✅ Added Railway-specific logging

### Package.json Updates
- ✅ Updated dependencies
- ✅ Added Node.js engine specification
- ✅ Added Railway-specific scripts

### Railway Configuration
- ✅ Switched to NIXPACKS builder
- ✅ Added health check endpoint
- ✅ Reduced restart retries for faster recovery

## Testing the Fix

1. **Check Health Endpoint**: `https://your-app.up.railway.app/api/health`
2. **Test Login**: Use the login form with credentials:
   - Username: `itweera`
   - Password: `itweera321`

## Troubleshooting

### If Still Getting 404 Errors
1. Check Railway logs for build errors
2. Verify environment variables are set
3. Ensure the build completed successfully

### If PDF Processing Fails
1. Check Railway logs for memory issues
2. Consider reducing PDF file size for testing
3. Verify `pdfjs-dist` installed correctly

### If Server Crashes
1. Check Railway logs for specific error messages
2. Verify all dependencies are compatible with Node.js 18+
3. Check memory usage in Railway dashboard

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `CLIENT_URL` | Frontend URL | `https://suralyric.netlify.app` |
| `REACT_APP_SERVER_URL` | Backend URL | `https://your-app.up.railway.app` |

## Next Steps After Deployment

1. Test all functionality:
   - Login/logout
   - File upload (PDF and images)
   - Real-time synchronization
   - OCR processing

2. Monitor Railway logs for any remaining issues

3. Set up proper monitoring and alerts if needed
