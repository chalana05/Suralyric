# Railway Backend Deployment Guide for Suralyric

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub account (your code should be in a GitHub repository)
- Your frontend already deployed on Netlify at https://suralyric.netlify.app

## Step 1: Prepare Your Repository

### 1.1 Push your code to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 1.2 Verify your files are ready
- ✅ `server.js` - Your Express server
- ✅ `package.json` - With all dependencies
- ✅ `Dockerfile` - For containerized deployment
- ✅ `railway.json` - Railway configuration
- ✅ `Procfile` - Process configuration

## Step 2: Deploy to Railway

### 2.1 Create a new Railway project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Suralyric repository
5. Railway will automatically detect it's a Node.js project

### 2.2 Configure Environment Variables
In your Railway project dashboard, go to "Variables" tab and add:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-railway
CLIENT_URL=https://suralyric.netlify.app
REACT_APP_SERVER_URL=https://your-railway-app-name.up.railway.app
```

**Important:** Replace `your-super-secure-jwt-secret-key-change-this-in-railway` with a strong, random secret key.

### 2.3 Deploy
1. Railway will automatically start building and deploying
2. Wait for the deployment to complete (usually 2-5 minutes)
3. Your backend will be available at: `https://your-app-name.up.railway.app`

## Step 3: Update Frontend Configuration

### 3.1 Update API URL
After deployment, update your frontend's API configuration:

1. In your Netlify dashboard, go to "Site settings" > "Environment variables"
2. Add: `REACT_APP_SERVER_URL=https://your-railway-app-name.up.railway.app`
3. Redeploy your frontend

### 3.2 Alternative: Update the code directly
Update `src/utils/api.js` line 15:
```javascript
return 'https://your-actual-railway-app-name.up.railway.app';
```

## Step 4: Test Your Deployment

### 4.1 Health Check
Visit: `https://your-railway-app-name.up.railway.app/api/health`

You should see:
```json
{
  "status": "OK",
  "connectedDevices": 0,
  "currentFile": null
}
```

### 4.2 Test Authentication
1. Go to your frontend: https://suralyric.netlify.app
2. Try logging in with:
   - Username: `itweera`
   - Password: `itweera321`

### 4.3 Test File Upload
1. Login as master
2. Upload a PDF or image file
3. Check if it syncs to connected devices

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add custom domain in Railway
1. Go to your Railway project
2. Click "Settings" > "Domains"
3. Add your custom domain (e.g., `api.suralyric.com`)
4. Follow Railway's DNS instructions

### 5.2 Update CORS settings
If using custom domain, update your `server.js` CORS configuration:
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "https://suralyric.netlify.app",
  "https://your-custom-domain.com" // Add your custom domain
];
```

## Step 6: Monitor and Maintain

### 6.1 Railway Dashboard
- Monitor logs in Railway dashboard
- Check resource usage
- View deployment history

### 6.2 Logs
Railway provides real-time logs. Common issues:
- Port binding errors
- Environment variable issues
- File upload permission problems

### 6.3 Scaling
Railway automatically handles:
- Traffic spikes
- Memory management
- Process restarts

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure `CLIENT_URL` environment variable is set correctly
   - Check that your frontend URL is in the allowed origins

2. **File Upload Issues**
   - Railway has ephemeral file storage
   - Files are lost on restart
   - Consider using Railway's persistent storage or external storage

3. **Socket.IO Connection Issues**
   - Ensure WebSocket connections are allowed
   - Check Railway's WebSocket support

4. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

### Getting Help:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway logs for detailed error messages

## Security Considerations

1. **JWT Secret**: Use a strong, random secret key
2. **CORS**: Only allow necessary origins
3. **File Uploads**: Consider file size limits and validation
4. **Rate Limiting**: Consider implementing rate limiting for production

## Next Steps

1. Set up monitoring and alerting
2. Configure automated backups
3. Implement proper logging
4. Consider database integration for persistent storage
5. Set up CI/CD pipeline for automated deployments

---

Your Suralyric backend should now be successfully deployed on Railway! 🚀
