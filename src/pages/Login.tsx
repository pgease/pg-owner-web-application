import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { requestOtp, verifyOtp, type OtpChannel } from "@/api/propertyOwner";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import {
  Shield,
  Lock,
  Users,
  Pencil,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Gift,
  Building2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

type Step = "phone" | "otp";
type Lang = "en" | "hi";

const LAST_PHONE_KEY = "pgEase_lastPhone";
const clampDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const cleanPhoneInput = (v: string): string => {
  const digits = v.replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.startsWith("91")) {
      return digits.slice(2, 12);
    }
    if (digits.startsWith("0")) {
      return digits.slice(1, 11);
    }
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
};

const EASE_SMOOTH = cubicBezier(0.16, 1, 0.3, 1);
const EASE_FAST = cubicBezier(0.2, 0.9, 0.2, 1);

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
          className="text-white/10"
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
          className="text-primary transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute text-[9px] font-semibold text-white/70">{seconds}</span>
    </div>
  );
}

/* ---------- Shimmer submit button ---------- */
function ShimmerButton({
  children,
  loading,
  disabled,
  onClick,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={`relative w-full h-11 rounded-xl font-medium text-white shadow-md overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-semibold">
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

/* ---------- Animation variants ---------- */
const pageEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE_SMOOTH },
};

const cardMotion = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.35, ease: EASE_SMOOTH },
};

const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.25, ease: EASE_FAST },
};

/* ---------- i18n ---------- */
const TEXTS = {
  en: {
    title: "Executive PG Management",
    subtitle: "Complete control over occupancy, rent reconciliation, tenant KYC, and team operations.",
    owner: "PG Ease Owner Portal",
    phoneLabel: "Mobile Number",
    phoneHintWhatsapp: "We'll send an OTP to your WhatsApp account.",
    phoneHintSms: "We'll send an OTP via SMS to verify your mobile.",
    sendVia: "Receive Verification Code via",
    whatsapp: "WhatsApp",
    sms: "SMS",
    fastBadge: "Instant",
    sendOtp: "Send OTP",
    sendOtpWhatsapp: "Send Code on WhatsApp",
    sendOtpSms: "Send Code via SMS",
    sending: "Transmitting...",
    verifyTitle: "Verify Mobile",
    verifySubWhatsapp: "Enter the 4-digit code sent via WhatsApp to",
    verifySubSms: "Enter the 4-digit code sent via SMS to",
    verifyBtn: "Verify & Continue",
    verifying: "Authenticating...",
    editNumber: "Edit",
    resendWhatsapp: "Resend on WhatsApp",
    resendSms: "Resend via SMS",
    resendIn: "Resend in",
    switchChannelPrompt: "Didn't receive the code?",
    otpWarn: "Never share your authentication code with anyone.",
    lang: "Language",
    english: "English",
    hindi: "हिंदी",
    trust: "Trusted by 2,000+ PG owners",
    encryption: "Bank-grade 256-bit encryption",
    secureLogin: "Secure OTP Authentication",
    consentWhatsapp: "By proceeding, you consent to receive communication on WhatsApp.",
    consentSms: "By proceeding, you consent to receive a one-time verification SMS.",
    trialBadge: "45-Day Free Pro Trial Included",
    trialHeadline: "Get 45 days of complimentary Pro tier access upon sign up.",
    trialSub: "Includes automated payment ledger, custom PG portal, and digital tenant onboarding.",
  },
  hi: {
    title: "स्मार्ट पीजी प्रबंधन",
    subtitle: "कमरों की उपलब्धता, किराया संग्रह और कर्मचारियों का संचालन एक ही सुरक्षित डैशबोर्ड में।",
    owner: "पीजी ईज़ ओनर पोर्टल",
    phoneLabel: "मोबाइल नंबर",
    phoneHintWhatsapp: "हम आपके व्हाट्सएप पर एक ओटीपी भेजेंगे।",
    phoneHintSms: "हम आपके नंबर पर एसएमएस के माध्यम से ओटीपी भेजेंगे।",
    sendVia: "ओटीपी प्राप्त करने का माध्यम",
    whatsapp: "व्हाट्सएप",
    sms: "एसएमएस",
    fastBadge: "तत्काल",
    sendOtp: "ओटीपी भेजें",
    sendOtpWhatsapp: "व्हाट्सएप पर ओटीपी भेजें",
    sendOtpSms: "एसएमएस द्वारा ओटीपी भेजें",
    sending: "भेज रहे हैं...",
    verifyTitle: "ओटीपी सत्यापित करें",
    verifySubWhatsapp: "व्हाट्सएप पर भेजा गया 4-अंकीय कोड दर्ज करें",
    verifySubSms: "एसएमएस द्वारा भेजा गया 4-अंकीय कोड दर्ज करें",
    verifyBtn: "सत्यापित करें और आगे बढ़ें",
    verifying: "सत्यापित कर रहे हैं...",
    editNumber: "बदलें",
    resendWhatsapp: "व्हाट्सएप पर पुनः भेजें",
    resendSms: "एसएमएस द्वारा पुनः भेजें",
    resendIn: "पुनः भेजें",
    switchChannelPrompt: "कोड प्राप्त नहीं हुआ?",
    otpWarn: "यह कोड किसी के साथ साझा न करें।",
    lang: "भाषा",
    english: "English",
    hindi: "हिंदी",
    trust: "2,000+ पीजी मालिकों का भरोसा",
    encryption: "बैंक-ग्रेड एन्क्रिप्शन",
    secureLogin: "सुरक्षित ओटीपी लॉगिन",
    consentWhatsapp: "जारी रखकर, आप व्हाट्सएप पर संचार प्राप्त करने की सहमति देते हैं।",
    consentSms: "जारी रखकर, आप लॉगिन हेतु सत्यापन SMS प्राप्त करने की सहमति देते हैं।",
    trialBadge: "45 दिनों का मुफ़्त Pro ट्रायल",
    trialHeadline: "खाता बनाने पर 45 दिनों तक मुफ़्त Pro ऐक्सेस पाएं।",
    trialSub: "इसमें ऑटोमेटेड यूपीआई कलेक्शन, वेबसाइट और डिजिटल ऑनबोर्डिंग शामिल है।",
  },
};

/* ==================== Main Component ==================== */
export default function Login() {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Lang>("en");
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
  const [showSuccess, setShowSuccess] = useState(false);

  const { secondsLeft, start, reset, canResend } = useResendTimer(30);
  const phoneValid = phone.length === 10;

  const T = TEXTS[lang];

  // Remember last phone
  useEffect(() => {
    if (phone.length === 10) {
      try {
        localStorage.setItem(LAST_PHONE_KEY, phone);
      } catch {}
    }
  }, [phone]);

  // Immediately autofocus OTP input when transitioning to OTP screen
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

        setShowSuccess(true);
        toast({
          title: "Authenticated Successfully",
          description: data.isNewUser ? "Welcome! Let's set up your property." : "Welcome back to PG Ease.",
        });

        setTimeout(() => {
          if (data.isNewUser || !data.hasProperties) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 800);
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
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* ================= LEFT EXECUTIVE PANEL ================= */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#081214] text-white relative overflow-hidden flex-col justify-between p-12 border-r border-border/40 select-none">
        {/* Subtle executive geometry accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] border border-primary/5 rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img src={pgeaseLogo} className="h-11 w-11 rounded-xl shadow-md border border-white/10 object-cover" alt="PG Ease" />
          <div>
            <span className="text-base font-bold tracking-tight text-white block">PG Ease</span>
            <span className="text-[11px] uppercase tracking-wider text-primary font-medium">Owner Portal</span>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="relative z-10 space-y-7 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs text-amber-300 font-semibold shadow-xs">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>45-Day Complimentary Pro Trial</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Intelligent Management <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
                for Modern PG Businesses
              </span>
            </h1>
            <p className="text-sm text-white/65 max-w-md leading-relaxed">
              Automate rent tracking, room assignments, tenant onboarding, and team operations with an enterprise-grade platform.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              {
                icon: Building2,
                title: "Live Multi-Property Grid",
                desc: "Real-time room occupancy, vacant bed status, and meal plan yields.",
              },
              {
                icon: TrendingUp,
                title: "Automated UPI Rent Collections",
                desc: "Direct-to-bank settlements with automated tenant WhatsApp reminders.",
              },
              {
                icon: Shield,
                title: "Enterprise Security & KYC",
                desc: "Verified tenant government IDs, digital agreements, and 256-bit encryption.",
              },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white/90">{title}</p>
                  <p className="text-[11px] text-white/55 leading-normal">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/5">
          <span>© {new Date().getFullYear()} PG Ease Solutions Pvt. Ltd.</span>
          <span className="flex items-center gap-1.5 text-white/50">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> SOC2 Compliant
          </span>
        </div>
      </div>

      {/* ================= RIGHT AUTHENTICATION PANEL ================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 min-h-screen bg-card/40 relative">
        {/* Top Navbar: Mobile Logo & Language Switcher */}
        <div className="flex items-center justify-between w-full max-w-[420px] mx-auto">
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src={pgeaseLogo} className="h-8 w-8 rounded-lg shadow-sm" alt="PG Ease" />
            <span className="text-sm font-bold text-foreground">PG Ease Owner</span>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
            {(["en", "hi"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  lang === l
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "en" ? T.english : T.hindi}
              </button>
            ))}
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-6">
          <Card className="border-border/80 shadow-lg bg-card rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              {showSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-8 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Authentication Successful</h3>
                    <p className="text-xs text-muted-foreground mt-1">Connecting to your property portfolio...</p>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {step === "phone" ? (
                    <motion.div key="phone" {...stepMotion} className="space-y-5">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          Owner Sign In
                        </span>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Access Your Dashboard</h2>
                        <p className="text-xs text-muted-foreground">
                          Enter your mobile number to sign in or create an owner account.
                        </p>
                      </div>

                      {/* 45-Day Free Pro Trial Highlight Banner */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-start gap-2.5">
                          <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs">{T.trialBadge}</span>
                              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                                PRO
                              </span>
                            </div>
                            <p className="text-[11px] opacity-80 leading-snug">{T.trialHeadline}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground">{T.phoneLabel}</Label>
                        <div className="flex rounded-xl overflow-hidden border border-input shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                          <div className="flex items-center bg-muted/70 px-3.5 text-xs font-semibold text-muted-foreground border-r border-border">
                            +91
                          </div>
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                            onKeyDown={handlePhoneKeyDown}
                            placeholder="Enter 10-digit number"
                            inputMode="numeric"
                            autoComplete="tel"
                            className="h-11 rounded-none border-0 shadow-none text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {channel === "whatsapp" ? T.phoneHintWhatsapp : T.phoneHintSms}
                        </p>
                      </div>

                      {/* Channel Selector: WhatsApp vs SMS */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">{T.sendVia}</Label>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border/60">
                          <button
                            type="button"
                            onClick={() => setChannel("whatsapp")}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
                              channel === "whatsapp"
                                ? "bg-card text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{T.whatsapp}</span>
                            <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              {T.fastBadge}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChannel("sms")}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
                              channel === "sms"
                                ? "bg-card text-primary border border-primary/30 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            <span>{T.sms}</span>
                          </button>
                        </div>
                      </div>

                      <ShimmerButton
                        loading={isSendingOtp}
                        onClick={() => handleSendOtp(channel)}
                        disabled={!phoneValid}
                        className={channel === "whatsapp" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {channel === "whatsapp" ? (
                            <MessageCircle className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span>
                            {isSendingOtp
                              ? T.sending
                              : channel === "whatsapp"
                              ? T.sendOtpWhatsapp
                              : T.sendOtpSms}
                          </span>
                        </div>
                      </ShimmerButton>

                      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                        {channel === "whatsapp" ? T.consentWhatsapp : T.consentSms}
                      </p>

                      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3 text-primary" />
                        <span>Protected by 256-bit bank-grade encryption</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp" {...stepMotion} className={`space-y-5 ${shaking ? "animate-shake" : ""}`}>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          Verification
                        </span>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">{T.verifyTitle}</h2>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {channel === "whatsapp" ? T.verifySubWhatsapp : T.verifySubSms}{" "}
                          <span className="font-semibold text-foreground inline-flex items-center gap-1">
                            +91 {phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOtp("");
                              setStep("phone");
                              reset();
                            }}
                            className="ml-2 inline-flex items-center gap-0.5 text-primary text-xs hover:underline font-semibold"
                          >
                            <Pencil className="h-3 w-3" /> {T.editNumber}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Enter 4-Digit Security Code
                        </Label>
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
                          containerClassName="w-full justify-between"
                          autoComplete="one-time-code"
                        >
                          <InputOTPGroup className="w-full justify-between gap-3">
                            {[0, 1, 2, 3].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border border-input bg-muted/30 text-lg font-bold text-foreground shadow-2xs"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <ShimmerButton
                        loading={isVerifyingOtp}
                        onClick={() => handleVerifyOtp(otp)}
                        disabled={otp.length !== 4}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isVerifyingOtp ? T.verifying : T.verifyBtn}
                      </ShimmerButton>

                      {/* Resend Controls */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {!canResend && <CircularTimer seconds={secondsLeft} total={30} />}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResend(channel)}
                            disabled={!canResend || isSendingOtp}
                            className={`text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                              canResend && !isSendingOtp
                                ? channel === "whatsapp"
                                  ? "text-emerald-600 dark:text-emerald-400 hover:underline"
                                  : "text-primary hover:underline"
                                : "text-muted-foreground/50 cursor-not-allowed"
                            }`}
                          >
                            {channel === "whatsapp" ? (
                              <MessageCircle className="h-3.5 w-3.5" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5" />
                            )}
                            {canResend
                              ? channel === "whatsapp"
                                ? T.resendWhatsapp
                                : T.resendSms
                              : `${T.resendIn} (${secondsLeft}s)`}
                          </button>
                        </div>

                        {canResend && (
                          <div className="text-center pt-2 border-t border-border/50">
                            <button
                              type="button"
                              onClick={() => handleResend(channel === "whatsapp" ? "sms" : "whatsapp")}
                              disabled={isSendingOtp}
                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                            >
                              <span>{T.switchChannelPrompt}</span>
                              <span className="text-primary underline font-semibold inline-flex items-center gap-1">
                                {channel === "whatsapp" ? (
                                  <>
                                    <MessageSquare className="h-3 w-3" />
                                    {T.resendSms}
                                  </>
                                ) : (
                                  <>
                                    <MessageCircle className="h-3 w-3" />
                                    {T.resendWhatsapp}
                                  </>
                                )}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Social Links & Trust Footer */}
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              {T.trust}
            </span>
            <a
              href="https://www.linkedin.com/company/pg-ease-solutions/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom spacing / terms */}
        <div className="text-center text-[11px] text-muted-foreground">
          By signing in, you agree to PG Ease's Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
