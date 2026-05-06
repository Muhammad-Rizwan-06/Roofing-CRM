/**
 * Safe localStorage parser that handles both old and new data formats
 * - New format: array stored directly [...]
 * - Old format: object with list property { list: [...] }
 * Always returns an array
 */
export const safeParse = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    // If it's already an array, return it
    if (Array.isArray(data)) return data;
    // If it's an object with a list property, return the list
    if (data?.list && Array.isArray(data.list)) return data.list;
    // Default to empty array
    return [];
  } catch {
    // Return empty array on parse error
    return [];
  }
};

/**
 * Safe localStorage parser that returns data as-is (for non-array data)
 * Handles parse errors gracefully
 */
export const safeParseAny = (key, defaultValue = null) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};
