import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { encryptPayload } from "../../../utils/encryption";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '200px'
};
const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    pujaTitle: string;
    price: number;
    pujaId: string;
}

export default function BookingModal({ isOpen, onClose, pujaTitle, price, pujaId }: BookingModalProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'online' | 'offline'>('online');
    const [saveAs, setSaveAs] = useState<'home' | 'work' | 'other'>('home');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasAutoOpenedSummary, setHasAutoOpenedSummary] = useState(false);

    // Google Maps and Serviceability states
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [autocompleteInfo, setAutocompleteInfo] = useState<google.maps.places.Autocomplete | null>(null);
    const [notServiceablePopup, setNotServiceablePopup] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const { user, openLoginModal } = useAuth();

    const [bhaktName, setBhaktName] = useState("");
    const [gotra, setGotra] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [emailId, setEmailId] = useState("");

    const [houseNo, setHouseNo] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [city, setCity] = useState("");
    const [stateVal, setStateVal] = useState("");
    const [pincode, setPincode] = useState("");

    const minDateStr = new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(minDateStr);
    const [selectedTime, setSelectedTime] = useState("");

    const handleFetchLocation = () => {
        setIsFetchingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setMapCenter(pos);
                    setMarkerPosition(pos);
                    setIsFetchingLocation(false);
                    fetchAddressFromCoords(pos.lat, pos.lng);
                },
                () => {
                    setIsFetchingLocation(false);
                    alert("Error: The Geolocation service failed.");
                }
            );
        } else {
            setIsFetchingLocation(false);
            alert("Error: Your browser doesn't support geolocation.");
        }
    };

    const fetchAddressFromCoords = async (lat: number, lng: number) => {
        if (!googleMapsApiKey) return;
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                updateAddressFieldsFromGoogleAddress(result.address_components);
            }
        } catch (error) {
            console.error("Error reverse geocoding:", error);
        }
    };

    const updateAddressFieldsFromGoogleAddress = (components: google.maps.GeocoderAddressComponent[]) => {
        let newStreet = "";
        let newCity = "";
        let newState = "";
        let newPincode = "";

        components.forEach((component) => {
            const types = component.types;
            if (types.includes("route") || types.includes("sublocality") || types.includes("neighborhood")) {
                newStreet += (newStreet ? ", " : "") + component.long_name;
            }
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                if (!newCity) newCity = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
                newState = component.long_name;
            }
            if (types.includes("postal_code")) {
                newPincode = component.long_name;
            }
        });

        if (newStreet) setStreet(newStreet);
        if (newCity) setCity(newCity);
        if (newState) setStateVal(newState);
        if (newPincode) setPincode(newPincode);
    };

    const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
        setAutocompleteInfo(autocomplete);
    };

    const onPlaceChanged = () => {
        if (autocompleteInfo !== null) {
            const place = autocompleteInfo.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setMapCenter({ lat, lng });
                setMarkerPosition({ lat, lng });
            }
            if (place.address_components) {
                updateAddressFieldsFromGoogleAddress(place.address_components);
            }
        } else {
            console.log('Autocomplete is not loaded yet!');
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            fetchAddressFromCoords(lat, lng);
        }
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
                const res = await fetch(`${apiUrl}/config/maps`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.apiKey) {
                        setGoogleMapsApiKey(data.apiKey);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch maps config", err);
            }
        };
        fetchConfig();
    }, []);

    const { isLoaded: isMapScriptLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiKey,
        libraries: ['places']
    });

    const handleBodyScroll = () => {
        const el = scrollContainerRef.current;
        if (!el || hasAutoOpenedSummary) return;

        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

        if (nearBottom) {
            setIsSummaryOpen(true);
            setHasAutoOpenedSummary(true);
        }
    };

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
            setHasAutoOpenedSummary(false);
            setIsSummaryOpen(false);

            if (user) {
                if (user.name) setBhaktName(user.name);
                if (user.phone) setContactNumber(user.phone);
                if (user.email) setEmailId(user.email);
            }
        } else {
            setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = 'unset';
            setIsProcessing(false);
        }

        return () => {
            document.body.style.overflow = 'unset';
            clearTimeout(undefined);
        }
    }, [isOpen]);

    const samagriCharge = 350;
    const panditDakshina = 501;
    const totalDiscount = samagriCharge + panditDakshina;
    const discountedPrice = price;
    const originalPrice = price + totalDiscount;
    const discountPercent =
        originalPrice > 0 ? Math.round((totalDiscount / originalPrice) * 100) : 0;

    const handleCheckout = async () => {
        if (!bhaktName || !contactNumber) {
            alert("Please provide at least your name and contact number.");
            return;
        }

        if (mode === 'offline' && (!houseNo || !street || !city || !stateVal || !pincode)) {
            alert("Please fill all required address fields for offline pooja.");
            return;
        }

        setIsProcessing(true);

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

        if (mode === 'offline') {
            try {
                const checkPayload = encryptPayload({ pincode });
                const checkRes = await fetch(`${apiUrl}/addresses/check-pincode`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(checkPayload)
                });
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    if (!data.isServiceable) {
                        setNotServiceablePopup(true);
                        setIsProcessing(false);
                        return;
                    }
                } else {
                    // Assume something went wrong or offline check failed, proceed or show error
                    // To be safe we continue or show error
                    console.warn("Failed to verify pincode serviceability.");
                }
            } catch (err) {
                console.error("Error verifying pincode", err);
            }
        }

        try {
            const userId = user?._id || user?.id;

            if (!userId) {
                setIsProcessing(false);
                onClose();
                openLoginModal();
                return;
            }

            const pendingPayload = {
                userId,
                poojaId: pujaId,
                poojaMode: mode,
                bookingDate: selectedDate,
                amount: discountedPrice,
                panditDakshina: 501,
                bhaktName,
                gotra,
                contactNumber,
                emailId,
                address: mode === 'offline' ? {
                    houseFlatNo: houseNo,
                    streetArea: street,
                    landmark: landmark,
                    city: city,
                    state: stateVal,
                    pincode: pincode,
                    saveAs: saveAs
                } : undefined
            };

            const encryptedPendingPayload = encryptPayload(pendingPayload);
            const pendingRes = await fetch(`${apiUrl}/bookings/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptedPendingPayload)
            });

            if (!pendingRes.ok) {
                const errorData = await pendingRes.json();
                throw new Error(errorData.message || "Failed to initialize booking.");
            }

            const pendingData = await pendingRes.json();

            const options = {
                key: pendingData.razorpayKeyId,
                amount: discountedPrice * 100,
                currency: "INR",
                name: "PanditJiAtRequest",
                description: pujaTitle,
                order_id: pendingData.razorpayOrderId,
                handler: async function (response: any) {
                    try {
                        const completePayload = {
                            pendingBookingId: pendingData.bookingId,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            amountPaid: discountedPrice
                        };

                        const encryptedCompletePayload = encryptPayload(completePayload);
                        const compRes = await fetch(`${apiUrl}/bookings/complete-booking`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(encryptedCompletePayload)
                        });

                        if (!compRes.ok) {
                            throw new Error("Payment verification failed on server");
                        }

                        alert("Pooja booked successfully!");
                        onClose();
                    } catch (err: any) {
                        alert(err.message || "Failed to complete booking after payment.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: bhaktName,
                    email: emailId,
                    contact: contactNumber
                },
                theme: {
                    color: "#F97316"
                },
                modal: {
                    ondismiss: function () {
                        alert("Payment cancelled. Your booking is saved as pending in your account.");
                        setIsProcessing(false);
                        onClose();
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error: any) {
            alert(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    if (!isOpen && !mounted) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                .booking-modal { font-family: 'DM Sans', sans-serif; }
                .slide-up { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .slide-down { animation: modalSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes modalSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes modalSlideDown {
                    from { transform: translateY(0); }
                    to { transform: translateY(100%); }
                }
            `}</style>

            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center booking-modal">
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                />

                <div className={`relative w-full sm:max-w-md h-[95vh] sm:h-[85vh] bg-[#fdfdfd] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden ${isOpen ? 'slide-up' : 'slide-down'}`}>

                    <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-stone-200 sticky top-0 z-10 shrink-0">
                        <button onClick={onClose} className="p-1 -ml-1 text-stone-700 active:scale-95 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-stone-800 font-medium text-base truncate flex-1">{pujaTitle}</h2>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleBodyScroll}
                        className="flex-1 overflow-y-auto pb-6"
                    >
                        <div className="px-4 py-4 space-y-7">

                            <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setMode('online')}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'online'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${mode === 'online' ? 'bg-orange-500 animate-pulse' : 'bg-stone-300'}`} />
                                    Online Mode
                                </button>
                                <button
                                    onClick={() => setMode('offline')}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'offline'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${mode === 'offline' ? 'bg-orange-500' : 'bg-stone-300'}`} />
                                    Offline Mode
                                </button>
                            </div>

                            <div className="relative">
                                <h3 className="text-stone-800 font-medium text-[15px] mb-3">Fill Your Preferences</h3>

                                <div className="flex items-start">
                                    <div className="flex-1 space-y-3 pr-28 sm:pr-32">
                                        <div className="relative">
                                            <input
                                                type="date"
                                                min={minDateStr}
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm appearance-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 pr-11 text-sm text-stone-500 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                            />
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg
                                                    className="w-4 h-4 text-slate-400"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M12 6v6l4 2" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute right-0 bottom-[-10px] w-[110px] sm:w-[130px] pointer-events-none">
                                        <img
                                            src="https://png.pngtree.com/png-vector/20250731/ourmid/pngtree-indian-pujari-priest-cartoon-illustration-vector-png-image_16949581.webp"
                                            alt="Pandit Ji"
                                            className="w-full h-auto object-contain drop-shadow-lg [clip-path:inset(0_0_0_0)] rounded-xl filter contrast-125"
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FF6D00] text-white px-4 py-2.5 flex items-start gap-2.5 text-xs shadow-inner">
                            <div className="shrink-0 mt-0.5 border border-white/50 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                <span className="text-[8px] font-bold">i</span>
                            </div>
                            <span className="font-medium leading-relaxed">
                                {mode === 'online'
                                    ? "Online puja — all items will be arranged virtually."
                                    : "Offline puja — Pandit Ji will visit your provided address."}
                            </span>
                        </div>

                        <div className="px-4 py-6 space-y-6">
                            <div>
                                <h3 className="text-stone-800 font-medium text-[15px] mb-3">Fill Bhakt Details</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Fill your name"
                                        value={bhaktName}
                                        onChange={(e) => setBhaktName(e.target.value)}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Gotra"
                                        value={gotra}
                                        onChange={(e) => setGotra(e.target.value)}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-500 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Your Contact Number"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={emailId}
                                        onChange={(e) => setEmailId(e.target.value)}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />

                                    {mode === 'offline' && (
                                        <div className="pt-4 pb-2 space-y-4 border-t border-stone-100 mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-stone-800 font-semibold text-[14px]">Address Details</h4>
                                                <button
                                                    onClick={handleFetchLocation}
                                                    disabled={isFetchingLocation}
                                                    className="flex items-center gap-1.5 text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                                                >
                                                    {isFetchingLocation ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                    {isFetchingLocation ? 'Fetching...' : 'Use Current Location'}
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="House / Flat No.*"
                                                    value={houseNo}
                                                    onChange={(e) => setHouseNo(e.target.value)}
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />
                                                {isMapScriptLoaded ? (
                                                    <Autocomplete
                                                        onLoad={onLoadAutocomplete}
                                                        onPlaceChanged={onPlaceChanged}
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="Search Location or Street / Area*"
                                                            value={street}
                                                            onChange={(e) => setStreet(e.target.value)}
                                                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                        />
                                                    </Autocomplete>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Street / Area*"
                                                        value={street}
                                                        onChange={(e) => setStreet(e.target.value)}
                                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                    />
                                                )}

                                                {isMapScriptLoaded && (
                                                    <div className="rounded-xl overflow-hidden border border-stone-300 h-[200px]">
                                                        <GoogleMap
                                                            mapContainerStyle={mapContainerStyle}
                                                            center={mapCenter}
                                                            zoom={14}
                                                            onClick={handleMapClick}
                                                            options={{ disableDefaultUI: true, zoomControl: true }}
                                                        >
                                                            <Marker
                                                                position={markerPosition}
                                                                draggable={true}
                                                                onDragEnd={(e) => handleMapClick(e as google.maps.MapMouseEvent)}
                                                            />
                                                        </GoogleMap>
                                                    </div>
                                                )}

                                                <input
                                                    type="text"
                                                    placeholder="Landmark (Optional)"
                                                    value={landmark}
                                                    onChange={(e) => setLandmark(e.target.value)}
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />

                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="City*"
                                                        value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                        className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="State*"
                                                        value={stateVal}
                                                        onChange={(e) => setStateVal(e.target.value)}
                                                        className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                    />
                                                </div>

                                                <input
                                                    type="text"
                                                    placeholder="Pincode*"
                                                    value={pincode}
                                                    onChange={(e) => setPincode(e.target.value)}
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">Save Address As</p>
                                                <div className="flex gap-2">
                                                    {(['home', 'work', 'other'] as const).map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setSaveAs(type)}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${saveAs === type
                                                                ? 'bg-orange-50 border-orange-200 text-orange-600'
                                                                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                                                }`}
                                                        >
                                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-2 w-full bg-[#f4f4f5] -mx-4 px-8" />

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-stone-800 font-medium text-[15px]">Have a Coupon?</h3>
                                    <button className="text-[#E65100] text-xs font-bold hover:underline">View All Coupons</button>
                                </div>
                                <div className="bg-[#FFF8F2] border border-[#FDE0C9] rounded-xl p-3 flex sm:flex-row flex-col gap-2.5">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code"
                                            className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300 shadow-sm placeholder:text-stone-400"
                                        />
                                    </div>
                                    <button disabled className="bg-[#C9C9C9] text-white text-sm font-semibold rounded-lg sm:px-8 py-2.5 sm:w-auto w-full transition-colors opacity-90">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-[#fdfdfd] shrink-0 border-t border-stone-200 px-4 pt-3 pb-safe-bottom shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                            className="w-full flex items-center justify-between mb-2 pb-1 focus:outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <h3 className="text-stone-800 font-medium text-[15px]">Order Summary</h3>
                                <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {discountPercent}% OFF
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
                                {isSummaryOpen ? "Hide" : "View"} Details
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isSummaryOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${isSummaryOpen ? "max-h-56 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"}`}
                        >
                            <div className="space-y-1.5 px-1 text-sm">
                                <div className="flex justify-between text-stone-500">
                                    <span>Base Puja</span>
                                    <span>₹{discountedPrice}</span>
                                </div>

                                <div className="flex justify-between text-red-500">
                                    <span className="line-through">Samagri</span>
                                    <span className="line-through">₹{samagriCharge}</span>
                                </div>

                                <div className="flex justify-between text-red-500">
                                    <span className="line-through">Pandit Dakshina</span>
                                    <span className="line-through">₹{panditDakshina}</span>
                                </div>

                                <div className="flex justify-between text-green-600 font-semibold bg-green-50 border border-green-100 rounded-lg px-2 py-1 mt-2">
                                    <span>You Save</span>
                                    <span>
                                        ₹{totalDiscount} ({discountPercent}% OFF)
                                    </span>
                                </div>

                                <div className="flex justify-between font-bold text-stone-800 pt-1.5 border-t border-stone-100 mt-1">
                                    <span>Total Payable</span>
                                    <span className="text-orange-600">₹{discountedPrice}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className={`w-full ${isProcessing ? 'bg-orange-400' : 'bg-orange-500 hover:bg-orange-600'} active:scale-95 text-white rounded-xl py-3.5 px-5 flex items-center justify-between transition-colors shadow-md mb-4 font-bold tracking-wide`}
                        >
                            <span className="text-xl">₹{discountedPrice}</span>
                            <span className="text-sm uppercase tracking-widest text-orange-50">
                                {isProcessing ? 'Processing...' : 'Schedule Pandit'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Not Serviceable Popup */}
            {notServiceablePopup && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative slide-up">
                        <button
                            onClick={() => setNotServiceablePopup(false)}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold text-stone-800 mb-2">Location Not Serviceable</h3>
                        <p className="text-stone-500 text-sm mb-6">
                            We are not currently serviceable at this pincode ({pincode}), but we will be available soon!
                        </p>

                        <button
                            onClick={() => {
                                setNotServiceablePopup(false);
                                setMode('online');
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
                        >
                            Choose Online Mode
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}