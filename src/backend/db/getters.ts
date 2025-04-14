import {db} from './config.ts'
import {Item} from '../../types/generic/Item.ts'
import {ItemGroup} from "../../types/generic/ItemGroup.ts";

/**
 * Retrieves a list of items formatted for UI display based on the provided groups and a search query.
 *
 * @param {ItemGroup[]} groups - An array of item groups, where each group contains a `selected` property indicating its inclusion in the query.
 * @param {string} search - A search term to filter items by name.
 * @return {Item[]} An array of items containing their `name`, `price`, and a default `quantity` value of 0, filtered based on the selected groups and search term.
 */
export function getItemsForUI(groups: ItemGroup[], search: string): Item[] {
    // Base query
    let query = `
        SELECT DISTINCT i.name, i.price
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

    return stmt.all(params).map((row: { name: string; price: number }) => ({
        name: row.name,
        price: row.price,
        quantity: 0,
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
