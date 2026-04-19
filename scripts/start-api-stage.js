const { ensureProductionBuild, loadEnvFile, startNext } = require('./startup-common');

loadEnvFile('.env.stage', 'production', 'stage api start');
ensureProductionBuild();

const port = 4001;
startNext(['start', '-p', port.toString()]);
