import { createServer } from 'node:http';
import { env, assertRuntimeConfig } from './config/env.js';
import { handleRequest } from './app.js';

assertRuntimeConfig();
const server = createServer((req, res) => { void handleRequest(req, res); });
server.listen(env.port, '0.0.0.0', () => {
  console.log(`BAND server ready at http://localhost:${env.port}`);
  if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is missing: local/offline frontend works, cloud API will return 503.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
