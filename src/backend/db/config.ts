import { createRequire } from 'module';
import {Operator} from "../../types/accounting/filter/Operator.ts";
import {Orientation} from "../../types/accounting/sort/Orientation.ts";

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// Database configuration
export const DATABASE_PATH = "./default.account";
export const DB_OPTIONS = { };

// Create or open the database
export const db = new Database(DATABASE_PATH, DB_OPTIONS);

/**
 * Converts a given type to its corresponding SQL operator representation.
 *
 * @param {Operator | Orientation} type - The operator or orientation type to convert.
 * @return {string} The corresponding SQL operator or keyword as a string.
 * @throws {Error} If the given type is not supported.
 */
export function typeToOperator(type: Operator | Orientation): string {
    if (type === Operator.Is) {
        return "LIKE";
    } else if (type === Operator.IsExactly) {
        return "=";
    } else if (type === Operator.MoreThan) {
        return ">";
    } else if (type === Operator.LessThan) {
        return "<";
    } else if (type === Orientation.Asc) {
        return "ASC";
    } else if (type === Orientation.Desc) {
        return "DESC";
    } else {
        throw new Error(`Unsupported operator type: ${type}`);
    }
}
