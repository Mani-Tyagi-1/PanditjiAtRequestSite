import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { encryptPayload, decryptData } from "../../../utils/encryption";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "200px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

const GOOGLE_LIBRARIES: ("places")[] = ["places"];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pooja: any;
}

type LatLng = {
  lat: number;
  lng: number;
};

interface OfflineLocationPickerProps {
  googleMapsApiKey: string;
  street: string;
  setStreet: (value: string) => void;
  houseNo: string;
  setHouseNo: (value: string) => void;
  landmark: string;
  setLandmark: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  stateVal: string;
  setStateVal: (value: string) => void;
  pincode: string;
  setPincode: (value: string) => void;
  saveAs: "home" | "work" | "other";
  setSaveAs: (value: "home" | "work" | "other") => void;
  isFetchingLocation: boolean;
  handleFetchLocation: () => void;
  mapCenter: LatLng;
  setMapCenter: (value: LatLng) => void;
  markerPosition: LatLng;
  setMarkerPosition: (value: LatLng) => void;
  fetchAddressFromCoords: (lat: number, lng: number) => Promise<void>;
  updateAddressFieldsFromGoogleAddress: (
    components: google.maps.GeocoderAddressComponent[]
  ) => void;
}

function OfflineLocationPicker({
  googleMapsApiKey,
  street,
  setStreet,
  houseNo,
  setHouseNo,
  landmark,
  setLandmark,
  city,
  setCity,
  stateVal,
  setStateVal,
  pincode,
  setPincode,
  saveAs,
  setSaveAs,
  isFetchingLocation,
  handleFetchLocation,
  mapCenter,
  setMapCenter,
  markerPosition,
  setMarkerPosition,
  fetchAddressFromCoords,
  updateAddressFieldsFromGoogleAddress,
}: OfflineLocationPickerProps) {
  const [autocompleteInfo, setAutocompleteInfo] =
    useState<google.maps.places.Autocomplete | null>(null);

  const loaderOptions = useMemo(
    () => ({
      id: "google-map-script",
      googleMapsApiKey,
      libraries: GOOGLE_LIBRARIES,
      language: "en",
      region: "IN",
    }),
    [googleMapsApiKey]
  );

  const { isLoaded: isMapScriptLoaded, loadError } =
    useJsApiLoader(loaderOptions);

  const onLoadAutocomplete = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      setAutocompleteInfo(autocomplete);
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    if (!autocompleteInfo) {
      console.log("Autocomplete is not loaded yet!");
      return;
    }

    const place = autocompleteInfo.getPlace();

    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
    }

    if (place.address_components) {
      updateAddressFieldsFromGoogleAddress(place.address_components);
    }
  }, [
    autocompleteInfo,
    setMapCenter,
    setMarkerPosition,
    updateAddressFieldsFromGoogleAddress,
  ]);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });
      await fetchAddressFromCoords(lat, lng);
    },
    [fetchAddressFromCoords, setMapCenter, setMarkerPosition]
  );

  const handleMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });
      await fetchAddressFromCoords(lat, lng);
    },
    [fetchAddressFromCoords, setMapCenter, setMarkerPosition]
  );

  return (
    <div className="pt-4 pb-2 space-y-4 border-t border-stone-100 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-stone-800 font-semibold text-[14px]">
          Address Details
        </h4>
        <button
          onClick={handleFetchLocation}
          disabled={isFetchingLocation}
          className="flex items-center gap-1.5 text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          {isFetchingLocation ? (
            <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
          {isFetchingLocation ? "Fetching..." : "Use Current Location"}
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

        {loadError ? (
          <input
            type="text"
            placeholder="Street / Area*"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
          />
        ) : isMapScriptLoaded ? (
          <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
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
            placeholder="Loading Maps..."
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
          />
        )}

        {isMapScriptLoaded && !loadError && (
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
                onDragEnd={handleMarkerDragEnd}
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
        <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
          Save Address As
        </p>
        <div className="flex gap-2">
          {(["home", "work", "other"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSaveAs(type)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${saveAs === type
                ? "bg-orange-50 border-orange-200 text-orange-600"
                : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BookingModal({
  isOpen,
  onClose,
  pooja,
}: BookingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [saveAs, setSaveAs] = useState<"home" | "work" | "other">("home");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAutoOpenedSummary, setHasAutoOpenedSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "error" | "info" | "success";
    onConfirm?: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    type: "info",
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "error" | "info" | "success" = "info",
    onConfirm?: () => void
  ) => {
    setAlertConfig({ show: true, title, message, type, onConfirm });
  };

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState("");

  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const fetchCoupons = async () => {
    if (!contactNumber) {
      triggerAlert("Number Required", "Please enter your contact number to check for available coupons.", "info");
      return;
    }

    setIsLoadingCoupons(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
      
      // 1. Check if user has bookings
      console.log("Checking bookings for:", contactNumber);
      const bookingRes = await fetch(`${apiUrl}/bookings/get-pending-poojabookings/${contactNumber}`);
      const bookingData = await bookingRes.json();
      console.log("Raw Booking Data:", bookingData);
      
      // Handle various booking response formats (direct array, or object with poojas/data field)
      const poojaList = Array.isArray(bookingData) 
        ? bookingData 
        : (bookingData.poojas || bookingData.data || bookingData.results || []);
      
      const hasPreviousBookings = poojaList.length > 0;
      console.log("Has Previous Bookings:", hasPreviousBookings, "Count:", poojaList.length);

      if (hasPreviousBookings) {
        setCoupons([]);
        setIsCouponsModalOpen(true);
      } else {
        // 2. Fetch coupons via backend proxy
        const promoRes = await fetch(`${apiUrl}/config/fetch-promo-proxy`);
        const promoData = await promoRes.json();
        
        // Handle various promo response formats
        const allPromos = Array.isArray(promoData) 
          ? promoData 
          : (promoData.promos || promoData.data || promoData.results || promoData.promotions || []);

        // Filter by PROMO_TYPE_ALLOWED = "Festival-Promo" (Case-insensitive check)
        const targetCategory = "festival-promo";
        const filtered = allPromos.filter((p: any) => {
          // Identify category using promoType (as seen in API) or other fallbacks
          const cat = (p.promoType || p.category || p.promo_category || "").toLowerCase();
          return cat === targetCategory;
        });

        setCoupons(filtered);
        setIsCouponsModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      triggerAlert("Error", "Failed to check coupons. Please try again.", "error");
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = (promo: any) => {
    setAppliedCoupon(promo);
    setCouponCode(promo.promoName || promo.code || promo.promoCode || "");
    setIsCouponsModalOpen(false);
    triggerAlert("Coupon Applied", `Successfully applied coupon: ${promo.promoName || promo.code || promo.promoCode}`, "success");
  };

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<LatLng>(defaultCenter);
  const [notServiceablePopup, setNotServiceablePopup] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

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

  const minDateStr = new Date(
    new Date().setDate(new Date().getDate() + 3)
  )
    .toISOString()
    .split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(minDateStr);
  const [selectedTime, setSelectedTime] = useState("");

  const updateAddressFieldsFromGoogleAddress = useCallback(
    (components: google.maps.GeocoderAddressComponent[]) => {
      let newStreet = "";
      let newCity = "";
      let newState = "";
      let newPincode = "";

      components.forEach((component) => {
        const types = component.types;

        if (
          types.includes("route") ||
          types.includes("sublocality") ||
          types.includes("sublocality_level_1") ||
          types.includes("neighborhood")
        ) {
          newStreet += (newStreet ? ", " : "") + component.long_name;
        }

        if (
          types.includes("locality") ||
          types.includes("administrative_area_level_2")
        ) {
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
    },
    []
  );

  const fetchAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      if (!(window as any).google?.maps) return;

      try {
        const geocoder = new google.maps.Geocoder();

        const response = await geocoder.geocode({
          location: { lat, lng },
        });

        if (response.results && response.results.length > 0) {
          const result = response.results[0];

          updateAddressFieldsFromGoogleAddress(result.address_components || []);

          // Optional: if street is still empty, use formatted address as fallback
          if (!street && result.formatted_address) {
            setStreet(result.formatted_address);
          }
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
      }
    },
    [street, updateAddressFieldsFromGoogleAddress]
  );

  const handleFetchLocation = useCallback(() => {
    setIsFetchingLocation(true);

    if (!navigator.geolocation) {
      setIsFetchingLocation(false);
      triggerAlert("Location Error", "Your browser doesn't support geolocation.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setMapCenter(pos);
        setMarkerPosition(pos);
        setIsFetchingLocation(false);
        await fetchAddressFromCoords(pos.lat, pos.lng);
      },
      () => {
        setIsFetchingLocation(false);
        triggerAlert("Location Error", "The Geolocation service failed. Please check your permissions.", "error");
      }
    );
  }, [fetchAddressFromCoords]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
        const res = await fetch(`${apiUrl}/config/maps`);

        if (!res.ok) {
          console.warn("Failed to fetch maps config");
          return;
        }

        const data = await res.json();

        if (data.apiKey && typeof data.apiKey === "string") {
          setGoogleMapsApiKey(data.apiKey);
        } else {
          console.warn("Maps API key missing in response.");
        }
      } catch (err) {
        console.error("Failed to fetch maps config", err);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user) return;
      setIsLoadingAddresses(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
        const userId = user?._id || user?.id;
        console.log("Fetching saved addresses for user:", userId);
        const res = await fetch(`${apiUrl}/addresses?userId=${userId}`);

        if (res.ok) {
          const data = await res.json();
          const decrypted = decryptData(data.encrypted);

          if (Array.isArray(decrypted)) {
            setSavedAddresses(decrypted);
          }
        } else {
          console.error("Failed to fetch saved addresses, status:", res.status);
        }
      } catch (err) {
        console.error("Failed to fetch saved addresses error:", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    if (isOpen && user) {
      fetchSavedAddresses();
    }
  }, [isOpen, user]);

  const handleBodyScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || hasAutoOpenedSummary) return;

    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

    if (nearBottom) {
      setIsSummaryOpen(true);
      setHasAutoOpenedSummary(true);
    }
  }, [hasAutoOpenedSummary]);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      setHasAutoOpenedSummary(false);
      setIsSummaryOpen(false);

      if (user) {
        if (user.name) setBhaktName(user.name);
        if (user.phone) setContactNumber(user.phone);
        if (user.email) setEmailId(user.email);
      }
    } else {
      closeTimerRef.current = window.setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      setIsProcessing(false);
    }

    return () => {
      document.body.style.overflow = "unset";
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, user]);

  const samagriCharge = pooja?.samagriPrice || 0;
  const panditDakshina = pooja?.panditDakshina || 0;
  const currentPoojaPrice = mode === "online" ? (pooja?.poojaPriceOnline || 0) : (pooja?.poojaPriceOffline || 0);

  const totalDiscount = samagriCharge + panditDakshina;
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage' || appliedCoupon.type === 'percentage') {
      const val = appliedCoupon.discountAmount || appliedCoupon.discountValue || appliedCoupon.value || 0;
      couponDiscount = (currentPoojaPrice * val) / 100;
    } else {
      couponDiscount = appliedCoupon.discountAmount || appliedCoupon.discountValue || appliedCoupon.value || 0;
    }
  }

  const discountedPrice = Math.max(0, currentPoojaPrice - couponDiscount);
  const originalPrice = currentPoojaPrice + totalDiscount;
  const discountPercent =
    originalPrice > 0 ? Math.round(((totalDiscount + couponDiscount) / (originalPrice)) * 100) : 0;

  const handleCheckout = async () => {
    if (!bhaktName || !contactNumber) {
      triggerAlert("Details Required", "Please provide at least your name and contact number to proceed.", "info");
      return;
    }

    if (!selectedDate) {
      triggerAlert("Date Required", "Please select a date for the pooja.", "info");
      return;
    }

    if (!selectedTime) {
      triggerAlert("Time Required", "Please specify a preferred time for the ritual.", "info");
      return;
    }

    if (
      mode === "offline" &&
      (!houseNo || !street || !city || !stateVal || !pincode)
    ) {
      triggerAlert("Address Required", "Please fill all required address fields for offline pooja.", "info");
      return;
    }

    setIsProcessing(true);

    const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";

    if (mode === "offline") {
      try {
        const checkPayload = selectedAddressId
          ? encryptPayload({ addressId: selectedAddressId })
          : encryptPayload({
            latitude: markerPosition.lat,
            longitude: markerPosition.lng
          });

        const checkRes = await fetch(`${apiUrl}/addresses/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?._id || user?.id || ""
          },
          body: JSON.stringify(checkPayload),
        });

        if (checkRes.ok) {
          const data = await checkRes.json();

          if (!data.isServiceable) {
            setNotServiceablePopup(true);
            setIsProcessing(false);
            return;
          }

          // --- Automatically Save Address if it's new ---
          if (!selectedAddressId && user) {
            try {
              const addressPayload = {
                userId: user?._id || user?.id,
                addressLine1: houseNo,
                addressLine2: landmark,
                street: street,
                city: city,
                state: stateVal,
                pincode: pincode,
                latitude: markerPosition.lat,
                longitude: markerPosition.lng,
                addressName: `${saveAs.charAt(0).toUpperCase() + saveAs.slice(1)} (${street.split(',')[0].trim()})`,
                country: "India",
                isPrimary: false
              };

              const encryptedAddress = encryptPayload(addressPayload);

              // We'll fire and forget or just log errors, don't block booking for this
              fetch(`${apiUrl}/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptedAddress),
              }).catch(err => console.error("Auto-save address failed:", err));
            } catch (err) {
              console.error("Failed to prepare address saving payload:", err);
            }
          }
        } else {
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

      const combinedDateTime = selectedTime
        ? `${selectedDate}T${selectedTime}`
        : selectedDate;

      const pendingPayload = {
        userId,
        poojaId: pooja?._id || pooja?.id,
        poojaMode: mode,
        bookingDate: combinedDateTime,
        amount: discountedPrice,
        panditDakshina: panditDakshina,
        bhaktName,
        gotra,
        contactNumber,
        emailId,
        address:
          mode === "offline"
            ? {
              houseFlatNo: houseNo,
              streetArea: street,
              landmark: landmark,
              city: city,
              state: stateVal,
              pincode: pincode,
              saveAs: saveAs,
              coordinates: {
                lat: markerPosition.lat,
                lng: markerPosition.lng,
              },
            }
            : undefined,
      };

      const encryptedPendingPayload = encryptPayload(pendingPayload);

      const pendingRes = await fetch(`${apiUrl}/bookings/create-pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedPendingPayload),
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
        description: pooja?.poojaNameEng || "Pooja Booking",
        order_id: pendingData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const completePayload = {
              pendingBookingId: pendingData.bookingId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              amountPaid: discountedPrice,
            };

            const encryptedCompletePayload = encryptPayload(completePayload);

            const compRes = await fetch(`${apiUrl}/bookings/complete-booking`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(encryptedCompletePayload),
            });

            if (!compRes.ok) {
              throw new Error("Payment verification failed on server");
            }

            setShowSuccessModal(true);
          } catch (err: any) {
            triggerAlert("Booking Error", err.message || "Failed to complete booking after payment.", "error");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: bhaktName,
          email: emailId,
          contact: contactNumber,
        },
        theme: {
          color: "#F97316",
        },
        modal: {
          ondismiss: function () {
            triggerAlert("Payment Cancelled", "Your booking session was cancelled. You can try again from the menu.", "info");
            setIsProcessing(false);
            onClose();
          },
        },
      };

      const RazorpayCtor = (window as any).Razorpay;

      if (!RazorpayCtor) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const rzp = new RazorpayCtor(options);

      rzp.on("payment.failed", function (response: any) {
        triggerAlert("Payment Failed", response?.error?.description || "Your payment could not be processed.", "error");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error: any) {
      triggerAlert("Unexpected Error", error.message || "An unexpected error occurred while processing your request.", "error");
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
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={onClose}
        />

        <div
          className={`relative w-full sm:max-w-md h-[95vh] sm:h-[85vh] bg-[#fdfdfd] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden ${isOpen ? "slide-up" : "slide-down"
            }`}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-stone-200 sticky top-0 z-10 shrink-0">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-stone-700 active:scale-95 transition-transform"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h2 className="text-stone-800 font-medium text-base truncate flex-1">
              {pooja?.poojaNameEng}
            </h2>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleBodyScroll}
            className="flex-1 overflow-y-auto pb-6"
          >
            <div className="px-4 py-4 space-y-7">
              <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setMode("online")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "online"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${mode === "online"
                      ? "bg-orange-500 animate-pulse"
                      : "bg-stone-300"
                      }`}
                  />
                  Online Mode
                </button>
                <button
                  onClick={() => setMode("offline")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "offline"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${mode === "offline" ? "bg-orange-500" : "bg-stone-300"
                      }`}
                  />
                  Offline Mode
                </button>
              </div>

              <div className="relative">
                <h3 className="text-stone-800 font-medium text-[15px] mb-3">
                  Fill Your Preferences
                </h3>

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
                    <div className="space-y-1">
                      {/* <div 
                        className="relative cursor-pointer"
                        onClick={() => {
                          setTempTime(selectedTime || "09:00");
                          setIsTimePickerOpen(true);
                        }}
                      >
                        <div className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 pr-11 text-sm text-stone-500 shadow-sm flex items-center justify-between min-h-[44px]">
                          <span>{selectedTime || "Select Time"}</span>
                        </div>
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
                      </div> */}
                      <input
                        type="time"
                        min={minDateStr}
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm appearance-none"
                      />
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-[-10px] w-[110px] sm:w-[130px] pointer-events-none">
                    <img
                      src="https://png.pngtree.com/png-vector/20250731/ourmid/pngtree-indian-pujari-priest-cartoon-illustration-vector-png-image_16949581.webp"
                      alt="Pandit Ji"
                      className="w-full h-auto object-contain drop-shadow-lg [clip-path:inset(0_0_0_0)] rounded-xl filter contrast-125"
                      style={{ mixBlendMode: "multiply" }}
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
                {mode === "online"
                  ? "Online puja — all items will be arranged virtually."
                  : "Offline puja — Pandit Ji will visit your provided address."}
              </span>
            </div>

            <div className="px-4 py-6 space-y-6">
              <div>
                <h3 className="text-stone-800 font-medium text-[15px] mb-3">
                  Fill Bhakt Details
                </h3>

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

                  {mode === "offline" && (
                    <div className="pt-4 space-y-4 border-t border-stone-100 mt-4">
                      {user && (
                        <div className="space-y-3">
                          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                            Saved Addresses
                          </p>
                          {isLoadingAddresses ? (
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                              {[1, 2].map((i) => (
                                <div key={i} className="flex-shrink-0 w-40 h-20 bg-stone-100 animate-pulse rounded-xl" />
                              ))}
                            </div>
                          ) : savedAddresses.length > 0 ? (
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
                              {savedAddresses.map((addr) => (
                                <button
                                  key={addr._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAddressId(addr._id);
                                    setHouseNo(addr.addressLine1 || addr.houseFlatNo || "");
                                    setStreet(addr.street || addr.streetArea || "");
                                    setLandmark(addr.landmark || "");
                                    setCity(addr.city || "");
                                    setStateVal(addr.state || "");
                                    setPincode(addr.pincode || "");
                                    const normalizedSaveAs = addr.addressName?.toLowerCase();
                                    setSaveAs(normalizedSaveAs === 'home' ? 'home' : normalizedSaveAs === 'work' ? 'work' : 'other');
                                    if (addr.latitude != null && addr.longitude != null) {
                                      const pos = { lat: Number(addr.latitude), lng: Number(addr.longitude) };
                                      setMarkerPosition(pos);
                                      setMapCenter(pos);
                                    }
                                  }}
                                  className={`flex-shrink-0 w-40 p-3 rounded-xl border text-left transition-all ${selectedAddressId === addr._id
                                    ? "bg-orange-50 border-orange-500 ring-1 ring-orange-500"
                                    : "bg-white border-stone-200 hover:border-stone-300"
                                    }`}
                                >
                                  <p className={`text-xs font-bold mb-1 ${selectedAddressId === addr._id ? "text-orange-600" : "text-stone-700"}`}>
                                    {addr.addressName || "Address"}
                                  </p>
                                  <p className="text-[10px] text-stone-500 line-clamp-2">
                                    {addr.addressLine1 || addr.houseFlatNo}, {addr.street || addr.streetArea}, {addr.city}
                                  </p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-400 italic">No saved addresses found. Use form below to add one.</p>
                          )}
                        </div>
                      )}

                      {googleMapsApiKey && (
                        <OfflineLocationPicker
                          googleMapsApiKey={googleMapsApiKey}
                          street={street}
                          setStreet={setStreet}
                          houseNo={houseNo}
                          setHouseNo={setHouseNo}
                          landmark={landmark}
                          setLandmark={setLandmark}
                          city={city}
                          setCity={setCity}
                          stateVal={stateVal}
                          setStateVal={setStateVal}
                          pincode={pincode}
                          setPincode={setPincode}
                          saveAs={saveAs}
                          setSaveAs={setSaveAs}
                          isFetchingLocation={isFetchingLocation}
                          handleFetchLocation={handleFetchLocation}
                          mapCenter={mapCenter}
                          setMapCenter={setMapCenter}
                          markerPosition={markerPosition}
                          setMarkerPosition={setMarkerPosition}
                          fetchAddressFromCoords={fetchAddressFromCoords}
                          updateAddressFieldsFromGoogleAddress={updateAddressFieldsFromGoogleAddress}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-2 w-full bg-[#f4f4f5] -mx-4 px-8" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-stone-800 font-medium text-[15px]">
                    Have a Coupon?
                  </h3>
                  <button 
                    onClick={fetchCoupons}
                    disabled={isLoadingCoupons}
                    className="text-[#E65100] text-xs font-bold hover:underline disabled:opacity-50"
                  >
                    {isLoadingCoupons ? "Checking..." : "View All Coupons"}
                  </button>
                </div>

                <div className="bg-[#FFF8F2] border border-[#FDE0C9] rounded-xl p-3 flex sm:flex-row flex-col gap-2.5">
                  <div className="flex-1 relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300 shadow-sm placeholder:text-stone-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                        if (couponCode) triggerAlert("Manual Entry", "Please use 'View All Coupons' to select verified active offers.", "info");
                    }}
                    className={`${couponCode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#C9C9C9]'} text-white text-sm font-semibold rounded-lg sm:px-8 py-2.5 sm:w-auto w-full transition-colors opacity-90`}
                  >
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
                <h3 className="text-stone-800 font-medium text-[15px]">
                  Order Summary
                </h3>
                <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
                {isSummaryOpen ? "Hide" : "View"} Details
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isSummaryOpen ? "rotate-180" : ""
                    }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${isSummaryOpen ? "max-h-56 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"
                }`}
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

                {appliedCoupon && (
                    <div className="flex justify-between text-orange-600 font-medium">
                        <span>Coupon ({appliedCoupon.code || appliedCoupon.promoCode || appliedCoupon.promoName})</span>
                        <span>-₹{Math.floor(couponDiscount)}</span>
                    </div>
                )}

                <div className="flex justify-between text-green-600 font-semibold bg-green-50 border border-green-100 rounded-lg px-2 py-1 mt-2">
                  <span>You Save</span>
                  <span>
                    ₹{Math.floor(totalDiscount + couponDiscount)} ({discountPercent}% OFF)
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
              className={`w-full ${isProcessing ? "bg-orange-400" : "bg-orange-500 hover:bg-orange-600"
                } active:scale-95 text-white rounded-xl py-3.5 px-5 flex items-center justify-between transition-colors shadow-md mb-4 font-bold tracking-wide`}
            >
              <span className="text-xl">₹{discountedPrice}</span>
              <span className="text-sm uppercase tracking-widest text-orange-50">
                {isProcessing ? "Processing..." : "Schedule Pandit"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {notServiceablePopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative slide-up">
            <button
              onClick={() => setNotServiceablePopup(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-stone-800 mb-2">
              Location Not Serviceable
            </h3>
            <p className="text-stone-500 text-sm mb-6">
              We are not currently serviceable at this pincode ({pincode}), but we
              will be available soon!
            </p>

            <button
              onClick={() => {
                setNotServiceablePopup(false);
                setMode("online");
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
            >
              Choose Online Mode
            </button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative slide-up border border-orange-100">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-stone-800 mb-3 tracking-tight">
              Booking Confirmed! 🙏
            </h3>

            <div className="space-y-4 mb-8">
              <p className="text-stone-600 leading-relaxed">
                Thank you for choosing <span className="text-orange-600 font-bold">PanditJiAtRequest</span>. Your booking for <span className="font-semibold text-stone-800">{pooja?.poojaNameEng}</span> has been received.
              </p>

              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <p className="text-sm text-orange-800 font-medium">
                  One of our verified Pandits will accept your request shortly. You'll receive a notification once assigned.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              Great, I'll Wait!
            </button>

            <p className="mt-4 text-[11px] text-stone-400 font-medium uppercase tracking-widest">
              May this puja bring you peace & prosperity
            </p>
          </div>
        </div>
      )}

      {alertConfig.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative slide-up border border-stone-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${alertConfig.type === 'error' ? 'bg-red-50 text-red-500' :
                alertConfig.type === 'success' ? 'bg-green-50 text-green-500' :
                  'bg-blue-50 text-blue-500'
              }`}>
              {alertConfig.type === 'error' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {alertConfig.type === 'success' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {alertConfig.type === 'info' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h3 className="text-xl font-bold text-stone-800 mb-2 font-display">
              {alertConfig.title}
            </h3>
            <p className="text-stone-500 text-sm mb-8 leading-relaxed">
              {alertConfig.message}
            </p>

            <button
              onClick={() => {
                setAlertConfig({ ...alertConfig, show: false });
                if (alertConfig.onConfirm) alertConfig.onConfirm();
              }}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-md active:scale-95 ${alertConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' :
                  alertConfig.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-100' :
                    'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                }`}
            >
              Understand
            </button>
          </div>
        </div>
      )}
      {isTimePickerOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-full shadow-2xl relative border border-stone-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-stone-800 font-semibold text-sm mb-4">
              Preferred Time
            </h3>
            
            <div className="relative mb-6">
              <input 
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-base font-medium text-stone-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setTempTime("");
                  setSelectedTime("");
                  setIsTimePickerOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTimePickerOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedTime(tempTime);
                    setIsTimePickerOpen(false);
                  }}
                  className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-100 transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isCouponsModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative slide-up border border-stone-100 flex flex-col max-h-[80vh]">
            <button
              onClick={() => setIsCouponsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-stone-800 mb-2 pr-10">
              Available Coupons
            </h3>
            <p className="text-stone-500 text-sm mb-6">
              Exclusive offers just for you
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {coupons.length > 0 ? (
                coupons.map((promo, idx) => (
                  <div 
                    key={idx}
                    className="bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-400 transition-colors"
                  >
                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-orange-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-white text-orange-600 border border-orange-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          {promo.promoName || promo.code || promo.promoCode}
                        </span>
                        <span className="text-stone-800 font-bold text-lg">
                          {(promo.discountType === 'percentage' || promo.type === 'percentage') 
                             ? `${promo.discountAmount || promo.discountValue || promo.value}% OFF` 
                             : `₹${promo.discountAmount || promo.discountValue || promo.value} OFF`}
                        </span>
                      </div>
                      
                      <p className="text-stone-600 text-xs font-medium leading-relaxed mb-4">
                        {promo.description || `Get ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : ''} discount on your first booking!`}
                      </p>

                      <button
                        onClick={() => handleApplyCoupon(promo)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-sm shadow-orange-100"
                      >
                        Apply Coupon
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-stone-500 font-bold mb-1">No coupons available</p>
                  <p className="text-stone-400 text-xs px-6">
                    This offer is only available for first-time users.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-6 text-[10px] text-stone-400 text-center uppercase tracking-widest font-semibold">
              Terms & Conditions Apply
            </p>
          </div>
        </div>
      )}
    </>
  );
}