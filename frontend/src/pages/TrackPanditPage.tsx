import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Polyline,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Navigation,
  Map as MapIcon,
  Maximize,
  Focus,
  Loader2,
  Signal,
  SignalLow,
  Clock,
  Navigation2,
  Phone
} from "lucide-react";
import axios from "axios";
import { usePanditTrackingStore } from "../store/panditTrackingStore";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// Meters
const ROUTE_REFETCH_MIN_MOVE = 40;
const ROUTE_REFETCH_MIN_MS = 9000;

function haversineMeters(a: { lat: number, lng: number }, b: { lat: number, lng: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function formatEta(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "--";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDistance(meters?: number) {
  if (!meters || !Number.isFinite(meters)) return "--";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// 🗺️ Sub-component to isolate the useJsApiLoader hook
interface MapContentProps {
  apiKey: string;
  panditId: string;
  destination: { lat: number, lng: number };
}

function TrackingMapContent({ apiKey, panditId, destination }: MapContentProps) {
  const navigate = useNavigate();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [follow, setFollow] = useState(true);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

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

  const lastRouteStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastRouteAtRef = useRef<number>(0);
  const didFitRef = useRef(false);

  const { panditLocation, startTracking, stopTracking, loading, connected } =
    usePanditTrackingStore();

  const loaderOptions = useMemo(() => ({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    language: "en",
    region: "IN",
  }), [apiKey]);

  const { isLoaded } = useJsApiLoader(loaderOptions);

  // Start tracking
  useEffect(() => {
    if (panditId) {
      startTracking(panditId);
    }
    return () => stopTracking();
  }, [panditId, startTracking, stopTracking]);

  // Routing Logic
  const fetchRoute = useCallback(async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
    // console.log("[Tracking] Attempting route fetch:", start, "->", end);

    if (!isLoaded) {
      console.log("[Tracking] API not yet isLoaded... waiting.");
      return;
    }

    if (!window.google?.maps?.DirectionsService) {
      console.warn("[Tracking] window.google.maps.DirectionsService not found. API might still be initializing.");
      return;
    }

    setRouteLoading(true);
    const service = new window.google.maps.DirectionsService();

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route({
          origin: start,
          destination: end,
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (res, status) => {
          // console.log(`[Tracking] Directions Callback Status: ${status}`, res);
          if (status === 'OK' && res) {
            setErrorStatus(null);
            resolve(res);
          } else {
            console.error(`[Tracking] Directions API Failed with status: ${status}`);
            setErrorStatus(status);
            reject(status);
          }
        });
      });

      // console.log("[Tracking] Route found:", result.routes[0]?.summary);
      if (result.routes[0]) {
        const route = result.routes[0];
        const leg = route.legs[0];

        // console.log("[Tracking] Leg data:", { 
        //   dist: leg.distance?.text, 
        //   dur: leg.duration?.text 
        // });

        setEtaSeconds(leg.duration?.value ?? null);
        setDistanceMeters(leg.distance?.value ?? null);

        const path = route.overview_path.map(p => ({
          lat: p.lat(),
          lng: p.lng(),
        }));

        setRouteCoords(path);

        if (!didFitRef.current && map) {
          didFitRef.current = true;
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(p => bounds.extend(p));
          map.fitBounds(bounds, { top: 120, bottom: 250, left: 60, right: 60 });
        }
      }
    } catch (err) {
      console.warn("[Tracking] Directions request failed:", err);
      if (err === 'REQUEST_DENIED') {
        console.log("Directions API might not be enabled for this API key.");
      }
    } finally {
      setRouteLoading(false);
    }
  }, [map, isLoaded]);

  const handleCall = async () => {
    if (!panditId) return;
    try {
      const userDataString = localStorage.getItem("user_data");
      if (!userDataString) return;
      const user = JSON.parse(userDataString);

      const baseCallId = crypto.randomUUID();
      const callId = `${baseCallId}_AC`;
      const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";

      await axios.post(`${apiUrl}/calls/invite`, {
        fromUserId: user._id,
        toUserId: panditId,
        callId,
        callerName: user.name || user.userName || "User",
        callerId: user._id,
        fromAppType: "user",
        toAppType: "pandit",
        callType: "audio"
      });

      navigate(`/audio-call/${callId}/${panditId}`);
    } catch (err) {
      console.error("Error starting call:", err);
      triggerAlert("Call Error", "Failed to start call. Please try again.", "error");
    }
  };

  // Refetch route when pandit moves
  useEffect(() => {
    if (!panditLocation) return;

    const start = { lat: panditLocation.latitude, lng: panditLocation.longitude };
    const now = Date.now();
    const lastStart = lastRouteStartRef.current;
    const lastAt = lastRouteAtRef.current;

    const moved = lastStart ? haversineMeters(lastStart, start) : 999999;
    const tooSoon = now - lastAt < ROUTE_REFETCH_MIN_MS;

    // 🛡️ CRITICAL: Only skip if we ARE loaded and it's actually too soon.
    if (isLoaded && moved < ROUTE_REFETCH_MIN_MOVE && tooSoon) return;

    // Only update refs if we are actually ready to fetch, 
    // otherwise we "consume" the update before it can be processed.
    if (isLoaded) {
      lastRouteStartRef.current = start;
      lastRouteAtRef.current = now;
      fetchRoute(start, destination);
    }
  }, [panditLocation, destination, fetchRoute, isLoaded]);

  // Auto-follow
  useEffect(() => {
    if (follow && map && panditLocation) {
      map.panTo({ lat: panditLocation.latitude, lng: panditLocation.longitude });
    }
  }, [follow, map, panditLocation]);

  const fitBoth = () => {
    if (!map) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (routeCoords.length > 0) {
      routeCoords.forEach(p => bounds.extend(p));
    } else {
      bounds.extend(destination);
      if (panditLocation) {
        bounds.extend({ lat: panditLocation.latitude, lng: panditLocation.longitude });
      }
    }
    map.fitBounds(bounds, { top: 100, bottom: 200, left: 50, right: 50 });
  };

  if (!isLoaded || loading || !panditLocation) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-white font-medium animate-pulse">Initializing Tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-[#0a0a0a] overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/my-bookings")}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white pointer-events-auto hover:bg-black/60 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>

          <div className="flex flex-col items-end gap-2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-auto"
            >
              {connected ? (
                <Signal className="w-4 h-4 text-green-400" />
              ) : (
                <SignalLow className="w-4 h-4 text-orange-400 animate-pulse" />
              )}
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {connected ? "Live Connection" : "Reconnecting..."}
              </span>
            </motion.div>

            {errorStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-tighter"
              >
                Route Error: {errorStatus}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Map Control Stats Bar */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4 pointer-events-none">
        <div className="max-w-lg mx-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Arrival ETA</p>
                <p className="text-xl font-black text-white">{formatEta(etaSeconds ?? undefined)}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Navigation2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Distance</p>
                <p className="text-xl font-black text-white">{formatDistance(distanceMeters ?? undefined)}</p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {routeLoading ? (
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="h-full w-full">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: panditLocation.latitude, lng: panditLocation.longitude }}
          zoom={16}
          onLoad={setMap}
          onDragStart={() => setFollow(false)}
          options={{
            disableDefaultUI: true,
            styles: [
              {
                "elementType": "geometry",
                "stylers": [{ "color": "#242f3e" }]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#746855" }]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#242f3e" }]
              },
              {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#d59563" }]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#d59563" }]
              },
              {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{ "color": "#263c3f" }]
              },
              {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#6b9a76" }]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#38414e" }]
              },
              {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#212a37" }]
              },
              {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#9ca5b3" }]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{ "color": "#746855" }]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#1f2835" }]
              },
              {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#f3d19c" }]
              },
              {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{ "color": "#2f3948" }]
              },
              {
                "featureType": "transit.station",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#d59563" }]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#17263c" }]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#515c6d" }]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#17263c" }]
              }
            ]
          }}
        >
          {/* Route */}
          {routeCoords.length > 0 && (
            <Polyline
              path={routeCoords}
              options={{
                strokeColor: "#F97316",
                strokeOpacity: 0.3,
                strokeWeight: 14,
              }}
            />
          )}
          {routeCoords.length > 0 && (
            <Polyline
              path={routeCoords}
              options={{
                strokeColor: "#F97316",
                strokeOpacity: 1,
                strokeWeight: 8,
              }}
            />
          )}

          {/* Destination Marker */}
          <MarkerF
            position={destination}
            icon={{
              path: "M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z", // House Shape
              fillColor: "#EF4444",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 1.8,
              anchor: new window.google.maps.Point(12, 12),
            }}
            label={{
              text: "HOME",
              color: "white",
              fontWeight: "900",
              fontSize: "10px",
              className: "mt-10"
            }}
          />

          {/* Pandit Marker */}
          <MarkerF
            position={{ lat: panditLocation.latitude, lng: panditLocation.longitude }}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: "#F97316",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 2.2,
              anchor: new window.google.maps.Point(12, 24),
              labelOrigin: new window.google.maps.Point(12, 10),
            }}
            label={{
              text: "🕉️",
              fontSize: "16px",
              color: "white"
            }}
          />
        </GoogleMap>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-10 px-4 md:px-8 pointer-events-none">
        <div className="max-w-md mx-auto flex items-end justify-between gap-4">

          <div className="flex flex-col gap-3 pointer-events-auto">
            <AnimatePresence>
              {!follow && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => setFollow(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95"
                >
                  <Focus className="w-5 h-5" />
                  Recenter
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={() => setFollow(!follow)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10 font-bold transition-all active:scale-95 ${follow
                  ? "bg-white text-black"
                  : "bg-black/40 text-white"
                }`}
            >
              <Navigation className={`w-5 h-5 ${follow ? "animate-pulse" : ""}`} />
              {follow ? "Following" : "Auto-follow Off"}
            </button>
          </div>

          <div className="flex gap-3 pointer-events-auto">
            <button
              onClick={handleCall}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-green-600 text-white shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all active:scale-95"
              title="Call Panditji"
            >
              <Phone className="w-6 h-6 fill-white" />
            </button>
            <button
              onClick={fitBoth}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95"
              title="Fit to Route"
            >
              <Maximize className="w-6 h-6" />
            </button>
            <button
              onClick={() => map?.setMapTypeId(window.google.maps.MapTypeId.HYBRID)}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95"
              title="Satellite View"
            >
              <MapIcon className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>

      {/* Visual Enhancers - Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.4)]" />

      {/* Premium Notification Modal */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border border-stone-100 animate-in fade-in zoom-in duration-300">
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

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {alertConfig.title}
            </h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
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
    </div>
  );
}

export default function TrackPanditPage() {
  const { panditId, destLat, destLng } = useParams();
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");

  const destination = useMemo(() => ({
    lat: Number(destLat),
    lng: Number(destLng),
  }), [destLat, destLng]);

  // Fetch API Key
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
        const res = await fetch(`${apiUrl}/config/maps`);
        if (res.ok) {
          const data = await res.json();
          setGoogleMapsApiKey(data.apiKey);
        }
      } catch (err) {
        console.error("Failed to fetch maps config", err);
      }
    };
    fetchConfig();
  }, []);

  // 🛡️ CRITICAL: Do NOT call useJsApiLoader or mount the map component until we have an actual API KEY.
  // This prevents the "Loader must not be called again with different options" error.
  if (!googleMapsApiKey || !panditId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-white font-medium animate-pulse">
            Establishing Secure Map Connection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TrackingMapContent
      apiKey={googleMapsApiKey}
      panditId={panditId}
      destination={destination}
    />
  );
}
