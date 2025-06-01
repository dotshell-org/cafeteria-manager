import { db } from './config.js';

db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        name TEXT,
        price REAL,
        image_path TEXT
    );
    CREATE TABLE IF NOT EXISTS group_items (
        id INTEGER PRIMARY KEY,
        group_name TEXT,
        item_id INTEGER,
        FOREIGN KEY(item_id) REFERENCES items(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        date TEXT,
        total_price REAL,
        TIMESTAMP DEFAULT (datetime('now', 'localtime'))
        );
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER,
        item_name TEXT,
        item_price REAL,
        quantity INTEGER,
        FOREIGN KEY(order_id) REFERENCES orders(id)
    );
`);
