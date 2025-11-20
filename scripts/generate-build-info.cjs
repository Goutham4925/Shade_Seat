// scripts/generate-build-info.cjs
const fs = require('fs');
const path = require('path');

// Get commit hash from Vercel environment or git
const getCommitHash = () => {
  // Vercel environment variables (available during deployment)
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    console.log('Using Vercel commit:', process.env.VERCEL_GIT_COMMIT_SHA);
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  
  // Other environment variables
  if (process.env.COMMIT_REF) {
    console.log('Using commit ref:', process.env.COMMIT_REF);
    return process.env.COMMIT_REF;
  }
  
  // Local development - get from git
  try {
    const commitHash = require('child_process')
      .execSync('git rev-parse --short HEAD')
      .toString()
      .trim();
    console.log('Using local git commit:', commitHash);
    return commitHash;
  } catch (error) {
    console.log('No git commit found, using timestamp');
    return 'dev-' + Date.now().toString(36);
  }
};

const commitHash = getCommitHash();
const buildInfo = {
  commit: commitHash,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  // Vercel-specific info
  vercel: {
    url: process.env.VERCEL_URL || 'local',
    env: process.env.VERCEL_ENV || 'development'
  }
};

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write to public directory
const outputPath = path.join(publicDir, 'build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
console.log('✅ build-info.json generated');
console.log('📝 Commit:', commitHash);
console.log('🌍 Environment:', buildInfo.environment);