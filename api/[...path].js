import { handleRequest } from '../src/server/app.js';

// Vercel Node.js catch-all function. Keep the same request handler used in local development.
export default async function bandApi(req, res) {
  await handleRequest(req, res);
}
