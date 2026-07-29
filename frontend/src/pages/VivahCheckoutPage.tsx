import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  CloudUpload,
  Gift,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  LogIn,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";
import {
  advanceOf,
  ddmmyyyyToIso,
  DEFAULT_VIVAH_LANGUAGES,
  effectiveAdvancePercent,
  fmtINR,
  isoToDDMMYYYY,
  templeIsFreeInTier,
  type CatalogMuhurat,
  type CrossSellProduct,
  type VivahKashi,
  type VivahPackage,
  type VivahTemple,
} from "../data/vivahCatalog";
import { formatMuhuratDate } from "../data/vivahContent";
import {
  authHeaders,
  clearSession,
  currentUser,
  hasValidSession,
  jsonHeaders,
  humanError,
  humanPaymentError,
  loadRazorpay,
  vivahFetch,
  VivahAuthError,
  pixelVivahInitiateCheckout,
  pixelVivahLead,
  pixelVivahPurchase,
  reportPaymentAbandoned,
} from "../data/vivahApi";
import { sessionToken } from "../data/vivahApi";
import { PJAR, PjarLogo, VivahMark, VivahScope } from "../components/vivah/VivahLayout";
import MuhuratPicker, { prettyTime } from "../components/vivah/MuhuratPicker";
import {
  AnimatePresence,
  AnimatedTotal,
  EASE,
  Reveal,
  RevealItem,
  Stagger,
  motion,
  useLift,
  useTap,
} from "../components/vivah/motion";

/* ========================================================================== */
/*                                  TYPES                                     */
/* ========================================================================== */

type SelectedRitual = {
  slug: string;
  name: string;
  price: number;
  samagriPrice: number;
  /** Set when the card folds several catalog rituals (the Core Ceremony). */
  componentSlugs?: string[];
};

type PackageTier = Pick<
  VivahPackage,
  | "packageId"
  | "name"
  | "price"
  | "panditCount"
  | "hasCoordinator"
  | "gifts"
  | "advancePercent"
  | "freeTempleDarshan"
  | "templeDarshanCount"
>;

type CheckoutState = {
  rituals?: SelectedRitual[];
  isSampooranPackage?: boolean;
  samagriNeeded?: boolean;
  packageTier?: PackageTier;
  packagePricing?: { name: string; packagePrice: number; samagriPrice: number };
  crossSell?: CrossSellProduct[];
  advancePercent?: number;
  supportedLanguages?: string[];
  temples?: VivahTemple[];
  kashi?: VivahKashi | null;
  muhurats?: CatalogMuhurat[];
  /** Kashi seva the family already added on the landing page. */
  preInviteKashi?: boolean;
  preKashiPanditName?: string;
};

type Person = { name: string; dob: string; tob: string; pob: string };
const EMPTY_PERSON: Person = { name: "", dob: "", tob: "", pob: "" };

/* ========================================================================== */
/*                            PRESENTATION PIECES                             */
/* ========================================================================== */

const INPUT =
  "w-full bg-transparent text-[14px] text-viv-ink placeholder-viv-muted-2 focus:outline-none";

/** A bordered well with the label sitting inside, as drawn in the comp. */
function Field({
  label,
  children,
  className = "",
  error,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
  /** Set after a failed submit — turns the well red and prints the reason. */
  error?: string;
}) {
  return (
    <span className={`block ${className}`}>
      <label
        className={`block bg-white/70 border rounded-xl px-3.5 py-2.5 transition-all ${
          error
            ? "border-red-400 ring-2 ring-red-200/70"
            : "border-viv-hair focus-within:border-viv-gold focus-within:ring-2 focus-within:ring-viv-gold/15"
        }`}
      >
        {label && (
          <span
            className={`block text-[10.5px] font-medium mb-0.5 ${
              error ? "text-red-600" : "text-viv-muted-2"
            }`}
          >
            {label}
          </span>
        )}
        {children}
      </label>
      {error && (
        <span role="alert" className="block text-[11px] text-red-600 mt-1 ml-1">
          {error}
        </span>
      )}
    </span>
  );
}

/** One block inside the single ivory sheet, hairline-separated as in the comp. */
function Block({
  title,
  icon: Icon,
  children,
  id,
  flash = false,
  incomplete = false,
}: {
  title?: string;
  icon?: typeof User;
  children: React.ReactNode;
  /** Anchor the checklist and the scroll-to-error jump to. */
  id?: string;
  /** Pulse the section ring — set briefly after a failed submit. */
  flash?: boolean;
  /** Show the red "needs attention" chip beside the title. */
  incomplete?: boolean;
}) {
  return (
    <section
      id={id}
      className={`px-5 sm:px-7 py-5 border-b border-viv-hair/70 last:border-b-0 scroll-mt-24 ${
        flash ? "viv-flash" : ""
      }`}
    >
      {title && (
        <h2 className="display text-[18px] text-viv-maroon flex items-center gap-2 mb-3">
          {Icon && <Icon className="w-4 h-4 text-viv-gold" />}
          {title}
          {incomplete && (
            <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
              Needs attention
            </span>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  right,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="w-full flex items-center gap-3 text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-viv-ink">{label}</p>
        {hint && <p className="text-[11.5px] text-viv-muted mt-0.5 leading-snug">{hint}</p>}
      </div>
      {right}
      <span
        className={`w-12 h-6.5 rounded-full p-0.5 shrink-0 transition-colors ${
          value ? "bg-viv-maroon" : "bg-viv-muted-2/45"
        }`}
      >
        <span
          className={`block w-5.5 h-5.5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5.5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[12.5px] text-viv-muted">{label}</span>
      <span
        className={`text-[13px] font-semibold ${muted ? "text-viv-muted-2" : "text-viv-ink"} text-right`}
      >
        {value}
      </span>
    </div>
  );
}

const CHIP = (on: boolean) =>
  `text-[12px] font-medium rounded-full px-3.5 py-1.5 border transition-colors ${
    on
      ? "bg-viv-maroon text-viv-cream border-viv-maroon"
      : "bg-white/70 text-viv-ink/85 border-viv-hair hover:border-viv-gold"
  }`;

/* ========================================================================== */
/*                                   PAGE                                     */
/* ========================================================================== */

export default function VivahCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, openLoginModal, logout } = useAuth();
  const state = (location.state || {}) as CheckoutState;

  // Memoised because `state.rituals || []` would hand a fresh array to the
  // expandedSlugs useMemo on every render, defeating it.
  const rituals = useMemo(() => state.rituals || [], [state.rituals]);
  const isSampooranPackage = !!state.isSampooranPackage;
  const packageTier = state.packageTier || null;
  const packagePricing = state.packagePricing || null;
  const crossSellProducts = state.crossSell || [];
  const templesParam = state.temples || [];
  const kashiParam = state.kashi || null;
  const muhuratsParam = (state.muhurats || []).filter((m) => m.isActive !== false);
  const languageOptions = state.supportedLanguages?.length
    ? state.supportedLanguages
    : DEFAULT_VIVAH_LANGUAGES;
  // Resolved through the SAME clamped helper the server uses
  // (`effectiveAdvancePercent`: tier override only when 0 < p <= 100, else the
  // catalog default). Rolling our own here is how the button ends up promising
  // "Pay 150% advance" while the server charges 50%.
  const advancePercent = effectiveAdvancePercent(
    state.advancePercent,
    packageTier as VivahPackage | null
  );

  const hasSelection = rituals.length > 0 || isSampooranPackage || !!packageTier;

  // A direct hit / refresh carries no router state → send them back to pick.
  useEffect(() => {
    if (!hasSelection) navigate("/vedic-vivah", { replace: true });
  }, [hasSelection, navigate]);

  /* ── Form state ───────────────────────────────────────────────────────── */
  const [devoteeName, setDevoteeName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [needMuhuratHelp, setNeedMuhuratHelp] = useState(true);
  const [eventDate, setEventDate] = useState(""); // DD/MM/YYYY
  const [eventTime, setEventTime] = useState(""); // HH:mm
  const [language, setLanguage] = useState("");
  const [langOther, setLangOther] = useState(false);
  const [customLang, setCustomLang] = useState("");

  const [selectedMuhurat, setSelectedMuhurat] = useState<CatalogMuhurat | null>(null);
  const [selectedTempleId, setSelectedTempleId] = useState("");
  // Pre-filled when the family added the Kashi Acharya on the landing page.
  const [inviteKashi, setInviteKashi] = useState(!!state.preInviteKashi);
  const [kashiPanditName, setKashiPanditName] = useState(state.preKashiPanditName || "");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [stateName, setStateName] = useState("");

  const [kundaliMode, setKundaliMode] = useState<"details" | "upload">("details");
  const [boy, setBoy] = useState<Person>(EMPTY_PERSON);
  const [girl, setGirl] = useState<Person>(EMPTY_PERSON);
  const [kundaliBoyUrl, setKundaliBoyUrl] = useState("");
  const [kundaliGirlUrl, setKundaliGirlUrl] = useState("");
  const [kundaliBoyName, setKundaliBoyName] = useState("");
  const [kundaliGirlName, setKundaliGirlName] = useState("");
  const [uploadingSide, setUploadingSide] = useState<null | "boy" | "girl">(null);

  const [samagriNeeded, setSamagriNeeded] = useState(state.samagriNeeded !== false);
  const [notes, setNotes] = useState("");
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});

  const [payMode, setPayMode] = useState<"advance" | "full">("advance");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successType, setSuccessType] = useState<null | "paid" | "lead">(null);
  /** The amount the SERVER actually charged, used for the receipt copy. */
  const [chargedAmount, setChargedAmount] = useState(0);
  /**
   * Set when Razorpay captured the money but our confirmation call failed.
   * While this is set the "Pay" CTA is replaced by a retry — re-running the
   * whole flow would mint a SECOND order and charge the family twice.
   */
  const [pendingVerification, setPendingVerification] = useState<null | {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
  }>(null);

  const boyFileRef = useRef<HTMLInputElement | null>(null);
  const girlFileRef = useRef<HTMLInputElement | null>(null);

  const lift = useLift();
  const tap = useTap();

  /* ── Field-level validation ────────────────────────────────────────────
     One failed submit used to produce a single red line at the bottom of the
     page. Now every missing field is outlined and captioned individually, the
     section carrying the FIRST problem is scrolled to and pulsed, and errors
     clear the moment the family fixes the field. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [flashId, setFlashId] = useState("");

  const clearErr = (...keys: string[]) =>
    setFieldErrors((prev) => {
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const scrollFlash = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(id);
    window.setTimeout(() => setFlashId(""), 2600);
  };



  /* ── Session ──────────────────────────────────────────────────────────
     Tokens live 7 days. A dead one used to surface as a raw "Invalid or
     expired token" banner at the exact moment of payment, with no way out.
     We now track it, show it before the form is filled, and re-run whatever
     the family was trying to do the moment they sign back in. */
  const [signedIn, setSignedIn] = useState(() => hasValidSession());
  /** Set when a call was interrupted by a dead session; replayed after login. */
  const resumeRef = useRef<null | "pay" | "lead">(null);

  // AuthContext's `token` flips the moment the login modal succeeds.
  useEffect(() => {
    const ok = hasValidSession();
    setSignedIn(ok);
    if (!ok || !resumeRef.current) return;
    const action = resumeRef.current;
    resumeRef.current = null;
    setError("");
    // Let the modal finish closing before we re-open the payment sheet.
    const t = setTimeout(() => {
      if (action === "pay") void submitPayment();
      else void submitLead();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /** Common landing spot for a rejected token. */
  const handleAuthLoss = (action: "pay" | "lead" | null, message: string) => {
    // logout() clears the same three keys AND resets AuthContext, so the header
    // and the rest of the site stop showing a session that no longer exists.
    logout();
    clearSession();
    setSignedIn(false);
    resumeRef.current = action;
    setError(message);
    setSubmitting(false);
    openLoginModal();
  };

  const requireSignIn = (action: "pay" | "lead"): boolean => {
    if (hasValidSession()) return true;
    handleAuthLoss(
      action,
      sessionToken()
        ? "Your session has expired. Please sign in again — we've kept everything you filled in."
        : "Please sign in to confirm your booking — we've kept everything you filled in."
    );
    return false;
  };

  // Prefill from the signed-in family.
  useEffect(() => {
    const u = currentUser();
    if (!u) return;
    setDevoteeName((v) => v || u.name || "");
    setWhatsapp((v) => v || String(u.phone || "").replace(/\D/g, "").slice(-10));
    setEmail((v) => v || u.email || "");
  }, [token]);

  // Referral code captured site-wide by <ReferralCapture/> in App.tsx.
  const referralCode = useMemo(() => {
    try {
      const raw = localStorage.getItem("pjar_partner_ref");
      return raw ? String(JSON.parse(raw)?.code || "") : "";
    } catch {
      return "";
    }
  }, []);

  /* ── Kundali is only asked for on à-la-carte Kundali Milan ─────────────── */
  // Compare against the EXPANDED slugs, not the display slugs. A card can fold
  // several catalog rituals (the "Core Ceremony"), and the folded card reports
  // slug "vivah-sanskar" — so if an admin reorders the catalog such that
  // kundali-milan lands inside the fold, a display-slug check would hide this
  // section while the server (which sees the expanded steps) hard-rejects the
  // booking with "please enter the birth details". Dead end for the family.
  const expandedSlugs = useMemo(
    () => rituals.flatMap((r) => (r.componentSlugs?.length ? r.componentSlugs : [r.slug])),
    [rituals]
  );
  const kundaliRequired =
    !isSampooranPackage && !packageTier && expandedSlugs.includes("kundali-milan");

  /** Section completion, live — drives the checklist and the badges. */
  const youDone = devoteeName.trim().length > 0 && whatsapp.replace(/\D/g, "").length === 10;
  const vivahDone = needMuhuratHelp || !!eventDate;
  const kundaliDone =
    !kundaliRequired ||
    (kundaliMode === "upload"
      ? !!kundaliBoyUrl && !!kundaliGirlUrl
      : [boy, girl].every((p) => p.name.trim() && p.dob && p.tob && p.pob.trim()));

  // The kundali error clears itself the moment the section is complete.
  useEffect(() => {
    if (kundaliDone) clearErr("kundali");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kundaliDone]);

  /* ── Pricing (mirrors the server's maths exactly) ──────────────────────── */
  const isTier = !!packageTier;

  const baseAmount = isTier
    ? packageTier!.price || 0
    : isSampooranPackage
      ? packagePricing?.packagePrice || 0
      : rituals.reduce((s, r) => s + (r.price || 0), 0);

  const samagriTotal = isTier
    ? 0
    : isSampooranPackage
      ? packagePricing?.samagriPrice || 0
      : rituals.reduce((s, r) => s + (r.samagriPrice || 0), 0);

  const samagriAmount = samagriNeeded ? samagriTotal : 0;

  const addOnAmount = crossSellProducts.reduce(
    (s, p) => s + (addOnQty[p.shopifyProductId] || 0) * (p.price || 0),
    0
  );

  // Uses the SAME rule the server applies (freeTempleDarshan || count > 0),
  // not a name-match on the packageId — so a renamed tier can't mis-price.
  const templeFreeInTier = templeIsFreeInTier(packageTier as VivahPackage | null);
  const selectedTemple = templesParam.find((t) => t.templeId === selectedTempleId) || null;
  const templeAmount = selectedTemple ? (templeFreeInTier ? 0 : selectedTemple.price || 0) : 0;

  const kashiAmount = inviteKashi && kashiParam ? kashiParam.premiumPrice || 0 : 0;

  const total = baseAmount + samagriAmount + addOnAmount + templeAmount + kashiAmount;
  const advance = advanceOf(total, advancePercent);
  const balance = Math.max(0, total - advance);
  const payableNow = payMode === "full" ? total : advance;

  const selectionLabel = isTier
    ? `${packageTier!.name} Package`
    : isSampooranPackage
      ? packagePricing?.name || "Sampooran Vivah (Complete Package)"
      : rituals.map((r) => r.name).join(", ");

  /* ── Validation ───────────────────────────────────────────────────────── */
  /** Null when clean; otherwise every problem, keyed by field, plus where to scroll. */
  const validate = (): string | null => {
    const errs: Record<string, string> = {};
    let firstId = "";
    const flag = (key: string, msg: string, sectionId: string) => {
      errs[key] = msg;
      if (!firstId) firstId = sectionId;
    };

    if (!devoteeName.trim()) flag("devoteeName", "Please enter your name.", "sec-you");
    if (whatsapp.replace(/\D/g, "").length < 10)
      flag("whatsapp", "A valid 10-digit WhatsApp number is needed.", "sec-you");
    if (!needMuhuratHelp && !eventDate)
      flag(
        "eventDate",
        "Pick a date on the calendar — or switch on “Let our Pandit Ji choose”.",
        "sec-vivah"
      );
    if (kundaliRequired) {
      if (kundaliMode === "upload") {
        if (!kundaliBoyUrl || !kundaliGirlUrl)
          flag("kundali", "Both the Var and Vadhu kundali images are needed.", "sec-kundali");
      } else {
        const ok = (p: Person) => p.name.trim() && p.dob && p.tob && p.pob.trim();
        if (!ok(boy) || !ok(girl))
          flag(
            "kundali",
            "Name, date, time and place of birth are needed for both the Var and Vadhu.",
            "sec-kundali"
          );
      }
    }

    if (!firstId) {
      setFieldErrors({});
      return null;
    }
    setFieldErrors(errs);
    scrollFlash(firstId);
    return "Please complete the highlighted fields to continue.";
  };

  /* ── Payload (identical shape to the app's) ────────────────────────────── */
  const buildPayload = (paymentOption?: "advance" | "full") => ({
    userId: currentUser()?._id,
    referralCode,
    devoteeName: devoteeName.trim(),
    whatsapp: whatsapp.trim(),
    email: email.trim(),
    eventDate,
    eventTime: needMuhuratHelp ? "" : eventTime,
    needMuhuratHelp,
    language: (langOther ? customLang : language).trim(),
    samagriNeeded,
    notes: notes.trim(),
    address: {
      street: street.trim(),
      pincode: pincode.trim(),
      city: city.trim(),
      state: stateName.trim(),
    },
    kundaliMode,
    kundaliBoyUrl,
    kundaliGirlUrl,
    ...(kundaliRequired
      ? {
          boy: { name: boy.name.trim(), dob: boy.dob, tob: boy.tob, pob: boy.pob.trim() },
          girl: { name: girl.name.trim(), dob: girl.dob, tob: girl.tob, pob: girl.pob.trim() },
        }
      : {}),
    // Expand any folded "Core Ceremony" card into its underlying ritual slugs so
    // the server prices and books each one individually.
    selectedSteps: expandedSlugs.map((s) => ({ stepId: s })),
    isSampooranPackage,
    ...(packageTier ? { packageId: packageTier.packageId } : {}),
    addOnProducts: crossSellProducts
      .filter((p) => (addOnQty[p.shopifyProductId] || 0) > 0)
      .map((p) => ({ shopifyProductId: p.shopifyProductId, qty: addOnQty[p.shopifyProductId] })),
    ...(selectedTempleId ? { liveDarshanTempleId: selectedTempleId } : {}),
    inviteKashiPandit: inviteKashi,
    ...(inviteKashi && kashiPanditName ? { kashiPanditName } : {}),
    ...(selectedMuhurat
      ? {
          selectedMuhurat: {
            date: selectedMuhurat.date,
            day: selectedMuhurat.day || "",
            tithi: selectedMuhurat.tithi || "",
            nakshatra: selectedMuhurat.nakshatra || "",
          },
        }
      : {}),
    isPreBooking: !!selectedMuhurat,
    ...(paymentOption ? { paymentOption } : {}),
  });

  /* ── Kundali upload ───────────────────────────────────────────────────── */
  const uploadKundali = async (side: "boy" | "girl", file: File) => {
    if (!hasValidSession()) {
      handleAuthLoss(null, "Please sign in to upload a kundali.");
      return;
    }
    setUploadingSide(side);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await vivahFetch(`${API_URL}/bookings/vedic-vivah/upload-kundali`, {
        method: "POST",
        // No Content-Type — the browser must set the multipart boundary itself.
        headers: { Accept: "application/json", ...authHeaders() },
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.url) {
        throw new Error(data?.message || "Could not upload the kundali.");
      }
      if (side === "boy") {
        setKundaliBoyUrl(data.url);
        setKundaliBoyName(file.name || "Var kundali uploaded");
      } else {
        setKundaliGirlUrl(data.url);
        setKundaliGirlName(file.name || "Vadhu kundali uploaded");
      }
    } catch (e: any) {
      if (e instanceof VivahAuthError) {
        handleAuthLoss(null, e.message);
        return;
      }
      setError(humanError(e, "upload-kundali"));
    } finally {
      setUploadingSide(null);
    }
  };

  /* ── Submit: callback request (no payment) ─────────────────────────────── */
  const submitLead = async () => {
    const v = validate();
    if (v) return setError(v);
    if (!requireSignIn("lead")) return;

    setError("");
    setSubmitting(true);
    try {
      const res = await vivahFetch(`${API_URL}/bookings/vedic-vivah/create-lead`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) {
        throw new Error(data?.message || "");
      }
      pixelVivahLead(selectionLabel);
      setSuccessType("lead");
    } catch (e: any) {
      if (e instanceof VivahAuthError) {
        handleAuthLoss("lead", e.message);
        return;
      }
      setError(humanError(e, "create-lead"));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Confirm a captured payment with our server.
   *
   * Split out of the Razorpay handler so it can be RETRIED without creating a
   * second order. The money is already captured by the time this runs, so the
   * failure path must never leave the family looking at a live "Pay" button —
   * that's how you double-charge someone. Instead we park the receipt and offer
   * a retry; the server's confirmation is idempotent, so retrying is safe.
   */
  const confirmPayment = async (receipt: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
  }) => {
    setSubmitting(true);
    try {
      const verifyRes = await vivahFetch(`${API_URL}/bookings/vedic-vivah/complete-payment`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          bookingId: receipt.bookingId,
          razorpayPaymentId: receipt.razorpayPaymentId,
          razorpayOrderId: receipt.razorpayOrderId,
          razorpaySignature: receipt.razorpaySignature,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || verifyData?.success !== true) {
        throw new Error(verifyData?.message || "Payment verification failed.");
      }
      pixelVivahPurchase(receipt.razorpayOrderId, receipt.amount, selectionLabel);
      setPendingVerification(null);
      setChargedAmount(receipt.amount);
      setError("");
      setSuccessType("paid");
    } catch (e: any) {
      // The money IS captured by now. Park the receipt whatever went wrong —
      // and on an auth failure prompt for login WITHOUT queueing a replay of
      // submitPayment, which would mint a second order and charge again.
      setPendingVerification(receipt);
      if (e instanceof VivahAuthError) {
        logout();
        clearSession();
        setSignedIn(false);
        resumeRef.current = null;
        setError(
          "Your payment went through, but your session expired before we could record it. " +
            "Sign in again and tap “Confirm my payment” — you will not be charged twice."
        );
        openLoginModal();
        return;
      }
      // Money is captured. Whatever the cause, the family must hear that first.
      setError(
        `Your payment went through — we just couldn't record it yet. Your money is safe. ` +
          `Tap “Confirm my payment” to finish; you will not be charged twice. ` +
          `(${humanError(e, "complete-payment")})`
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit: pay & confirm ─────────────────────────────────────────────── */
  const submitPayment = async () => {
    const v = validate();
    if (v) return setError(v);
    if (!requireSignIn("pay")) return;

    setError("");
    setSubmitting(true);
    let createdBookingId = "";

    try {
      const RazorpayCtor = await loadRazorpay();

      const orderRes = await vivahFetch(`${API_URL}/bookings/vedic-vivah/create-order`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(buildPayload(payMode)),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || orderData?.success !== true) {
        throw new Error(orderData?.message || "Failed to create order");
      }
      createdBookingId = String(orderData.bookingId);

      // ── Reconcile before we take money ───────────────────────────────────
      // The server re-prices everything from the admin catalog. If the page was
      // painted from stale/bundled defaults (a failed catalog fetch, or an admin
      // repricing mid-session), the family is looking at a different number than
      // the one about to be charged. Refuse to open the gateway on a mismatch.
      const serverPayable = Number(orderData.amount);
      if (Number.isFinite(serverPayable) && serverPayable !== payableNow) {
        setError(
          `Our prices were updated while you were filling this in. The current amount is ${fmtINR(
            serverPayable
          )} (this page showed ${fmtINR(
            payableNow
          )}). Please reload the page and book again — you have not been charged.`
        );
        setSubmitting(false);
        return;
      }

      pixelVivahInitiateCheckout(serverPayable, selectionLabel);

      const rzp = new RazorpayCtor({
        key: orderData.razorpayKeyId,
        amount: Number(orderData.amount) * 100,
        currency: orderData.currency || "INR",
        name: "Pandit Ji At Request",
        description:
          payMode === "full"
            ? "Vedic Vivah Sanskar — full payment"
            : "Vedic Vivah Sanskar — advance to confirm",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: devoteeName.trim(),
          contact: whatsapp.replace(/\D/g, ""),
          email: email.trim() || "yajaman@panditjiatrequest.com",
        },
        notes: { bookingId: createdBookingId, service: "Vedic Vivah Sanskar" },
        theme: { color: "#C04A01" },
        handler: async (response: any) => {
          const receipt = {
            bookingId: String(orderData.bookingId),
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount: serverPayable,
          };
          await confirmPayment(receipt);
        },
        modal: {
          ondismiss: () => {
            reportPaymentAbandoned(createdBookingId, devoteeName.trim(), whatsapp);
            setError("Your payment was not completed. You can try again or request a callback.");
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        setError(humanPaymentError(resp));
        setSubmitting(false);
      });

      rzp.open();
    } catch (e: any) {
      // Nothing has been charged on this path — the gateway never opened — so
      // replaying after a fresh login is safe.
      if (e instanceof VivahAuthError) {
        handleAuthLoss("pay", e.message);
        return;
      }
      setError(humanError(e, "create-order"));
      setSubmitting(false);
    }
  };

  if (!hasSelection) return null;

  /**
   * A prefilled WhatsApp confirmation. The booking is already recorded on the
   * server by the time this is offered — this just puts the family and our
   * Vivah desk in the same thread with the details already typed out.
   */
  const whatsappConfirmUrl = (() => {
    const lines = [
      "🙏 Namaste! I have just booked my Vedic Vivah Sanskar.",
      "",
      `Name: ${devoteeName.trim() || "—"}`,
      `Ceremony: ${selectionLabel || "—"}`,
      `Muhurat: ${
        needMuhuratHelp && !eventDate
          ? "Pandit Ji will suggest"
          : `${eventDate}${eventTime ? `, ${prettyTime(eventTime)}` : ""}`
      }`,
      ...(selectedTemple ? [`Mandir: ${selectedTemple.name}`] : []),
      ...(inviteKashi ? [`Kashi Acharya: ${kashiPanditName || "Any available Acharya"}`] : []),
      `Samagri: ${samagriNeeded ? "Pandit Ji arranges" : "We will arrange"}`,
      `Total seva: ${fmtINR(total)}`,
      successType === "paid"
        ? `Paid now: ${fmtINR(chargedAmount || payableNow)}`
        : "I would like a callback to confirm.",
      "",
      "Please confirm my booking. 🪔",
    ];
    return `https://wa.me/919056955311?text=${encodeURIComponent(lines.join("\n"))}`;
  })();

  const bump = (id: string, delta: number) =>
    setAddOnQty((prev) => {
      const next = { ...prev };
      const q = Math.max(0, Math.min(9, (next[id] || 0) + delta));
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });

  /* ====================================================================== */

  return (
    <VivahScope className="pb-40">
      <Helmet>
        <title>Vivah Sankalp — Complete your Vedic Vivah booking | Pandit Ji At Request</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-viv-maroon-900/96 backdrop-blur border-b border-viv-gold/25">
        <div className="max-w-[860px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-full border border-viv-gold/45 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-viv-gold-lt" />
          </button>
          <PjarLogo className="h-7 sm:h-8" onDark />
          <div className="min-w-0 flex-1">
            <h1 className="display text-[19px] text-viv-cream leading-tight">Vivah Sankalp</h1>
            <p className="text-[10.5px] text-viv-gold-lt leading-tight">वैदिक विवाह संकल्प</p>
          </div>
          <a
            href={PJAR.phoneHref}
            aria-label={`Call ${PJAR.phoneDisplay}`}
            className="w-9 h-9 rounded-full border border-viv-gold/45 flex items-center justify-center shrink-0"
          >
            <Phone className="w-4 h-4 text-viv-gold-lt" />
          </a>
        </div>
      </div>

      {/* ── Invocation band ── */}
      <div className="max-w-[860px] mx-auto px-4">
        <div className="relative bg-viv-maroon-900 rounded-b-[6px] overflow-hidden min-h-[170px] sm:min-h-[190px] flex items-center">
          <div
            className="viv-art-sankalp-mobile absolute inset-0 bg-cover bg-center sm:hidden"
          />
          <div
            className="viv-art-sankalp-desktop absolute inset-0 bg-cover bg-center hidden sm:block"
          />
          {/* Mobile art is candle-dark → dark scrim + cream text. The desktop
              art is ivory on the left → a soft light wash + maroon text. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,9,8,0.9)_0%,rgba(33,9,8,0.62)_55%,rgba(33,9,8,0.88)_100%)] sm:bg-[linear-gradient(95deg,rgba(253,250,244,0.9)_0%,rgba(253,250,244,0.68)_38%,rgba(253,250,244,0.12)_68%,rgba(253,250,244,0)_100%)]" />
          <div className="relative px-5 sm:px-7 py-6 max-w-[420px]">
            <h2 className="display text-[21px] sm:text-[24px] text-viv-cream sm:text-viv-maroon leading-snug">
              Begin your sacred union
              <br />
              with divine grace.
            </h2>
            <p className="text-[12px] text-viv-cream/70 sm:text-viv-muted mt-2 leading-relaxed">
              Share a few details and our verified Pandit Ji will guide every vidhi with devotion. 🙏
            </p>
          </div>
        </div>
      </div>

      {/* ── The ivory sheet ── */}
      <main className="max-w-[860px] mx-auto px-4 relative">
        <div className="relative bg-viv-sheet rounded-[16px] border border-viv-hair shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Hanging toran ornament, as drawn in the comp. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-0 z-0 w-11 h-16 bg-viv-maroon hidden sm:flex items-start justify-center pt-2.5 rounded-b-[6px] [clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)]"
          >
            <VivahMark size={24} tone="cream" />
          </span>

          {/* ── Sign-in gate ── */}
          <AnimatePresence initial={false}>
            {!signedIn && (
              <motion.div
                key="signin"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                style={{ overflow: "hidden" }}
              >
                <div className="relative z-10 m-4 sm:m-5 sm:mr-20 rounded-xl border border-viv-orange bg-gradient-to-r from-viv-tint to-viv-tint-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-viv-orange text-white flex items-center justify-center shrink-0">
                    <LogIn className="w-4.5 h-4.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-viv-ink">
                      Sign in to confirm your booking
                    </p>
                    <p className="text-[11.5px] text-viv-muted mt-0.5 leading-snug">
                      One OTP on your WhatsApp number. Fill this form either way — nothing you
                      type here is lost when you sign in.
                    </p>
                  </div>
                  <motion.button
                    {...tap}
                    onClick={openLoginModal}
                    className="shrink-0 bg-gradient-to-b from-viv-orange-lt to-viv-orange text-white font-semibold text-[13px] px-5 py-2.5 rounded-full"
                  >
                    Sign in
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Your details, in one glance: what's filled, what's left ── */}
          <div className="px-4 sm:px-5 pt-4">
            <div className="rounded-xl border border-viv-hair bg-white/70 px-4 py-3">
              <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-viv-muted-2 mb-2">
                Complete these to confirm
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["sec-you", "Your Details", youDone, true],
                    ["sec-vivah", "Vivah Details", vivahDone, true],
                    ...(kundaliRequired
                      ? ([["sec-kundali", "Kundali Milan", kundaliDone, true]] as const)
                      : []),
                    ["sec-address", "Address", !!(street || city || pincode), false],
                  ] as const
                ).map(([id, label, done, required]) => {
                  const attention = required && !done && Object.keys(fieldErrors).length > 0;
                  return (
                    <motion.button
                      key={id}
                      {...tap}
                      onClick={() => scrollFlash(id)}
                      className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold rounded-full pl-1.5 pr-3 py-1 border transition-colors ${
                        done
                          ? "bg-viv-tint text-viv-ink border-viv-hair"
                          : attention
                            ? "bg-red-50 text-red-700 border-red-300"
                            : "bg-white text-viv-muted border-viv-hair hover:border-viv-gold"
                      }`}
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded-full flex items-center justify-center ${
                          done
                            ? "bg-viv-orange text-white"
                            : attention
                              ? "bg-red-500 text-white"
                              : "bg-viv-gold-pale text-viv-maroon"
                        }`}
                      >
                        {done ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </span>
                      {label}
                      {!required && <span className="font-normal text-viv-muted-2">· optional</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Selection summary ── */}
          <Block
            title={isTier || isSampooranPackage ? "Your Package" : "Your Selected Rituals"}
            icon={CheckCircle2}
          >
            {isTier ? (
              <>
                <p className="display text-[19px] text-viv-ink">{packageTier!.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] font-medium text-viv-maroon bg-white border border-viv-hair rounded-full px-3 py-1.5">
                    {packageTier!.panditCount} Pandit Ji
                    {(packageTier!.panditCount || 1) > 1 ? "s" : ""}
                  </span>
                  {packageTier!.hasCoordinator && (
                    <span className="text-[11px] font-medium text-viv-maroon bg-white border border-viv-hair rounded-full px-3 py-1.5">
                      Dedicated coordinator
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-viv-maroon bg-white border border-viv-hair rounded-full px-3 py-1.5">
                    All rituals • Samagri
                  </span>
                </div>
                {!!packageTier!.gifts?.length && (
                  <div className="mt-3.5 rounded-xl border-2 border-viv-gold/50 bg-gradient-to-br from-viv-tint to-viv-tint-2 overflow-hidden">
                    <div className="px-4 py-2.5 bg-viv-gold/15 border-b border-viv-gold/30 flex items-center justify-between gap-2">
                      <p className="text-[12.5px] font-bold text-viv-ink flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-viv-orange" /> Free gifts included
                      </p>
                      <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase bg-viv-orange text-white rounded-full px-2.5 py-1">
                        {packageTier!.gifts.length} Uphaar · Free
                      </span>
                    </div>
                    <ul className="p-3 space-y-2">
                      {packageTier!.gifts.map((g, i) => (
                        <li
                          key={`${g.title}-${i}`}
                          className="flex items-center gap-3 bg-white/70 border border-viv-hair rounded-lg p-2"
                        >
                          <span className="w-11 h-11 rounded-lg overflow-hidden bg-viv-gold-pale border border-viv-hair flex items-center justify-center shrink-0">
                            {g.image ? (
                              <img src={g.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <Gift className="w-4.5 h-4.5 text-viv-maroon" />
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12.5px] font-semibold text-viv-ink leading-snug">
                              {g.title}
                              {(g.count || 1) > 1 ? ` ×${g.count}` : ""}
                            </span>
                            {(g.forWhom || g.price) && (
                              <span className="block text-[10.5px] text-viv-muted mt-0.5">
                                {[g.forWhom && `For ${g.forWhom}`, g.price && `worth ${fmtINR(g.price)}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-viv-orange bg-viv-tint border border-viv-hair rounded-full px-2 py-0.5 shrink-0">
                            FREE
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : isSampooranPackage ? (
              <p className="display text-[19px] text-viv-ink">
                {packagePricing?.name || "Sampooran Vivah (Complete Package)"}
              </p>
            ) : (
              <ul className="space-y-2">
                {rituals.map((r) => (
                  <li key={r.slug} className="flex items-start justify-between gap-3">
                    <span className="text-[13.5px] text-viv-ink/85">{r.name}</span>
                    <span className="text-[13px] font-semibold text-viv-ink whitespace-nowrap">
                      {fmtINR(r.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="h-px bg-viv-hair my-3.5" />
            <Row
              label={isTier || isSampooranPackage ? "Package price" : "Rituals subtotal"}
              value={fmtINR(baseAmount)}
            />
            {samagriTotal > 0 && (
              <Row
                label={samagriNeeded ? "Samagri (Pandit Ji arranges)" : "Samagri (you'll arrange)"}
                value={samagriNeeded ? fmtINR(samagriAmount) : "—"}
                muted={!samagriNeeded}
              />
            )}
          </Block>

          {/* ── Cross-sell gifts ── */}
          {crossSellProducts.length > 0 && (
            <Block title="Add a Gift (optional)" icon={Gift}>
              <p className="text-[12px] text-viv-muted mb-3">
                Bless the couple with something more — add gifts from our shop at special Vivah
                pricing.
              </p>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {crossSellProducts.map((p) => {
                  const q = addOnQty[p.shopifyProductId] || 0;
                  return (
                    <div
                      key={p.shopifyProductId}
                      className="shrink-0 w-[150px] bg-white border border-viv-hair rounded-xl p-2.5"
                    >
                      <div className="w-full h-[92px] rounded-lg bg-viv-tint overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Gift className="w-6 h-6 text-viv-gold" />
                        )}
                      </div>
                      <p className="text-[12px] font-semibold text-viv-ink mt-2 line-clamp-2 leading-snug">
                        {p.title}
                      </p>
                      <p className="text-[12.5px] font-bold text-viv-ink mt-1">
                        {fmtINR(p.price)}
                        {!!p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-[10.5px] text-viv-muted-2 line-through ml-1.5">
                            {fmtINR(p.compareAtPrice)}
                          </span>
                        )}
                      </p>
                      {q === 0 ? (
                        <button
                          onClick={() => bump(p.shopifyProductId, 1)}
                          className="mt-2 w-full text-[12px] font-bold text-viv-orange bg-viv-tint border border-viv-hair rounded-lg py-1.5 flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      ) : (
                        <div className="mt-2 flex items-center justify-between bg-viv-tint border border-viv-hair rounded-lg px-1.5 py-1">
                          <button
                            onClick={() => bump(p.shopifyProductId, -1)}
                            aria-label="Decrease"
                            className="w-6 h-6 rounded-md bg-white flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5 text-viv-orange" />
                          </button>
                          <span className="text-[13px] font-bold text-viv-ink">{q}</span>
                          <button
                            onClick={() => bump(p.shopifyProductId, 1)}
                            aria-label="Increase"
                            className="w-6 h-6 rounded-md bg-white flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5 text-viv-orange" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Block>
          )}

          {/* ── Your details ── */}
          <Block
            id="sec-you"
            flash={flashId === "sec-you"}
            incomplete={!!(fieldErrors.devoteeName || fieldErrors.whatsapp)}
            title="Your Details"
            icon={User}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full Name" error={fieldErrors.devoteeName}>
                <input
                  className={INPUT}
                  value={devoteeName}
                  onChange={(e) => {
                    setDevoteeName(e.target.value);
                    clearErr("devoteeName");
                  }}
                  placeholder="Yajaman ka naam"
                  autoComplete="name"
                />
              </Field>
              <Field label="WhatsApp Number" error={fieldErrors.whatsapp}>
                <input
                  className={INPUT}
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10));
                    clearErr("whatsapp");
                  }}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  autoComplete="tel-national"
                />
              </Field>
              <Field label="Email (optional)" className="sm:col-span-2">
                <input
                  className={INPUT}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  type="email"
                  autoComplete="email"
                />
              </Field>
            </div>
          </Block>

          {/* ── Vivah details: date, muhurat and language in ONE place ── */}
          <Block
            id="sec-vivah"
            flash={flashId === "sec-vivah"}
            incomplete={!!fieldErrors.eventDate}
            title="Vivah Details"
            icon={Calendar}
          >
            <p className="text-[12px] text-viv-muted -mt-1.5 mb-3 leading-relaxed">
              Choose your date and time, or let our Pandit Ji find the most auspicious muhurat for
              your family.
            </p>

            {fieldErrors.eventDate && (
              <p role="alert" className="text-[11.5px] text-red-600 mb-2 -mt-1">
                {fieldErrors.eventDate}
              </p>
            )}
            <MuhuratPicker
              date={eventDate}
              onDateChange={(d) => {
                setEventDate(d);
                if (d) clearErr("eventDate");
              }}
              time={eventTime}
              onTimeChange={setEventTime}
              muhurats={muhuratsParam}
              onMuhuratChange={setSelectedMuhurat}
              needMuhuratHelp={needMuhuratHelp}
              onNeedMuhuratHelpChange={(v) => {
                setNeedMuhuratHelp(v);
                if (v) {
                  setEventTime("");
                  clearErr("eventDate");
                }
              }}
            />

            <div className="mt-4">
              <p className="text-[13px] font-semibold text-viv-ink">Preferred Ritual Language</p>
              <p className="text-[11.5px] text-viv-muted mt-0.5 mb-2.5">
                We'll assign a verified Pandit Ji who performs the rituals in your language.
              </p>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((l) => {
                  const on = !langOther && language === l;
                  return (
                    <motion.button
                      key={l}
                      {...tap}
                      onClick={() => {
                        setLangOther(false);
                        setLanguage(on ? "" : l);
                      }}
                      className={CHIP(on)}
                    >
                      {l}
                    </motion.button>
                  );
                })}
                <motion.button
                  {...tap}
                  onClick={() => {
                    setLangOther((v) => !v);
                    setLanguage("");
                  }}
                  className={CHIP(langOther)}
                >
                  + Other
                </motion.button>
              </div>
              <AnimatePresence initial={false}>
                {langOther && (
                  <motion.div
                    key="lang-other"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <Field className="mt-2.5">
                      <input
                        className={INPUT}
                        value={customLang}
                        onChange={(e) => setCustomLang(e.target.value)}
                        placeholder="Enter your language (e.g. Awadhi, Tulu, Kumaoni)"
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Block>

          {/* ── Mandir for the ceremony ── */}
          {templesParam.length > 0 && (
            <Block title="Choose your Mandir" icon={Building2}>
              <p className="text-[12px] text-viv-muted -mt-1.5 mb-1.5 leading-relaxed">
                {templeFreeInTier
                  ? `Included free with your ${packageTier?.name || "package"} — pick any ONE mandir.`
                  : "Add a mandir seva for the couple's first blessings (optional) — pick any ONE."}
              </p>
              <p className="text-[11.5px] text-viv-muted-2 mb-3 leading-relaxed">
                Our Pandit Ji performs the pooja for you at the mandir you choose. Your family
                travels there for darshan on your own — we don't arrange the travel.
              </p>

              <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5" gap={0.04}>
                {templesParam.map((t) => {
                  const on = selectedTempleId === t.templeId;
                  return (
                    <RevealItem key={t.templeId} className="h-full">
                      <motion.button
                        {...lift}
                        onClick={() => setSelectedTempleId(on ? "" : t.templeId)}
                        aria-pressed={on}
                        className={`relative w-full h-full text-center rounded-xl border overflow-hidden transition-colors ${
                          on
                            ? "border-viv-maroon bg-viv-maroon text-viv-cream shadow-[0_12px_28px_-18px_rgba(97,26,27,0.9)]"
                            : "border-viv-hair bg-white/70 text-viv-ink hover:border-viv-gold"
                        }`}
                      >
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 26 }}
                              className="absolute left-2 top-2 z-10 w-5 h-5 rounded-full bg-viv-gold flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-viv-maroon-900" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <div className="h-[80px] flex items-center justify-center overflow-hidden bg-viv-gold-pale/60">
                          {t.image ? (
                            <img
                              src={t.image}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-7 h-7 text-viv-maroon" />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="display text-[13px] font-semibold leading-snug line-clamp-2">
                            {t.name}
                          </p>
                          <p
                            className={`text-[10px] mt-0.5 ${on ? "text-viv-cream/65" : "text-viv-muted"}`}
                          >
                            {[t.deity, t.city].filter(Boolean).join(" • ")}
                          </p>
                          <p className="text-[12px] font-bold mt-1.5">
                            {templeFreeInTier ? (
                              <span className={on ? "text-viv-gold-lt" : "text-viv-orange"}>
                                FREE
                              </span>
                            ) : (
                              <span>{fmtINR(t.price)}</span>
                            )}
                          </p>
                        </div>
                      </motion.button>
                    </RevealItem>
                  );
                })}
              </Stagger>

              <AnimatePresence initial={false}>
                {!!selectedTemple && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: EASE }}
                    className="mt-3 text-[12px] text-viv-ink bg-viv-tint border border-viv-hair rounded-xl px-3.5 py-2.5"
                  >
                    <span className="font-semibold">{selectedTemple.name}</span> selected —{" "}
                    {templeFreeInTier
                      ? "included free in your package."
                      : `${fmtINR(templeAmount)} added to your total.`}{" "}
                    Only one mandir can be chosen.
                  </motion.p>
                )}
              </AnimatePresence>
            </Block>
          )}

          {/* ── Kashi Acharya — one row, never a second competing toggle ── */}
          {kashiParam && kashiParam.enabled !== false && kashiParam.isActive !== false && (
            <Block>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <h2 className="display text-[18px] text-viv-maroon flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-viv-gold" />
                  {kashiParam.title || "Invite a Pandit Ji from Kashi"}
                </h2>
                <span className="text-[9px] font-bold tracking-[0.16em] uppercase bg-viv-gold text-viv-maroon-900 rounded-full px-2.5 py-1">
                  Optional add-on
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {inviteKashi ? (
                  /* ── Added: confirm what's attached, offer change / remove ── */
                  <motion.div
                    key="on"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: EASE }}
                    className="rounded-xl border border-viv-orange bg-gradient-to-r from-viv-tint to-viv-tint-2 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-viv-orange text-white flex items-center justify-center shrink-0">
                        <Check className="w-4.5 h-4.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-viv-ink">
                          {kashiPanditName || "Any available Kashi Acharya"}
                        </p>
                        <p className="text-[11.5px] text-viv-muted mt-0.5 leading-snug">
                          Added to your Vivah — travels to your ceremony and performs the vidhi
                          with a Ganga-Jal sankalp.
                        </p>
                      </div>
                      <span className="text-[15px] font-bold text-viv-orange whitespace-nowrap">
                        +{fmtINR(kashiParam.premiumPrice)}
                      </span>
                    </div>

                    {kashiParam.pandits?.length > 0 && (
                      <>
                        <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-viv-muted-2 mt-4 mb-2">
                          Change Acharya
                        </p>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          <motion.button
                            {...tap}
                            onClick={() => setKashiPanditName("")}
                            className={CHIP(kashiPanditName === "")}
                          >
                            Any available
                          </motion.button>
                          {kashiParam.pandits.map((p) => (
                            <motion.button
                              key={p.name}
                              {...tap}
                              onClick={() => setKashiPanditName(p.name)}
                              className={`${CHIP(kashiPanditName === p.name)} whitespace-nowrap`}
                            >
                              {p.name}
                            </motion.button>
                          ))}
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setInviteKashi(false);
                        setKashiPanditName("");
                      }}
                      className="mt-3 text-[12px] font-semibold text-viv-muted hover:text-viv-maroon transition-colors"
                    >
                      Remove this add-on
                    </button>
                  </motion.div>
                ) : (
                  /* ── Not added: one button, no toggle to misread ── */
                  <motion.button
                    key="off"
                    {...tap}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: EASE }}
                    onClick={() => setInviteKashi(true)}
                    className="w-full rounded-xl border border-viv-hair bg-white/70 hover:border-viv-gold p-4 flex items-center gap-3 text-left transition-colors"
                  >
                    <span className="w-10 h-10 rounded-full bg-viv-gold-pale text-viv-maroon flex items-center justify-center shrink-0">
                      <Plus className="w-4.5 h-4.5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold text-viv-ink">
                        Add a Kashi Acharya
                      </span>
                      <span className="block text-[11.5px] text-viv-muted mt-0.5 leading-snug">
                        {kashiParam.description ||
                          "Blessings of Baba Vishwanath at your vivah — performed by a revered Vedacharya from Kashi."}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold text-viv-orange whitespace-nowrap">
                      +{fmtINR(kashiParam.premiumPrice)}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>

              {kashiParam.note && (
                <p className="text-[11px] italic text-viv-muted-2 mt-3 leading-snug">
                  {kashiParam.note}
                </p>
              )}
            </Block>
          )}

          {/* ── Address ── */}
          <Block id="sec-address" flash={flashId === "sec-address"} title="Address" icon={MapPin}>
            <div className="space-y-3">
              <Field>
                <input
                  className={INPUT}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="House / Street / Area"
                  autoComplete="street-address"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <input
                    className={INPUT}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </Field>
                <Field>
                  <input
                    className={INPUT}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </Field>
              </div>
              <Field>
                <input
                  className={INPUT}
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="State"
                  autoComplete="address-level1"
                />
              </Field>
            </div>
          </Block>

          {/* ── Kundali Milan ── */}
          {kundaliRequired && (
            <Block
              id="sec-kundali"
              flash={flashId === "sec-kundali"}
              incomplete={!!fieldErrors.kundali}
              title="Kundali Milan Details"
              icon={Sparkles}
            >
              <p className="text-[12px] text-viv-muted mb-3">
                For accurate Guna Milan, share the birth details of both — or simply upload an
                existing kundali.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                {(["details", "upload"] as const).map((m) => (
                  <button key={m} onClick={() => setKundaliMode(m)} className={CHIP(kundaliMode === m)}>
                    {m === "details" ? "Enter Details" : "Upload Kundali"}
                  </button>
                ))}
              </div>
              {fieldErrors.kundali && (
                <p role="alert" className="text-[11.5px] text-red-600 mb-3">
                  {fieldErrors.kundali}
                </p>
              )}

              {kundaliMode === "details" ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["Var (Groom)", boy, setBoy] as const,
                      ["Vadhu (Bride)", girl, setGirl] as const,
                    ]
                  ).map(([title, person, setPerson]) => (
                    <div key={title} className="bg-white/70 border border-viv-hair rounded-xl p-3.5">
                      <p className="display text-[14px] text-viv-maroon mb-2.5">{title}</p>
                      <div className="space-y-2.5">
                        <Field label="Name">
                          <input
                            className={INPUT}
                            value={person.name}
                            onChange={(e) => setPerson({ ...person, name: e.target.value })}
                            placeholder="Full name"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-2.5">
                          <Field label="Date of Birth">
                            <input
                              type="date"
                              className={INPUT}
                              value={ddmmyyyyToIso(person.dob)}
                              onChange={(e) =>
                                setPerson({ ...person, dob: isoToDDMMYYYY(e.target.value) })
                              }
                            />
                          </Field>
                          <Field label="Time of Birth">
                            <input
                              type="time"
                              className={INPUT}
                              value={person.tob}
                              onChange={(e) => setPerson({ ...person, tob: e.target.value })}
                            />
                          </Field>
                        </div>
                        <Field label="Place of Birth">
                          <input
                            className={INPUT}
                            value={person.pob}
                            onChange={(e) => setPerson({ ...person, pob: e.target.value })}
                            placeholder="City of birth"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
                      [
                        "boy",
                        "Var (Groom) Kundali",
                        "Upload Var Kundali (image)",
                        kundaliBoyUrl,
                        kundaliBoyName,
                        boyFileRef,
                      ] as const,
                      [
                        "girl",
                        "Vadhu (Bride) Kundali",
                        "Upload Vadhu Kundali (image)",
                        kundaliGirlUrl,
                        kundaliGirlName,
                        girlFileRef,
                      ] as const,
                    ]
                  ).map(([side, label, empty, url, fileName, ref]) => (
                    <div key={side}>
                      <p className="text-[11.5px] font-semibold text-viv-muted mb-1.5">{label}</p>
                      <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadKundali(side, f);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => ref.current?.click()}
                        disabled={uploadingSide === side}
                        className={`w-full rounded-xl border border-dashed p-4 flex items-center justify-center gap-2 transition-colors ${
                          url ? "border-viv-gold bg-viv-tint" : "border-viv-hair bg-white/70"
                        }`}
                      >
                        {uploadingSide === side ? (
                          <Loader2 className="w-5 h-5 text-viv-orange animate-spin" />
                        ) : url ? (
                          <div className="text-center">
                            <Check className="w-5 h-5 text-viv-orange mx-auto" />
                            <p className="text-[12.5px] font-semibold text-viv-ink mt-1 break-all">
                              {fileName}
                            </p>
                            <p className="text-[11px] text-viv-muted-2 mt-0.5">Tap to replace</p>
                          </div>
                        ) : (
                          <>
                            <CloudUpload className="w-5 h-5 text-viv-gold" />
                            <span className="text-[12.5px] font-semibold text-viv-muted">
                              {empty}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Block>
          )}

          {/* ── Arrangements ── */}
          <Block title="Arrangements / Samagri" icon={Leaf}>
            <div className="bg-white/70 border border-viv-hair rounded-xl px-4 py-3.5">
              <ToggleRow
                label="Include all puja samagri"
                hint={
                  samagriNeeded
                    ? "Pandit Ji arranges authentic, pure samagri for every ritual. No last-minute market runs."
                    : "You'll arrange the samagri yourself — no samagri charge added."
                }
                value={samagriNeeded}
                onChange={setSamagriNeeded}
              />
            </div>

            {/* Both prices, side by side, so the choice is never a guess. */}
            {samagriTotal > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {(
                  [
                    [true, "With samagri", "Pandit Ji arranges everything", baseAmount + samagriTotal],
                    [false, "Without samagri", "Your family arranges it", baseAmount],
                  ] as const
                ).map(([mode, title, sub, amount]) => (
                  <motion.button
                    key={title}
                    {...tap}
                    onClick={() => setSamagriNeeded(mode)}
                    aria-pressed={samagriNeeded === mode}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      samagriNeeded === mode
                        ? "border-viv-orange bg-gradient-to-br from-viv-tint to-viv-tint-2"
                        : "border-viv-hair bg-white/70 hover:border-viv-gold"
                    }`}
                  >
                    <span className="block text-[12.5px] font-semibold text-viv-ink">{title}</span>
                    <span className="block text-[10.5px] text-viv-muted mt-0.5 leading-snug">
                      {sub}
                    </span>
                    <span
                      className={`block text-[17px] font-semibold mt-1.5 ${
                        samagriNeeded === mode ? "text-viv-orange" : "text-viv-ink"
                      }`}
                    >
                      {fmtINR(amount)}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-viv-ink bg-viv-tint border border-viv-hair rounded-xl px-3.5 py-2.5 leading-relaxed">
                <span className="font-semibold">Samagri is already included</span> in the
                {packageTier ? ` ${packageTier.name}` : ""} package price — there is no extra
                charge for it.
              </p>
            )}
            <Field label="Special Requests (optional)" className="mt-3 viv-mandala bg-[position:right_-180px_bottom_-180px]">
              <textarea
                className={`${INPUT} min-h-[76px] resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Family customs, sankalp names, gotra, etc."
              />
            </Field>

            <div className="mt-3.5 flex gap-3 items-start bg-viv-tint border border-viv-hair rounded-xl p-4">
              <span className="text-[20px] leading-none" aria-hidden="true">
                🪔
              </span>
              <p className="text-[12px] text-viv-ink/85 leading-relaxed">
                <span className="font-bold">Tip: </span>
                Booking 2–3 weeks early helps us lock the best muhurat and a senior Pandit Ji for
                your date.
              </p>
            </div>
          </Block>

          {/* ── Trust strip ── */}
          <div className="px-5 sm:px-7 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-viv-gold/25 rounded-xl overflow-hidden border border-viv-gold/25">
              {[
                [ShieldCheck, "Verified Vedic", "Pandit Ji"],
                [Lock, "100% Secure", "Payment"],
                [Leaf, "All Samagri", "Arranged"],
                [CalendarDays, "Free Reschedule &", "Cancellation*"],
              ].map(([Icon, l1, l2]: any) => (
                <div
                  key={l1}
                  className="bg-viv-maroon-900 px-3 py-3.5 flex items-center gap-2.5 justify-center"
                >
                  <Icon className="w-4.5 h-4.5 text-viv-gold-lt shrink-0" />
                  <p className="text-[11px] text-viv-cream/85 leading-tight">
                    {l1}
                    <br />
                    {l2}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-viv-muted-2 leading-relaxed mt-2.5">
              *Full refund on cancellation 7+ days before the ceremony · 50% within 3–6 days. Manage
              or cancel anytime from My Bookings.
            </p>
            <p className="text-[11.5px] text-viv-muted text-center mt-2">
              🌸 <span className="font-semibold text-viv-orange">12,400+</span> sacred rituals
              performed · <span className="font-semibold text-viv-ink">4.9★</span> from verified
              families
            </p>
          </div>

          {/* ── Full summary: everything the family is about to pay for ── */}
          <Reveal>
            <div className="px-5 sm:px-7 pb-5">
              <div className="rounded-2xl border border-viv-hair bg-white/70 overflow-hidden">
                <div className="bg-gradient-to-r from-viv-tint to-viv-tint-2 px-5 py-3.5 border-b border-viv-hair">
                  <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-viv-gold">
                    Please review
                  </p>
                  <h2 className="display text-[22px] text-viv-ink mt-0.5">Your Vivah Sankalp</h2>
                </div>

                <div className="p-5">
                  <Row label="Ceremony" value={selectionLabel || "—"} />
                  <Row
                    label="Muhurat"
                    value={
                      needMuhuratHelp && !eventDate
                        ? "Pandit Ji will suggest"
                        : `${formatMuhuratDate(eventDate) || "—"}${
                            eventTime ? `, ${prettyTime(eventTime)}` : ""
                          }`
                    }
                  />
                  <Row label="Yajaman" value={devoteeName.trim() || "—"} />
                  <Row label="WhatsApp" value={whatsapp ? `+91 ${whatsapp}` : "—"} />
                  <Row label="Language" value={(langOther ? customLang : language) || "—"} />
                  {selectedTemple && (
                    <Row
                      label="Mandir"
                      value={`${selectedTemple.name}${templeFreeInTier ? " (free)" : ""}`}
                    />
                  )}
                  {inviteKashi && (
                    <Row label="Kashi Acharya" value={kashiPanditName || "Any available Acharya"} />
                  )}
                  <Row
                    label="Venue"
                    value={[street, city, stateName, pincode].filter(Boolean).join(", ") || "—"}
                  />
                  <Row
                    label="Samagri"
                    value={samagriNeeded ? "Pandit Ji arranges" : "Self-arranged"}
                  />
                  {notes.trim() && <Row label="Special requests" value={notes.trim()} />}

                  <div className="h-px bg-viv-hair my-3.5" />

                  {/* The money, itemised */}
                  <Row
                    label={isTier || isSampooranPackage ? "Package price" : "Rituals subtotal"}
                    value={fmtINR(baseAmount)}
                  />
                  {samagriTotal > 0 && (
                    <Row
                      label={samagriNeeded ? "Samagri" : "Samagri (self-arranged)"}
                      value={samagriNeeded ? fmtINR(samagriAmount) : "—"}
                      muted={!samagriNeeded}
                    />
                  )}
                  {addOnAmount > 0 && <Row label="Gift add-ons" value={fmtINR(addOnAmount)} />}
                  {selectedTemple && (
                    <Row
                      label={templeFreeInTier ? "Mandir seva (included)" : "Mandir seva"}
                      value={templeFreeInTier ? "Free" : fmtINR(templeAmount)}
                      muted={templeFreeInTier}
                    />
                  )}
                  {kashiAmount > 0 && (
                    <Row label="Kashi Acharya premium" value={fmtINR(kashiAmount)} />
                  )}

                  <div className="h-px bg-viv-hair my-3" />
                  <div className="flex items-center justify-between">
                    <span className="display text-[19px] text-viv-ink">Total Seva</span>
                    <AnimatedTotal
                      value={total}
                      format={fmtINR}
                      className="text-[24px] font-semibold text-viv-ink"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[12px] text-viv-muted">
                      Reserve now ({advancePercent}% advance)
                    </span>
                    <span className="text-[13px] font-bold text-viv-orange">
                      {fmtINR(advance)} now · {fmtINR(balance)} later
                    </span>
                  </div>

                  {/* Pay mode */}
                  <p className="text-[12.5px] font-semibold text-viv-ink mt-5 mb-2">
                    How would you like to pay?
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        [
                          "advance",
                          `Pay ${advancePercent}% advance`,
                          `${fmtINR(advance)} now · ${fmtINR(balance)} after the ceremony`,
                        ],
                        [
                          "full",
                          "Pay full amount",
                          `${fmtINR(total)} now · nothing left to pay later`,
                        ],
                      ] as const
                    ).map(([mode, title, sub]) => (
                      <motion.button
                        key={mode}
                        {...tap}
                        onClick={() => setPayMode(mode)}
                        aria-pressed={payMode === mode}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          payMode === mode
                            ? "border-viv-orange bg-gradient-to-r from-viv-tint to-viv-tint-2"
                            : "border-viv-hair bg-white/70 hover:border-viv-gold"
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            payMode === mode ? "border-viv-orange" : "border-viv-muted-2/60"
                          }`}
                        >
                          <AnimatePresence>
                            {payMode === mode && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 520, damping: 26 }}
                                className="w-2 h-2 rounded-full bg-viv-orange"
                              />
                            )}
                          </AnimatePresence>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-bold text-viv-ink">
                            {title}
                          </span>
                          <span className="block text-[11.5px] text-viv-muted mt-0.5">{sub}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="flex items-start gap-2 text-[11.5px] text-viv-muted mt-4 leading-relaxed">
                    <MessageCircle className="w-3.5 h-3.5 text-viv-gold shrink-0 mt-0.5" />
                    After payment you can confirm on WhatsApp in one tap — and every ritual reminder
                    comes to you there.
                  </p>

                  <AnimatePresence initial={false}>
                    {error && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.24, ease: EASE }}
                        className="mt-3 text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4 pt-4 bg-gradient-to-t from-viv-ivory via-viv-ivory/95 to-transparent">
        <div className="max-w-[600px] mx-auto">
          {pendingVerification ? (
            /* Money captured, confirmation pending. NEVER show the pay button
               here — a second run would create a second order and charge again. */
            <>
              <button
                onClick={() => confirmPayment(pendingVerification)}
                disabled={submitting}
                className="w-full bg-gradient-to-b from-emerald-500 to-green-700 text-white font-bold text-[15px] py-4 rounded-full flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform shadow-lg shadow-black/40"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm my payment
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-viv-muted mt-2 leading-relaxed">
                Your payment of {fmtINR(pendingVerification.amount)} went through. We just need to
                record it — this will not charge you again. Payment ID{" "}
                <span className="font-mono">{pendingVerification.razorpayPaymentId}</span>
              </p>
            </>
          ) : (
            <>
              <motion.button
                onClick={submitPayment}
                disabled={submitting}
                {...tap}
                className="relative w-full bg-gradient-to-b from-viv-orange-lt to-viv-orange text-white font-bold text-[15px] py-4 rounded-full flex items-center justify-center gap-2 disabled:opacity-60 transition-shadow shadow-[0_14px_34px_-14px_rgba(192,74,1,0.9)] overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-25 hidden sm:block"
                >
                  <VivahMark size={40} tone="cream" />
                </span>
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : signedIn ? (
                  <>
                    Pay {fmtINR(payableNow)} &amp; Confirm Booking
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign in &amp; pay {fmtINR(payableNow)}
                  </>
                )}
              </motion.button>
              <button
                onClick={submitLead}
                disabled={submitting}
                className="w-full text-[12.5px] font-semibold text-viv-maroon py-2.5 disabled:opacity-60"
              >
                <span className="underline">Request a callback</span> — pay later
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Success ── */}
      {successType && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-5">
          <div className="w-full max-w-sm bg-viv-sheet rounded-[18px] border border-viv-hair p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-viv-tint border border-viv-hair mx-auto flex items-center justify-center text-[30px]">
              🙏
            </div>
            <h3 className="display text-[24px] text-viv-ink mt-4">
              {successType === "paid" ? "Vivah Booking Confirmed 🙏" : "Request Received 🙏"}
            </h3>
            <p className="text-[13px] text-viv-muted mt-2 leading-relaxed">
              {successType === "paid"
                ? `Your ${
                    payMode === "full" ? "payment" : "advance"
                  } of ${fmtINR(
                    chargedAmount || payableNow
                  )} is received and the rituals below are confirmed. Our verified Pandit Ji will connect with you shortly on WhatsApp.`
                : "Your Vivah request has been received. Our team will call you shortly to confirm the muhurat and rituals. A confirmation is on its way to your WhatsApp."}
            </p>

            {/* Exactly what is now booked — no ambiguity about what was paid for. */}
            <div className="mt-4 text-left rounded-xl border border-viv-hair bg-white/70 p-4">
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-viv-gold mb-2">
                {successType === "paid" ? "Booked" : "Requested"}
              </p>
              <ul className="space-y-1.5">
                {(isTier || isSampooranPackage
                  ? [selectionLabel]
                  : rituals.map((r) => r.name)
                ).map((label) => (
                  <li
                    key={label}
                    className="flex gap-2 text-[12.5px] text-viv-ink leading-snug"
                  >
                    <Check className="w-3.5 h-3.5 text-viv-orange shrink-0 mt-0.5" />
                    {label}
                  </li>
                ))}
                {selectedTemple && (
                  <li className="flex gap-2 text-[12.5px] text-viv-ink leading-snug">
                    <Check className="w-3.5 h-3.5 text-viv-orange shrink-0 mt-0.5" />
                    Mandir seva — {selectedTemple.name}
                  </li>
                )}
                {inviteKashi && (
                  <li className="flex gap-2 text-[12.5px] text-viv-ink leading-snug">
                    <Check className="w-3.5 h-3.5 text-viv-orange shrink-0 mt-0.5" />
                    Kashi Acharya — {kashiPanditName || "any available"}
                  </li>
                )}
              </ul>
              {successType === "paid" && balance > 0 && payMode !== "full" && (
                <p className="text-[11.5px] text-viv-muted mt-3 pt-3 border-t border-viv-hair leading-snug">
                  Balance of{" "}
                  <span className="font-semibold text-viv-ink">{fmtINR(balance)}</span> is due
                  before the ceremony — payable any time from My Bookings.
                </p>
              )}
            </div>
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full bg-[#25D366] text-white font-bold py-3.5 rounded-full inline-flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm on WhatsApp
            </a>
            <p className="text-[11px] text-viv-muted-2 mt-2 leading-relaxed">
              We'll also send every ritual reminder and update to{" "}
              <span className="font-semibold text-viv-muted">
                {whatsapp ? `+91 ${whatsapp}` : "your WhatsApp"}
              </span>
              .
            </p>
            <button
              onClick={() => navigate("/account?tab=vivah", { replace: true })}
              className="mt-3 w-full bg-gradient-to-b from-viv-orange-lt to-viv-orange text-white font-bold py-3.5 rounded-full active:scale-[0.99] transition-transform"
            >
              Om Shubham 🪔
            </button>
            <button
              onClick={() => navigate("/vedic-vivah", { replace: true })}
              className="mt-2 w-full text-[12.5px] font-semibold text-viv-muted py-2"
            >
              Back to Vedic Vivah
            </button>
          </div>
        </div>
      )}
    </VivahScope>
  );
}
