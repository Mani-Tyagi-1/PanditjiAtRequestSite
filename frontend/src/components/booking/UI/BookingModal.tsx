import { useState, useEffect, useRef, useCallback, } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { encryptPayload, decryptData } from "../../../utils/encryption";
import API_URL from "../../../utils/apiConfig";
import { useAbandonedCart } from "../../../utils/useAbandonedCart";
import { money } from "../../../utils/currency";

import { attributionPayload } from "../../../utils/attribution";
// The contact number must stay a number: strip anything non-numeric and keep
// the last 10 digits, so a pasted "+91 98765 43210" lands as "9876543210"
// instead of failing validation at checkout.
const onlyDigits10 = (value: string) => value.replace(/\D/g, "").slice(-10);
// import {
//   GoogleMap,
//   useJsApiLoader,
//   Marker,
//   Autocomplete,
// } from "@react-google-maps/api";

// const mapContainerStyle = {
//   width: "100%",
//   height: "200px",
// };

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

// const GOOGLE_LIBRARIES: ("places")[] = ["places"];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pooja: any;
}

type LatLng = {
  lat: number;
  lng: number;
};

type DeceasedPerson = {
  name: string;
  gotra: string;
  relation: string;
};

const RITUAL_PLACES = [
  { id: "kashi", label: "Kashi", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/kashi.png" },
  { id: "haridwar", label: "Haridwar", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/haridwar.png" },
  { id: "prayagraj", label: "Prayagraj", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/prayagraj.png" },
];

// interface OfflineLocationPickerProps {
//   googleMapsApiKey: string;
//   street: string;
//   setStreet: (value: string) => void;
//   houseNo: string;
//   setHouseNo: (value: string) => void;
//   landmark: string;
//   setLandmark: (value: string) => void;
//   city: string;
//   setCity: (value: string) => void;
//   stateVal: string;
//   setStateVal: (value: string) => void;
//   pincode: string;
//   setPincode: (value: string) => void;
//   saveAs: "home" | "work" | "other";
//   setSaveAs: (value: "home" | "work" | "other") => void;
//   isFetchingLocation: boolean;
//   handleFetchLocation: () => void;
//   mapCenter: LatLng;
//   setMapCenter: (value: LatLng) => void;
//   markerPosition: LatLng;
//   setMarkerPosition: (value: LatLng) => void;
//   fetchAddressFromCoords: (lat: number, lng: number) => Promise<void>;
//   updateAddressFieldsFromGoogleAddress: (
//     components: google.maps.GeocoderAddressComponent[]
//   ) => void;
// }

// function OfflineLocationPicker({
//   googleMapsApiKey,
//   street,
//   setStreet,
//   houseNo,
//   setHouseNo,
//   landmark,
//   setLandmark,
//   city,
//   setCity,
//   stateVal,
//   setStateVal,
//   pincode,
//   setPincode,
//   saveAs,
//   setSaveAs,
//   isFetchingLocation,
//   handleFetchLocation,
//   mapCenter,
//   setMapCenter,
//   markerPosition,
//   setMarkerPosition,
//   fetchAddressFromCoords,
//   updateAddressFieldsFromGoogleAddress,
// }: OfflineLocationPickerProps) {
//   const [autocompleteInfo, setAutocompleteInfo] =
//     useState<google.maps.places.Autocomplete | null>(null);

//   const loaderOptions = useMemo(
//     () => ({
//       id: "google-map-script",
//       googleMapsApiKey,
//       libraries: GOOGLE_LIBRARIES,
//       language: "en",
//       region: "IN",
//     }),
//     [googleMapsApiKey]
//   );

//   const { isLoaded: isMapScriptLoaded, loadError } =
//     useJsApiLoader(loaderOptions);

//   const onLoadAutocomplete = useCallback(
//     (autocomplete: google.maps.places.Autocomplete) => {
//       setAutocompleteInfo(autocomplete);
//     },
//     []
//   );

//   const onPlaceChanged = useCallback(() => {
//     if (!autocompleteInfo) {
//       console.log("Autocomplete is not loaded yet!");
//       return;
//     }

//     const place = autocompleteInfo.getPlace();

//     if (place.geometry?.location) {
//       const lat = place.geometry.location.lat();
//       const lng = place.geometry.location.lng();

//       setMapCenter({ lat, lng });
//       setMarkerPosition({ lat, lng });
//     }

//     if (place.address_components) {
//       updateAddressFieldsFromGoogleAddress(place.address_components);
//     }
//   }, [
//     autocompleteInfo,
//     setMapCenter,
//     setMarkerPosition,
//     updateAddressFieldsFromGoogleAddress,
//   ]);

//   const handleMapClick = useCallback(
//     async (e: google.maps.MapMouseEvent) => {
//       if (!e.latLng) return;

//       const lat = e.latLng.lat();
//       const lng = e.latLng.lng();

//       setMarkerPosition({ lat, lng });
//       setMapCenter({ lat, lng });
//       await fetchAddressFromCoords(lat, lng);
//     },
//     [fetchAddressFromCoords, setMapCenter, setMarkerPosition]
//   );

//   const handleMarkerDragEnd = useCallback(
//     async (e: google.maps.MapMouseEvent) => {
//       if (!e.latLng) return;

//       const lat = e.latLng.lat();
//       const lng = e.latLng.lng();

//       setMarkerPosition({ lat, lng });
//       setMapCenter({ lat, lng });
//       await fetchAddressFromCoords(lat, lng);
//     },
//     [fetchAddressFromCoords, setMapCenter, setMarkerPosition]
//   );

//   return (
//     <div className="pt-4 pb-2 space-y-4 border-t border-stone-100 mt-4">
//       <div className="flex items-center justify-between mb-2">
//         <h4 className="text-stone-800 font-semibold text-[14px]">
//           Address Details
//         </h4>
//         <button
//           onClick={handleFetchLocation}
//           disabled={isFetchingLocation}
//           className="flex items-center gap-1.5 text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
//         >
//           {isFetchingLocation ? (
//             <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
//           ) : (
//             <svg
//               className="w-3.5 h-3.5"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2.5}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//               />
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//               />
//             </svg>
//           )}
//           {isFetchingLocation ? "Fetching..." : "Use Current Location"}
//         </button>
//       </div>

//       <div className="space-y-3">
//         <input
//           type="text"
//           placeholder="House / Flat No.*"
//           value={houseNo}
//           onChange={(e) => setHouseNo(e.target.value)}
//           className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//         />

//         {loadError ? (
//           <input
//             type="text"
//             placeholder="Street / Area*"
//             value={street}
//             onChange={(e) => setStreet(e.target.value)}
//             className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//           />
//         ) : isMapScriptLoaded ? (
//           <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
//             <input
//               type="text"
//               placeholder="Search Location or Street / Area*"
//               value={street}
//               onChange={(e) => setStreet(e.target.value)}
//               className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//             />
//           </Autocomplete>
//         ) : (
//           <input
//             type="text"
//             placeholder="Loading Maps..."
//             value={street}
//             onChange={(e) => setStreet(e.target.value)}
//             className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//           />
//         )}

//         {isMapScriptLoaded && !loadError && (
//           <div className="rounded-xl overflow-hidden border border-stone-300 h-[200px]">
//             <GoogleMap
//               mapContainerStyle={mapContainerStyle}
//               center={mapCenter}
//               zoom={14}
//               onClick={handleMapClick}
//               options={{ disableDefaultUI: true, zoomControl: true }}
//             >
//               <Marker
//                 position={markerPosition}
//                 draggable={true}
//                 onDragEnd={handleMarkerDragEnd}
//               />
//             </GoogleMap>
//           </div>
//         )}

//         <input
//           type="text"
//           placeholder="Landmark (Optional)"
//           value={landmark}
//           onChange={(e) => setLandmark(e.target.value)}
//           className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//         />

//         <div className="flex gap-3">
//           <input
//             type="text"
//             placeholder="City*"
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//           />
//           <input
//             type="text"
//             placeholder="State*"
//             value={stateVal}
//             onChange={(e) => setStateVal(e.target.value)}
//             className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//           />
//         </div>

//         <input
//           type="text"
//           placeholder="Pincode*"
//           value={pincode}
//           onChange={(e) => setPincode(e.target.value)}
//           className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
//         />
//       </div>

//       <div className="pt-2">
//         <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
//           Save Address As
//         </p>
//         <div className="flex gap-2">
//           {(["home", "work", "other"] as const).map((type) => (
//             <button
//               key={type}
//               type="button"
//               onClick={() => setSaveAs(type)}
//               className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${saveAs === type
//                 ? "bg-orange-50 border-orange-200 text-orange-600"
//                 : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
//                 }`}
//             >
//               {type.charAt(0).toUpperCase() + type.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

export default function BookingModal({
  isOpen,
  onClose,
  pooja,
}: BookingModalProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">(
    pooja?.poojaMode === "offline" ? "offline" : "online"
  );

  /**
   * A puja catalogued as "both" can be performed either way, so the devotee
   * chooses. Anything else is fixed by the catalog.
   *
   * The useState initialiser above only runs once, on the first render — and
   * this modal is mounted before `pooja` has necessarily loaded. Without this
   * effect an offline-only puja could stay stuck on "online" forever.
   */
  const canChooseMode = pooja?.poojaMode === "both";
  useEffect(() => {
    if (!pooja?.poojaMode) return;
    if (pooja.poojaMode === "both") return; // the devotee's choice stands
    setMode(pooja.poojaMode === "offline" ? "offline" : "online");
  }, [pooja?.poojaMode]);

  const chooseMode = (next: "online" | "offline") => {
    setMode(next);
    // An address picked for an at-home booking is meaningless online, and
    // leaving it selected would send a stale addressId to the server.
    if (next === "online") setSelectedAddressId(null);
  };
  // const [modeInfoType, setModeInfoType] = useState<"online" | "offline" | null>(null);
  const [saveAs, _setSaveAs] = useState<"home" | "work" | "other">("home");
  // const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  // const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAutoOpenedSummary, setHasAutoOpenedSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // `trackCustomerDetails` fired a CustomerDetailsFilled pixel off the name and
  // phone fields. Removed with the rest of this flow's Meta reporting — it also
  // put the devotee's name and number into a pixel payload, which is the one
  // thing here worth not restoring. The onBlur handlers it was wired to are
  // gone too.

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
  const [_isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [_couponCode, setCouponCode] = useState("");
  const [couponUsage, setCouponUsage] = useState<any[]>([]);
  const [couponDiscountVal, setCouponDiscountVal] = useState(0);

  // User fetched by phone number (read-only, no auth context change)
  const [phoneUserData, setPhoneUserData] = useState<any>(null);
  const [_isFirstBooking, setIsFirstBooking] = useState(false);

  const fetchCoupons = async (openModal = true) => {
    setIsLoadingCoupons(true);
    try {
      const apiUrl = API_URL;

      const response = await fetch(`${apiUrl}/config/fetch-coupons-proxy`);
      const data = await response.json();

      const allCoupons = data.coupons || [];
      const activeCoupons = allCoupons.filter((c: any) => c.isActive);

      // Fetch usage for logged-in user OR phone-fetched user
      const effectiveUserId = user?._id || user?.id || phoneUserData?._id || phoneUserData?.id;
      if (effectiveUserId) {
        try {
          const usageRes = await fetch(`${apiUrl}/config/check-coupon-usage-proxy/${effectiveUserId}`);
          const usageData = await usageRes.json();
          setCouponUsage(Array.isArray(usageData) ? usageData : (usageData.usages || usageData.usage || []));
        } catch (usageErr) {
          console.error("Error fetching coupon usage:", usageErr);
        }
      }

      setCoupons(activeCoupons);
      if (openModal) setIsCouponsModalOpen(true);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      if (openModal) triggerAlert("Error", "Failed to load coupons. Please try again.", "error");
    } finally {
      setIsLoadingCoupons(false);
    }
  };


  const handleApplyCoupon = (coupon: any) => {
    // Check if this coupon has already been used by this user
    const usage = couponUsage?.find(
      (u: any) => u.couponCode?.toUpperCase() === coupon.code?.toUpperCase()
    );
    const isAlreadyUsed =
      (coupon.usageType === "MONTHLY_LIMITED" && (usage?.monthlyUsed || 0) > 0) ||
      (["ONCE", "ONE_TIME"].includes(coupon.usageType) && (usage?.totalUsed || 0) > 0);

    if (isAlreadyUsed) {
      triggerAlert(
        "Coupon Already Used",
        `You have already used coupon "${coupon.code}". Please try a different one.`,
        "info"
      );
      return;
    }

    if (coupon.minOrderAmount && currentPoojaPrice < coupon.minOrderAmount) {
      triggerAlert("Minimum Amount Required", `This coupon requires a minimum booking amount of ${money(coupon.minOrderAmount)}`, "info");
      return;
    }

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
    triggerAlert("Coupon Applied", `Coupon ${coupon.code} applied. You save ${money(discount)}. Discount will be confirmed on payment.`, "success");
  };

  // const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  // const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [markerPosition, _setMarkerPosition] = useState<LatLng>(defaultCenter);
  const [notServiceablePopup, setNotServiceablePopup] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const { user } = useAuth();

  const [bhaktName, setBhaktName] = useState("");
  const [gotra, setGotra] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailId, setEmailId] = useState("");

  // When phone reaches 10 digits: fetch user details + coupons in background
  useEffect(() => {
    const phone = contactNumber.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) return;

    // Fetch coupons silently if not loaded yet
    if (coupons.length === 0) fetchCoupons(false);

    // Read-only user lookup by phone — no user creation
    (async () => {
      try {
        const res = await fetch(`${API_URL}/lookup-by-phone/${phone}`);
        const data = await res.json();
        if (data.exists && data.user) {
          setPhoneUserData(data.user);
          setIsFirstBooking(data.bookingCount === 0);
          // Pre-fill form fields if they are empty
          if (!bhaktName && (data.user.name || data.user.given_name)) {
            const fullName = data.user.given_name
              ? `${data.user.given_name} ${data.user.family_name || ""}`.trim()
              : data.user.name;
            setBhaktName(fullName);
          }
          if (!emailId && data.user.email) setEmailId(data.user.email);
          if (!gotra && data.user.gotra) setGotra(data.user.gotra);
        } else {
          setPhoneUserData(null);
          setIsFirstBooking(true); // new user → first booking
        }
      } catch {
        // non-fatal — proceed without pre-fill
      }
    })();
  }, [contactNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply best coupon for first-time users once coupons load
  // useEffect(() => {
  //   if (!isFirstBooking || appliedCoupon || coupons.length === 0) return;
  //   const firstTimeCoupon = coupons.find(
  //     (c) =>
  //       c.isActive &&
  //       (!c.minOrderAmount || c.minOrderAmount <= currentPoojaPrice) &&
  //       (c.usageType === "FIRST_BOOKING" ||
  //         c.code?.toUpperCase().includes("FIRST") ||
  //         c.code?.toUpperCase().includes("NEW") ||
  //         c.code?.toUpperCase().includes("WELCOME"))
  //   );
  //   if (firstTimeCoupon) handleApplyCoupon(firstTimeCoupon);
  // }, [isFirstBooking, coupons]); // eslint-disable-line react-hooks/exhaustive-deps
  const [deceasedPersons, setDeceasedPersons] = useState<DeceasedPerson[]>([
    { name: "", gotra: "", relation: "" },
  ]);
  const [ritualPerformerName, setRitualPerformerName] = useState("");
  const [ritualPerformerGotra, setRitualPerformerGotra] = useState("");
  const [selectedRitualPlace, setSelectedRitualPlace] = useState("haridwar");

  // const [houseNo, setHouseNo] = useState("");
  // const [street, setStreet] = useState("");
  // const [landmark, setLandmark] = useState("");
  // const [city, setCity] = useState("");
  // const [stateVal, setStateVal] = useState("");
  // const [pincode, setPincode] = useState("");

  const minDateStr = new Date(
    new Date().setDate(new Date().getDate() + 1)
  )
    .toISOString()
    .split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(minDateStr);
  const [selectedTime, setSelectedTime] = useState("");

  // const updateAddressFieldsFromGoogleAddress = useCallback(
  //   (components: google.maps.GeocoderAddressComponent[]) => {
  //     let newStreet = "";
  //     let newCity = "";
  //     let newState = "";
  //     let newPincode = "";
  // 
  //     components.forEach((component) => {
  //       const types = component.types;
  // 
  //       if (
  //         types.includes("route") ||
  //         types.includes("sublocality") ||
  //         types.includes("sublocality_level_1") ||
  //         types.includes("neighborhood")
  //       ) {
  //         newStreet += (newStreet ? ", " : "") + component.long_name;
  //       }
  // 
  //       if (
  //         types.includes("locality") ||
  //         types.includes("administrative_area_level_2")
  //       ) {
  //         if (!newCity) newCity = component.long_name;
  //       }
  // 
  //       if (types.includes("administrative_area_level_1")) {
  //         newState = component.long_name;
  //       }
  // 
  //       if (types.includes("postal_code")) {
  //         newPincode = component.long_name;
  //       }
  //     });
  // 
  //     if (newStreet) setStreet(newStreet);
  //     if (newCity) setCity(newCity);
  //     if (newState) setStateVal(newState);
  //     if (newPincode) setPincode(newPincode);
  //   },
  //   []
  // );

  // const fetchAddressFromCoords = useCallback(
  //   async (lat: number, lng: number) => {
  //     if (!(window as any).google?.maps) return;
  // 
  //     try {
  //       const geocoder = new google.maps.Geocoder();
  // 
  //       const response = await geocoder.geocode({
  //         location: { lat, lng },
  //       });
  // 
  //       if (response.results && response.results.length > 0) {
  //         const result = response.results[0];
  // 
  //         updateAddressFieldsFromGoogleAddress(result.address_components || []);
  // 
  //         if (!street && result.formatted_address) {
  //           setStreet(result.formatted_address);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Reverse geocoding failed:", error);
  //     }
  //   },
  //   [street, updateAddressFieldsFromGoogleAddress]
  // );

  // const handleFetchLocation = useCallback(() => {
  //   setIsFetchingLocation(true);

  //   if (!navigator.geolocation) {
  //     setIsFetchingLocation(false);
  //     triggerAlert("Location Error", "Your browser doesn't support geolocation.", "error");
  //     return;
  //   }

  //   navigator.geolocation.getCurrentPosition(
  //     async (position) => {
  //       const pos = {
  //         lat: position.coords.latitude,
  //         lng: position.coords.longitude,
  //       };

  //       setMapCenter(pos);
  //       setMarkerPosition(pos);
  //       setIsFetchingLocation(false);
  //       await fetchAddressFromCoords(pos.lat, pos.lng);
  //     },
  //     () => {
  //       setIsFetchingLocation(false);
  //       triggerAlert("Location Error", "The Geolocation service failed. Please check your permissions.", "error");
  //     }
  //   );
  // }, [fetchAddressFromCoords]);

  // useEffect(() => {
  //   const fetchConfig = async () => {
  //     try {
  //       const apiUrl = API_URL;
  //       const res = await fetch(`${apiUrl}/config/maps`);
  // 
  //       if (!res.ok) {
  //         console.warn("Failed to fetch maps config");
  //         return;
  //       }
  // 
  //       const data = await res.json();
  // 
  //       if (data.apiKey && typeof data.apiKey === "string") {
  //         setGoogleMapsApiKey(data.apiKey);
  //       } else {
  //         console.warn("Maps API key missing in response.");
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch maps config", err);
  //     }
  //   };
  // 
  //   fetchConfig();
  // }, []);

  // Most website bookings are placed without logging in: the phone lookup is
  // the only identity that flow has, and addresses must follow it or an at-home
  // booking would be impossible for everyone except logged-in devotees.
  const addrUserId = user?._id || user?.id || phoneUserData?._id || phoneUserData?.id;

  const fetchSavedAddresses = useCallback(async () => {
      if (!addrUserId) return;
      setIsLoadingAddresses(true);
      try {
        const apiUrl = API_URL;
        const userId = addrUserId;
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
  }, [addrUserId]);

  useEffect(() => {
    if (isOpen && addrUserId) {
      fetchSavedAddresses();
    }
  }, [isOpen, addrUserId, fetchSavedAddresses]);

  /* ── Adding an address ────────────────────────────────────────────────
     Coordinates come from the browser, not a maps key: this server has no
     geocoding endpoint, and pandit dispatch matches on the coordinates, so a
     typed address with no lat/lng would produce a booking no pandit can be
     matched to. The devotee grants location once and the rest is plain text
     for the Pandit Ji to find the door. */
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    addressName: "Home",
    addressLine1: "",
    addressLine2: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [newAddrCoords, setNewAddrCoords] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      triggerAlert(
        "Location unavailable",
        "Your browser cannot share a location. Please add the address from your profile instead.",
        "error"
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddrCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        triggerAlert(
          "Location needed",
          "We need the location to find a Pandit Ji near you. Please allow location access and try again.",
          "info"
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const saveNewAddress = async () => {
    const userId = addrUserId;
    if (!userId) {
      triggerAlert(
        "Phone number needed",
        "Enter your phone number above so we can save this address to your bookings.",
        "info"
      );
      return;
    }
    // Mirrors the server's own required set, so a save cannot bounce with a
    // generic "Missing required fields".
    if (!newAddr.addressLine1.trim() || !newAddr.street.trim() || !newAddr.state.trim() || !newAddr.pincode.trim()) {
      triggerAlert("Almost there", "Please fill house/flat, street, state and pincode.", "info");
      return;
    }
    if (!newAddrCoords) {
      triggerAlert(
        "Location needed",
        "Tap \u201cUse my current location\u201d so we can find a Pandit Ji near you.",
        "info"
      );
      return;
    }

    setSavingAddress(true);
    try {
      const payload = encryptPayload({
        userId,
        addressName: newAddr.addressName.trim() || "Home",
        addressLine1: newAddr.addressLine1.trim(),
        addressLine2: newAddr.addressLine2.trim(),
        street: newAddr.street.trim(),
        city: newAddr.city.trim(),
        state: newAddr.state.trim(),
        pincode: newAddr.pincode.trim(),
        latitude: newAddrCoords.lat,
        longitude: newAddrCoords.lng,
        country: "India",
        isPrimary: savedAddresses.length === 0,
      });
      const res = await fetch(`${API_URL}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": String(userId) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Could not save the address.");
      }
      const created = await res.json().catch(() => null);
      await fetchSavedAddresses();
      // Select it straight away — the devotee added it to use it now.
      if (created?._id) setSelectedAddressId(created._id);
      setShowAddAddress(false);
      setNewAddr({ addressName: "Home", addressLine1: "", addressLine2: "", street: "", city: "", state: "", pincode: "" });
      setNewAddrCoords(null);
    } catch (e: any) {
      triggerAlert("Could not save", e?.message || "Please try again.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleBodyScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || hasAutoOpenedSummary) return;

    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

    if (nearBottom) {
      // setIsSummaryOpen(true);
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
      // setIsSummaryOpen(false);

      setIsProcessing(false);
      setAlertConfig({ show: false, title: "", message: "", type: "info" });

      if (user) {
        try {
          const storedData = localStorage.getItem("user_data");
          const localUser = storedData ? JSON.parse(storedData) : null;

          const name = localUser?.name || user.name || "";
          const phone = localUser?.phone || user.phone || "";
          const email = localUser?.email || user.email || "";
          const gotraVal = localUser?.gotra || (user as any).gotra || "";

          if (name) setBhaktName(name);
          if (phone) setContactNumber(onlyDigits10(phone));
          if (email) setEmailId(email);
          if (gotraVal) setGotra(gotraVal);
        } catch {
          if (user.name) setBhaktName(user.name);
          if (user.phone) setContactNumber(onlyDigits10(user.phone));
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

  useEffect(() => {
    let redirectTimer: number | undefined;

    if (showSuccessModal) {
      redirectTimer = window.setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
        navigate("/account?tab=pooja");
      }, 1800);
    }

    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [showSuccessModal, navigate, onClose]);

  // const samagriCharge = pooja?.samagriPrice || 0;
  const panditDakshina = pooja?.panditDakshina || 0;
  const isDeathRitual = pooja?.poojaID === "death-rituals";
  const basePoojaPrice = mode === "online" ? (pooja?.poojaPriceOnline || 0) : (pooja?.poojaPriceOffline || 0);
  const deathRitualExtraPrice =
    isDeathRitual && deceasedPersons.length > 1
      ? (deceasedPersons.length - 1) * 1100
      : 0;
  const currentPoojaPrice = basePoojaPrice + deathRitualExtraPrice;

  /**
   * The address an at-home booking will be performed at.
   *
   * Only ever a SAVED address the devotee picked. The old code fell back to
   * `markerPosition`, which is a hardcoded default that nothing moves — so a
   * booking would carry coordinates for a place the devotee has never been,
   * and pandit dispatch (which matches on those coordinates) would offer it to
   * the wrong pandits entirely.
   */
  const selectedAddress = savedAddresses.find(
    (a: any) => String(a?._id) === String(selectedAddressId)
  );
  const addressLat = Number(selectedAddress?.latitude ?? selectedAddress?.lat);
  const addressLng = Number(selectedAddress?.longitude ?? selectedAddress?.lng);
  const hasUsableAddress =
    !!selectedAddress && Number.isFinite(addressLat) && Number.isFinite(addressLng);

  // const totalDiscount = samagriCharge + panditDakshina;

  let couponDiscount = 0;
  if (appliedCoupon) {
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

  /* ── How the devotee wants to pay ───────────────────────────────────────
     "full"    → the whole bill now.
     "advance" → a percentage now, the rest after the puja (Pandit Ji's QR, or
                 "Pay remaining" in My Bookings).
     The percentage comes from the server so this page can never quote a figure
     the server would refuse to charge. */
  const [payOption, setPayOption] = useState<"full" | "advance">("full");
  const [advancePercent, setAdvancePercent] = useState(30);
  // Starts FALSE on purpose: a server that has not been redeployed knows
  // nothing about paymentOption and would charge the full amount after this
  // page had promised a 30% split. The option only appears once the server
  // confirms it honours it.
  const [advanceEnabled, setAdvanceEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/payment-options`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const pct = Number(data?.advancePercent);
        if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return;
        setAdvancePercent(Math.round(pct));
        const modes: string[] = Array.isArray(data?.advanceModes) ? data.advanceModes : ["offline"];
        setAdvanceEnabled(data?.advanceEnabled !== false && modes.includes("offline"));
      } catch {
        // Keep the default. What is actually charged always comes back from
        // create-pending, so a failed lookup only affects the preview text.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Only at-home pujas can be split — the server enforces the same rule, so the
  // two can never disagree about what gets charged.
  const canSplitPayment = advanceEnabled && mode === "offline";
  // Mirrors the server's advanceOf(): whole rupees, never 0, never above the bill.
  const advanceDue = Math.min(
    Math.max(0, discountedPrice),
    Math.max(1, Math.round((discountedPrice * advancePercent) / 100)),
  );
  const balanceAfter = Math.max(0, discountedPrice - advanceDue);

  // Switching to an online puja after choosing the split would leave the page
  // promising a part-payment the server would decline to honour.
  useEffect(() => {
    if (!canSplitPayment && payOption === "advance") setPayOption("full");
  }, [canSplitPayment, payOption]);

  /** Razorpay's script is not bundled; make sure it is there before opening. */
  const ensureRazorpay = async (): Promise<any> => {
    if ((window as any).Razorpay) return (window as any).Razorpay;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load.")));
        return;
      }
      const el = document.createElement("script");
      el.src = "https://checkout.razorpay.com/v1/checkout.js";
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("Razorpay SDK failed to load."));
      document.body.appendChild(el);
    });
    if (!(window as any).Razorpay) throw new Error("Razorpay SDK failed to load.");
    return (window as any).Razorpay;
  };

  // Abandoned-cart capture: the row is created as soon as the 10-digit contact
  // number is typed, then patched with every further detail (name, gotra, email,
  // date/time, amount, death-ritual details), so a devotee who closes the modal
  // before confirming is still reachable with full context.
  const { markCartConverted } = useAbandonedCart("puja-booking-modal", {
    phone: contactNumber,
    name: bhaktName,
    gotra,
    email: emailId,
    pujaId: pooja?._id || pooja?.id,
    pujaSlug: pooja?.poojaID,
    pujaName: pooja?.poojaNameEng || "Pooja Booking",
    amount: discountedPrice,
    userId: user?._id || user?.id || phoneUserData?._id || phoneUserData?.id,
    extra: {
      poojaMode: mode,
      bookingDate: selectedDate,
      bookingTime: selectedTime,
      couponCode: appliedCoupon?.code,
      ...(isDeathRitual && {
        deceasedPersons,
        ritualPerformerName,
        ritualPerformerGotra,
        ritualPlace: selectedRitualPlace,
      }),
    },
  }, String(pooja?._id || pooja?.id || pooja?.poojaID || ""));
  // const originalPrice = currentPoojaPrice + totalDiscount;
  // const discountPercent =
  //   originalPrice > 0 ? Math.round(((totalDiscount + couponDiscount) / (originalPrice)) * 100) : 0;

  const getCookie = (name: string): string => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : "";
  };

  const handleCheckout = async () => {
    if (isDeathRitual) {
      const deceasedValid =
        deceasedPersons.length > 0 &&
        deceasedPersons.every(
          (person) =>
            person.name.trim() &&
            person.gotra.trim() &&
            person.relation.trim()
        );

      if (!contactNumber.trim()) {
        triggerAlert("Details Required", "Please provide a contact number to proceed.", "info");
        return;
      }

      if (!deceasedValid) {
        triggerAlert("Deceased Details Required", "Please fill name, gotra and relation for each deceased person.", "info");
        return;
      }

      if (!ritualPerformerName.trim() || !ritualPerformerGotra.trim() || !selectedRitualPlace) {
        triggerAlert("Ritual Details Required", "Please fill performer details and select a ritual place.", "info");
        return;
      }
    } else if (!bhaktName || !contactNumber) {
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

    // if (
    //   mode === "offline" &&
    //   (!houseNo || !street || !city || !stateVal || !pincode)
    // ) {
    //   triggerAlert("Address Required", "Please fill all required address fields for offline pooja.", "info");
    //   return;
    // }

    setIsProcessing(true);

    // NO InitiateCheckout pixel, and no `InitiateCheckout` DOM event either —
    // that event was the GTM hook for the same signal, so leaving it would put
    // the conversion back on the tag-manager side of the fence. Bookings from
    // the generic /puja/:id flow report nothing to Meta; see `skipMetaCapi` in
    // the pending payload below.

    const apiUrl = API_URL;

    if (mode === "offline") {
      // No guessing. Without real coordinates the serviceability check is
      // meaningless and the Pandit Ji would be sent to the wrong place.
      if (!hasUsableAddress) {
        triggerAlert(
          "Where should Pandit Ji come?",
          savedAddresses.length
            ? "Please choose the address for the puja."
            : "Please add an address to your profile first, then book the puja at home.",
          "info"
        );
        setIsProcessing(false);
        return;
      }
      try {
        const checkPayload = encryptPayload({ addressId: selectedAddressId });

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

          // NOTE: the old "auto-save the map pin as a new address" branch is
          // gone with the map — an at-home booking now always uses an address
          // the devotee already saved, so there is nothing new to store.
          if (false && user) {
            try {
              const addressPayload = {
                userId: user?._id || user?.id,
                // addressLine1: houseNo,
                // addressLine2: landmark,
                // street: street,
                // city: city,
                // state: stateVal,
                // pincode: pincode,
                latitude: markerPosition.lat,
                longitude: markerPosition.lng,
                // addressName: `${saveAs.charAt(0).toUpperCase() + saveAs.slice(1)} (${street.split(',')[0].trim()})`,
                country: "India",
                isPrimary: false
              };

              const encryptedAddress = encryptPayload(addressPayload);

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
      // Resolve userId: from auth context, from phone-lookup cache, or create silently
      let effectiveUserId = user?._id || user?.id || phoneUserData?._id || phoneUserData?.id;

      // Email = exactly what is in the form field (pre-fill already loaded the profile email into it)
      const resolvedEmail = emailId.trim();

      if (!effectiveUserId) {
        const phone = contactNumber.replace(/\D/g, "").slice(-10);
        if (!phone || phone.length !== 10) {
          setIsProcessing(false);
          triggerAlert("Phone Required", "Please enter a valid 10-digit contact number to proceed.", "info");
          return;
        }
        // Silently register / fetch user — no redirect, no friction
        const authRes = await fetch(`${API_URL}/login-by-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name: bhaktName.trim() || undefined,
            email: resolvedEmail || undefined,
          }),
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.message || "Could not register for booking");
        setPhoneUserData(authData.user);
        effectiveUserId = authData.user?._id || authData.user?.id;
      }

      if (!effectiveUserId) throw new Error("Unable to identify user. Please try again.");

      const combinedDateTime = selectedTime
        ? `${selectedDate}T${selectedTime}`
        : selectedDate;

      // Read partner referral code from localStorage (2-day TTL)
      const partnerRefCode = (() => {
        try {
          const raw = localStorage.getItem("pjar_partner_ref");
          if (!raw) return "";
          const entry = JSON.parse(raw) as { code: string; storedAt: number };
          if (Date.now() - entry.storedAt > 2 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem("pjar_partner_ref");
            return "";
          }
          return entry.code || "";
        } catch {
          return "";
        }
      })();

      const pendingPayload = {
        userId: effectiveUserId,
        poojaId: pooja?._id || pooja?.id,
        poojaMode: mode,
        bookingDate: combinedDateTime,
        // The INR bill. What is collected NOW is derived server-side from
        // paymentOption — this page never dictates the payable.
        amount: discountedPrice,
        paymentOption: canSplitPayment ? payOption : "full",
        panditDakshina: panditDakshina,
        bhaktName,
        gotra,
        contactNumber,
        emailId: resolvedEmail,
        ...(isDeathRitual && {
          deceasedPersons,
          ritualPerformerName,
          ritualPerformerGotra,
          ritualPlace: selectedRitualPlace,
        }),
        ...(partnerRefCode && { referralCode: partnerRefCode }),
        // Which campaign brought this devotee in. `referralCode` above is a
        // partner tie-up that pays a commission; this is the ad channel the
        // click came from, and a booking can carry both. Note this is stored
        // regardless of `skipMetaCapi` below — that suppresses REPORTING a
        // purchase to Meta, not recording where the sale came from.
        ...attributionPayload(),
        // Bookings from the generic /puja/:id flow report NOTHING to Meta —
        // no browser pixel (all removed from this file and from PujaPage) and
        // no server CAPI Purchase. This flag is the server half: it is stored
        // on the booking and checked in finalizePendingPoojaBooking, so the
        // event stays suppressed whether the purchase is finalised by the
        // browser or by the Razorpay webhook.
        //
        // Every booking flow shares this endpoint, so it MUST be sent from
        // here and only from here. The themed booking pages (Savan, Banke
        // Bihari, Hanuman, Kaal Bhairav, Live Mandir) omit it and keep
        // reporting exactly as before.
        skipMetaCapi: true,
        address:
          mode === "offline" && hasUsableAddress
            ? {
              // Sent so the server can store a GeoJSON point and dispatch the
              // booking to pandits near THIS address.
              _id: selectedAddress?._id,
              addressId: selectedAddress?._id,
              addressLine1: selectedAddress?.addressLine1,
              addressLine2: selectedAddress?.addressLine2,
              street: selectedAddress?.street,
              city: selectedAddress?.city,
              state: selectedAddress?.state,
              pincode: selectedAddress?.pincode,
              // houseFlatNo: houseNo,
              // streetArea: street,
              // landmark: landmark,
              // city: city,
              // state: stateVal,
              // pincode: pincode,
              saveAs: saveAs,
              latitude: addressLat,
              longitude: addressLng,
              coordinates: { lat: addressLat, lng: addressLng },
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

      // The browser charges the SERVER's figures, never its own. On an advance
      // booking `amount` is the advance rather than the bill, and complete-booking
      // rejects any mismatch — substituting discountedPrice here would fail every
      // part-payment.
      const payableInr = Number(pendingData.amount ?? discountedPrice);
      const payableMinor = Number(
        pendingData.amountMinor ?? Math.round(payableInr * 100),
      );
      const payCurrency = String(pendingData.currency || "INR");

      const RazorpayCtor = await ensureRazorpay();

      const options = {
        key: pendingData.razorpayKeyId,
        amount: payableMinor,
        currency: payCurrency,
        name: "PanditJiAtRequest",
        description:
          pendingData.paymentOption === "advance"
            ? `${pooja?.poojaNameEng || "Pooja Booking"} — ${pendingData.advancePercent ?? advancePercent}% advance`
            : pooja?.poojaNameEng || "Pooja Booking",
        order_id: pendingData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // ── Step 1: Apply referral BEFORE completing booking ──
            // Referral is puja-scoped: only apply if the stored pujaId matches
            // this booking's puja, and the entry is within the 1-week TTL.
            const INTREF_TTL_MS = 7 * 24 * 60 * 60 * 1000;
            let intrefCode = "";
            try {
              const raw = decodeURIComponent(getCookie("pjar_intref_data") || "");
              if (raw) {
                const entry = JSON.parse(raw) as { code: string; pujaId: string; bookingUrl: string; storedAt: number };
                const currentPujaId = String(pooja?._id || pooja?.id || "");
                const notExpired = Date.now() - entry.storedAt < INTREF_TTL_MS;
                const pujaMatches = entry.pujaId && entry.pujaId === currentPujaId;
                if (entry.code && notExpired && pujaMatches) {
                  intrefCode = entry.code;
                }
              }
            } catch (_) {
              // malformed cookie entry — ignore
            }

            if (intrefCode && effectiveUserId) {
              try {
                const referralPayload = encryptPayload({ code: intrefCode });
                await fetch(`${apiUrl}/users/${effectiveUserId}/apply-referral`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(referralPayload),
                });
              } catch (refErr) {
                // Non-fatal — booking can still proceed without referral
                console.error("[Referral] apply failed:", refErr);
              }
            }

            // ── Step 2: Complete the booking ──
            const completePayload = {
              pendingBookingId: pendingData.bookingId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              // Rupees actually collected on this leg — the advance, or the whole bill.
              amountPaid: payableInr,
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

            // ── Step 3: Clear referral cookie — code has been consumed ──
            if (intrefCode) {
              document.cookie = "pjar_intref_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
            }

            if (appliedCoupon) {
              fetch(`${apiUrl}/config/apply-coupon-proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: effectiveUserId,
                  phone: contactNumber || (user as any)?.phone || 0,
                  appKey: "par",
                  couponCode: appliedCoupon.code,
                  orderAmount: currentPoojaPrice,
                }),
              }).catch((err) => console.error("Coupon apply after payment failed:", err));
            }

            // Booking is paid — drop this row out of the abandoned-lead list.
            markCartConverted();
            setShowSuccessModal(true);

            // NO Purchase pixel. Bookings from the generic /puja/:id flow are
            // deliberately not reported to Meta — see `skipMetaCapi` in the
            // pending payload above, which suppresses the server CAPI event.
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
            // The pending booking stays put: the devotee can come back and pay,
            // and it feeds the abandoned-cart follow-up in the meantime.
            triggerAlert("Payment Cancelled", "Your booking session was cancelled. You can try again from the menu.", "info");
            setIsProcessing(false);
          },
        },
      };

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
            <h2 className="text-orange-700 font-bold leading-tight truncate px-10"
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

            {/* <div className={`mx-4 mb-1 rounded-2xl px-4 py-3 flex items-start gap-3 border ${mode === "online" ? "bg-orange-50 border-orange-200" : "bg-amber-50 border-amber-200"}`}>
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
            </div> */}

            <div className="px-4 py-6 space-y-6">
              <div>
                {!isDeathRitual ? (
                  <>
                    <div className="bm-section-label"><span>Bhakt Details</span><div /></div>

                    <div className="space-y-3">
                      <input type="text" placeholder="Your full name*" value={bhaktName}
                        onChange={(e) => setBhaktName(e.target.value)}
                        className="bm-input" />

                      <input type="text" placeholder="Gotra (optional)" value={gotra}
                        onChange={(e) => setGotra(e.target.value)} className="bm-input" />

                      <input type="tel" inputMode="numeric" maxLength={10}
                        placeholder="Contact number*" value={contactNumber}
                        onChange={(e) => setContactNumber(onlyDigits10(e.target.value))}
                        className="bm-input" />

                      <input type="email" placeholder="Email address*" value={emailId}
                        onChange={(e) => setEmailId(e.target.value)} className="bm-input" />
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="bm-section-label"><span>Select Ritual Place</span><div /></div>
                      <div className="grid grid-cols-3 gap-3">
                        {RITUAL_PLACES.map((place) => {
                          const selected = selectedRitualPlace === place.id;
                          return (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => setSelectedRitualPlace(place.id)}
                              className={`relative overflow-hidden rounded-2xl border text-left transition-all ${
                                selected
                                  ? "bg-orange-50 border-orange-500 ring-1 ring-orange-500"
                                  : "bg-white border-stone-200 hover:border-orange-200"
                              }`}
                            >
                              <div className="w-30 h-18 bg-orange-50">
                                {place.imageUrl ? (
                                  <img
                                    src={place.imageUrl}
                                    alt={place.label}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-orange-300">
                                    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="px-3 py-1">
                                <span className={`block text-xs font-bold ${selected ? "text-orange-600" : "text-stone-700"}`}>
                                  {place.label}
                                </span>
                              </div>
                              {selected && (
                                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shadow-sm">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="bm-section-label"><span>Deceased Person Details</span><div /></div>
                      <p className="text-[11px] text-stone-500 -mt-2 mb-3">
                        Add name, gotra and your relation for each deceased person. Add another deceased person for ₹1,100.
                      </p>
                      <div className="space-y-3">
                        {deceasedPersons.map((person, idx) => (
                          <div key={idx} className="rounded-2xl border border-orange-100 bg-white/70 p-3 space-y-3">
                            <input
                              type="text"
                              placeholder="Name of deceased*"
                              value={person.name}
                              onChange={(e) =>
                                setDeceasedPersons((prev) =>
                                  prev.map((item, itemIdx) =>
                                    itemIdx === idx ? { ...item, name: e.target.value } : item
                                  )
                                )
                              }
                              className="bm-input"
                            />
                            <input
                              type="text"
                              placeholder="Gotra of deceased*"
                              value={person.gotra}
                              onChange={(e) =>
                                setDeceasedPersons((prev) =>
                                  prev.map((item, itemIdx) =>
                                    itemIdx === idx ? { ...item, gotra: e.target.value } : item
                                  )
                                )
                              }
                              className="bm-input"
                            />
                            <input
                              type="text"
                              placeholder="Your relation with deceased*"
                              value={person.relation}
                              onChange={(e) =>
                                setDeceasedPersons((prev) =>
                                  prev.map((item, itemIdx) =>
                                    itemIdx === idx ? { ...item, relation: e.target.value } : item
                                  )
                                )
                              }
                              className="bm-input"
                            />
                            {deceasedPersons.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeceasedPersons((prev) =>
                                    prev.filter((_, itemIdx) => itemIdx !== idx)
                                  )
                                }
                                className="text-red-500 text-xs font-bold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDeceasedPersons((prev) => [
                            ...prev,
                            { name: "", gotra: "", relation: "" },
                          ])
                        }
                        className="mt-3 text-orange-600 text-sm font-bold"
                      >
                        + Add Another Deceased Person ({money(1100)})
                      </button>
                    </div>

                    <div>
                      <div className="bm-section-label"><span>Ritual Performer Details</span><div /></div>
                      <p className="text-[11px] text-stone-500 -mt-2 mb-3">
                        Name and gotra of the person performing the ritual.
                      </p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Performer's name*"
                          value={ritualPerformerName}
                          onChange={(e) => setRitualPerformerName(e.target.value)}
                          className="bm-input"
                        />
                        <input
                          type="text"
                          placeholder="Performer's gotra*"
                          value={ritualPerformerGotra}
                          onChange={(e) => setRitualPerformerGotra(e.target.value)}
                          className="bm-input"
                        />
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Contact number*"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(onlyDigits10(e.target.value))}
                          className="bm-input"
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={emailId}
                          onChange={(e) => setEmailId(e.target.value)}
                          className="bm-input"
                        />
                      </div>
                    </div>

                    <div className="hidden">
                      <div className="bm-section-label"><span>Select Ritual Place</span><div /></div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "haridwar", label: "Haridwar", icon: "🏞️" },
                          { id: "gaya", label: "Gaya", icon: "🪔" },
                          { id: "prayagraj", label: "Prayagraj", icon: "🌊" },
                        ].map((place) => {
                          const selected = selectedRitualPlace === place.id;
                          return (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => setSelectedRitualPlace(place.id)}
                              className={`relative rounded-2xl border px-2 py-3 text-center transition-all ${
                                selected
                                  ? "bg-orange-50 border-orange-500 ring-1 ring-orange-500"
                                  : "bg-white border-stone-200 hover:border-orange-200"
                              }`}
                            >
                              <span className="block text-xl mb-1">{place.icon}</span>
                              <span className={`block text-xs font-bold ${selected ? "text-orange-600" : "text-stone-600"}`}>
                                {place.label}
                              </span>
                              {selected && (
                                <span className="absolute top-1.5 right-1.5 text-orange-500 text-xs">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* <div className="space-y-3">
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
                </div> */}
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-200 to-transparent -mx-0" />

              {/* <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="bm-section-label mb-0"><span>Have a Coupon?</span><div /></div>
                  <button
                    onClick={() => fetchCoupons()}
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
                    onClick={async () => {
                      if (!couponCode.trim()) return;

                      // 1. Ensure coupon list is loaded
                      let couponList = coupons;
                      if (couponList.length === 0) {
                        try {
                          const response = await fetch(`${API_URL}/config/fetch-coupons-proxy`);
                          const data = await response.json();
                          couponList = (data.coupons || []).filter((c: any) => c.isActive);
                          setCoupons(couponList);
                        } catch {
                          triggerAlert("Error", "Failed to verify coupon. Please try again.", "error");
                          return;
                        }
                      }

                      // 2. Check if coupon exists
                      const found = couponList.find((c: any) => c.code?.toUpperCase() === couponCode.trim().toUpperCase());
                      if (!found) {
                        triggerAlert("Invalid Coupon", "No such coupon exists.", "error");
                        return;
                      }

                      // 3. Live usage check via API
                      const currentUserId = user?._id || user?.id || phoneUserData?._id || phoneUserData?.id;
                      if (currentUserId) {
                        try {
                          const usageRes = await fetch(`${API_URL}/config/check-coupon-usage-proxy/${currentUserId}`);
                          const usageData = await usageRes.json();
                          const freshUsage: any[] = Array.isArray(usageData) ? usageData : (usageData.usages || usageData.usage || []);
                          setCouponUsage(freshUsage);

                          const usage = freshUsage.find((u: any) => u.couponCode?.toUpperCase() === found.code?.toUpperCase());
                          const isAlreadyUsed =
                            (found.usageType === "MONTHLY_LIMITED" && (usage?.monthlyUsed || 0) > 0) ||
                            (["ONCE", "ONE_TIME"].includes(found.usageType) && (usage?.totalUsed || 0) > 0);

                          if (isAlreadyUsed) {
                            triggerAlert("Coupon Already Used", `You have already used coupon "${found.code}". Please try a different one.`, "info");
                            return;
                          }
                        } catch {
                          // non-fatal — proceed to apply without usage check
                        }
                      }

                      // 4. All checks passed — apply
                      handleApplyCoupon(found);
                    }}
                    className={`${couponCode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#C9C9C9]'} text-white text-sm font-semibold rounded-lg sm:px-8 py-2.5 sm:w-auto w-full transition-colors opacity-90`}
                  >
                    Apply
                  </button>
                </div>
              </div> */}
            </div>
          </div>

          <div className="w-full bg-white/95 backdrop-blur-md shrink-0 border-t border-orange-100 px-4 pt-3 pb-4 shadow-[0_-12px_24px_-8px_rgba(249,115,22,0.12)]">
            {/* <button
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
            </button> */}

            {/* <div className={`overflow-hidden transition-all duration-300 ${isSummaryOpen ? "max-h-72 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"}`}>
              <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Base Puja</span>
                  <span className="font-medium text-stone-700">{money(basePoojaPrice)}</span>
                </div>
                {isDeathRitual && deceasedPersons.length > 1 && (
                  <div className="flex justify-between text-stone-500">
                    <span>Additional Persons ({deceasedPersons.length - 1})</span>
                    <span className="font-medium text-stone-700">{money(deathRitualExtraPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span className="line-through">Samagri</span>
                  <span className="line-through">{money(samagriCharge)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span className="line-through">Panditji Dakshina</span>
                  <span className="line-through">{money(panditDakshina)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Coupon ({appliedCoupon.code || appliedCoupon.promoCode || appliedCoupon.promoName})</span>
                    <span>-{money(Math.floor(couponDiscount))}</span>
                  </div>
                )}
                <div className="h-px bg-orange-200 my-1" />
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>You Save</span>
                  <span>{money(Math.floor(totalDiscount + couponDiscount))} ({discountPercent}% OFF)</span>
                </div>
                <div className="flex justify-between font-bold text-stone-800 pt-1">
                  <span>Total Payable</span>
                  <span className="text-orange-600">{money(discountedPrice)}</span>
                </div>
              </div>
            </div> */}

            {/* ── Online or at your home ──
                Only offered when the catalog allows both; a puja fixed to one
                mode has nothing to choose. */}
            {canChooseMode && (
              <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50/40 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                  How should the puja be performed?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "offline" as const, title: "At my home", sub: "Pandit Ji visits you", price: pooja?.poojaPriceOffline },
                    { key: "online" as const, title: "Online", sub: "Performed for you, streamed", price: pooja?.poojaPriceOnline },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => chooseMode(opt.key)}
                      className={`rounded-xl border p-3 text-left transition-all ${mode === opt.key ? "border-orange-500 bg-white shadow-sm" : "border-stone-200 bg-white/60"}`}
                    >
                      <span className="block text-sm font-bold text-stone-800">{opt.title}</span>
                      <span className="block text-[11px] leading-snug text-stone-500">{opt.sub}</span>
                      {typeof opt.price === "number" && opt.price > 0 && (
                        <span className="mt-1 block text-[12px] font-bold text-orange-600">{money(opt.price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Where should Pandit Ji come? ──
                A saved address only. Guessing a location would send him to the
                wrong house and hand the booking to the wrong pandits. */}
            {mode === "offline" && (
              <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50/40 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                  Where should Pandit Ji come?
                </p>

                {isLoadingAddresses ? (
                  <div className="flex gap-2">
                    <div className="h-16 flex-1 animate-pulse rounded-xl bg-stone-100" />
                    <div className="h-16 flex-1 animate-pulse rounded-xl bg-stone-100" />
                  </div>
                ) : savedAddresses.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {savedAddresses.map((addr: any) => {
                      const on = String(selectedAddressId) === String(addr._id);
                      const line = [addr.addressLine1, addr.street, addr.city]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => setSelectedAddressId(on ? null : addr._id)}
                          className={`w-44 shrink-0 rounded-xl border p-3 text-left transition-all ${on ? "border-orange-500 bg-white shadow-sm" : "border-stone-200 bg-white/60"}`}
                        >
                          <span className="block text-[12px] font-bold text-stone-800">
                            {addr.addressName || addr.saveAs || "Address"}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-stone-500">
                            {line || "Saved address"}
                          </span>
                          {addr.pincode && (
                            <span className="mt-1 block text-[10.5px] font-semibold text-stone-400">
                              {addr.pincode}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] leading-snug text-stone-600">
                    {addrUserId
                      ? "No saved addresses yet — add one below."
                      : "Enter your phone number above so we can load your saved addresses."}
                  </p>
                )}

                {/* Add an address inline. Without this a devotee with none
                    saved simply cannot book an at-home puja on the website. */}
                {addrUserId && !showAddAddress && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="mt-2 text-[12px] font-bold text-orange-600 hover:text-orange-700"
                  >
                    + Add a new address
                  </button>
                )}

                {addrUserId && showAddAddress && (
                  <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                        placeholder="Label (Home / Office)"
                        value={newAddr.addressName}
                        onChange={(e) => setNewAddr((p) => ({ ...p, addressName: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                        placeholder="House / Flat no. *"
                        value={newAddr.addressLine1}
                        onChange={(e) => setNewAddr((p) => ({ ...p, addressLine1: e.target.value }))}
                      />
                    </div>
                    <input
                      className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                      placeholder="Street / Locality *"
                      value={newAddr.street}
                      onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                      placeholder="Landmark (optional)"
                      value={newAddr.addressLine2}
                      onChange={(e) => setNewAddr((p) => ({ ...p, addressLine2: e.target.value }))}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                        placeholder="City"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                        placeholder="State *"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-[12.5px] text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none"
                        placeholder="Pincode *"
                        inputMode="numeric"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr((p) => ({ ...p, pincode: e.target.value }))}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={captureLocation}
                      disabled={locating}
                      className={`w-full rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors ${newAddrCoords ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                    >
                      {locating
                        ? "Getting your location…"
                        : newAddrCoords
                          ? "✓ Location captured"
                          : "Use my current location *"}
                    </button>
                    <p className="text-[10.5px] leading-snug text-stone-400">
                      We need this to find a verified Pandit Ji near you — the typed address
                      alone is not enough to match one.
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={saveNewAddress}
                        disabled={savingAddress}
                        className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-[12.5px] font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {savingAddress ? "Saving…" : "Save & use this address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-[12.5px] font-semibold text-stone-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── How would you like to pay? ── */}
            <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50/40 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                How would you like to pay?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPayOption("full")}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${payOption === "full" ? "border-orange-500 bg-white shadow-sm" : "border-stone-200 bg-white/60"}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${payOption === "full" ? "border-orange-500" : "border-stone-300"}`}>
                    {payOption === "full" && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-stone-800">
                      Pay full now — {money(discountedPrice)}
                    </span>
                    <span className="block text-[11px] leading-snug text-stone-500">
                      Pay securely online and confirm instantly. Nothing to pay later.
                    </span>
                  </span>
                </button>

                {canSplitPayment && (
                  <button
                    type="button"
                    onClick={() => setPayOption("advance")}
                    className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${payOption === "advance" ? "border-orange-500 bg-white shadow-sm" : "border-stone-200 bg-white/60"}`}
                  >
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${payOption === "advance" ? "border-orange-500" : "border-stone-300"}`}>
                      {payOption === "advance" && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-stone-800">
                        Pay {advancePercent}% now — {money(advanceDue)}
                      </span>
                      <span className="block text-[11px] leading-snug text-stone-500">
                        Remaining {money(balanceAfter)} after the pooja — scan Pandit Ji&rsquo;s QR, or pay from My
                        Bookings.
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full active:scale-[0.98] text-white rounded-2xl py-3.5 px-5 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200 mb-1 ${isProcessing ? "bg-orange-400" : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"}`}
            >
              <span className="text-sm font-bold tracking-wide text-orange-50">
                {isProcessing
                  ? "Processing..."
                  : `Pay ${money(canSplitPayment && payOption === "advance" ? advanceDue : discountedPrice)} & Book`}
              </span>
              {!isProcessing && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              )}
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
              We are not currently serviceable at this pincode, but we
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
                  Redirecting you to My Bookings...
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
                navigate("/account?tab=pooja");
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              Go to My Bookings
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
                              : `${money(coupon.discountValue)} OFF`}
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
                              Min. Order: {money(coupon.minOrderAmount)}
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
