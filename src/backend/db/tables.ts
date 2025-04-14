import { db } from './config.ts';

db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        name TEXT,
        price REAL
    );
    CREATE TABLE IF NOT EXISTS group_items (
        id INTEGER PRIMARY KEY,
        group_name TEXT,
        item_id INTEGER,
        FOREIGN KEY(item_id) REFERENCES items(id)
    );
`);