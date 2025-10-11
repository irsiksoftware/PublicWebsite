#!/usr/bin/env node

/**
 * CDN Deployment Script
 *
 * Uploads built assets to CDN and optionally purges cache
 */

const fs = require('fs');
const path = require('path');
const { CDN_CONFIG, purgeCDNCache } = require('../config/cdn.config.js');

/**
 * Deploy assets to CDN
 * @param {string} distDir - Directory containing built assets
 */
async function deployToCDN(distDir = 'dist') {
  const distPath = path.resolve(process.cwd(), distDir);

  if (!fs.existsSync(distPath)) {
    console.error(`Error: Build directory '${distDir}' does not exist.`);
    console.error('Run "npm run build" first to generate assets.');
    process.exit(1);
  }

  console.log('CDN Deployment Configuration');
  console.log('============================');
  console.log(`Provider: ${CDN_CONFIG.provider}`);
  console.log(`Domain: ${CDN_CONFIG.domain}`);
  console.log(`Enabled: ${CDN_CONFIG.enabled}`);
  console.log(`Source: ${distPath}`);
  console.log('');

  if (!CDN_CONFIG.enabled) {
    console.warn('Warning: CDN is not enabled in configuration.');
    console.warn('Set NODE_ENV=production to enable CDN.');
    process.exit(0);
  }

  // Get list of files to upload
  const files = getAllFiles(distPath);
  console.log(`Found ${files.length} files to upload`);
  console.log('');

  // Show file summary
  const summary = getFileSummary(files, distPath);
  console.log('File Summary:');
  console.log(`  JS files: ${summary.js}`);
  console.log(`  CSS files: ${summary.css}`);
  console.log(`  Image files: ${summary.images}`);
  console.log(`  Other files: ${summary.other}`);
  console.log('');

  console.log('Deployment Instructions');
  console.log('======================');

  switch (CDN_CONFIG.provider) {
    case 'cloudflare':
      printCloudflareInstructions(distPath);
      break;
    case 'cloudfront':
      printCloudFrontInstructions(distPath);
      break;
    case 'fastly':
      printFastlyInstructions(distPath);
      break;
    default:
      printGenericInstructions(distPath);
  }

  console.log('');
  console.log('After uploading, you may want to purge the CDN cache:');
  console.log('');
  console.log('  npm run cdn:purge');
  console.log('');
}

/**
 * Get all files recursively from a directory
 * @param {string} dir - Directory path
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dir) {
  const files = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    });
  }

  traverse(dir);
  return files;
}

/**
 * Get summary of file types
 * @param {string[]} files - Array of file paths
 * @param {string} baseDir - Base directory for relative paths
 * @returns {object} File type counts
 */
function getFileSummary(files, baseDir) {
  const summary = {
    js: 0,
    css: 0,
    images: 0,
    other: 0
  };

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();

    if (ext === '.js' || ext === '.map') {
      summary.js++;
    } else if (ext === '.css') {
      summary.css++;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
      summary.images++;
    } else {
      summary.other++;
    }
  });

  return summary;
}

/**
 * Print Cloudflare deployment instructions
 */
function printCloudflareInstructions(distPath) {
  console.log('Cloudflare Pages Deployment:');
  console.log('');
  console.log('  # Install Wrangler CLI (if not already installed)');
  console.log('  npm install -g wrangler');
  console.log('');
  console.log('  # Login to Cloudflare');
  console.log('  wrangler login');
  console.log('');
  console.log('  # Deploy to Cloudflare Pages');
  console.log(`  wrangler pages publish ${distPath} --project-name=your-project-name`);
  console.log('');
  console.log('Or use Cloudflare Dashboard:');
  console.log('  1. Go to Pages section in Cloudflare Dashboard');
  console.log('  2. Create new project or select existing');
  console.log(`  3. Upload contents of ${distPath} directory`);
}

/**
 * Print CloudFront deployment instructions
 */
function printCloudFrontInstructions(distPath) {
  console.log('AWS CloudFront Deployment:');
  console.log('');
  console.log('  # Upload to S3');
  console.log(`  aws s3 sync ${distPath}/ s3://your-bucket-name/ --delete`);
  console.log('');
  console.log('  # Invalidate CloudFront cache');
  console.log('  aws cloudfront create-invalidation \\');
  console.log('    --distribution-id YOUR_DISTRIBUTION_ID \\');
  console.log('    --paths "/*"');
  console.log('');
  console.log('Note: Ensure your IAM user has appropriate permissions.');
}

/**
 * Print Fastly deployment instructions
 */
function printFastlyInstructions(distPath) {
  console.log('Fastly Deployment:');
  console.log('');
  console.log('  1. Upload files to your origin server:');
  console.log(`     - Upload contents of ${distPath} to your web server`);
  console.log('');
  console.log('  2. Purge Fastly cache:');
  console.log('     curl -X POST https://api.fastly.com/service/YOUR_SERVICE_ID/purge_all \\');
  console.log('       -H "Fastly-Key: YOUR_API_KEY"');
  console.log('');
  console.log('Or use Fastly CLI:');
  console.log('  fastly purge --all');
}

/**
 * Print generic CDN deployment instructions
 */
function printGenericInstructions(distPath) {
  console.log('Generic CDN Deployment:');
  console.log('');
  console.log(`  1. Upload contents of ${distPath} to your CDN origin`);
  console.log('  2. Ensure proper CORS headers are configured');
  console.log('  3. Verify cache headers are set correctly');
  console.log('  4. Test asset loading from CDN domain');
  console.log('  5. Purge cache if needed');
}

// Run deployment if called directly
if (require.main === module) {
  const distDir = process.argv[2] || 'dist';
  deployToCDN(distDir).catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = { deployToCDN };
