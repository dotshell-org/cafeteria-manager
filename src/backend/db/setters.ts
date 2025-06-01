import { db } from './config.js';
import { Product } from '../../types/generic/Product.js';

// Add a new product and return its new id
export function addProduct(product: Omit<Product, 'id'>): number {
    const insertItem = db.prepare(
        'INSERT INTO items (name, price, image_path) VALUES (?, ?, ?)' 
    );
    const result = insertItem.run(product.name, product.price, product.image || null);
    const itemId = result.lastInsertRowid as number;

    // Handle group
    if (product.group && product.group.trim()) {
        const insertGroup = db.prepare(
            'INSERT INTO group_items (group_name, item_id) VALUES (?, ?)' 
        );
        insertGroup.run(product.group, itemId);
    }
    return itemId;
}

// Update an existing product
export function updateProduct(product: Product): void {
    const updateItem = db.prepare(
        'UPDATE items SET name = ?, price = ?, image_path = ? WHERE id = ?'
    );
    updateItem.run(product.name, product.price, product.image || null, product.id);

    // Remove old group(s)
    const deleteGroups = db.prepare('DELETE FROM group_items WHERE item_id = ?');
    deleteGroups.run(product.id);
    // Insert new group if provided
    if (product.group && product.group.trim()) {
        const insertGroup = db.prepare(
            'INSERT INTO group_items (group_name, item_id) VALUES (?, ?)' 
        );
        insertGroup.run(product.group, product.id);
    }
}

// Delete a product and its group links
export function deleteProduct(productId: number): void {
    // Remove from group_items
    const deleteGroups = db.prepare('DELETE FROM group_items WHERE item_id = ?');
    deleteGroups.run(productId);
    // Remove from items
    const deleteItem = db.prepare('DELETE FROM items WHERE id = ?');
    deleteItem.run(productId);
}

// Save an order and its items, return the new order id
export function saveOrder(order: { date: string; totalPrice: number; items: { itemName: string; itemPrice: number; quantity: number; }[] }): number {
    const insertOrder = db.prepare(
        'INSERT INTO orders (date, total_price) VALUES (?, ?)'
    );
    const result = insertOrder.run(order.date, order.totalPrice);
    const orderId = result.lastInsertRowid as number;

    const insertOrderItem = db.prepare(
        'INSERT INTO order_items (order_id, item_name, item_price, quantity) VALUES (?, ?, ?, ?)'
    );
    for (const item of order.items) {
        insertOrderItem.run(orderId, item.itemName, item.itemPrice, item.quantity);
    }
    return orderId;
}
