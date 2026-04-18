const { ensureProductionBuild, loadEnvFile, startNext } = require('./startup-common');

loadEnvFile('.env.prod', 'production', 'production start');
ensureProductionBuild();

const port = process.env.PORT || 4000;
startNext(['start', '-p', port.toString()]);
