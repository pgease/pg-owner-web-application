import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, CheckCircle2, Building2, ArrowLeft, ArrowRight, Shield, Globe, Loader2, Plus, ChevronRight } from "lucide-react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { toast } from "@/components/ui/use-toast";
import {
  createProperty,
  updateLanguage,
  getPropertyTypesAndAmenities,
  type PropertyType,
  DEFAULT_PROPERTY_TYPE_ID,
} from "@/api/propertyOwner";

type FlowStep = 1 | 2 | 3;
type Lang = "en" | "hi";

const EASE = cubicBezier(0.16, 1, 0.3, 1);

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: EASE },
};

/** Bed range values aligned with Figma / API examples */
const BED_RANGE_OPTIONS = [
  { value: "5-10", labelEn: "5–10 Beds", labelHi: "5–10 बेड" },
  { value: "11-20", labelEn: "11–20 Beds", labelHi: "11–20 बेड" },
  { value: "21-50", labelEn: "21–50 Beds", labelHi: "21–50 बेड" },
  { value: "51-100", labelEn: "51–100 Beds", labelHi: "51–100 बेड" },
  { value: "100+", labelEn: "100+ Beds", labelHi: "100+ बेड" },
] as const;

const TEXTS = {
  en: {
    onboarding: "PgEase",
    stepOf: "of",
    chooseLanguage: "Choose your Language",
    chooseLanguageSub: "Pick how you’d like to use the app.",
    continueWith: "Continue with",
    step2Title: "Tell us about your PG",
    step2Sub: "Step 2 — We only need these details to create your property.",
    pgName: "PG name",
    pgAddress: "PG address",
    pgType: "PG type",
    selectBedRange: "Select bed range",
    useLocation: "Use my current location",
    locating: "Getting location…",
    goToDashboard: "Go to Dashboard",
    back: "Back",
    continue: "Continue",
    saving: "Saving…",
    successTitle: "Your PG has been set up successfully",
    successSub: "Welcome to PgEase. You can start managing your property from the dashboard.",
    secureFooter: "Your data is secure & encrypted",
    selectTypePlaceholder: "Select type",
    selectRangePlaceholder: "Choose range",
    locationDenied: "Location permission denied. Add a full address with a 6-digit pincode.",
    locationFailed: "Could not get location. Try again or enter address with pincode.",
    geocodeFailed: "Could not find that address. Check the address or use current location.",
    needPinOrLocation: "Enter a 6-digit pincode in the address or use current location.",
    loadTypesError: "Could not load property types. Using default.",
    propertiesTitle: "Your Properties",
    propertiesSub: "Select a PG to open, or add a new one.",
    addNewPg: "Add New PG",
  },
  hi: {
    onboarding: "PgEase",
    stepOf: "का",
    chooseLanguage: "अपनी भाषा चुनें",
    chooseLanguageSub: "ऐप किस भाषा में चलाना है, चुनें।",
    continueWith: "जारी रखें",
    step2Title: "अपने PG के बारे में बताएं",
    step2Sub: "चरण 2 — प्रॉपर्टी बनाने के लिए इतनी जानकारी ही चाहिए।",
    pgName: "PG का नाम",
    pgAddress: "PG का पता",
    pgType: "PG प्रकार",
    selectBedRange: "बेड रेंज चुनें",
    useLocation: "मेरी वर्तमान लोकेशन उपयोग करें",
    locating: "लोकेशन मिल रही है…",
    goToDashboard: "डैशबोर्ड पर जाएं",
    back: "पीछे",
    continue: "जारी रखें",
    saving: "सहेज रहे हैं…",
    successTitle: "आपका PG सफलतापूर्वक सेट हो गया",
    successSub: "PgEase में आपका स्वागत है। डैशबोर्ड से प्रॉपर्टी मैनेज करें।",
    secureFooter: "आपका डेटा सुरक्षित है",
    selectTypePlaceholder: "प्रकार चुनें",
    selectRangePlaceholder: "रेंज चुनें",
    locationDenied: "लोकेशन अनुमति नहीं मिली। पते में 6 अंकों का पिनकोड जोड़ें।",
    locationFailed: "लोकेशन नहीं मिल सकी। फिर कोशिश करें या पिनकोड सहित पता दर्ज करें।",
    geocodeFailed: "पता नहीं मिला। पता जाँचें या करंट लोकेशन उपयोग करें।",
    needPinOrLocation: "पते में 6 अंकों का पिनकोड दें या करंट लोकेशन उपयोग करें।",
    loadTypesError: "प्रकार लोड नहीं हो सके। डिफ़ॉल्ट उपयोग हो रहा है।",
    propertiesTitle: "आपकी प्रॉपर्टीज",
    propertiesSub: "डैशबोर्ड खोलने के लिए अपनी प्रॉपर्टी चुनें या नई जोड़ें।",
    addNewPg: "नई प्रॉपर्टी जोड़ें",
  },
};

function extractIndianPincode(address: string): string | null {
  const m = address.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

function refinePostcode(address: string, detectedPostcode: string | null): string | null {
  const lower = address.toLowerCase();
  if (lower.includes("shipra sun city") || lower.includes("shipra suncity") || lower.includes("indirapuram")) {
    return "201014";
  }
  if (lower.includes("vaishali")) {
    return "201010";
  }
  if (lower.includes("vasundhara")) {
    return "201012";
  }
  return detectedPostcode;
}

const NOMINATIM_UA = "PGEase-OwnerWeb/1.0 (support@pgease.in)";

async function reverseGeocode(lat: number, lon: number): Promise<{ displayName: string; postcode: string | null } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: { postcode?: string };
  };
  const displayName = data.display_name ?? "";
  let postcode = data.address?.postcode?.match(/\d{6}/)?.[0] ?? null;
  postcode = refinePostcode(displayName, postcode);
  return { displayName, postcode };
}

async function forwardGeocodeIndia(query: string): Promise<{ lat: number; lon: number; postcode: string | null } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const arr = (await res.json()) as { lat: string; lon: string; display_name?: string }[];
  if (!arr?.length) return null;
  const item = arr[0];
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const rev = await reverseGeocode(lat, lon);
  return { lat, lon, postcode: rev?.postcode ?? extractIndianPincode(query) };
}

const getPropertyTypeIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("boy")) {
    return (
      <svg className="h-4 w-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 21a6 6 0 0 0-12 0" />
        <circle cx="12" cy="10" r="4" />
        <path d="M12 2v2" />
      </svg>
    );
  }
  if (lower.includes("girl") || lower.includes("female")) {
    return (
      <svg className="h-4 w-4 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 21a6 6 0 0 0-12 0" />
        <circle cx="12" cy="10" r="4" />
        <path d="M6 10c-1-1.5-1-4 0-5.5s3.5-1.5 4.5 0" />
        <path d="M18 10c1-1.5 1-4 0-5.5s-3.5-1.5-4.5 0" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
};

const getBedIcon = (value: string) => {
  return (
    <svg className="h-4 w-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { forceShowForm?: boolean } | null;
  const { properties, setSelectedPgId, refreshProperties, language, setLanguage } = useApp();
  const lang: Lang = language === "hi-IN" ? "hi" : "en";
  const [step, setStep] = useState<FlowStep>(2);
  const [showForm, setShowForm] = useState(navState?.forceShowForm ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  const [pgName, setPgName] = useState("");
  const [address, setAddress] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState(DEFAULT_PROPERTY_TYPE_ID);
  const [bedRange, setBedRange] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationPin, setLocationPin] = useState("");

  const T = TEXTS[lang];
  const apiLanguage = lang === "en" ? "en-US" : "hi-IN";

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getPropertyTypesAndAmenities();
        const types = res.propertyTypes ?? [];
        if (cancelled) return;
        setPropertyTypes(types);
        if (types.length) {
          setPropertyTypeId((prev) => (types.some((t) => t.id === prev) ? prev : types[0].id));
        }
      } catch {
        if (!cancelled) {
          toast({ title: TEXTS[lang].loadTypesError, variant: "destructive" });
          setPropertyTypes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, lang]);

  const handleUseLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: T.locationFailed, variant: "destructive" });
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);
      const rev = await reverseGeocode(lat, lon);
      if (rev?.displayName) setAddress(rev.displayName);
      if (rev?.postcode) setLocationPin(rev.postcode);
      else {
        const fromAddr = extractIndianPincode(address);
        if (fromAddr) setLocationPin(fromAddr);
      }
      toast({ title: lang === "en" ? "Location applied" : "लोकेशन सेट हो गई" });
    } catch {
      toast({ title: T.locationDenied, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  }, [T.locationDenied, T.locationFailed, address, lang]);

  const canSubmitStep2 = useMemo(() => {
    return Boolean(pgName.trim() && address.trim() && propertyTypeId && bedRange);
  }, [pgName, address, propertyTypeId, bedRange]);



  const handlePropertyContinue = async () => {
    if (!canSubmitStep2) return;

    let lat = latitude;
    let lng = longitude;
    let pin = locationPin.trim() || extractIndianPincode(address) || "";

    try {
      setIsSubmitting(true);

      if (lat == null || lng == null) {
        const geo = await forwardGeocodeIndia(address.trim());
        if (!geo) {
          toast({ title: T.geocodeFailed, variant: "destructive" });
          return;
        }
        lat = geo.lat;
        lng = geo.lon;
        if (!pin && geo.postcode) pin = geo.postcode;
        setLatitude(lat);
        setLongitude(lng);
        if (geo.postcode) setLocationPin(geo.postcode);
      }

      if (!pin || pin.length !== 6) {
        toast({ title: T.needPinOrLocation, variant: "destructive" });
        return;
      }

      const newPg = await createProperty({
        name: pgName.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        locationPin: pin,
        bedRange,
        propertyTypeId,
      });
      await refreshProperties();
      setSelectedPgId(newPg.id);
      toast({ title: lang === "en" ? "Onboarding complete" : "सेटअप पूरा", description: T.successSub });
      navigate("/dashboard", { replace: true, state: { justOnboarded: true, pgName: pgName.trim() } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Please try again.";
      toast({ title: lang === "en" ? "Could not create PG" : "PG नहीं बन सका", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bedOptions = BED_RANGE_OPTIONS.map((o) => ({
    value: o.value,
    label: lang === "en" ? o.labelEn : o.labelHi,
  }));

  return (
    <div className="min-h-screen relative bg-[hsl(180,50%,5%)] text-white overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute top-[10%] left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={pgeaseLogo} alt="PG Ease" className="h-9 w-9 rounded-xl shadow-md" />
            <div>
              <p className="text-sm font-semibold">{T.onboarding}</p>
              <p className="text-[11px] text-white/50">
                {(!showForm && properties.length > 0) ? "" : lang === "en" ? "PG Setup" : "PG सेटअप"}
              </p>
            </div>
          </div>

          {/* Floating Language Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-0.5 flex">
              {(["en", "hi"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l === "en" ? "en-US" : "hi-IN")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    lang === l ? "bg-white/[0.12] text-white shadow-sm" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {l === "en" ? "English" : "हिन्दी"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/30">
          <CardContent className="p-6 sm:p-8">
            {(!showForm && properties.length > 0) ? (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-white">{T.propertiesTitle}</h2>
                  <p className="text-xs text-white/50">{T.propertiesSub}</p>
                </div>
                
                <div className="grid gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {properties.map((pg) => {
                    const initials = pg.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <button
                        key={pg.id}
                        onClick={() => {
                          setSelectedPgId(pg.id);
                          navigate("/dashboard", { replace: true });
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-left hover:bg-white/[0.08] hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular initial avatar like Instagram profile image */}
                          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-105 transition-transform">
                            {initials || "PG"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{pg.name}</p>
                            <p className="text-[10px] text-white/50 truncate max-w-[200px]">{pg.address}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/[0.02] text-xs font-bold text-white/70 hover:text-white transition-all mt-4"
                >
                  <Plus className="h-4 w-4" />
                  <span>{T.addNewPg}</span>
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {step === 2 && (
                  <motion.div key="pg" {...stepMotion} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{T.step2Title}</h2>
                      <p className="text-xs text-white/50 mt-1">
                        {lang === "en" ? "We only need these details to create your property." : "प्रॉपर्टी बनाने के लिए इतनी जानकारी ही चाहिए।"}
                      </p>
                    </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">{T.pgName}</Label>
                    <Input
                      value={pgName}
                      onChange={(e) => setPgName(e.target.value)}
                      placeholder="Sunrise PG"
                      className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-white/60">{T.pgAddress}</Label>
                      <button
                        type="button"
                        disabled={locating}
                        onClick={() => void handleUseLocation()}
                        className="text-[11px] font-semibold flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                      >
                        {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                        <span>{locating ? T.locating : T.useLocation}</span>
                      </button>
                    </div>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={lang === "en" ? "Door no, street, area, city, state, pincode" : "पूरा पता, पिनकोड सहित"}
                      rows={3}
                      className="rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">{T.pgType}</Label>
                    <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
                      <SelectTrigger className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white">
                        <SelectValue placeholder={T.selectTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {(propertyTypes.length ? propertyTypes : [{ id: DEFAULT_PROPERTY_TYPE_ID, name: "PG / Hostel", description: null, imageUrl: null }]).map(
                          (t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <span className="flex items-center gap-2.5">
                                {getPropertyTypeIcon(t.name)}
                                <span>{t.name}</span>
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">{T.selectBedRange}</Label>
                    <Select value={bedRange} onValueChange={setBedRange}>
                      <SelectTrigger className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white">
                        <SelectValue placeholder={T.selectRangePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {bedOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <span className="flex items-center gap-2.5">
                              {getBedIcon(o.value)}
                              <span>{o.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-1">
                    {properties.length > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        className="flex-1 rounded-2xl border-white/10 bg-white/[0.04] text-xs text-white/70 hover:bg-white/[0.08] h-11"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {T.back}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/login", { replace: true })}
                        className="flex-1 rounded-2xl border-white/10 bg-white/[0.04] text-xs text-white/70 hover:bg-white/[0.08] h-11"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {T.back}
                      </Button>
                    )}
                    <Button
                      onClick={() => void handlePropertyContinue()}
                      disabled={!canSubmitStep2 || isSubmitting}
                      className="flex-1 rounded-2xl bg-primary text-xs font-semibold text-white shadow-lg hover:bg-primary/90 h-11 disabled:opacity-40"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin inline" /> {T.saving}
                        </>
                      ) : (
                        <>
                          {T.continue} <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
            )}

            {(properties.length === 0 || showForm) && step === 2 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <Shield className="h-3 w-3 text-white/25" />
                <span className="text-[10px] text-white/25">{T.secureFooter}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
