import { db } from '../db/config';
import dayjs from 'dayjs';
import 'dayjs/plugin/isoWeek';

/**
 * Gets all products for export
 * 
 * @returns {Array} Array of all products
 */
export function getAllProducts(): any[] {
    const query = `
        SELECT i.id, i.name, i.price, COALESCE(gi.group_name, '') as group_name
        FROM items i
        LEFT JOIN group_items gi ON i.id = gi.item_id
        ORDER BY i.name;
    `;
    const stmt = db.prepare(query);
    return stmt.all().map((row: any) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        group: row.group_name
    }));
}

/**
 * Gets all orders for export
 * 
 * @returns {Array} Array of all orders with their items
 */
export function getAllOrders(): any[] {
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

    // Map the results to Order objects
    return orders.map((order: any) => {
        const items = itemsStmt.all(order.id).map((item: any) => ({
            id: item.id,
            name: item.item_name,
            price: item.item_price,
            quantity: item.quantity
        }));

        return {
            id: order.id,
            date: order.date,
            totalPrice: order.total_price,
            items: items
        };
    });
}

/**
 * Gets a weekly sales report for a specific week
 * 
 * @param {string} weekStartDate - Start date of the week in YYYY-MM-DD format
 * @returns {Object} Weekly sales report with product sales by day
 */
export function getWeeklySalesReport(weekStartDate: string): any {
    // Create dayjs instance
    const dayjs_week = dayjs(weekStartDate);
    
    // Calculate the end date (6 days after start date, for a full week)
    const weekEndDate = dayjs_week.add(6, 'day').format('YYYY-MM-DD');
    
    // Generate all dates in the week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        weekDays.push(dayjs_week.add(i, 'day').format('YYYY-MM-DD'));
    }
    
    // Query to get all orders for the week
    const ordersQuery = `
        SELECT 
            o.id, 
            o.date, 
            o.total_price,
            oi.item_name,
            oi.item_price,
            oi.quantity
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE date >= ? AND date <= ?
        ORDER BY o.date;
    `;
    
    const stmt = db.prepare(ordersQuery);
    // Include the entire end day
    const results = stmt.all(weekStartDate, weekEndDate + ' 23:59:59');
    
    // Group results by product
    const productMap = new Map();
    let weeklyTotal = 0;
    
    results.forEach((row: any) => {
        const date = row.date.split('T')[0].split(' ')[0]; // Extract date part
        const revenue = row.item_price * row.quantity;
        weeklyTotal += revenue;

        if (!productMap.has(row.item_name)) {
            productMap.set(row.item_name, {
                name: row.item_name,
                price: row.item_price,
                totalQuantity: 0,
                totalRevenue: 0,
                dailySales: {}
            });
        }

        const product = productMap.get(row.item_name);
        product.totalQuantity += row.quantity;
        product.totalRevenue += revenue;

        if (!product.dailySales[date]) {
            product.dailySales[date] = { quantity: 0, revenue: 0 };
        }

        product.dailySales[date].quantity += row.quantity;
        product.dailySales[date].revenue += revenue;
    });

    return {
        startDate: weekStartDate,
        endDate: weekEndDate,
        weekDays: weekDays,
        products: Array.from(productMap.values()),
        weeklyTotal: weeklyTotal
    };
}

// Export functions go here
// getSalesSummary has been moved to src/backend/db/getters.ts
/**
 * Get sales summary for a date range
 */
export function getSalesSummary(startDate: string, endDate: string) {
    const query = `
        SELECT 
            oi.item_name,
            oi.item_price,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.item_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.date >= ? AND o.date <= ?
        GROUP BY oi.item_name, oi.item_price
        ORDER BY total_revenue DESC
    `;

    return db.prepare(query).all(startDate, endDate);


    return db.prepare(query).all();
}