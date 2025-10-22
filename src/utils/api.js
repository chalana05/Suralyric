// API utility functions
export const getServerUrl = () => {
  // Use environment variable if set, otherwise determine based on hostname
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // For development (localhost)
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // For production - Railway URL (update to your deployment)
  return 'https://web-production-b359.up.railway.app';
};

export const getApiUrl = (endpoint) => {
  return `${getServerUrl()}${endpoint}`;
};
