/**
 * Checks whether a given date (string, Date, ISO, or relative label) is today or in the future.
 * Returns true if valid/ongoing, false if strictly in the past.
 * If fallbackIfMissing is true (default), missing/empty dates are considered evergreen (valid).
 * If fallbackIfMissing is false, missing/empty dates are considered invalid.
 */
export function isTodayOrFuture(dateVal?: string | Date | null, fallbackIfMissing = true): boolean {
    if (!dateVal) return fallbackIfMissing;
    const raw = String(dateVal).trim().toLowerCase();
    if (raw === "today" || raw === "tomorrow" || raw.startsWith("every") || raw === "daily") {
        return true;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallbackIfMissing;
    // Valid until the end of that day (23:59:59.999 local time)
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime() >= Date.now();
}

/**
 * Specifically checks if an array of available dates has at least one today or future date.
 */
export function hasUpcomingDate(dates?: unknown[]): boolean {
    if (!Array.isArray(dates) || dates.length === 0) return false;
    return dates.some((d) => isTodayOrFuture(d as string | Date, false));
}
