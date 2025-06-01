import {db} from './config.js'
import {Item} from '../../types/generic/Item.js'
import {ItemGroup} from "../../types/generic/ItemGroup.js";
import { Product } from '../../types/generic/Product.js';
import { Order } from "../../types/generic/Order.js";

/**
 * Retrieves a list of items formatted for UI display based on the provided groups and a search query.
 *
 * @param {ItemGroup[]} groups - An array of item groups, where each group contains a `selected` property indicating its inclusion in the query.
 * @param {string} search - A search term to filter items by name.
 * @return {Item[]} An array of items containing their `name`, `price`, `image_path` and a default `quantity` value of 0, filtered based on the selected groups and search term.
 */
export function getItemsForUI(groups: ItemGroup[], search: string): Item[] {
    // Base query
    let query = `
        SELECT DISTINCT i.name, i.price, i.image_path
        FROM items i
    `;

    const params: string[] = [];
    if (groups.some(group => group.selected)) {
        query += `
            JOIN group_items gi ON i.id = gi.item_id
            WHERE gi.group_name IN (${groups.filter(group => group.selected).map(() => '?').join(', ')})
        `;
        params.push(...groups.filter(group => group.selected).map(group => group.name));
    }

    if (search && search.trim()) {
        query += groups.some(group => group.selected) ? ' AND' : ' WHERE';
        query += ` i.name LIKE ?`;
        params.push(`%${search.trim()}%`);
    }

    const stmt = db.prepare(query);

    return stmt.all(params).map((row: { name: string; price: number; image_path: string }) => ({
        name: row.name,
        price: row.price,
        quantity: 0,
        image: row.image_path, // Map image_path to image
    }));
}

/**
 * Retrieves a list of groups from the database and returns them as an array of objects.
 * Each object represents a group with its name and a default selected status.
 *
 * @return {ItemGroup[]} An array of groups, where each group has a `name` property and a `selected` property set to false.
 */
export function getGroups(): ItemGroup[] {
    const stmt = db.prepare('SELECT DISTINCT group_name FROM group_items');
    return stmt.all().map((row: { group_name: string }) => ({
        name: row.group_name,
        selected: false,
    }));
}

/**
 * Retrieves all products from the database, including their group information and image path.
 *
 * @returns {Product[]} An array of all products.
 */
export function getProducts(): Product[] {
    const query = `
        SELECT i.id, i.name, i.price, i.image_path, COALESCE(gi.group_name, '') as group_name
        FROM items i
        LEFT JOIN group_items gi ON i.id = gi.item_id
        ORDER BY i.name;
    `;
    const stmt = db.prepare(query);
    return stmt.all().map((row: any) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        group: row.group_name,
        image: row.image_path // Map image_path to image
    }));
}

/**
 * Retrieves all orders from the database, including their items, grouped by date.
 * 
 * @returns {Record<string, Order[]>} An object where keys are dates and values are arrays of orders for that date.
 */
export function getOrders(): Record<string, Order[]> {
    // First, get all orders
    const ordersQuery = `
        SELECT id, date, total_price
        FROM orders
        ORDER BY date DESC;
    `;
    const ordersStmt = db.prepare(ordersQuery);
    const orders = ordersStmt.all();

    // Then, for each order, get its items
    const itemsQuery = `
        SELECT id, order_id, item_name, item_price, quantity
        FROM order_items
        WHERE order_id = ?;
    `;
    const itemsStmt = db.prepare(itemsQuery);

    // Map the results to Order objects and group by date
    const ordersByDate: Record<string, Order[]> = {};

    orders.forEach((order: any) => {
        const items = itemsStmt.all(order.id).map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            itemName: item.item_name,
            itemPrice: item.item_price,
            quantity: item.quantity
        }));

        const orderObj = {
            id: order.id,
            date: order.date,
            totalPrice: order.total_price,
            items: items
        };

        // Extract date part (YYYY-MM-DD) for grouping
        const dateOnly = order.date.split('T')[0].split(' ')[0]; // Handle both ISO and space-separated formats

        // Group by date (without time)
        if (!ordersByDate[dateOnly]) {
            ordersByDate[dateOnly] = [];
        }
        ordersByDate[dateOnly].push(orderObj);
    });

    return ordersByDate;
}

/**
 * Gets the total sales for a specific day.
 *
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {number} The total sales for the specified day
 */
export function getDailySales(date: string): number {
    const query = `
        SELECT SUM(total_price) as daily_total
        FROM orders
        WHERE date LIKE ?;
    `;
    const stmt = db.prepare(query);
    const result = stmt.get(`${date}%`); // Use LIKE with % to match any time on the specified date

    return result?.daily_total || 0; // Return 0 if no sales for that day
}

/**
 * Gets the total sales for multiple days.
 *
 * @param {string[]} dates - Array of dates in YYYY-MM-DD format
 * @returns {Record<string, number>} Object with dates as keys and total sales as values
 */
export function getMultipleDaysSales(dates: string[]): Record<string, number> {
    const result: Record<string, number> = {};

    // Initialize all dates with 0
    dates.forEach(date => {
        result[date] = 0;
    });

    // If no dates provided, return empty object
    if (dates.length === 0) {
        return result;
    }

    const query = `
        SELECT date, SUM(total_price) as daily_total
        FROM orders
        WHERE date LIKE ?
        GROUP BY substr(date, 1, 10);
    `;

    // Execute query for each date
    const stmt = db.prepare(query);

    dates.forEach(date => {
        const row = stmt.get(`${date}%`);
        if (row && row.daily_total) {
            // Extract date part (YYYY-MM-DD) for grouping
            const dateOnly = row.date.split('T')[0].split(' ')[0]; // Handle both ISO and space-separated formats
            result[dateOnly] = row.daily_total;
        }
    });

    return result;
}

/**
 * Gets a sales summary for a date range
 *
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of product sales summaries with item name, price, quantity and revenue
 */
export function getSalesSummary(startDate: string, endDate: string): any[] {
    // Query to get product sales summaries within the date range
    const query = `
        SELECT 
            item_name,
            item_price,
            SUM(quantity) as total_quantity,
            SUM(item_price * quantity) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.date >= ? AND o.date <= ?
        GROUP BY item_name, item_price
        ORDER BY total_revenue DESC;
    `;

    // Add time to include the entire end day
    const endWithTime = endDate + ' 23:59:59';

    const stmt = db.prepare(query);
    const results = stmt.all(startDate, endWithTime);

    // Format the results
    return results.map((row: any) => ({
        item_name: row.item_name,
        item_price: row.item_price,
        total_quantity: row.total_quantity,
        total_revenue: row.total_revenue
    }));
}
