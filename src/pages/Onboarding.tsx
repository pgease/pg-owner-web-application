import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, CheckCircle2, Building2, User, Home, MapPinned, BedDouble, ArrowLeft, ArrowRight, Shield } from "lucide-react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { toast } from "@/components/ui/use-toast";
import { DEFAULT_PROPERTY_TYPE_ID, createProperty, updateLanguage } from "@/api/propertyOwner";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;
type Lang = "en" | "hi";

const EASE = cubicBezier(0.16, 1, 0.3, 1);

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: EASE },
};

const STEP_META = [
  { icon: User, label: "Profile" },
  { icon: Home, label: "Property" },
  { icon: MapPinned, label: "Location" },
  { icon: BedDouble, label: "Capacity" },
  { icon: CheckCircle2, label: "Finish" },
];

const TEXTS = {
  en: {
    onboarding: "Setup your PG",
    stepOf: "of",
    step1Title: "Tell us about yourself",
    step1Sub: "We'll personalise the experience for you.",
    fullName: "Full Name",
    email: "Email address",
    emailHint: "For receipts and agreements",
    pgType: "PG type",
    boys: "Boys",
    girls: "Girls",
    both: "Co-ed (Both)",
    step2Title: "Name your PG property",
    step2Sub: "This is the primary PG you manage.",
    pgName: "PG name",
    step3Title: "Where is your PG?",
    step3Sub: "Add the address so tenants can find you easily.",
    address: "Full address",
    pincode: "Pincode",
    useLocation: "Use my current location",
    step4Title: "Rooms & Capacity",
    step4Sub: "Select the bed range for your PG.",
    bedRange: "Bed range",
    step5Title: "You're all set!",
    step5Sub: "Your PG has been created successfully. Start managing tenants, payments and staff.",
    goToDashboard: "Go to Dashboard",
    back: "Back",
    next: "Continue",
    saving: "Saving...",
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
  },
  hi: {
    onboarding: "अपना PG सेटअप करें",
    stepOf: "का",
    step1Title: "अपने बारे में बताएं",
    step1Sub: "हम आपके लिए अनुभव को व्यक्तिगत बनाएंगे।",
    fullName: "पूरा नाम",
    email: "ईमेल पता",
    emailHint: "रसीदों और अनुबंधों के लिए",
    pgType: "PG प्रकार",
    boys: "लड़के",
    girls: "लड़कियाँ",
    both: "दोनों (Co-ed)",
    step2Title: "अपनी PG प्रॉपर्टी का नाम दें",
    step2Sub: "यह वह मुख्य PG है जिसे आप प्रबंधित करते हैं।",
    pgName: "PG का नाम",
    step3Title: "आपकी PG कहाँ है?",
    step3Sub: "पता जोड़ें ताकि किरायेदार आसानी से ढूंढ सकें।",
    address: "पूरा पता",
    pincode: "पिनकोड",
    useLocation: "मेरी वर्तमान लोकेशन उपयोग करें",
    step4Title: "कमरे और क्षमता",
    step4Sub: "अपने PG के लिए बेड रेंज चुनें।",
    bedRange: "बेड रेंज",
    step5Title: "सब तैयार है!",
    step5Sub: "आपका PG सफलतापूर्वक बनाया गया है। किरायेदारों, भुगतान और स्टाफ को प्रबंधित करना शुरू करें।",
    goToDashboard: "डैशबोर्ड पर जाएं",
    back: "पीछे",
    next: "जारी रखें",
    saving: "सहेज रहे हैं...",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
  },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    pgType: "" as "" | "boys" | "girls" | "both",
    pgName: "",
    address: "",
    pincode: "",
    bedRange: "",
    language: "" as "" | "hi-IN" | "en-US",
  });

  const T = TEXTS[lang];
  const update = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  // Sync language selection
  const handleLangToggle = (l: Lang) => {
    setLang(l);
    update("language", l === "en" ? "en-US" : "hi-IN");
  };

  const handleUseLocation = () => {
    update("address", "123 Main Street, Andheri West, Mumbai 400058");
    update("pincode", "400058");
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!form.fullName && !!form.email && !!form.pgType;
      case 2: return !!form.pgName;
      case 3: return !!form.address && form.pincode.length === 6;
      case 4: return !!form.bedRange;
      default: return true;
    }
  }, [step, form]);

  const handleNext = async () => {
    if (step < 4) {
      setStep((s) => (s + 1) as OnboardingStep);
    } else if (step === 4) {
      // Submit
      try {
        setIsSubmitting(true);
        await updateLanguage(form.language as "hi-IN" | "en-US" || "en-US");
        await createProperty({
          name: form.pgName,
          address: form.address,
          latitude: 19.1367,
          longitude: 72.8264,
          locationPin: form.pincode,
          bedRange: form.bedRange,
          propertyTypeId: DEFAULT_PROPERTY_TYPE_ID,
        });
        toast({ title: "Onboarding complete", description: "Your PG has been created successfully." });
        setStep(5);
      } catch (error: any) {
        toast({ title: "Failed to complete onboarding", description: error?.message ?? "Please try again.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as OnboardingStep);
  };

  return (
    <div className="min-h-screen relative bg-[hsl(180,50%,5%)] text-white overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute top-[10%] left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={pgeaseLogo} alt="PG Ease" className="h-9 w-9 rounded-xl shadow-md" />
            <div>
              <p className="text-sm font-semibold">{T.onboarding}</p>
              <p className="text-[11px] text-white/50">Step {step} {T.stepOf} 5</p>
            </div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            {(["en", "hi"] as Lang[]).map((l) => (
              <button key={l} onClick={() => handleLangToggle(l)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  lang === l ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/70"
                }`}>
                {l === "en" ? T.english : T.hindi}
              </button>
            ))}
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-6">
          {STEP_META.map((s, i) => {
            const stepNum = i + 1;
            const active = step >= stepNum;
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${active ? "text-primary" : "text-white/25"}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-all ${
                    step === stepNum
                      ? "border-primary bg-primary/20 text-primary"
                      : active
                      ? "border-primary/50 bg-primary/10 text-primary/80"
                      : "border-white/10 bg-white/[0.03] text-white/25"
                  }`}>
                    {step > stepNum ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < 4 && <div className={`flex-1 h-px mx-1.5 ${active && step > stepNum ? "bg-primary/40" : "bg-white/10"}`} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/30">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" {...stepMotion} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">{T.step1Title}</h2>
                    <p className="text-xs text-white/50 mt-1">{T.step1Sub}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">{T.fullName}</Label>
                      <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="John Doe"
                        className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">{T.email}</Label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="owner@gmail.com"
                        className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50" />
                      <p className="text-[11px] text-white/35">{T.emailHint}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">{T.pgType}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["boys", "girls", "both"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => update("pgType", t)}
                            className={`rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all ${
                              form.pgType === t
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20"
                            }`}>
                            {t === "boys" ? T.boys : t === "girls" ? T.girls : T.both}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" {...stepMotion} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">{T.step2Title}</h2>
                    <p className="text-xs text-white/50 mt-1">{T.step2Sub}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">{T.pgName}</Label>
                    <Input value={form.pgName} onChange={(e) => update("pgName", e.target.value)} placeholder="Sunrise PG"
                      className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50" />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" {...stepMotion} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">{T.step3Title}</h2>
                    <p className="text-xs text-white/50 mt-1">{T.step3Sub}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">{T.address}</Label>
                      <Textarea value={form.address} onChange={(e) => update("address", e.target.value)}
                        placeholder="Door no, street, area, city, state" rows={3}
                        className="rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">{T.pincode}</Label>
                      <Input value={form.pincode} maxLength={6} inputMode="numeric"
                        onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="400058"
                        className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-primary/50" />
                    </div>
                    <Button variant="outline" onClick={handleUseLocation}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border-white/10 bg-white/[0.04] text-xs text-white/70 hover:bg-white/[0.08] h-10">
                      <MapPin className="h-4 w-4" /> {T.useLocation}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" {...stepMotion} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">{T.step4Title}</h2>
                    <p className="text-xs text-white/50 mt-1">{T.step4Sub}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">{T.bedRange}</Label>
                    <Select value={form.bedRange} onValueChange={(v) => update("bedRange", v)}>
                      <SelectTrigger className="h-11 rounded-2xl border-white/[0.08] bg-white/[0.04] text-white">
                        <SelectValue placeholder="Choose range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-20">1 – 20 beds</SelectItem>
                        <SelectItem value="21-50">21 – 50 beds</SelectItem>
                        <SelectItem value="50-100">50 – 100 beds</SelectItem>
                        <SelectItem value="100+">100+ beds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" {...stepMotion} className="flex flex-col items-center gap-5 py-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 14 }}
                    className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
                      <Building2 className="h-8 w-8 text-primary" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        ✓
                      </span>
                    </div>
                  </motion.div>
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold">{T.step5Title}</p>
                    <p className="text-xs text-white/50 max-w-xs">{T.step5Sub}</p>
                  </div>
                  <Button onClick={() => navigate("/*", { replace: true })}
                    className="mt-2 h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-white shadow-lg hover:bg-primary/90">
                    {T.goToDashboard}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            {step < 5 && (
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}
                    className="flex-1 rounded-2xl border-white/10 bg-white/[0.04] text-xs text-white/70 hover:bg-white/[0.08] h-11">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {T.back}
                  </Button>
                )}
                <Button onClick={handleNext} disabled={!canProceed || isSubmitting}
                  className="flex-1 rounded-2xl bg-primary text-xs font-semibold text-white shadow-lg hover:bg-primary/90 h-11 disabled:opacity-40">
                  {isSubmitting ? T.saving : step === 4 ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {T.next}</>
                  ) : (
                    <>{T.next} <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                  )}
                </Button>
              </div>
            )}

            {/* Footer trust */}
            {step < 5 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <Shield className="h-3 w-3 text-white/25" />
                <span className="text-[10px] text-white/25">Your data is secure & encrypted</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
