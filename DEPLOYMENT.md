# Deployment Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=https://your-domain.com

# React App Configuration
REACT_APP_SERVER_URL=https://your-domain.com
```

## Deployment Options

### 1. Heroku Deployment

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
   heroku config:set REACT_APP_SERVER_URL=https://your-app-name.herokuapp.com
   ```
5. Deploy: `git push heroku main`

### 2. Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

### 3. Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### 4. DigitalOcean App Platform

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

## Local Development

1. Install dependencies: `npm install`
2. Create `.env` file with local values
3. Run development server: `npm run dev`

## Production Build

1. Build React app: `npm run build`
2. Start production server: `npm run production`

## Troubleshooting

### Connection Issues

1. Check that all hardcoded URLs are replaced with environment variables
2. Verify CORS settings allow your domain
3. Ensure WebSocket connections are supported by your hosting provider
4. Check that the server is running on the correct port

### File Upload Issues

1. Ensure the `uploads` directory exists and is writable
2. Check file size limits
3. Verify supported file types

### Authentication Issues

1. Set a strong JWT_SECRET
2. Check token expiration settings
3. Verify user credentials
