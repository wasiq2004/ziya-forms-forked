const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const os = require('os');

function loadEnvFile(relativePath, expectedNodeEnv, label) {
  const envPath = path.join(__dirname, '..', relativePath);

  if (!fs.existsSync(envPath)) {
    console.error(`Missing env file for ${label}: ${envPath}`);
    process.exit(1);
  }

  const result = dotenv.config({ path: envPath, override: true });

  if (result.error) {
    console.error(`Error loading ${envPath}:`, result.error);
    process.exit(1);
  }

  process.env.NODE_ENV = expectedNodeEnv;

  console.log(`Loaded ${path.basename(envPath)} for ${label} (${expectedNodeEnv})`);
  return envPath;
}

function ensureProductionBuild() {
  const nextDir = path.join(__dirname, '..', '.next');
  const buildIdPath = path.join(__dirname, '..', '.next', 'BUILD_ID');
  const staleDevAssets = path.join(nextDir, 'static', 'development');
  const routesManifestPath = path.join(nextDir, 'routes-manifest.json');

  const hasBuild = fs.existsSync(buildIdPath);
  const hasStaleDevAssets = fs.existsSync(staleDevAssets);

  if (hasBuild && !hasStaleDevAssets && fs.existsSync(routesManifestPath)) {
    try {
      const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, 'utf8'));
      if (routesManifest && Array.isArray(routesManifest.dataRoutes)) {
        return;
      }
    } catch (error) {
      console.warn('Existing .next routes manifest is unreadable. Rebuilding from scratch.');
    }
  }

  if (fs.existsSync(nextDir)) {
    console.log('Refreshing .next with a clean production build...');
    fs.rmSync(nextDir, { recursive: true, force: true });
  } else {
    console.log('No production build found in .next. Running `npm run build` first...');
  }

  const build = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: process.env,
    shell: os.platform() === 'win32',
  });

  if (build.status !== 0) {
    process.exit(build.status || 1);
  }
}

function startNext(args) {
  const server = spawn('npm', ['exec', 'next', '--', ...args], {
    stdio: 'inherit',
    env: process.env,
    shell: os.platform() === 'win32',
  });

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = {
  loadEnvFile,
  ensureProductionBuild,
  startNext,
};
