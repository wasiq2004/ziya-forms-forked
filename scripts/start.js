const dotenv = require('dotenv');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const envPath = path.join(__dirname, '../.env.prod');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`Error loading ${envPath}:`, result.error);
  process.exit(1);
}

const port = process.env.PORT || 3000;

const server = spawn('npm', ['exec', 'next', '--', 'start', '-p', port.toString()], {
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
