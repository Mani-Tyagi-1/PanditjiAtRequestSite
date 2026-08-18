const PREFIX = "pjar_puja_checkout_draft:";

export function savePujaCheckoutDraft(key: string, draft: unknown) {
    try {
        sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(draft));
    } catch {
        // Checkout can continue with in-memory state when storage is blocked.
    }
}

export function loadPujaCheckoutDraft<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(`${PREFIX}${key}`);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
}

export function clearPujaCheckoutDraft(key: string) {
    try {
        sessionStorage.removeItem(`${PREFIX}${key}`);
    } catch {
        // Ignore unavailable session storage.
    }
}
