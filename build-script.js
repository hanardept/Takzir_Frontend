const fs = require('fs');
const path = require('path');

// Build configuration
const buildConfig = {
  distDir: path.join(__dirname, 'dist'),
  publicDir: path.join(__dirname, 'public'),
  viewsDir: path.join(__dirname, 'views'),
  
  // Production API URL
 productionApiUrl: process.env.PRODUCTION_API_URL || 'https://takzir-backend-5915076344.europe-west4.run.app/api',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'takzir-95a86',
  productionDomain: process.env.PRODUCTION_DOMAIN || 'https://takzir-95a86.web.app',
  
  // Files to process for API URL updates
  jsFiles: [
    'dist/js/app.js',
    'dist/js/users.js', 
    'dist/js/import.js',
    'dist/js/tickets.js', // Add if you have it
    'dist/js/utils.js'    // Add if you have it
  ]
};

async function build() {
  try {
    console.log('🚀 Starting Takzir frontend build process...');
    console.log('📍 Target: Firebase Hosting deployment');
    
    // Step 1: Clean and create dist directory
    await cleanAndCreateDist();
    
    // Step 2: Copy static assets
    await copyAssets();
    
    // Step 3: Process files for production
    await processForProduction();
    
    // Step 4: Create Firebase configuration
    await createFirebaseConfig();
    
    console.log('✅ Build completed successfully!');
    console.log('📦 Build output: ./dist/');
    console.log('🔧 Next steps:');
    console.log('   1. Update PRODUCTION_API_URL after backend deployment');
    console.log('   2. Run: firebase deploy --only hosting');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function cleanAndCreateDist() {
  console.log('🧹 Cleaning dist directory...');
  
  // Remove existing dist directory
  if (fs.existsSync(buildConfig.distDir)) {
    fs.rmSync(buildConfig.distDir, { recursive: true, force: true });
  }
  
  // Create fresh dist directory
  fs.mkdirSync(buildConfig.distDir, { recursive: true });
  console.log('   ✓ Dist directory ready');
}

async function copyAssets() {
  console.log('📂 Copying assets...');
  
  // Copy public assets
  if (fs.existsSync(buildConfig.publicDir)) {
    copyDir(buildConfig.publicDir, buildConfig.distDir);
    console.log('   ✓ Copied public assets');
  }
  
  // Copy HTML files from views to root of dist
  if (fs.existsSync(buildConfig.viewsDir)) {
    const htmlFiles = fs.readdirSync(buildConfig.viewsDir)
      .filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
      const srcPath = path.join(buildConfig.viewsDir, file);
      const destPath = path.join(buildConfig.distDir, file);
      fs.copyFileSync(srcPath, destPath);
    });
    
    console.log(`   ✓ Copied ${htmlFiles.length} HTML files`);
  }
}

async function processForProduction() {
  console.log('⚙️ Processing files for production...');
  
  // Update API URLs
  await updateApiUrls();
  
  // Process HTML files
  await processHtmlFiles();
  
  // Add production optimizations
  await addProductionOptimizations();
}

async function updateApiUrls() {
  console.log('   🔧 Updating API URLs...');
  
  let updatedFiles = 0;
  
  buildConfig.jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Update localhost API URLs to production
      const updatedContent = content.replace(
        /const API_BASE_URL = ['"]http:\/\/localhost:3000\/api['"];?/g,
        `const API_BASE_URL = '${buildConfig.productionApiUrl}';`
      );
      
      // Also update any hardcoded localhost references
      const finalContent = updatedContent.replace(
        /['"]http:\/\/localhost:3000\/api['"]/g,
        `'${buildConfig.productionApiUrl}'`
      );
      
      if (content !== finalContent) {
        fs.writeFileSync(file, finalContent);
        updatedFiles++;
      }
    }
  });
  
  console.log(`   ✓ Updated API URLs in ${updatedFiles} JavaScript files`);
}

async function processHtmlFiles() {
  console.log('   🏗️ Processing HTML files...');
  
  const htmlFiles = fs.readdirSync(buildConfig.distDir)
    .filter(file => file.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const filePath = path.join(buildConfig.distDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add production meta tags
    content = content.replace(
      '<head>',
      `<head>
    <!-- Production Deployment -->
    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="Military Equipment Maintenance Ticket System - IDF">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">`
    );
    
    // Update any localhost references in HTML
    content = content.replace(
      /http:\/\/localhost:3001/g,
      'https://YOUR_PROJECT_ID.web.app'
    );
    
    fs.writeFileSync(filePath, content);
  });
  
  console.log(`   ✓ Processed ${htmlFiles.length} HTML files`);
}

async function addProductionOptimizations() {
  console.log('   🚀 Adding production optimizations...');
  
  // Add service worker registration (optional)
  const appJsPath = path.join(buildConfig.distDir, 'js', 'app.js');
  if (fs.existsSync(appJsPath)) {
    let content = fs.readFileSync(appJsPath, 'utf8');
    
    // Add production environment flag
    content = content.replace(
      /const API_BASE_URL = ['"'][^'"]*['"];/,
      `const API_BASE_URL = '${buildConfig.productionApiUrl}';
const ENVIRONMENT = 'production';
const BUILD_TIME = '${new Date().toISOString()}';`
    );
    
    fs.writeFileSync(appJsPath, content);
    console.log('   ✓ Added production environment variables');
  }
}

async function createFirebaseConfig() {
  console.log('🔥 Creating Firebase configuration...');
  
  const firebaseConfig = {
    "hosting": {
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**",
        "**/*.log"
      ],
      "rewrites": [
        {
          "source": "/",
          "destination": "/login.html"
        },
        {
          "source": "/dashboard",
          "destination": "/dashboard.html"
        },
        {
          "source": "/users",
          "destination": "/users.html"
        },
        {
          "source": "/tickets",
          "destination": "/tickets.html"
        },
        {
          "source": "/import",
          "destination": "/import.html"
        },
        {
          "source": "/login",
          "destination": "/login.html"
        },
        {
          "source": "**",
          "destination": "/login.html"
        }
      ],
      "headers": [
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000, immutable"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            {
              "key": "Cache-Control", 
              "value": "max-age=300"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            }
          ]
        },
        {
          "source": "/api/**",
          "headers": [
            {
              "key": "Access-Control-Allow-Origin",
              "value": "*"
            }
          ]
        }
      ],
      "cleanUrls": true,
      "trailingSlash": false
    }
  };
  
  const firebaseConfigPath = path.join(__dirname, 'firebase.json');
  fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
  console.log('   ✓ Created firebase.json configuration');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source directory not found: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    try {
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (error) {
      console.warn(`⚠️  Could not copy ${srcPath}: ${error.message}`);
    }
  });
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build, buildConfig };
