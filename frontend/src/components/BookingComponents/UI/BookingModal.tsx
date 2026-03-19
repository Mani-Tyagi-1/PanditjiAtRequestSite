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
  const [mode, setMode] = useState<"online" | "offline">(
    pooja?.poojaMode === "offline" ? "offline" : "online"
  );
  const [modeInfoType, setModeInfoType] = useState<"online" | "offline" | null>(null);
  const [saveAs, setSaveAs] = useState<"home" | "work" | "other">("home");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAutoOpenedSummary, setHasAutoOpenedSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasTrackedDetails, setHasTrackedDetails] = useState(false);

  const trackCustomerDetails = () => {
    if (bhaktName.trim().length >= 3 && contactNumber.trim().length >= 10 && !hasTrackedDetails) {
      if (window.fbq) {
        window.fbq("track", "CustomerDetailsFilled", {
          content_name: pooja?.poojaNameEng || "Pooja Booking",
          bhaktName: bhaktName,
          contactNumber: contactNumber,
        });
      }
      setHasTrackedDetails(true);
    }
  };

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
  const [couponUsage, setCouponUsage] = useState<any[]>([]);
  const [couponDiscountVal, setCouponDiscountVal] = useState(0);

  const fetchCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

      // Fetch available coupons
      const response = await fetch(`${apiUrl}/config/fetch-coupons-proxy`);
      const data = await response.json();

      const allCoupons = data.coupons || [];
      const activeCoupons = allCoupons.filter((c: any) => c.isActive);

      // If user is logged in, check their coupon usage
      if (user?._id || user?.id) {
        const userId = user?._id || user?.id;
        try {
          const usageRes = await fetch(`${apiUrl}/config/check-coupon-usage-proxy/${userId}`);
          const usageData = await usageRes.json();
          setCouponUsage(Array.isArray(usageData) ? usageData : (usageData.usages || usageData.usage || []));
        } catch (usageErr) {
          console.error("Error fetching coupon usage:", usageErr);
        }
      }

      setCoupons(activeCoupons);
      setIsCouponsModalOpen(true);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      triggerAlert("Error", "Failed to load coupons. Please try again.", "error");
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = (coupon: any) => {
    if (!user) {
      triggerAlert("Login Required", "Please login to apply coupons.", "info");
      return;
    }

    if (coupon.minOrderAmount && currentPoojaPrice < coupon.minOrderAmount) {
      triggerAlert("Minimum Amount Required", `This coupon requires a minimum booking amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`, "info");
      return;
    }

    // Calculate discount locally — coupon will be consumed via API only after successful payment
    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = (currentPoojaPrice * (coupon.discountValue || 0)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue || 0;
    }
    discount = Math.min(discount, currentPoojaPrice);

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code || "");
    setCouponDiscountVal(discount);
    setIsCouponsModalOpen(false);
    triggerAlert("Coupon Applied", `Coupon ${coupon.code} applied. You save ₹${discount}. Discount will be confirmed on payment.`, "success");
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
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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

      setIsProcessing(false);
      setAlertConfig({ show: false, title: "", message: "", type: "info" });
      setHasTrackedDetails(false);

      if (user) {
        try {
          const storedData = localStorage.getItem("user_data");
          const localUser = storedData ? JSON.parse(storedData) : null;

          const name = localUser?.name || user.name || "";
          const phone = localUser?.phone || user.phone || "";
          const email = localUser?.email || user.email || "";
          const gotraVal = localUser?.gotra || (user as any).gotra || "";

          if (name) setBhaktName(name);
          if (phone) setContactNumber(phone);
          if (email) setEmailId(email);
          if (gotraVal) setGotra(gotraVal);
        } catch {
          if (user.name) setBhaktName(user.name);
          if (user.phone) setContactNumber(user.phone);
          if (user.email) setEmailId(user.email);
        }
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
    // Use the server-validated discount if available, otherwise fallback to local calculation
    couponDiscount = couponDiscountVal > 0 ? couponDiscountVal : 0;

    if (couponDiscountVal === 0) {
      if (appliedCoupon.discountType === 'PERCENT') {
        couponDiscount = (currentPoojaPrice * (appliedCoupon.discountValue || 0)) / 100;
      } else {
        couponDiscount = appliedCoupon.discountValue || 0;
      }
    }
  }

  const discountedPrice = Math.max(0, currentPoojaPrice - couponDiscount);
  const originalPrice = currentPoojaPrice + totalDiscount;
  const discountPercent =
    originalPrice > 0 ? Math.round(((totalDiscount + couponDiscount) / (originalPrice)) * 100) : 0;

  const getCookie = (name: string): string => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : "";
  };

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

    // Track checkout initiation
    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_ids: [pooja?._id || pooja?.id],
        productname: [pooja?.poojaNameEng || "Pooja Booking"],
        content_name: pooja?.poojaNameEng || "Pooja Booking",
        content_type: "product",
        value: discountedPrice,
        currency: "INR",
      });
    }
    // Also dispatch custom event as requested
    window.dispatchEvent(new CustomEvent("InitiateCheckout", {
      detail: {
        poojaId: pooja?._id || pooja?.id,
        amount: discountedPrice,
        productname: pooja?.poojaNameEng || "Pooja Booking"
      }
    }));

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
              latitude: markerPosition.lat,
              longitude: markerPosition.lng,
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
              headers: {
                "Content-Type": "application/json",
                "x-event-source-url": window.location.href,
                "x-fbp": getCookie("_fbp"),
                "x-fbc": getCookie("_fbc"),
              },
              body: JSON.stringify(encryptedCompletePayload),
            });

            if (!compRes.ok) {
              throw new Error("Payment verification failed on server");
            }

            // Consume coupon only after successful payment
            if (appliedCoupon) {
              fetch(`${apiUrl}/config/apply-coupon-proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user?._id || (user as any)?.id,
                  phone: contactNumber || (user as any)?.phone || 0,
                  appKey: "par",
                  couponCode: appliedCoupon.code,
                  orderAmount: currentPoojaPrice,
                }),
              }).catch((err) => console.error("Coupon apply after payment failed:", err));
            }

            setShowSuccessModal(true);

            // Track successful purchase — eventID must match server CAPI event_id for deduplication
            if (window.fbq) {
              const capiEventId = `puja_purchase_${response.razorpay_order_id}`;
              window.fbq("track", "Purchase", {
                content_ids: [pooja?._id || pooja?.id],
                productname: [pooja?.poojaNameEng || "Pooja Booking"],
                content_name: pooja?.poojaNameEng || "Pooja Booking",
                content_type: "product",
                value: discountedPrice,
                currency: "INR",
              }, { eventID: capiEventId });
            }
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .booking-modal { font-family: 'DM Sans', sans-serif; background: #FFFAF3; }
        .booking-modal input, .booking-modal select { font-family: 'DM Sans', sans-serif; }
        .slide-up { animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-down { animation: modalSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes modalSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes modalSlideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        .bm-input {
          width: 100%; background: #fff; border: 1px solid #e7ddd1;
          border-radius: 14px; padding: 12px 16px; font-size: 14px;
          color: #292524; outline: none; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .bm-input:focus { border-color: #fb923c; box-shadow: 0 0 0 3px rgba(251,146,60,0.12); }
        .bm-input::placeholder { color: #a8a29e; }
        .bm-section-label {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .bm-section-label span {
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: #f97316;
        }
        .bm-section-label div {
          height: 1px; flex: 1;
          background: linear-gradient(to right, #fed7aa, transparent);
        }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center booking-modal">
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={onClose}
        />

        <div
          className={`relative w-full sm:max-w-md h-[95vh] sm:h-[85vh] bg-[#FFFAF3] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden ${isOpen ? "slide-up" : "slide-down"
            }`}
        >
          {/* ── Gradient Header ── */}
          <div className="relative px-4 pt-4 pb-4 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 shrink-0 shadow-sm">
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-orange-500 mb-0.5">Book Your Puja</p>
            <h2 className="text-orange-700 font-extrabold leading-tight truncate px-10"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px" }}>
              {pooja?.poojaNameEng}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-orange-400/50" />
              <span className="text-orange-500 text-xs">🕉</span>
              <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-orange-400/50" />
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleBodyScroll}
            className="flex-1 overflow-y-auto pb-6 bg-[#FFFAF3]"
          >
            <div className="px-4 py-4 ">
              {/* Mode info modal */}
              {modeInfoType && (
                <div className="fixed inset-0 z-[300] flex items-end justify-center" onClick={() => setModeInfoType(null)}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                  <div
                    className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden slide-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close */}
                    <button
                      onClick={() => setModeInfoType(null)}
                      className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Pandit image */}
                    <div className="flex justify-center pt-8 pb-2">
                      <img
                        src="https://png.pngtree.com/png-vector/20250731/ourmid/pngtree-indian-pujari-priest-cartoon-illustration-vector-png-image_16949581.webp"
                        alt="Pandit Ji"
                        className="w-28 h-28 object-contain drop-shadow-md"
                        style={{ mixBlendMode: "multiply" }}
                      />
                    </div>

                    {/* Title */}
                    <div className="text-center px-6 pb-4">
                      <h3 className="text-2xl font-bold text-stone-800 mb-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        About this Puja
                      </h3>
                      <p className="text-stone-500 text-sm">
                        What to expect with{" "}
                        <strong className="text-orange-600">
                          {modeInfoType === "online" ? "Online" : "Offline"}
                        </strong>{" "}
                        puja
                      </p>
                    </div>

                    {/* Points */}
                    <div className="px-6 pb-6 space-y-4">
                      {(modeInfoType === "online" ? [
                        { icon: "?", text: "The puja will be performed in online mode by our experienced Pandit Ji." },
                        { icon: "📷", text: "You will receive photos & short video clips after the puja is completed." },
                        { icon: "?", text: "The selected time will be respected as far as possible; minor adjustments may occur." },
                        { icon: "?", text: "For online pujas, items are arranged virtually. You will get a samagri list via message." },
                      ] : [
                        { icon: "🏠", text: "Pandit Ji will visit your provided address to perform the puja in person." },
                        { icon: "🪔", text: "Pandit Ji brings all samagri & materials required for the puja." },
                        { icon: "?", text: "The selected time will be respected as far as possible; minor adjustments may occur." },
                        { icon: "?", text: "Traditional Vedic rituals will be followed with post-puja blessings & guidance." },
                      ]).map((pt, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-orange-500 text-lg shrink-0 leading-snug w-6 text-center">
                            {pt.icon === "?" ? (
                              <svg className="w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : pt.icon === "📷" ? (
                              <svg className="w-5 h-5 mt-0.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : pt.icon}
                          </span>
                          <p className="text-stone-600 text-sm leading-relaxed">{pt.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="px-6 pb-8">
                      <button
                        onClick={() => setModeInfoType(null)}
                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-200"
                      >
                        Got it — Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {pooja?.poojaMode !== "online" && pooja?.poojaMode !== "offline" ? (
                <div className="flex bg-stone-100 p-1 rounded-xl w-full justify-center space-x-4">
                  <button
                    onClick={() => setMode("online")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "online"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${mode === "online" ? "bg-orange-500 animate-pulse" : "bg-stone-300"}`} />
                    Online Mode
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setModeInfoType("online"); }}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-stone-400 hover:text-orange-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </button>
                  <button
                    onClick={() => setMode("offline")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "offline"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${mode === "offline" ? "bg-orange-500" : "bg-stone-300"}`} />
                    Offline Mode
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setModeInfoType("offline"); }}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-stone-400 hover:text-orange-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl w-fit">
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-orange-600 shadow-sm">
                    <span className={`w-2 h-2 rounded-full bg-orange-500 ${pooja?.poojaMode === "online" ? "animate-pulse" : ""}`} />
                    {pooja?.poojaMode === "online" ? "Online Mode" : "Offline Mode"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setModeInfoType(pooja?.poojaMode === "online" ? "online" : "offline")}
                    className="mr-1 w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="relative">
                <div className="bm-section-label"><span>Your Preferences</span><div /></div>

                <div className="flex items-start">
                  <div className="flex-1 space-y-3 pr-28 sm:pr-32">
                    <input type="date" min={minDateStr} value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bm-input appearance-none" />
                    <input type="time" value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="bm-input appearance-none" />
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

            <div className={`mx-4 mb-1 rounded-2xl px-4 py-3 flex items-start gap-3 border ${mode === "online" ? "bg-orange-50 border-orange-200" : "bg-amber-50 border-amber-200"}`}>
              <div className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${mode === "online" ? "bg-orange-100" : "bg-amber-100"}`}>
                {mode === "online" ? (
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.07A2 2 0 0122 9.764V15a2 2 0 01-2.894 1.789L15 15M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </div>
              <p className={`text-xs leading-relaxed font-medium ${mode === "online" ? "text-orange-700" : "text-amber-800"}`}>
                {mode === "online"
                  ? "Online puja — Pandit Ji performs all rituals virtually. All samagri will be arranged on your behalf."
                  : "Offline puja — Pandit Ji will visit your provided address with all required samagri."}
              </p>
            </div>

            <div className="px-4 py-6 space-y-6">
              <div>
                <div className="bm-section-label"><span>Bhakt Details</span><div /></div>

                <div className="space-y-3">
                  <input type="text" placeholder="Your full name*" value={bhaktName}
                    onChange={(e) => setBhaktName(e.target.value)}
                    onBlur={trackCustomerDetails}
                    className="bm-input" />

                  <input type="text" placeholder="Gotra (optional)" value={gotra}
                    onChange={(e) => setGotra(e.target.value)} className="bm-input" />

                  <input type="tel" placeholder="Contact number*" value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    onBlur={trackCustomerDetails}
                    className="bm-input" />

                  <input type="email" placeholder="Email address*" value={emailId}
                    onChange={(e) => setEmailId(e.target.value)} className="bm-input" />

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

              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-200 to-transparent -mx-0" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="bm-section-label mb-0"><span>Have a Coupon?</span><div /></div>
                  <button
                    onClick={fetchCoupons}
                    disabled={isLoadingCoupons}
                    className="text-orange-600 text-xs font-bold hover:text-orange-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isLoadingCoupons ? "Checking..." : "View All Coupons"}
                    {!isLoadingCoupons && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex sm:flex-row flex-col gap-2.5">
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

          <div className="w-full bg-white/95 backdrop-blur-md shrink-0 border-t border-orange-100 px-4 pt-3 pb-4 shadow-[0_-12px_24px_-8px_rgba(249,115,22,0.12)]">
            <button
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              className="w-full flex items-center justify-between mb-2 pb-1 focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-stone-700 font-semibold text-[13px]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px" }}>
                  Order Summary
                </span>
                <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                {isSummaryOpen ? "Hide" : "View"}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isSummaryOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${isSummaryOpen ? "max-h-56 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"}`}>
              <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Base Puja</span>
                  <span className="font-medium text-stone-700">₹{discountedPrice}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span className="line-through">Samagri</span>
                  <span className="line-through">₹{samagriCharge}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span className="line-through">Panditji Dakshina</span>
                  <span className="line-through">₹{panditDakshina}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Coupon ({appliedCoupon.code || appliedCoupon.promoCode || appliedCoupon.promoName})</span>
                    <span>-₹{Math.floor(couponDiscount)}</span>
                  </div>
                )}
                <div className="h-px bg-orange-200 my-1" />
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>You Save</span>
                  <span>₹{Math.floor(totalDiscount + couponDiscount)} ({discountPercent}% OFF)</span>
                </div>
                <div className="flex justify-between font-bold text-stone-800 pt-1">
                  <span>Total Payable</span>
                  <span className="text-orange-600">₹{discountedPrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full active:scale-[0.98] text-white rounded-2xl py-3.5 px-5 flex items-center justify-between transition-all shadow-lg shadow-orange-200 mb-1 ${isProcessing ? "bg-orange-400" : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"}`}
            >
              <div>
                <p className="text-[10px] text-orange-100 font-medium uppercase tracking-widest leading-none mb-0.5">Total</p>
                <p className="text-xl font-bold leading-none">₹{discountedPrice}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wide text-orange-50">
                  {isProcessing ? "Processing..." : "Schedule Pandit Ji"}
                </span>
                {!isProcessing && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                )}
              </div>
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

            {pooja?.poojaMode !== "offline" && (
              <button
                onClick={() => {
                  setNotServiceablePopup(false);
                  setMode("online");
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
              >
                Choose Online Mode
              </button>
            )}
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
                  One of our verified Panditji will accept your request shortly. You'll receive a notification once assigned.
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
                coupons.map((coupon, idx) => {
                  const usage = couponUsage?.find(u => u.couponCode?.toUpperCase() === coupon.code?.toUpperCase());
                  const isUsed = (coupon.usageType === 'MONTHLY_LIMITED' && (usage?.monthlyUsed || 0) > 0) ||
                    (['ONCE', 'ONE_TIME'].includes(coupon.usageType) && (usage?.totalUsed || 0) > 0);

                  return (
                    <div
                      key={idx}
                      className={`relative overflow-hidden group transition-colors rounded-2xl p-5 border-2 border-dashed ${isUsed
                          ? "bg-stone-100 border-stone-200 opacity-60 grayscale"
                          : "bg-orange-50/50 border-orange-200 hover:border-orange-400"
                        }`}
                    >
                      {!isUsed && <div className="absolute -right-2 -top-2 w-12 h-12 bg-orange-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />}

                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${isUsed
                              ? "bg-stone-200 text-stone-500 border-stone-300"
                              : "bg-white text-orange-600 border-orange-200"
                            }`}>
                            {coupon.code}
                          </span>
                          <span className={`${isUsed ? "text-stone-500" : "text-stone-800"} font-bold text-lg`}>
                            {coupon.discountType === 'PERCENT'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </span>
                        </div>

                        <div className="space-y-1 mb-4">
                          <p className={`${isUsed ? "text-stone-400" : "text-stone-600"} text-xs font-medium leading-relaxed`}>
                            {isUsed
                              ? "You have already used this coupon for this period."
                              : `Get ${coupon.discountValue}${coupon.discountType === 'PERCENT' ? '%' : ''} discount on your ritual booking!`}
                          </p>
                          {coupon.minOrderAmount > 0 && !isUsed && (
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                              Min. Order: ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => !isUsed && handleApplyCoupon(coupon)}
                          disabled={isUsed}
                          className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-sm ${isUsed
                              ? "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
                              : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100"
                            }`}
                        >
                          {isUsed ? "Coupon Used" : "Apply Coupon"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-stone-500 font-bold mb-1">No coupons available</p>
                  <p className="text-stone-400 text-xs px-6">
                    Check back later for exclusive spiritual offers and special discounts.
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