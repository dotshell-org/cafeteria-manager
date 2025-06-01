import { db } from './config.js';

// Create settings table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

/**
 * Saves a setting to the database
 * @param key The setting key
 * @param value The setting value
 */
export function saveSetting(key: string, value: string): void {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);
    stmt.run(key, value);
}

/**
 * Retrieves a setting from the database
 * @param key The setting key
 * @param defaultValue The default value to return if the setting doesn't exist
 * @returns The setting value or the default value if not found
 */
export function getSetting(key: string, defaultValue: string = ''): string {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : defaultValue;
}

/**
 * Saves the user's language preference
 * @param language The language code (e.g., 'en', 'fr', 'es')
 */
export function saveLanguagePreference(language: string): void {
    saveSetting('language', language);
}

/**
 * Retrieves the user's language preference
 * @param defaultLanguage The default language to use if no preference is found
 * @returns The user's preferred language or the default language if not found
 */
export function getLanguagePreference(defaultLanguage: string = 'en'): string {
    return getSetting('language', defaultLanguage);
}
