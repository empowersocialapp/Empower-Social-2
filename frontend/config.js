// Environment-aware API configuration
(function() {
  'use strict';
  
  // Detect environment
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAmplify = hostname.includes('amplifyapp.com') || hostname.includes('amplify.aws');
  
  // Set API base URL based on environment
  let API_BASE_URL;
  
  // Check for environment variable first (set in Amplify Console)
  // Note: Amplify injects env vars as window.REACT_APP_* variables
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    API_BASE_URL = window.REACT_APP_API_URL;
  } else if (isLocalhost) {
    API_BASE_URL = 'http://localhost:3000';
  } else if (isAmplify) {
    // Point to Render backend
    API_BASE_URL = 'https://empower-social-2.onrender.com';
  } else {
    // Production - use your production API URL
    API_BASE_URL = window.location.origin;
  }
  
  // Make it globally available
  window.API_BASE_URL = API_BASE_URL;
  window.APP_CONFIG = {
    API_BASE_URL: API_BASE_URL,
    ENVIRONMENT: isLocalhost ? 'development' : (isAmplify ? 'staging' : 'production')
  };
  
  console.log('API Base URL:', API_BASE_URL);
  console.log('Environment:', window.APP_CONFIG.ENVIRONMENT);
})();
