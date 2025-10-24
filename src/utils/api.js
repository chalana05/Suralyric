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
  
  // For production - Railway URL (default fallback if no env var set)
  return 'https://web-production-3716e.up.railway.app';
};

export const getApiUrl = (endpoint) => {
  return `${getServerUrl()}${endpoint}`;
};
      