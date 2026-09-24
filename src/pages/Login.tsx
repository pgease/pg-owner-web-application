import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { requestOtp, verifyOtp, type OtpChannel } from "@/api/propertyOwner";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import loginLottie from "@/assets/lottie/login.json";
import { Shield, Lock, Users, Pencil, Linkedin, MessageCircle, MessageSquare } from "lucide-react";

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
      className={`relative w-full h-12 rounded-2xl font-medium text-white shadow-lg overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
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

/* ---------- Floating background shapes ---------- */
function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-tl from-primary/15 via-primary/5 to-transparent blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-radial from-primary/[0.04] to-transparent blur-2xl" />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

/* ---------- Animation variants ---------- */
const pageEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE_SMOOTH },
};

const cardMotion = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE_SMOOTH },
};

const stepMotion = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -14 },
  transition: { duration: 0.3, ease: EASE_FAST },
};

/* ---------- i18n ---------- */
const TEXTS = {
  en: {
    title: "Manage your PG smarter",
    subtitle: "Track occupancy, rent, staff, and multiple properties in one secure dashboard.",
    owner: "PG Ease Owner",
    phoneLabel: "Mobile number",
    phoneHintWhatsapp: "We'll send an OTP to your WhatsApp.",
    phoneHintSms: "We'll send an OTP via SMS to verify your number.",
    sendVia: "Receive OTP via",
    whatsapp: "WhatsApp",
    sms: "SMS",
    fastBadge: "Instant",
    sendOtp: "Send OTP",
    sendOtpWhatsapp: "Send OTP on WhatsApp",
    sendOtpSms: "Send OTP via SMS",
    sending: "Sending...",
    verifyTitle: "Verify OTP",
    verifySubWhatsapp: "Enter the 4-digit code sent via WhatsApp to",
    verifySubSms: "Enter the 4-digit code sent via SMS to",
    verifyBtn: "Verify & Continue",
    verifying: "Verifying...",
    editNumber: "Edit",
    resendWhatsapp: "Resend on WhatsApp",
    resendSms: "Resend via SMS",
    resendIn: "Resend in",
    switchChannelPrompt: "Didn't receive the code?",
    otpWarn: "Do not share this code with anyone.",
    lang: "Language",
    english: "English",
    hindi: "Hindi",
    trust: "Trusted by 2,000+ PG owners",
    encryption: "Bank-grade encryption",
    secureLogin: "Secure OTP-based login",
    consentWhatsapp: "By continuing, you agree to receive verification OTP on WhatsApp.",
    consentSms: "By continuing, you agree to receive verification SMS for login.",
  },
  hi: {
    title: "अपना PG स्मार्ट तरीके से मैनेज करें",
    subtitle: "ऑक्यूपेंसी, रेंट, स्टाफ और कई प्रॉपर्टीज़ एक ही सुरक्षित डैशबोर्ड में।",
    owner: "PG Ease Owner",
    phoneLabel: "मोबाइल नंबर",
    phoneHintWhatsapp: "हम आपके WhatsApp पर OTP भेजेंगे।",
    phoneHintSms: "हम सत्यापन के लिए SMS भेजेंगे।",
    sendVia: "OTP यहाँ प्राप्त करें",
    whatsapp: "WhatsApp",
    sms: "SMS",
    fastBadge: "तुरंत",
    sendOtp: "OTP भेजें",
    sendOtpWhatsapp: "WhatsApp पर OTP भेजें",
    sendOtpSms: "SMS द्वारा OTP भेजें",
    sending: "भेज रहे हैं...",
    verifyTitle: "OTP सत्यापित करें",
    verifySubWhatsapp: "WhatsApp पर भेजा गया 4 अंकों का कोड दर्ज करें:",
    verifySubSms: "SMS पर भेजा गया 4 अंकों का कोड दर्ज करें:",
    verifyBtn: "Verify & Continue",
    verifying: "जाँच रहे हैं...",
    editNumber: "बदलें",
    resendWhatsapp: "WhatsApp पर फिर से भेजें",
    resendSms: "SMS द्वारा फिर से भेजें",
    resendIn: "फिर से भेजें",
    switchChannelPrompt: "कोड प्राप्त नहीं हुआ?",
    otpWarn: "OTP किसी से साझा न करें।",
    lang: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    trust: "2,000+ PG मालिकों का भरोसा",
    encryption: "बैंक-ग्रेड एन्क्रिप्शन",
    secureLogin: "सुरक्षित OTP लॉगिन",
    consentWhatsapp: "जारी रखकर, आप WhatsApp पर सत्यापन संदेश प्राप्त करने की सहमति देते हैं।",
    consentSms: "जारी रखकर, आप लॉगिन हेतु सत्यापन SMS प्राप्त करने की सहमति देते हैं।",
  },
};

/* ==================== Main Component ==================== */
export default function Login() {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("phone");
  const [channel, setChannel] = useState<OtpChannel>("whatsapp");
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem(LAST_PHONE_KEY) ?? ""; } catch { return ""; }
  });
  const [otp, setOtp] = useState("");
  const [shaking, setShaking] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { secondsLeft, start, reset, canResend } = useResendTimer(30);
  const lottieRef = useRef<any>(null);
  const phoneValid = phone.length === 10;

  const T = TEXTS[lang];

  // Remember last phone
  useEffect(() => {
    if (phone.length === 10) {
      try { localStorage.setItem(LAST_PHONE_KEY, phone); } catch {}
    }
  }, [phone]);

  // Immediately autofocus OTP input when transitioning to OTP screen
  useEffect(() => {
    if (step === "otp") {
      const focusOtpInput = () => {
        const otpInput = document.querySelector('input[data-input-otp="true"]') as HTMLInputElement;
        if (otpInput) {
          otpInput.focus();
        }
      };

      focusOtpInput();
      const t1 = setTimeout(focusOtpInput, 50);
      const t2 = setTimeout(focusOtpInput, 150);
      const t3 = setTimeout(focusOtpInput, 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  const handleSendOtp = async (targetChannel: OtpChannel = channel) => {
    if (!phoneValid) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone, targetChannel);
      setChannel(targetChannel);
      toast({
        title: targetChannel === "whatsapp" ? "OTP sent to WhatsApp" : "OTP sent via SMS",
        description: `Expires in ${Math.round(res.expiresIn / 60)} min`,
      });
      setStep("otp");
      start(30);
      try { lottieRef.current?.goToAndPlay?.(0, true); } catch {}
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResend = async (targetChannel: OtpChannel = channel) => {
    if (!canResend || !phoneValid) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone, targetChannel);
      setChannel(targetChannel);
      toast({
        title: targetChannel === "whatsapp" ? "OTP resent to WhatsApp" : "OTP resent via SMS",
        description: `Expires in ${Math.round(res.expiresIn / 60)} min`,
      });
      start(30);
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue: string) => {
    if (otpValue.length !== 4) return;
    try {
      setIsVerifyingOtp(true);
      const data = await verifyOtp(phone, otpValue);

      setShowSuccess(true);
      toast({
        title: "Logged in successfully",
        description: data.isNewUser ? "Let's set up your first PG." : "Welcome back!",
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
      toast({ title: "Invalid OTP", description: error?.message ?? "Please double-check and try again.", variant: "destructive" });
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [phone, navigate, triggerShake]);

  // Auto-submit when 4 digits entered
  const handleOtpChange = useCallback((value: string) => {
    const cleaned = clampDigits(value, 4);
    setOtp(cleaned);
    if (cleaned.length === 4) {
      handleVerifyOtp(cleaned);
    }
  }, [handleVerifyOtp]);

  // Enter key on phone input
  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && phoneValid && !isSendingOtp) {
      e.preventDefault();
      handleSendOtp(channel);
    }
  };

  return (
    <div className="min-h-screen relative bg-[hsl(180,50%,5%)] text-white overflow-hidden">
      <FloatingShapes />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-5 py-8 lg:flex-row lg:gap-20">

        {/* ---- Left: branding ---- */}
        <motion.div {...pageEnter} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl text-center lg:text-left mb-8 lg:mb-0">

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={pgeaseLogo} className="h-10 w-10 rounded-xl shadow-md" alt="PG Ease" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">{T.owner}</div>
                <div className="text-xs text-white/70">{T.secureLogin}</div>
              </div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-1.5">
              <div className="rounded-full border border-white/10 bg-white/[0.04] p-0.5 flex">
                {(["en", "hi"] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      lang === l ? "bg-white/[0.12] text-white shadow-sm" : "text-white/55 hover:text-white/80"
                    }`}>
                    {l === "en" ? T.english : T.hindi}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {T.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-primary">{T.title.split(" ").slice(-1)}</span>
          </h1>
          <p className="mt-4 text-sm text-white/60 sm:text-[15px] leading-relaxed max-w-md mx-auto lg:mx-0">
            {T.subtitle}
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/65">{T.encryption}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/65">{T.trust}</span>
            </div>
          </div>

          {/* Desktop Lottie */}
          <div className="mt-10 hidden lg:block">
            <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-xl pointer-events-none" />
              <Lottie lottieRef={lottieRef} animationData={loginLottie} loop className="h-56 w-full relative z-10" />
              <div className="mt-3 text-xs text-white/50 text-center relative z-10">
                Secure onboarding • Faster setup • Multi-property ready
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- Right: Auth card ---- */}
        <motion.div {...cardMotion} className="w-full max-w-md">
          <Card className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/30">
            <CardContent className="p-6 sm:p-8">

              {showSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-10 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Lock className="h-7 w-7 text-primary" />
                  </motion.div>
                  <p className="text-lg font-semibold">Login successful</p>
                  <p className="text-sm text-white/50">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {step === "phone" ? (
                    <motion.div key="phone" {...stepMotion} className="space-y-5">
                      <div className="space-y-1.5">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">Login</div>
                        <div className="text-lg font-semibold tracking-tight">Sign in to continue</div>
                        <div className="text-[13px] text-white/55">Use your registered mobile number</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-white/60">{T.phoneLabel}</Label>
                        <div className="flex">
                          <div className="flex h-12 items-center rounded-l-2xl border border-r-0 border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white/80">
                            +91
                          </div>
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                            onKeyDown={handlePhoneKeyDown}
                            placeholder="Enter 10-digit number"
                            inputMode="numeric"
                            autoComplete="tel"
                            className={`h-12 rounded-l-none rounded-r-2xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 transition-colors ${
                              phone.length > 0 && phone.length < 10
                                ? "border-destructive/50"
                                : phone.length === 10
                                ? "border-primary/40"
                                : ""
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-white/40">
                          {channel === "whatsapp" ? T.phoneHintWhatsapp : T.phoneHintSms}
                        </p>
                      </div>

                      {/* Channel Selector: WhatsApp vs SMS */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">{T.sendVia}</Label>
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-1 border border-white/[0.08]">
                          <button
                            type="button"
                            onClick={() => setChannel("whatsapp")}
                            className={`relative flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-medium transition-all ${
                              channel === "whatsapp"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                                : "text-white/55 hover:text-white/85 hover:bg-white/[0.04]"
                            }`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{T.whatsapp}</span>
                            <span className="rounded bg-emerald-500/25 px-1 py-0.2 text-[9px] font-semibold text-emerald-300">
                              {T.fastBadge}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChannel("sms")}
                            className={`relative flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-medium transition-all ${
                              channel === "sms"
                                ? "bg-primary/20 text-primary border border-primary/40 shadow-sm"
                                : "text-white/55 hover:text-white/85 hover:bg-white/[0.04]"
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
                        style={{
                          backgroundColor: channel === "whatsapp" ? "#059669" : "hsl(var(--primary))",
                        }}
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

                      <p className="text-center text-[11px] text-white/35 leading-relaxed">
                        {channel === "whatsapp" ? T.consentWhatsapp : T.consentSms}
                      </p>

                      {/* Security badge */}
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] text-white/30">Your data is 256-bit encrypted</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp" {...stepMotion}
                      className={`space-y-5 ${shaking ? "animate-shake" : ""}`}>
                      <div className="space-y-1.5">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">{T.verifyTitle}</div>
                        <div className="text-[13px] text-white/70">
                          {channel === "whatsapp" ? T.verifySubWhatsapp : T.verifySubSms}{" "}
                          <span className="font-semibold text-white/90 inline-flex items-center gap-1 ml-1">
                            {channel === "whatsapp" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-emerald-300 text-xs">
                                <MessageCircle className="h-3 w-3" /> +91 {phone}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-primary text-xs">
                                <MessageSquare className="h-3 w-3" /> +91 {phone}
                              </span>
                            )}
                          </span>
                          <button type="button" onClick={() => { setOtp(""); setStep("phone"); reset(); }}
                            className="ml-2 inline-flex items-center gap-1 text-primary text-xs hover:underline">
                            <Pencil className="h-3 w-3" /> {T.editNumber}
                          </button>
                        </div>
                        <div className="text-[11px] text-white/40">{T.otpWarn}</div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs text-white/60">One-time password</Label>
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
                              <InputOTPSlot key={i} index={i}
                                className="h-14 w-14 rounded-2xl border border-white/[0.1] bg-white/[0.04] text-lg font-bold text-white shadow-inner"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <ShimmerButton loading={isVerifyingOtp} onClick={() => handleVerifyOtp(otp)}
                        disabled={otp.length !== 4}
                        style={{ backgroundColor: "hsl(var(--primary))" }}>
                        {isVerifyingOtp ? T.verifying : T.verifyBtn}
                      </ShimmerButton>

                      {/* Resend row */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-white/40">
                            {!canResend && <CircularTimer seconds={secondsLeft} total={30} />}
                          </div>
                          <button type="button" onClick={() => handleResend(channel)}
                            disabled={!canResend || isSendingOtp}
                            className={`text-xs font-medium inline-flex items-center gap-1.5 transition ${
                              canResend && !isSendingOtp
                                ? channel === "whatsapp"
                                  ? "text-emerald-400 hover:text-emerald-300"
                                  : "text-primary hover:text-primary/80"
                                : "text-white/25 cursor-not-allowed"
                            }`}>
                            {channel === "whatsapp" ? (
                              <MessageCircle className="h-3.5 w-3.5" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5" />
                            )}
                            {canResend
                              ? channel === "whatsapp"
                                ? T.resendWhatsapp
                                : T.resendSms
                              : `${T.resendIn}`}
                          </button>
                        </div>

                        {/* Switch channel prompt if user hasn't received code */}
                        {canResend && (
                          <div className="text-center pt-2 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => handleResend(channel === "whatsapp" ? "sms" : "whatsapp")}
                              disabled={isSendingOtp}
                              className="text-[11px] text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>{T.switchChannelPrompt}</span>
                              <span className="text-primary underline font-medium inline-flex items-center gap-1">
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

                      {/* Security badge */}
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] text-white/30">Your data is 256-bit encrypted</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Social Links / Footer under Card */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
            <span>Connect with us:</span>
            <a
              href="https://www.linkedin.com/company/pg-ease-solutions/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
            >
              <Linkedin className="h-3.5 w-3.5 animate-pulse" />
              LinkedIn
            </a>
          </div>

          {/* Mobile Lottie */}
          <div className="mt-6 lg:hidden">
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur shadow-lg shadow-black/20">
              <Lottie animationData={loginLottie} loop className="h-36 w-full" />
              <div className="mt-2 text-center text-[11px] text-white/45">
                {T.secureLogin} for PG owners
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
