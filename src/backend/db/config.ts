import { createRequire } from 'module';
import path from 'node:path';
import { app } from 'electron';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// Database configuration
const USER_DATA_PATH = app.getPath('userData');
export const DATABASE_PATH = path.join(USER_DATA_PATH, 'local.storage');
export const DB_OPTIONS = { };

// Create or open the database
export const db = new Database(DATABASE_PATH, DB_OPTIONS);