import { Truck, MapPin, Phone, Loader2, X, AlertCircle, ShoppingBag } from "lucide-react";

interface CodAddress {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
}

interface CodLineItem {
    title: string;
    image?: string;
    qty: number;
    price: number;
}

interface CodConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    total: number;
    itemCount: number;
    items: CodLineItem[];
    address: CodAddress;
    errorMsg?: string;
}

// A lightweight "pay when it arrives" review screen shown before a COD order is placed.
export default function CodConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
    total,
    itemCount,
    items,
    address,
    errorMsg,
}: CodConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] max-w-md mx-auto flex items-end sm:items-center justify-center md:max-w-none md:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !isSubmitting && onClose()} />

            <div className="relative w-full bg-[#FFFAF3] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-300 md:max-w-lg md:p-7 md:rounded-3xl">
                <button
                    type="button"
                    onClick={() => !isSubmitting && onClose()}
                    className="absolute right-4 top-4 p-1 rounded-full bg-stone-100 text-stone-500 active:scale-90 cursor-pointer md:right-5 md:top-5 md:p-1.5 md:hover:bg-stone-200 md:transition-colors"
                >
                    <X className="w-4.5 h-4.5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
                    <Truck className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-stone-850">Confirm Cash on Delivery</h3>
                <p className="text-[12.5px] text-stone-500 mt-1">
                    🚚 Pay in cash when your order arrives. Please review your details below.
                </p>

                {/* Products being ordered */}
                <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1.5">
                        Order Summary ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </p>
                    <div className="bg-white border border-orange-100 rounded-2xl p-2.5 shadow-xs space-y-2 max-h-44 overflow-y-auto md:max-h-56 md:p-3">
                        {items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                                <div className="w-11 h-11 bg-orange-50/30 rounded-xl border border-orange-100 overflow-hidden shrink-0">
                                    {it.image ? (
                                        <img src={it.image} alt={it.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="w-5 h-5" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-stone-850 leading-snug line-clamp-2">{it.title}</p>
                                    <p className="text-[10.5px] text-stone-400 mt-0.5">Qty: {it.qty} · ₹{it.price.toLocaleString("en-IN")}</p>
                                </div>
                                <span className="text-[12.5px] font-black text-orange-600 shrink-0">₹{(it.price * it.qty).toLocaleString("en-IN")}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery address */}
                <div className="mt-3 bg-white border border-orange-100 rounded-2xl p-3.5 shadow-xs space-y-2">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div className="text-[12.5px] text-stone-700 leading-snug">
                            <p className="font-bold text-stone-850">{address.name}</p>
                            <p>{address.addressLine}, {address.city}, {address.state} − {address.pincode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 pt-1 border-t border-orange-50">
                        <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-[12.5px] text-stone-600">+91 {address.phone}</span>
                    </div>
                </div>

                {/* Amount due */}
                <div className="mt-3 flex items-center justify-between bg-white border border-orange-100 rounded-2xl p-3.5 shadow-xs">
                    <span className="text-[13px] font-semibold text-stone-600">
                        Amount due on delivery ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span className="text-lg font-black text-orange-600">₹{total.toLocaleString("en-IN")}</span>
                </div>

                {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => !isSubmitting && onClose()}
                        disabled={isSubmitting}
                        className="flex-1 border-2 border-stone-200 text-stone-600 font-bold py-3 rounded-2xl active:scale-95 transition-all text-sm disabled:opacity-60 cursor-pointer md:hover:bg-stone-50 md:hover:border-stone-300"
                    >
                        Go Back
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-[1.4] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer md:hover:shadow-lg md:hover:brightness-105"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                        ) : (
                            <>Place COD Order</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
