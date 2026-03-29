import 'dotenv/config';
import { startMarkyServer } from './start-server.js';

const ROOT_DIR = process.env.ROOT_DIR;
if (!ROOT_DIR) throw new Error('ROOT_DIR environment variable is required. Set it in .env');

await startMarkyServer({
  rootDir: ROOT_DIR,
  port: 3001,
  logger: true,
});
