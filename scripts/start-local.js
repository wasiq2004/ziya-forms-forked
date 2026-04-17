const { loadEnvFile, startNext } = require('./startup-common');

loadEnvFile('.env.local', 'development', 'local dev start');

const port = process.env.PORT || 3000;
startNext(['dev', '--turbopack', '-p', port.toString(), '-H', '0.0.0.0']);
