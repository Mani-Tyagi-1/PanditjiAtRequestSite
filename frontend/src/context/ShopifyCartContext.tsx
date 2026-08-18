import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { type ShopifyProduct, type CartLine, productPrice } from "../components/booking/Shop/shopifyTypes";

const STORAGE_KEY = "pjar_shopify_cart";

interface ShopifyCartContextType {
    items: CartLine[];
    isOpen: boolean;
    count: number;
    subtotal: number;
    addItem: (product: ShopifyProduct, qty?: number) => void;
    removeItem: (productId: string) => void;
    updateQty: (productId: string, qty: number) => void;
    clear: () => void;
    openCart: () => void;
    closeCart: () => void;
}

const ShopifyCartContext = createContext<ShopifyCartContextType | undefined>(undefined);

export function ShopifyCartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartLine[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isOpen, setIsOpen] = useState(false);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (err) {
            console.error("Failed to save cart", err);
        }
    }, [items]);

    // The shop can be opened in a second same-origin tab from the puja
    // checkout. Keep the booking tab's React state in sync when that tab
    // changes the persisted cart.
    useEffect(() => {
        const syncFromStorage = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return;
            try {
                const next = event.newValue ? JSON.parse(event.newValue) : [];
                setItems(Array.isArray(next) ? next : []);
            } catch {
                setItems([]);
            }
        };

        const syncOnFocus = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                const next = saved ? JSON.parse(saved) : [];
                setItems(Array.isArray(next) ? next : []);
            } catch {
                // Keep the current in-memory cart if storage is unavailable.
            }
        };

        window.addEventListener("storage", syncFromStorage);
        window.addEventListener("focus", syncOnFocus);
        return () => {
            window.removeEventListener("storage", syncFromStorage);
            window.removeEventListener("focus", syncOnFocus);
        };
    }, []);

    const addItem = useCallback((product: ShopifyProduct, qty = 1) => {
        setItems((prev) => {
            const existing = prev.find((l) => l.product._id === product._id);
            if (existing) {
                return prev.map((l) =>
                    l.product._id === product._id ? { ...l, qty: l.qty + qty } : l
                );
            }
            return [...prev, { product, qty }];
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((l) => l.product._id !== productId));
    }, []);

    const updateQty = useCallback((productId: string, qty: number) => {
        setItems((prev) =>
            prev
                .map((l) => (l.product._id === productId ? { ...l, qty } : l))
                .filter((l) => l.qty > 0)
        );
    }, []);

    const clear = useCallback(() => setItems([]), []);
    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    const count = items.reduce((s, l) => s + l.qty, 0);
    const subtotal = items.reduce((s, l) => s + productPrice(l.product) * l.qty, 0);

    return (
        <ShopifyCartContext.Provider
            value={{ items, isOpen, count, subtotal, addItem, removeItem, updateQty, clear, openCart, closeCart }}
        >
            {children}
        </ShopifyCartContext.Provider>
    );
}

export function useShopifyCart() {
    const ctx = useContext(ShopifyCartContext);
    if (ctx === undefined) {
        throw new Error("useShopifyCart must be used within a ShopifyCartProvider");
    }
    return ctx;
}
