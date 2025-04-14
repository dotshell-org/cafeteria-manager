import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// Database configuration
export const DATABASE_PATH = "./local.storage";
export const DB_OPTIONS = { };

// Create or open the database
export const db = new Database(DATABASE_PATH, DB_OPTIONS);

