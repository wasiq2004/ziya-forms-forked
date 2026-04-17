const { ensureProductionBuild, loadEnvFile, startNext } = require('./startup-common');

loadEnvFile('.env.stage', 'production', 'stage start');
ensureProductionBuild();

const port = process.env.PORT || 3000;
startNext(['start', '-p', port.toString()]);
