// Frontend Configuration
// This file contains environment-specific configuration

// API Base URL - will be replaced during build process
const hostname = window.location.hostname;
let API_BASE_URL = '';

if (hostname === 'localhost') {
  // Local development
  API_BASE_URL = 'http://localhost:3000/api';
} else if (hostname.includes('development') || hostname.includes('dev')) {
  // Development environment (Firebase preview channels)
  API_BASE_URL = 'https://your-dev-backend.run.app/api';
} else {
  // Production environment
  API_BASE_URL = 'https://your-prod-backend.run.app/api';
}

// Other configuration constants
const CONFIG = {
  API_BASE_URL: API_BASE_URL,
  API_TIMEOUT: 10000, // 10 seconds
  ENVIRONMENT: 'development',
  DEBUG: true
};

// Make available globally (for older script tag approach)
if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
  window.CONFIG = CONFIG;
}

// Export for module usage (if supported)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
