const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy all static files
const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(__dirname, 'views');

// Copy public assets
copyDir(publicDir, distDir);

// Copy HTML files
copyDir(viewsDir, distDir);

// Update API URLs for production
updateApiUrls();

console.log('✅ Build completed successfully');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function updateApiUrls() {
  const jsFiles = ['dist/js/app.js', 'dist/js/users.js', 'dist/js/import.js'];
  
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      // Update API URL to production backend
      content = content.replace(
        /const API_BASE_URL = 'http:\/\/localhost:3000\/api'/g,
        "const API_BASE_URL = 'https://YOUR_BACKEND_URL/api'"
      );
      fs.writeFileSync(file, content);
    }
  });
}
