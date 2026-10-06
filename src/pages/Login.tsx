import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";

import {
  requestOtp,
  verifyOtp,
  updateMe,
  type OtpChannel,
  type VerifyOtpResponse,
} from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import pgeaseLogo from "@/assets/pgease-logo.png";
import {
  Lock,
  Pencil,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Check,
  Globe,
  ChevronDown,
  Loader2,
  Banknote,
  LayoutGrid,
  User,
  Sparkles,
} from "lucide-react";

type Step = "phone" | "otp" | "first_time_name";
type Lang = "en" | "hi";

const LAST_PHONE_KEY = "pgEase_lastPhone";
const LANG_STORAGE_KEY = "pgEase_lang";

const clampDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const cleanPhoneInput = (v: string): string => {
  const digits = v.replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.startsWith("91")) return digits.slice(2, 12);
    if (digits.startsWith("0")) return digits.slice(1, 11);
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
};

/* ---------- Resend timer hook ---------- */
function useResendTimer(initialSeconds = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);
  const start = (sec = initialSeconds) => setSecondsLeft(sec);
  const reset = () => setSecondsLeft(0);
  return { secondsLeft, start, reset, canResend: secondsLeft <= 0 };
}

/* ---------- Circular countdown ---------- */
function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (total - seconds) / total : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="2.5"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="2.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#008080] transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute text-[9px] font-semibold text-gray-500 tabular-nums">
        {seconds}
      </span>
    </div>
  );
}

/* ---------- Fixed-Dimension WhatsApp Logo (Never Overflows) ---------- */
function WhatsAppIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        display: "inline-block",
        flexShrink: 0,
      }}
      className={`shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="#25D366"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
      />
      <path
        fill="#FFFFFF"
        d="M17.53 14.39C17.23 14.24 15.77 13.52 15.5 13.42C15.23 13.32 15.03 13.27 14.83 13.57C14.63 13.87 14.06 14.54 13.89 14.74C13.72 14.94 13.54 14.96 13.25 14.81C12.95 14.66 12 14.35 10.86 13.34C9.98 12.55 9.38 11.58 9.21 11.28C9.03 10.98 9.19 10.82 9.34 10.67C9.47 10.54 9.64 10.33 9.79 10.15C9.93 9.98 9.98 9.85 10.08 9.66C10.18 9.46 10.13 9.28 10.06 9.14C9.98 8.99 9.38 7.53 9.14 6.93C8.89 6.35 8.65 6.43 8.47 6.42C8.3 6.41 8.1 6.41 7.9 6.41C7.7 6.41 7.38 6.48 7.11 6.78C6.83 7.08 6.06 7.8 6.06 9.26C6.06 10.72 7.13 12.13 7.27 12.33C7.42 12.53 9.37 15.53 12.35 16.82C13.06 17.13 13.61 17.31 14.04 17.45C14.75 17.67 15.4 17.64 15.91 17.57C16.48 17.48 17.67 16.85 17.92 16.15C18.16 15.46 18.16 14.86 18.09 14.74C18.02 14.61 17.82 14.54 17.53 14.39Z"
      />
    </svg>
  );
}

/* ---------- i18n Dictionary ---------- */
const TEXTS = {
  en: {
    trustedPill: "Trusted by 2,500+ PG & Hostel Owners Across India",
    headlineHighlight: "without the chaos.",
    subHeadline: "Automate rent collections, room allocations, and digital KYC in one unified dashboard.",
    bullet1: "Instant UPI Collections & WhatsApp Receipts",
    bullet2: "Real-Time Bed Occupancy & Multi-Branch View",
    bullet3: "Paperless Aadhaar KYC & Police Verification",
    tabSignIn: "Sign In",
    tabSignUp: "New Owner Sign Up",
    titleSignIn: "Sign in to PG Ease",
    subtitleSignIn: "Enter your registered mobile number. Zero password hassle.",
    nameLabel: "Your Full Name",
    nameOptional: "Optional",
    namePlaceholder: "e.g. Rahul Sharma",
    nameHint: "Used on tenant rent receipts, invoices, and your owner profile.",
    signingUpAs: "Registering as",
    phoneLabel: "MOBILE NUMBER",
    otpNote: "We will send a 6-digit one-time password (OTP)",
    sendVia: "Send verification code via:",
    sendOtpWhatsapp: "Get OTP on WhatsApp",
    sendOtpSms: "Get OTP via SMS",
    sending: "Sending code...",
    trialPill: "New Property Owner? 45-Day Free Pro Plan Trial Auto-Activated",
    verifyTitle: "Verify Mobile Number",
    verifySubWhatsapp: "Enter the code sent to WhatsApp",
    verifySubSms: "Enter the code sent via SMS",
    verifyBtn: "Verify & Enter Dashboard",
    verifying: "Verifying...",
    editNumber: "Change number",
    resendWhatsapp: "Resend on WhatsApp",
    resendSms: "Resend via SMS",
    resendIn: "Resend code in",
    switchChannelPrompt: "Didn't receive the code?",
    firstTimeTitle: "Welcome to PG Ease! 🎉",
    firstTimeSubtitle: "Please enter your name to complete your owner account setup.",
    firstTimeContinue: "Continue to Dashboard",
    firstTimeSaving: "Setting up your account...",
  },
  hi: {
    trustedPill: "भारत भर में 2,500+ पीजी और हॉस्टल मालिकों का भरोसा",
    headlineHighlight: "बिना किसी झंझट के।",
    subHeadline: "किराया संग्रह, कमरों का आवंटन और डिजिटल केवाईसी एक ही सुरक्षित डैशबोर्ड में।",
    bullet1: "तत्काल यूपीआई संग्रह और व्हाट्सएप रसीदें",
    bullet2: "रियल-टाइम बेड उपलब्धता और मल्टी-ब्रांच व्यू",
    bullet3: "पेपरलेस आधार केवाईसी और डिजिटल अनुबंध",
    tabSignIn: "साइन इन",
    tabSignUp: "नया खाता बनाएं",
    titleSignIn: "पीजी ईज़ में लॉगिन करें",
    subtitleSignIn: "अपना पंजीकृत मोबाइल नंबर दर्ज करें। पासवर्ड का कोई झंझट नहीं।",
    nameLabel: "आपका पूरा नाम",
    nameOptional: "वैकल्पिक",
    namePlaceholder: "उदा. राहुल शर्मा",
    nameHint: "किरायेदार रसीदों और आपके ओनर प्रोफ़ाइल पर उपयोग किया जाता है।",
    signingUpAs: "रजिस्टर कर रहे हैं",
    phoneLabel: "मोबाइल नंबर",
    otpNote: "हम आपके नंबर पर 6-अंकीय ओटीपी कोड भेजेंगे",
    sendVia: "सत्यापन कोड माध्यम चुनें:",
    sendOtpWhatsapp: "व्हाट्सएप पर ओटीपी पाएं",
    sendOtpSms: "एसएमएस द्वारा ओटीपी पाएं",
    sending: "भेज रहे हैं...",
    trialPill: "नए पीजी मालिक? 45 दिनों का मुफ़्त Pro ट्रायल सक्रिय",
    verifyTitle: "मोबाइल नंबर सत्यापित करें",
    verifySubWhatsapp: "व्हाट्सएप पर भेजा गया 4-अंकीय कोड दर्ज करें",
    verifySubSms: "एसएमएस द्वारा भेजा गया 4-अंकीय कोड दर्ज करें",
    verifyBtn: "सत्यापित करें और आगे बढ़ें",
    verifying: "सत्यापन जारी है...",
    editNumber: "नंबर बदलें",
    resendWhatsapp: "व्हाट्सएप पर पुनः भेजें",
    resendSms: "एसएमएस द्वारा पुनः भेजें",
    resendIn: "पुनः भेजें",
    switchChannelPrompt: "कोड प्राप्त नहीं हुआ?",
    firstTimeTitle: "पीजी ईज़ में आपका स्वागत है! 🎉",
    firstTimeSubtitle: "अपना ओनर खाता पूरा करने के लिए कृपया अपना नाम दर्ज करें।",
    firstTimeContinue: "डैशबोर्ड खोलें",
    firstTimeSaving: "खाता सेटअप हो रहा है...",
  },
};

/* ==================== Main Component ==================== */
export default function Login({ initialMode: _initialMode }: { initialMode?: string } = {}) {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(LANG_STORAGE_KEY) as Lang) || "en";
    } catch {
      return "en";
    }
  });

  const [step, setStep] = useState<Step>("phone");
  const [channel, setChannel] = useState<OtpChannel>("whatsapp");
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem(LAST_PHONE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [otp, setOtp] = useState("");
  const [shaking, setShaking] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [verifiedAuthData, setVerifiedAuthData] = useState<VerifyOtpResponse | null>(null);
  const [firstTimeOwnerName, setFirstTimeOwnerName] = useState("");

  const { secondsLeft, start, reset, canResend } = useResendTimer(30);
  const phoneValid = phone.length === 10;

  const T = TEXTS[lang];

  const handleLangToggle = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {}
  };

  // Remember last phone
  useEffect(() => {
    if (phone.length === 10) {
      try {
        localStorage.setItem(LAST_PHONE_KEY, phone);
      } catch {}
    }
  }, [phone]);

  // Autofocus OTP input when transitioning
  useEffect(() => {
    if (step === "otp") {
      const focusOtpInput = () => {
        const firstOtpSlot = document.querySelector<HTMLInputElement>(
          '[data-input-otp-slot="0"], input[autocomplete="one-time-code"]'
        );
        if (firstOtpSlot) {
          firstOtpSlot.focus();
        } else {
          const anyInput = document.querySelector<HTMLInputElement>("input[inputmode='numeric']");
          anyInput?.focus();
        }
      };

      const timer = setTimeout(focusOtpInput, 60);
      const timer2 = setTimeout(focusOtpInput, 200);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [step]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  const handleSendOtp = async (targetChannel: OtpChannel = channel) => {
    if (!phoneValid) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone, targetChannel);
      setChannel(targetChannel);
      setStep("otp");
      start(30);

      toast({
        title: targetChannel === "whatsapp" ? "WhatsApp Code Sent" : "SMS Code Sent",
        description:
          targetChannel === "whatsapp"
            ? `A 4-digit code was sent to +91 ${phone} via WhatsApp.`
            : `A 4-digit code was sent to +91 ${phone} via SMS.`,
      });

      if (res?.devOtp) {
        toast({
          title: "Dev Mode OTP",
          description: `Use code: ${res.devOtp}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Could not send OTP",
        description: error?.message ?? "Please verify your mobile number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResend = (targetChannel: OtpChannel = channel) => {
    if (!canResend || isSendingOtp) return;
    setOtp("");
    handleSendOtp(targetChannel);
  };

  const handleVerifyOtp = useCallback(
    async (otpValue: string) => {
      if (otpValue.length !== 4) return;
      try {
        setIsVerifyingOtp(true);
        const data = await verifyOtp(phone, otpValue);

        const currentName = data.propertyOwner?.name?.trim();
        const isPlaceholder =
          !currentName ||
          currentName.toLowerCase() === "owner" ||
          currentName.toLowerCase().startsWith("user_");
        const isFirstTime = Boolean(data.isNewUser || isPlaceholder);

        if (isFirstTime) {
          // First-time owner signup: prompt for their name before entering dashboard
          setVerifiedAuthData(data);
          setStep("first_time_name");
          toast({
            title: "Mobile Verified!",
            description: "Welcome to PG Ease! Please enter your name to complete your setup.",
          });
        } else {
          // Normal returning login: never ask for name, direct access
          setShowSuccess(true);
          toast({
            title: "Authenticated Successfully",
            description: `Welcome back${currentName ? `, ${currentName}` : ""}!`,
          });

          setTimeout(() => {
            if (!data.hasProperties) {
              navigate("/onboarding", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }, 700);
        }
      } catch (error: any) {
        triggerShake();
        setOtp("");
        toast({
          title: "Invalid Verification Code",
          description: error?.message ?? "Please verify the 4-digit code and try again.",
          variant: "destructive",
        });
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [phone, navigate, triggerShake]
  );

  const handleSaveFirstTimeName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = firstTimeOwnerName.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please enter your full name to proceed.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingName(true);
      const updated = await updateMe({ name: trimmed });
      if (verifiedAuthData) {
        authStorage.setPropertyOwner({
          ...verifiedAuthData.propertyOwner,
          name: updated?.name || trimmed,
        });
      }
      setShowSuccess(true);
      toast({
        title: `Welcome, ${trimmed}!`,
        description: "Your PG Ease account is ready.",
      });

      setTimeout(() => {
        if (verifiedAuthData?.hasProperties) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }, 700);
    } catch {
      // Graceful fallback: persist name in local storage session so user is not blocked
      if (verifiedAuthData) {
        authStorage.setPropertyOwner({
          ...verifiedAuthData.propertyOwner,
          name: trimmed,
        });
      }
      setShowSuccess(true);
      setTimeout(() => {
        navigate(verifiedAuthData?.hasProperties ? "/dashboard" : "/onboarding", { replace: true });
      }, 700);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleOtpChange = useCallback(
    (value: string) => {
      const cleaned = clampDigits(value, 4);
      setOtp(cleaned);
      if (cleaned.length === 4) {
        handleVerifyOtp(cleaned);
      }
    },
    [handleVerifyOtp]
  );

  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && phoneValid && !isSendingOtp) {
      e.preventDefault();
      handleSendOtp(channel);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col justify-between bg-[#F8FAFB] text-[#18212B] select-none">
      {/* ================= TOP NAVBAR ================= */}
      <header className="shrink-0 w-full bg-white border-b border-gray-100 px-3.5 sm:px-8 lg:px-10 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Logo & Portal Badge (Never Wraps) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <img
              src={pgeaseLogo}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shadow-2xs object-cover shrink-0"
              alt="PG Ease"
            />
            <span className="font-extrabold text-[16px] sm:text-[17px] tracking-tight text-[#18212B] whitespace-nowrap">
              PG Ease
            </span>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-[#008080]/30 text-[#008080] bg-[#E8F4F4] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase select-none shrink-0 whitespace-nowrap">
            OWNER & MANAGER PORTAL
          </span>
          <span className="sm:hidden px-2 py-0.5 rounded-full border border-[#008080]/30 text-[#008080] bg-[#E8F4F4] text-[9.5px] font-bold tracking-wider uppercase select-none shrink-0 whitespace-nowrap">
            OWNER PORTAL
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Language Selector */}
          <button
            type="button"
            onClick={handleLangToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-colors shrink-0"
          >
            <Globe className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{lang === "en" ? "English" : "हिन्दी"}</span>
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          </button>

          {/* Support Phone - Desktop/Tablet */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-700 shrink-0">
            <WhatsAppIcon size={15} />
            <span className="text-gray-500 font-medium">Support:</span>
            <a
              href="https://wa.me/917701953356"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-900 hover:text-[#008080] transition-colors tabular-nums"
            >
              +91 77019 53356
            </a>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 lg:p-4 xl:p-6 w-full max-w-[1240px] mx-auto">
        {/* Centered Large Card Container */}
        <div className="w-full max-w-[440px] lg:max-w-none max-h-full bg-white rounded-2xl sm:rounded-[24px] lg:rounded-[28px] shadow-xl border border-gray-100 flex flex-col lg:flex-row overflow-hidden">
          {/* ================= LEFT SHOWCASE PANEL (DESKTOP ONLY) ================= */}
          <div className="hidden lg:flex lg:w-[53%] xl:w-[54%] bg-gradient-to-br from-[#064245] via-[#043336] to-[#022426] text-white p-5 sm:p-7 lg:p-6 xl:p-8 flex-col justify-between relative overflow-y-auto lg:overflow-visible select-none">
            {/* Subtle micro dot grid background */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Content Area */}
            <div className="relative z-10 space-y-3.5 sm:space-y-5 lg:space-y-4 xl:space-y-5">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] sm:text-xs leading-tight">{T.trustedPill}</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-[34px] font-extrabold tracking-tight leading-[1.15] text-white">
                  Run your PG operations, <br />
                  <span className="text-[#5CE1E6]">{T.headlineHighlight}</span>
                </h1>
                <p className="text-xs sm:text-[13px] text-white/75 max-w-lg leading-relaxed pt-0.5">
                  {T.subHeadline}
                </p>
              </div>

              {/* 3 Value Points with Circular Icons */}
              <div className="space-y-2 sm:space-y-2.5 pt-0.5">
                {[
                  { icon: Banknote, text: T.bullet1 },
                  { icon: LayoutGrid, text: T.bullet2 },
                  { icon: ShieldCheck, text: T.bullet3 },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white/90">
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                    <span className="text-xs sm:text-[13px] text-white/90 font-medium leading-tight">{text}</span>
                  </div>
                ))}
              </div>

              {/* Dark Glassmorphic Live Dashboard Widget (No Truncation) */}
              <div className="rounded-[14px] bg-[#021F21]/80 border border-white/10 p-3 sm:p-4 shadow-lg backdrop-blur-md space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide">
                      Emerald Stays — Koramangala Hub
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap">
                    LIVE DASHBOARD
                  </span>
                </div>

                {/* 3 Metric Columns - Clean & Responsive */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-2 border-t border-white/10">
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-[11px] text-white/60 font-medium">Occupancy Rate</div>
                    <div className="text-sm sm:text-lg xl:text-xl font-black text-white tabular-nums">94.2%</div>
                    <div className="text-[8.5px] sm:text-[10px] text-white/50">113 / 120 Beds</div>
                  </div>
                  <div className="border-l border-white/10 pl-1.5 sm:pl-3 min-w-0">
                    <div className="text-[10px] sm:text-[11px] text-white/60 font-medium">Collections</div>
                    <div className="text-sm sm:text-lg xl:text-xl font-black text-[#5CE1E6] tabular-nums">₹14.85L</div>
                    <div className="text-[8.5px] sm:text-[10px] text-white/50">96% on-time UPI</div>
                  </div>
                  <div className="border-l border-white/10 pl-1.5 sm:pl-3 min-w-0">
                    <div className="text-[10px] sm:text-[11px] text-white/60 font-medium">Pending Dues</div>
                    <div className="text-sm sm:text-lg xl:text-xl font-black text-[#FDBA74] tabular-nums">₹48,200</div>
                    <div className="text-[8.5px] sm:text-[10px] text-white/50">3 queued</div>
                  </div>
                </div>
              </div>

              {/* Rating & Social Proof */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5">
                {/* Overlapping Avatars */}
                <div className="flex -space-x-2 overflow-hidden shrink-0">
                  <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#E57373] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#054448]">RS</div>
                  <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#7986CB] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#054448]">VS</div>
                  <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#4DB6AC] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#054448]">MI</div>
                  <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#F06292] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#054448]">AK</div>
                </div>
                {/* Stars */}
                <div className="flex items-center gap-0.5 text-amber-400 text-xs shrink-0">
                  {"★★★★★"}
                </div>
                <span className="text-[10.5px] sm:text-[11.5px] text-white/75 font-medium">
                  4.9 / 5 rated across Bengaluru, Pune, NCR & Hyderabad
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT AUTHENTICATION PANEL ================= */}
          <div className="w-full lg:w-[47%] xl:w-[46%] p-5 sm:p-7 lg:p-6 xl:p-8 flex flex-col justify-center bg-white overflow-y-auto">
            {showSuccess ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="h-13 w-13 rounded-full bg-[#ECFAF1] border border-[#B4E5C5] flex items-center justify-center text-[#157F3D]">
                  <Check className="h-7 w-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#18212B]">
                    Authenticated Successfully
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Connecting to your property portfolio...
                  </p>
                </div>
              </div>
            ) : step === "first_time_name" ? (
              /* First-Time Sign Up: Prompt for PG Owner Name */
              <form
                onSubmit={handleSaveFirstTimeName}
                className="space-y-4 max-w-[390px] sm:max-w-[420px] mx-auto w-full animate-in fade-in duration-300"
              >
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F4F4] text-[#008080] text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-[#008080]" />
                    <span>First-Time Setup</span>
                  </div>
                  <h2 className="text-2xl sm:text-[25px] font-extrabold text-[#18212B] tracking-tight">
                    {T.firstTimeTitle}
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {T.firstTimeSubtitle}
                  </p>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#008080]" />
                    <span>{T.nameLabel}</span>
                  </label>
                  <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-[#008080] focus-within:ring-2 focus-within:ring-[#CCE6E6] h-11 sm:h-12 transition-all">
                    <input
                      autoFocus
                      value={firstTimeOwnerName}
                      onChange={(e) => setFirstTimeOwnerName(e.target.value)}
                      placeholder={T.namePlaceholder}
                      autoComplete="name"
                      className="flex-1 h-full px-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-gray-400">
                    {T.nameHint}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!firstTimeOwnerName.trim() || isSavingName}
                  className="w-full h-11 sm:h-12 rounded-lg bg-[#007A78] hover:bg-[#006866] active:bg-[#005755] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{T.firstTimeSaving}</span>
                    </>
                  ) : (
                    <>
                      <span>{T.firstTimeContinue}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : step === "phone" ? (
              <div className="space-y-3.5 sm:space-y-4 max-w-[390px] sm:max-w-[420px] mx-auto w-full">
                {/* Mobile Social Proof Strip */}
                <div className="lg:hidden flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#064245] to-[#043336] text-white shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-white truncate">
                      Trusted by 2,500+ PG Owners
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5CE1E6] font-bold shrink-0 bg-white/10 px-2 py-0.5 rounded-full">
                    ★ 4.9 / 5
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-[25px] font-extrabold text-[#18212B] tracking-tight">
                    {T.titleSignIn}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {T.subtitleSignIn}
                  </p>
                </div>

                {/* Mobile Input Section */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    {T.phoneLabel}
                  </label>
                  <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-[#008080] focus-within:ring-2 focus-within:ring-[#CCE6E6] h-11 sm:h-12 transition-all">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 text-xs font-bold text-gray-700 border-r border-gray-200 select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                      onKeyDown={handlePhoneKeyDown}
                      placeholder="98765 43210"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="flex-1 h-full px-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none tabular-nums"
                    />
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-gray-400">
                    {T.otpNote}
                  </p>
                </div>

                {/* Channel Selector: Radio-style Pill Buttons */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">
                    {T.sendVia}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp Option */}
                    <button
                      type="button"
                      onClick={() => setChannel("whatsapp")}
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-2 text-xs font-semibold border transition-all text-left ${
                        channel === "whatsapp"
                          ? "border-[#008080] bg-[#F0FAF7] text-gray-900 ring-1 ring-[#008080]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {/* Radio Circle */}
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          channel === "whatsapp"
                            ? "border-[#008080] bg-[#008080]"
                            : "border-gray-300"
                        }`}
                      >
                        {channel === "whatsapp" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <WhatsAppIcon size={15} />
                      <span className="font-bold text-[11px] sm:text-xs">WhatsApp</span>
                      <span className="ml-auto text-[8.5px] sm:text-[9px] font-extrabold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase">
                        FASTEST
                      </span>
                    </button>

                    {/* SMS Option */}
                    <button
                      type="button"
                      onClick={() => setChannel("sms")}
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-2 text-xs font-semibold border transition-all text-left ${
                        channel === "sms"
                          ? "border-[#008080] bg-[#F0FAF7] text-gray-900 ring-1 ring-[#008080]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {/* Radio Circle */}
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          channel === "sms"
                            ? "border-[#008080] bg-[#008080]"
                            : "border-gray-300"
                        }`}
                      >
                        {channel === "sms" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <MessageSquare className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="text-[11px] sm:text-xs">Regular SMS</span>
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="button"
                  disabled={!phoneValid || isSendingOtp}
                  onClick={() => handleSendOtp(channel)}
                  className="w-full h-11 sm:h-12 rounded-lg bg-[#007A78] hover:bg-[#006866] active:bg-[#005755] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{T.sending}</span>
                    </>
                  ) : (
                    <>
                      <span>{channel === "whatsapp" ? T.sendOtpWhatsapp : T.sendOtpSms}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Consent Note */}
                <p className="text-[10.5px] text-center text-gray-400 leading-normal">
                  By continuing, you agree to PG Ease's{" "}
                  <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a> &{" "}
                  <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>.
                </p>

                {/* Green Trial Pill - Symmetrically Aligned & Non-Wrapping on Desktop */}
                <div className="rounded-xl sm:rounded-full bg-[#E6F8F0] border border-[#B4E5C5] py-2 px-3 sm:px-4 text-center shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-bold text-[#0E7A4A] leading-snug">
                    <Check className="h-3.5 w-3.5 stroke-[3] shrink-0 text-[#0E7A4A]" />
                    <span className="text-center sm:whitespace-nowrap">{T.trialPill}</span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] text-gray-400 pt-0.5">
                  <Lock className="h-3 w-3 text-gray-400 shrink-0" />
                  <span>256-Bit Bank Grade SSL • ISO 27001 Certified Hostels</span>
                </div>
              </div>
            ) : (
              /* Step 2: OTP Verification */
              <div className={`space-y-4 max-w-[390px] sm:max-w-[420px] mx-auto w-full ${shaking ? "animate-shake" : ""}`}>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#008080]">
                    Security Verification
                  </span>
                  <h2 className="text-2xl font-bold text-[#18212B] tracking-tight">
                    {T.verifyTitle}
                  </h2>
                  <div className="text-xs text-gray-500 leading-normal flex items-center flex-wrap gap-1">
                    <span>{channel === "whatsapp" ? T.verifySubWhatsapp : T.verifySubSms}</span>
                    <span className="font-bold text-gray-900 tabular-nums">+91 {phone}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtp("");
                        setStep("phone");
                        reset();
                      }}
                      className="ml-1 inline-flex items-center gap-0.5 text-[#008080] text-[11px] hover:underline font-semibold"
                    >
                      <Pencil className="h-3 w-3" /> {T.editNumber}
                    </button>
                  </div>
                </div>

                {/* 4-Slot OTP Inputs */}
                <div className="space-y-2 py-1">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                    Enter 4-Digit Security Code
                  </label>
                  <InputOTP
                    autoFocus
                    maxLength={4}
                    value={otp}
                    onChange={handleOtpChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 4 && !isVerifyingOtp) {
                        e.preventDefault();
                        handleVerifyOtp(otp);
                      }
                    }}
                    containerClassName="w-full justify-center"
                    autoComplete="one-time-code"
                  >
                    <InputOTPGroup className="flex gap-2 sm:gap-3 justify-center">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg border border-gray-300 bg-white text-[19px] sm:text-[20px] font-bold text-gray-900 tabular-nums shadow-2xs focus:border-[#008080] focus:ring-2 focus:ring-[#CCE6E6]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  type="button"
                  disabled={otp.length !== 4 || isVerifyingOtp}
                  onClick={() => handleVerifyOtp(otp)}
                  className="w-full h-11 sm:h-12 rounded-lg bg-[#007A78] hover:bg-[#006866] active:bg-[#005755] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{T.verifying}</span>
                    </>
                  ) : (
                    <>
                      <span>{T.verifyBtn}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Resend Options */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      {!canResend && <CircularTimer seconds={secondsLeft} total={30} />}
                      <span className="text-[11px] tabular-nums">
                        {canResend ? "" : `${T.resendIn} ${secondsLeft}s`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResend(channel)}
                      disabled={!canResend || isSendingOtp}
                      className={`font-semibold inline-flex items-center gap-1.5 transition ${
                        canResend && !isSendingOtp
                          ? "text-[#008080] hover:underline"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {channel === "whatsapp" ? (
                        <WhatsAppIcon size={15} />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-[#008080]" />
                      )}
                      <span>{channel === "whatsapp" ? T.resendWhatsapp : T.resendSms}</span>
                    </button>
                  </div>

                  {canResend && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleResend(channel === "whatsapp" ? "sms" : "whatsapp")}
                        disabled={isSendingOtp}
                        className="text-[11px] text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1 font-medium"
                      >
                        <span>{T.switchChannelPrompt}</span>
                        <span className="text-[#008080] underline font-semibold inline-flex items-center gap-1">
                          {channel === "whatsapp" ? (
                            <>
                              <MessageSquare className="h-3 w-3" />
                              {T.resendSms}
                            </>
                          ) : (
                            <>
                              <WhatsAppIcon size={13} />
                              {T.resendWhatsapp}
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= BOTTOM CLIENT / TRUST BAR (COMPACT 100VH) ================= */}
      <footer className="shrink-0 w-full py-2.5 px-4 text-center border-t border-gray-100 bg-[#F4F6F8]/80 select-none">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="text-[10px] font-bold tracking-wider uppercase text-gray-500">
            POWERING 45,000+ BEDS ACROSS LEADING HOSTELS
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-extrabold text-gray-600 tracking-wider">
            <span>SRI SAI CO-LIVING</span>
            <span>STANZA LIVING PARTNERS</span>
            <span>KOTA RESIDENCY</span>
            <span>ZOLO ALLIANCE</span>
            <span>URBAN CAMPUS PG</span>
          </div>
          <div className="text-[10px] text-gray-400">
            © 2026 PG Ease Technologies
          </div>
        </div>
      </footer>
    </div>
  );
}
