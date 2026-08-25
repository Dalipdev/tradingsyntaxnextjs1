// utils/session.js or lib/session.js

/**
 * Session storage utilities optimized for Next.js
 * Handles SSR/CSR gracefully with improved error handling
 */

// Cache to reduce sessionStorage access
const sessionCache = new Map();

/**
 * Store data in sessionStorage with caching
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be stringified if object)
 * @returns {boolean} Success status
 */
export const storeInSession = (key, value) => {
    if (typeof window === 'undefined') return false;
    
    try {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        sessionStorage.setItem(key, stringValue);
        sessionCache.set(key, stringValue); // Update cache
        return true;
    } catch (error) {
        console.error(`Error storing "${key}" in session:`, error);
        return false;
    }
}

/**
 * Retrieve data from sessionStorage with caching
 * @param {string} key - Storage key
 * @param {boolean} parseJson - Auto-parse JSON (default: true)
 * @returns {any} Retrieved value or null
 */
export const lookInSession = (key, parseJson = true) => {
    if (typeof window === 'undefined') return null;
    
    try {
        // Check cache first for better performance
        if (sessionCache.has(key)) {
            const cached = sessionCache.get(key);
            return parseJson ? tryParseJSON(cached) : cached;
        }
        
        const value = sessionStorage.getItem(key);
        if (value !== null) {
            sessionCache.set(key, value); // Cache for next access
            return parseJson ? tryParseJSON(value) : value;
        }
        return null;
    } catch (error) {
        console.error(`Error reading "${key}" from session:`, error);
        return null;
    }
}

/**
 * Remove item from sessionStorage and cache
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeFromSession = (key) => {
    if (typeof window === 'undefined') return false;
    
    try {
        sessionStorage.removeItem(key);
        sessionCache.delete(key); // Clear from cache
        return true;
    } catch (error) {
        console.error(`Error removing "${key}" from session:`, error);
        return false;
    }
}

/**
 * Clear all session data and cache
 * Use for logout or complete reset
 */
export const logOutUser = () => {
    if (typeof window === 'undefined') return;
    
    try {
        sessionStorage.clear();
        sessionCache.clear(); // Clear cache
        
        // Optional: Redirect to login or home page
        // window.location.href = '/login';
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}

/**
 * Helper to safely parse JSON
 * @private
 */
const tryParseJSON = (value) => {
    if (!value) return value;
    try {
        return JSON.parse(value);
    } catch {
        return value; // Return as-is if not JSON
    }
}

/**
 * Batch operations for better performance
 */
export const batchStoreInSession = (items = {}) => {
    if (typeof window === 'undefined') return false;
    
    try {
        Object.entries(items).forEach(([key, value]) => {
            storeInSession(key, value);
        });
        return true;
    } catch (error) {
        console.error('Error in batch store:', error);
        return false;
    }
}

/**
 * Check if sessionStorage is available
 * Useful for feature detection
 */
export const isSessionStorageAvailable = () => {
    if (typeof window === 'undefined') return false;
    
    try {
        const test = '__storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

// Clear cache on page unload (optional)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        sessionCache.clear();
    });
}