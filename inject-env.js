// inject-env.js - Updated to handle both development and production
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const api = process.env.API_BASE_URL || 'http://localhost:3000/api';
console.log(`🔧 Using API_BASE_URL: ${api}`);

// Function to safely read and write files
function safeFileOperation(filePath, operation) {
  try {
    return operation(filePath);
  } catch (error) {
    console.error(`Error with file ${filePath}:`, error.message);
    return null;
  }
}

// Function to inject API URL into a file
function injectApiUrl(filePath, content) {
  let modified = false;
  let newContent = content;
  
  // Replace __API_BASE_URL__ placeholder
  if (content.includes('__API_BASE_URL__')) {
    newContent = newContent.replace(/__API_BASE_URL__/g, api);
    modified = true;
    console.log(`✅ Replaced __API_BASE_URL__ placeholders in ${path.basename(filePath)}`);
  }
  
  return { content: newContent, modified };
}

// Process config.js in multiple possible locations
const configPaths = [
  path.join(__dirname, 'public/js/config.js'),    // Development location
  path.join(__dirname, 'dist/js/config.js'),      // Production location
];

console.log(`📁 Checking for config.js in multiple locations...`);

configPaths.forEach(cfgPath => {
  console.log(`🔍 Checking: ${cfgPath}`);
  
  if (!fs.existsSync(cfgPath)) {
    console.log(`📝 config.js not found at ${cfgPath}, creating...`);
    
    const defaultConfig = `// Frontend Configuration
// This file contains environment-specific configuration

// API Base URL - will be replaced during build process
const API_BASE_URL = '__API_BASE_URL__';

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
`;
    
    // Ensure directory exists
    const jsDir = path.dirname(cfgPath);
    if (!fs.existsSync(jsDir)) {
      fs.mkdirSync(jsDir, { recursive: true });
      console.log(`📁 Created directory: ${jsDir}`);
    }
    
    fs.writeFileSync(cfgPath, defaultConfig, 'utf-8');
    console.log('✅ Created default config.js');
  }
  
  // Inject into config.js
  safeFileOperation(cfgPath, (filePath) => {
    let configContent = fs.readFileSync(filePath, 'utf-8');
    const result = injectApiUrl(filePath, configContent);
    
    if (result.modified) {
      fs.writeFileSync(filePath, result.content, 'utf-8');
      console.log(`✅ Updated config.js with API URL: ${api}`);
    } else {
      console.log('ℹ️  No changes needed in config.js (already configured)');
    }
  });
});

// List of JavaScript files to check in both public and dist
const jsFilesToCheck = [
  // Development locations (public)
  'public/js/app.js',
  'public/js/tickets.js',
  'public/js/users.js',
  'public/js/import.js',
  'public/js/utils.js',
  'public/js/new-ticket.js',
  
  // Production locations (dist)
  'dist/js/app.js',
  'dist/js/tickets.js',
  'dist/js/users.js',
  'dist/js/import.js',
  'dist/js/utils.js',
  'dist/js/new-ticket.js',
  
  // Other possible locations
  'views/js/app.js',
  'src/js/app.js'
];

// Check and inject into all JavaScript files
let filesProcessed = 0;
console.log('\n📂 Processing JavaScript files...');

jsFilesToCheck.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`📄 Processing: ${relativePath}`);
    
    safeFileOperation(fullPath, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf-8');
      const result = injectApiUrl(filePath, content);
      
      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log(`✅ Updated ${relativePath} with API URL: ${api}`);
        filesProcessed++;
      } else {
        console.log(`ℹ️  No placeholders found in ${relativePath}`);
      }
    });
  }
});

// Also check HTML files in views and dist
const htmlFilesToCheck = [
  // Views (development)
  'views/login.html',
  'views/dashboard.html',
  'views/tickets.html',
  'views/users.html',
  'views/import.html',
  'views/new-ticket.html',
  
  // Public (if any)
  'public/index.html',
  'public/login.html',
  
  // Dist (production)
  'dist/login.html',
  'dist/dashboard.html',
  'dist/tickets.html',
  'dist/users.html',
  'dist/import.html',
  'dist/new-ticket.html'
];

console.log('\n📄 Processing HTML files...');

htmlFilesToCheck.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  
  if (fs.existsSync(fullPath)) {
    safeFileOperation(fullPath, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf-8');
      const result = injectApiUrl(filePath, content);
      
      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log(`✅ Updated ${relativePath} with API URL: ${api}`);
        filesProcessed++;
      }
    });
  }
});

// Summary
console.log('\n📊 Environment Injection Summary:');
console.log(`🎯 API Base URL: ${api}`);
console.log(`📁 Files processed: ${filesProcessed}`);
console.log(`✅ Environment injection completed successfully!`);

// Verification - check if any placeholders remain
console.log('\n🔍 Verification: Checking for remaining placeholders...');
let remainingPlaceholders = false;

[...jsFilesToCheck, ...htmlFilesToCheck].forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('__API_BASE_URL__')) {
      console.log(`⚠️  WARNING: Placeholder still found in ${relativePath}`);
      remainingPlaceholders = true;
    }
  }
});

if (!remainingPlaceholders) {
  console.log('✅ Verification complete: No remaining placeholders found');
} else {
  console.log('❌ WARNING: Some placeholders were not replaced!');
}