import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShieldCheck, Plus, Trash2, Home, Briefcase, MapPin, Phone, User, HelpCircle } from "lucide-react";
import { type Chadhava, type ChadhavaSelection } from "./chadhavaData";
import API_URL from "../../../utils/apiConfig";
import { decryptData } from "../../../utils/encryption";
import { useAuth } from "../../../context/AuthContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chadhava: Chadhava | null;
    selections: ChadhavaSelection[];
    addPrasad: boolean;
    prasadPrice: number;
}

const INPUT_CONTAINER = "relative bg-white border border-stone-200 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all";
const INPUT_FIELD = "w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-none";

export default function ChadhavaBookingModal({ isOpen, onClose, chadhava, selections, addPrasad, prasadPrice }: Props) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // Form inputs
    const [form, setForm] = useState({ name: "", gotra: "", phone: "", wish: "" });
    const [dontKnowGotra, setDontKnowGotra] = useState(false);

    // Validation errors state
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Family Members
    const [familyMembers, setFamilyMembers] = useState<string[]>([]);
    const [familyInput, setFamilyInput] = useState("");
    const [showFamilyAdd, setShowFamilyAdd] = useState(false);

    // Address list & form
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        houseNo: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        saveAs: "Home"
    });

    // Reset fields on modal open
    useEffect(() => {
        if (isOpen) {
            setSubmitting(false);
            setError("");
            setDone(false);
            setForm({
                name: user?.name || user?.fullName || "",
                gotra: user?.gotra || "",
                phone: user?.phone || "",
                wish: ""
            });
            setDontKnowGotra(false);
            setValidationErrors({});
            setFamilyMembers([]);
            setFamilyInput("");
            setShowFamilyAdd(false);
            setSelectedAddressId(null);
            setShowNewAddressForm(false);
            setNewAddress({ houseNo: "", street: "", city: "", state: "", pincode: "", saveAs: "Home" });
        }
    }, [isOpen, user]);

    // Load saved addresses if Prasad is added (for logged-in user)
    useEffect(() => {
        if (user && addPrasad && isOpen) {
            fetch(`${API_URL}/addresses?userId=${user._id}`)
                .then((res) => res.json())
                .then((data) => {
                    const decrypted = data?.encrypted ? decryptData(data.encrypted) : data;
                    const list = Array.isArray(decrypted) ? decrypted : Array.isArray(data) ? data : [];
                    setAddresses(list);
                    if (list.length > 0) {
                        setSelectedAddressId(list[0]._id || list[0].id);
                        setShowNewAddressForm(false);
                    } else {
                        setShowNewAddressForm(true);
                    }
                })
                .catch((err) => console.error("Error fetching addresses:", err));
        }
    }, [user, addPrasad, isOpen]);

    // Load the Razorpay checkout script once.
    useEffect(() => {
        const SRC = "https://checkout.razorpay.com/v1/checkout.js";
        if (document.querySelector(`script[src="${SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Prevent body scrolling
    useEffect(() => {
        if (isOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    // Handle guest phone input (checking or registering guest when 10 digits are filled)
    const handlePhoneChange = async (val: string) => {
        setForm((f) => ({ ...f, phone: val }));
        
        // As soon as the user completes 10 digits (when not logged in)
        if (!user && val.length === 10) {
            try {
                const res = await fetch(`${API_URL}/find-or-register-guest`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: val, name: form.name, gotra: form.gotra })
                });
                const data = await res.json();
                
                if (data.success && data.user) {
                    // Prefill user details
                    setForm((f) => ({
                        ...f,
                        name: data.user.name || data.user.fullName || f.name,
                        gotra: data.user.gotra || f.gotra,
                    }));

                    // Fetch address info if Prasad is added
                    if (addPrasad) {
                        const addrRes = await fetch(`${API_URL}/addresses?userId=${data.user._id || data.user.id}`);
                        const addrData = await addrRes.json();
                        const decrypted = addrData?.encrypted ? decryptData(addrData.encrypted) : addrData;
                        const list = Array.isArray(decrypted) ? decrypted : Array.isArray(addrData) ? addrData : [];
                        setAddresses(list);
                        
                        if (list.length > 0) {
                            setSelectedAddressId(list[0]._id || list[0].id);
                            setShowNewAddressForm(false);
                        } else {
                            setShowNewAddressForm(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Error looking up/registering user by phone:", err);
            }
        }
    };

    if (!chadhava) return null;

    const itemsTotal = selections.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    
    // Count family members: explicitly added members + 1 if input field has text
    const activeFamilyCount = familyMembers.length + (familyInput.trim() ? 1 : 0);
    const familyCost = activeFamilyCount * 50;
    const total = itemsTotal + prasadPrice + familyCost;

    const addFamilyMember = () => {
        if (familyInput.trim()) {
            setFamilyMembers([...familyMembers, familyInput.trim()]);
            familyInput.trim();
            setFamilyInput("");
            setShowFamilyAdd(false);
        }
    };

    const removeFamilyMember = (index: number) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    };

    const handlePay = async () => {
        setError("");
        const errors: Record<string, string> = {};

        if (!form.name.trim()) {
            errors.name = "Devotee's name is required";
        }
        
        const phoneDigits = form.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
            errors.phone = "Valid 10-digit number is required";
        }
        
        if (!dontKnowGotra && !form.gotra.trim()) {
            errors.gotra = "Gotra is required";
        }

        let addressPayload: any = null;
        if (addPrasad) {
            if (!selectedAddressId && (!addresses || addresses.length === 0 || !showNewAddressForm)) {
                errors.address = "Please select or add a delivery address";
            } else if (showNewAddressForm) {
                if (!newAddress.houseNo.trim() || !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
                    errors.address = "Please fill out all address fields";
                } else {
                    addressPayload = {
                        addressLine1: newAddress.houseNo.trim(),
                        addressLine2: newAddress.street.trim(),
                        city: newAddress.city.trim(),
                        state: newAddress.state.trim(),
                        pincode: newAddress.pincode.trim(),
                        addressName: newAddress.saveAs.trim(),
                    };
                }
            } else {
                const selected = addresses.find(a => (a._id || a.id) === selectedAddressId);
                if (selected) {
                    addressPayload = {
                        addressLine1: selected.addressLine1 || selected.houseNo || "",
                        addressLine2: selected.addressLine2 || selected.street || "",
                        city: selected.city,
                        state: selected.state,
                        pincode: selected.pincode,
                        addressName: selected.addressName || selected.saveAs,
                    };
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError("Please fill out all required fields.");
            return;
        }
        setValidationErrors({});

        // Prepare final family members list (including inline input if present)
        const finalFamilyMembers = [...familyMembers];
        if (familyInput.trim()) {
            finalFamilyMembers.push(familyInput.trim());
        }

        setSubmitting(true);
        try {
            // First, ensure the guest user is saved/updated in Mongo before creating checkout order
            let targetUserId = user?._id || null;
            if (!user) {
                const userRes = await fetch(`${API_URL}/find-or-register-guest`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: phoneDigits, name: form.name.trim(), gotra: dontKnowGotra ? "Kashyap" : form.gotra.trim() })
                });
                const userData = await userRes.json();
                if (userData.success && userData.user) {
                    targetUserId = userData.user._id || userData.user.id;
                }
            }

            // Save new address if guest added it and Prasad is enabled
            if (addPrasad && showNewAddressForm && targetUserId && addressPayload) {
                try {
                    await fetch(`${API_URL}/addresses`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: targetUserId,
                            addressLine1: addressPayload.addressLine1,
                            addressLine2: addressPayload.addressLine2,
                            street: addressPayload.addressLine2,
                            city: addressPayload.city,
                            state: addressPayload.state,
                            pincode: addressPayload.pincode,
                            addressName: addressPayload.addressName,
                            country: "India",
                            latitude: 0,
                            longitude: 0
                        })
                    });
                } catch (addrErr) {
                    console.error("Failed to save guest address:", addrErr);
                }
            }

            const orderRes = await fetch(`${API_URL}/chadhava-bookings/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chadhavaSlug: chadhava.id,
                    items: selections.map((s) => ({ code: s.code, quantity: s.quantity })),
                    addPrasadBox: addPrasad,
                    devoteeName: form.name.trim(),
                    gotra: dontKnowGotra ? "Kashyap" : form.gotra.trim(),
                    phone: phoneDigits,
                    wish: form.wish.trim(),
                    familyMembers: finalFamilyMembers,
                    deliveryAddress: addressPayload
                }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || "Failed to start payment.");

            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) throw new Error("Payment SDK failed to load. Please refresh and try again.");

            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: Number(orderData.amount) * 100,
                currency: orderData.currency || "INR",
                name: "Pandit Ji At Request",
                description: `${chadhava.deity} Chadhava`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    contact: phoneDigits,
                    email: `user${phoneDigits}@panditjiatrequest.com`,
                },
                theme: { color: "#FF7000" },
                handler: async (response: any) => {
                    try {
                        const verifyRes = await fetch(`${API_URL}/chadhava-bookings/complete-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                bookingId: orderData.bookingId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        if ((window as any).fbq) {
                            (window as any).fbq("track", "Purchase", {
                                content_name: `Chadhava - ${chadhava.deity} - ${chadhava.templeName}`,
                                content_type: "chadhava",
                                value: total,
                                currency: "INR",
                            });
                        }
                        setDone(true);
                    } catch (verifyErr: any) {
                        setError(verifyErr.message || "Payment verification failed. Please contact support.");
                    } finally {
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setError("Payment was cancelled. You can try again.");
                        setSubmitting(false);
                    },
                },
            });

            rzp.on("payment.failed", (resp: any) => {
                setError(resp?.error?.description || "Payment failed. Please try again.");
                setSubmitting(false);
            });

            rzp.open();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FFFAF6] rounded-t-[32px] flex flex-col overflow-hidden"
                        style={{ maxHeight: "93vh" }}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#FFEFE2] bg-white">
                            <h2 className="text-[17px] font-bold text-stone-800 flex items-center gap-2">
                                <span> Complete your Seva</span>
                            </h2>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition-transform">
                                <X className="w-4 h-4 text-stone-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {done ? (
                                <div className="flex flex-col items-center text-center py-8">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200">
                                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-[24px] font-bold text-stone-800 mt-5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                        Chadhava Booked! 🙏
                                    </h3>
                                    <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                        Your seva will be offered to <span className="font-semibold text-stone-700">{chadhava.deity}</span>.
                                        We'll WhatsApp the proof on <span className="font-semibold text-stone-700">+91 {form.phone}</span>.
                                    </p>
                                    <button onClick={onClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Section 01: Your Selections */}
                                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-3.5">
                                            <div className="text-left">
                                                <h3 className="text-[15px] font-bold text-[#2E1F15] flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[11px] text-[#E05A10] font-bold">🌸</span>
                                                    Your Selections
                                                </h3>
                                                <p className="text-[11px] text-stone-400 mt-0.5">Review offerings included in this Seva</p>
                                            </div>
                                            <span className="text-[12.5px] font-extrabold text-[#E05A10]">01</span>
                                        </div>

                                        <div className="space-y-3">
                                            {selections.map((s) => (
                                                <div key={s.code} className="flex items-center justify-between py-2 border-b border-stone-50 text-[13.5px]">
                                                    <span className="text-stone-700 font-medium text-left">{s.name} (x{s.quantity})</span>
                                                    <span className="font-bold text-stone-800">₹{(s.unitPrice * s.quantity).toLocaleString("en-IN")}</span>
                                                </div>
                                            ))}
                                            {addPrasad && (
                                                <div className="flex items-center justify-between py-2 border-b border-stone-50 text-[13.5px]">
                                                    <span className="text-stone-700 font-medium text-left">Mandir Prasad Box</span>
                                                    <span className="font-bold text-stone-800">₹298</span>
                                                </div>
                                            )}
                                            {activeFamilyCount > 0 && (
                                                <div className="flex items-center justify-between py-2 border-b border-stone-50 text-[13.5px]">
                                                    <span className="text-stone-700 font-medium text-left">Family Members ({activeFamilyCount})</span>
                                                    <span className="font-bold text-stone-800">₹{familyCost}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-[#FFEFE2]">
                                            <span className="font-bold text-stone-800 text-[13px] uppercase tracking-wide">Total Amount</span>
                                            <span className="font-extrabold text-[#E05A10] text-[20px]">₹{total.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    {/* Section 02: Devotee Details */}
                                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-3.5">
                                            <div className="text-left">
                                                <h3 className="text-[15px] font-bold text-[#2E1F15] flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[11px] text-[#E05A10] font-bold">👤</span>
                                                    Devotee Details
                                                </h3>
                                                <p className="text-[11px] text-stone-400 mt-0.5">Details used for your personal Sankalp</p>
                                            </div>
                                            <span className="text-[12.5px] font-extrabold text-[#E05A10]">02</span>
                                        </div>

                                        <div className="space-y-3 text-left">
                                            {/* WhatsApp Phone */}
                                            <div>
                                                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">WhatsApp Number</label>
                                                <div className={`${INPUT_CONTAINER} ${validationErrors.phone ? "border-red-500 ring-2 ring-red-100" : ""}`}>
                                                    <Phone className="w-4 h-4 text-emerald-500" />
                                                    <input 
                                                        value={form.phone} 
                                                        onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                                                        placeholder="10-digit mobile number" 
                                                        inputMode="numeric" 
                                                        className={INPUT_FIELD} 
                                                    />
                                                </div>
                                                {validationErrors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{validationErrors.phone}</p>}
                                            </div>

                                            {/* Devotee Name */}
                                            <div>
                                                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Devotee Name</label>
                                                <div className={`${INPUT_CONTAINER} ${validationErrors.name ? "border-red-500 ring-2 ring-red-100" : ""}`}>
                                                    <User className="w-4 h-4 text-orange-500" />
                                                    <input 
                                                        value={form.name} 
                                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                                                        placeholder="Name for the sankalp" 
                                                        className={INPUT_FIELD} 
                                                    />
                                                </div>
                                                {validationErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{validationErrors.name}</p>}
                                            </div>

                                            {/* Gotra */}
                                            <div>
                                                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Gotra</label>
                                                <div className={`${INPUT_CONTAINER} ${dontKnowGotra ? "bg-stone-50 opacity-60" : ""} ${validationErrors.gotra ? "border-red-500 ring-2 ring-red-100" : ""}`}>
                                                    <HelpCircle className="w-4 h-4 text-purple-500" />
                                                    <input 
                                                        value={form.gotra} 
                                                        onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))} 
                                                        placeholder="e.g. Kashyap, Bhardwaj" 
                                                        disabled={dontKnowGotra}
                                                        className={INPUT_FIELD} 
                                                    />
                                                </div>
                                                {validationErrors.gotra && <p className="text-red-500 text-[11px] font-semibold mt-1">{validationErrors.gotra}</p>}
                                            </div>

                                            {/* Don't know Gotra checkbox */}
                                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={dontKnowGotra} 
                                                    onChange={(e) => setDontKnowGotra(e.target.checked)} 
                                                    className="w-4.5 h-4.5 rounded border-[#FFEFE2] text-orange-600 focus:ring-orange-500 cursor-pointer" 
                                                />
                                                <span className="text-[12px] text-stone-500 font-medium">I don't know my Gotra (Kashyap will be used)</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Section 03: Family Members */}
                                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-3.5">
                                            <div className="text-left">
                                                <h3 className="text-[15px] font-bold text-[#2E1F15] flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[11px] text-[#E05A10] font-bold">👥</span>
                                                    Family Members
                                                </h3>
                                                <p className="text-[11px] text-stone-400 mt-0.5">Include names in the Sankalp at ₹50 each</p>
                                            </div>
                                            <span className="text-[12.5px] font-extrabold text-[#E05A10]">03</span>
                                        </div>

                                        <div className="space-y-3 text-left">
                                            <div className="flex items-center justify-between text-[13px] font-bold text-stone-700">
                                                <span>{activeFamilyCount} members added</span>
                                                <button 
                                                    onClick={() => setShowFamilyAdd(!showFamilyAdd)}
                                                    className="text-[#E05A10] hover:text-[#C94D0C] text-[12px] font-bold flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Member
                                                </button>
                                            </div>

                                            {showFamilyAdd && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input 
                                                        value={familyInput} 
                                                        onChange={(e) => setFamilyInput(e.target.value)} 
                                                        placeholder="Enter family member name" 
                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                                                    />
                                                    <button 
                                                        onClick={addFamilyMember}
                                                        className="bg-[#E05A10] text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            )}

                                            {familyMembers.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {familyMembers.map((name, idx) => (
                                                        <span key={idx} className="bg-stone-50 border border-stone-200 text-stone-700 text-[11.5px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                                                            {name}
                                                            <button onClick={() => removeFamilyMember(idx)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 04: Delivery Address (Only shown if Prasad is added) */}
                                    {addPrasad && (
                                        <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-3.5">
                                                <div className="text-left">
                                                    <h3 className="text-[15px] font-bold text-[#2E1F15] flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[11px] text-[#E05A10] font-bold">📍</span>
                                                        Delivery Address
                                                    </h3>
                                                    <p className="text-[11px] text-stone-400 mt-0.5">
                                                        Choose where your sacred Prasad should arrive
                                                    </p>
                                                </div>
                                                <span className="text-[12.5px] font-extrabold text-[#E05A10]">04</span>
                                            </div>

                                            <div className="space-y-3.5 text-left">
                                                {/* Saved Address List */}
                                                {!showNewAddressForm && addresses.length > 0 && (
                                                    <div className="space-y-2.5">
                                                        {addresses.map((a) => {
                                                            const isSelected = (a._id || a.id) === selectedAddressId;
                                                            return (
                                                                <div 
                                                                    key={a._id || a.id} 
                                                                    onClick={() => setSelectedAddressId(a._id || a.id)}
                                                                    className={`rounded-2xl border p-4 flex gap-3 cursor-pointer transition-all ${
                                                                        isSelected ? "border-[#E05A10] bg-[#FFF8F2]" : "border-stone-200"
                                                                    }`}
                                                                >
                                                                    <span className="w-8 h-8 rounded-xl bg-orange-100/60 flex items-center justify-center shrink-0 mt-0.5">
                                                                        {a.saveAs?.toLowerCase() === "work" ? (
                                                                            <Briefcase className="w-4 h-4 text-[#E05A10]" />
                                                                        ) : (
                                                                            <Home className="w-4 h-4 text-[#E05A10]" />
                                                                        )}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="text-[13px] font-bold text-stone-800">{a.saveAs || a.addressName || "Address"}</h5>
                                                                        <p className="text-[11.5px] text-stone-500 leading-snug mt-0.5 truncate">
                                                                            {a.houseNo || a.addressLine1}, {a.street || a.addressLine2}, {a.city}, {a.state} - {a.pincode}
                                                                        </p>
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center justify-center">
                                                                        <input 
                                                                            type="radio" 
                                                                            checked={isSelected}
                                                                            onChange={() => setSelectedAddressId(a._id || a.id)}
                                                                            className="w-4.5 h-4.5 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Add New Address Trigger */}
                                                {!showNewAddressForm && (
                                                    <button 
                                                        onClick={() => setShowNewAddressForm(true)}
                                                        className="w-full text-center text-[#E05A10] hover:text-[#C94D0C] text-[12.5px] font-bold py-1 flex items-center justify-center gap-1 mt-1"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add New Address
                                                    </button>
                                                )}

                                                {/* New Address Form */}
                                                {showNewAddressForm && (
                                                    <div className="space-y-2.5 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h5 className="text-[12.5px] font-bold text-stone-800">New Delivery Address</h5>
                                                            {addresses.length > 0 && (
                                                                <button 
                                                                    onClick={() => setShowNewAddressForm(false)} 
                                                                    className="text-stone-400 hover:text-stone-600 text-xs font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input 
                                                            value={newAddress.houseNo} 
                                                            onChange={(e) => setNewAddress(na => ({ ...na, houseNo: e.target.value }))} 
                                                            placeholder="House/Flat No, Building Name" 
                                                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500" 
                                                        />
                                                        <input 
                                                            value={newAddress.street} 
                                                            onChange={(e) => setNewAddress(na => ({ ...na, street: e.target.value }))} 
                                                            placeholder="Street address, Colony" 
                                                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500" 
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input 
                                                                value={newAddress.city} 
                                                                onChange={(e) => setNewAddress(na => ({ ...na, city: e.target.value }))} 
                                                                placeholder="City" 
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500" 
                                                            />
                                                            <input 
                                                                value={newAddress.state} 
                                                                onChange={(e) => setNewAddress(na => ({ ...na, state: e.target.value }))} 
                                                                placeholder="State" 
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500" 
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input 
                                                                value={newAddress.pincode} 
                                                                onChange={(e) => setNewAddress(na => ({ ...na, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} 
                                                                placeholder="PIN Code" 
                                                                inputMode="numeric"
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500" 
                                                            />
                                                            <select 
                                                                value={newAddress.saveAs} 
                                                                onChange={(e) => setNewAddress(na => ({ ...na, saveAs: e.target.value }))} 
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500 text-stone-700"
                                                            >
                                                                <option value="Home">Home</option>
                                                                <option value="Work">Work</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {validationErrors.address && <p className="text-red-500 text-[11px] font-semibold mt-2">{validationErrors.address}</p>}
                                        </div>
                                    )}

                                    {/* Sankalp intentions */}
                                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm text-left">
                                        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">Your Wish / Prayer (optional)</label>
                                        <textarea 
                                            value={form.wish} 
                                            onChange={(e) => setForm((f) => ({ ...f, wish: e.target.value }))} 
                                            placeholder="Share the intention behind this offering…" 
                                            rows={2} 
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#E05A10] resize-none" 
                                        />
                                    </div>

                                    {/* Guarantee Info */}
                                    <div className="bg-white border border-[#FFEFE2] rounded-2xl p-4 flex items-start gap-2.5 text-left">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-[11.5px] text-stone-500 leading-snug">
                                            You'll receive a photo/video of your chadhava being offered. 100% secure payment & refund guarantee if the ritual is not performed.
                                        </p>
                                    </div>

                                    {error && <p className="text-red-500 text-[12.5px] font-semibold text-center mt-2">{error}</p>}
                                </>
                            )}
                        </div>

                        {/* Footer Bottom Bar */}
                        {!done && (
                            <div className="shrink-0 bg-white border-t border-[#FFEFE2] px-5 py-4 flex items-center justify-between">
                                <div className="leading-none text-left">
                                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">Total to Pay</span>
                                    <p className="text-[20px] font-extrabold text-[#E05A10] mt-0.5">₹{total.toLocaleString("en-IN")}</p>
                                </div>
                                <button
                                    onClick={handlePay}
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-orange-100 active:scale-95 transition-transform disabled:opacity-60 disabled:shadow-none"
                                >
                                    {submitting ? (
                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" /> Paying...</>
                                    ) : (
                                        <>Pay Now →</>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
