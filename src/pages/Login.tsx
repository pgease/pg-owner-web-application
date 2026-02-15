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

import { requestOtp, verifyOtp } from "@/api/propertyOwner";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import loginLottie from "@/assets/lottie/login.json";
import { Shield, Lock, Users, Pencil } from "lucide-react";

type Step = "phone" | "otp";
type Lang = "en" | "hi";

const LAST_PHONE_KEY = "pgEase_lastPhone";
const clampDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
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
  const r = 18;
  const c = 2 * Math.PI * r;
  const progress = seconds / total;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-white/80">{seconds}s</span>
    </div>
  );
}

/* ---------- Shimmer Button ---------- */
function ShimmerButton({
  loading, children, className, style, disabled, onClick, type = "button",
}: {
  loading?: boolean; children: React.ReactNode; className?: string;
  style?: React.CSSProperties; disabled?: boolean; onClick?: () => void; type?: "button" | "submit";
}) {
  return (
    <Button type={type} onClick={onClick} disabled={disabled || loading}
      className={`relative overflow-hidden rounded-2xl h-12 w-full font-semibold text-white transition-transform active:scale-[0.98] shadow-lg ${className ?? ""}`}
      style={style}
    >
      <span className={`pointer-events-none absolute inset-0 ${loading ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}>
        <span className="absolute inset-0 bg-white/10" />
        <motion.span className="absolute -inset-y-2 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={loading ? { x: ["0%", "250%"] } : { x: "0%" }}
          transition={loading ? { duration: 1.1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        />
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <motion.span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white"
            animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </span>
    </Button>
  );
}

/* ---------- Floating background ---------- */
function FloatingShapes() {
  const blobs = useMemo(() => [
    { size: 260, x: "5%", y: "8%", delay: 0, opacity: 0.15 },
    { size: 320, x: "78%", y: "12%", delay: 0.2, opacity: 0.1 },
    { size: 200, x: "72%", y: "75%", delay: 0.35, opacity: 0.08 },
    { size: 160, x: "15%", y: "80%", delay: 0.5, opacity: 0.08 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full blur-3xl"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y,
            background: `radial-gradient(circle at 30% 30%, hsl(var(--primary)), transparent 60%)`, opacity: b.opacity }}
          initial={{ y: 0, x: 0, scale: 1 }}
          animate={{ y: [0, -20, 0, 16, 0], x: [0, 14, 0, -12, 0] }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

const pageEnter = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(6px)" },
};
const cardMotion = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.55, ease: EASE_SMOOTH },
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
    phoneHint: "We'll send an OTP to verify your number.",
    sendOtp: "Send OTP",
    sending: "Sending...",
    verifyTitle: "Verify OTP",
    verifySub: "Enter the 4-digit code sent to",
    verifyBtn: "Verify & Continue",
    verifying: "Verifying...",
    editNumber: "Edit",
    resend: "Resend OTP",
    resendIn: "Resend in",
    otpWarn: "Do not share this code with anyone.",
    lang: "Language",
    english: "English",
    hindi: "Hindi",
    trust: "Trusted by 2,000+ PG owners",
    encryption: "Bank-grade encryption",
    secureLogin: "Secure OTP-based login",
    consent: "By continuing, you agree to receive verification SMS for login.",
  },
  hi: {
    title: "अपना PG स्मार्ट तरीके से मैनेज करें",
    subtitle: "ऑक्यूपेंसी, रेंट, स्टाफ और कई प्रॉपर्टीज़ एक ही सुरक्षित डैशबोर्ड में।",
    owner: "PG Ease Owner",
    phoneLabel: "मोबाइल नंबर",
    phoneHint: "हम सत्यापन के लिए OTP भेजेंगे।",
    sendOtp: "OTP भेजें",
    sending: "भेज रहे हैं...",
    verifyTitle: "OTP सत्यापित करें",
    verifySub: "4 अंकों का कोड दर्ज करें जो भेजा गया है:",
    verifyBtn: "Verify & Continue",
    verifying: "जाँच रहे हैं...",
    editNumber: "बदलें",
    resend: "OTP फिर से भेजें",
    resendIn: "फिर से भेजें",
    otpWarn: "OTP किसी से साझा न करें।",
    lang: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    trust: "2,000+ PG मालिकों का भरोसा",
    encryption: "बैंक-ग्रेड एन्क्रिप्शन",
    secureLogin: "सुरक्षित OTP लॉगिन",
    consent: "जारी रखकर, आप लॉगिन हेतु सत्यापन SMS प्राप्त करने की सहमति देते हैं।",
  },
};

/* ==================== Main Component ==================== */
export default function Login() {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("phone");
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

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  const handleSendOtp = async () => {
    if (!phoneValid) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone);
      toast({ title: "OTP sent", description: `Expires in ${Math.round(res.expiresIn / 60)} min` });
      setStep("otp");
      start(30);
      try { lottieRef.current?.goToAndPlay?.(0, true); } catch {}
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: error?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !phoneValid) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone);
      toast({ title: "OTP resent", description: `Expires in ${Math.round(res.expiresIn / 60)} min` });
      start(30);
    } catch (error: any) {
      toast({ title: "Failed to resend", description: error?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue: string) => {
    if (otpValue.length !== 4) return;
    try {
      setIsVerifyingOtp(true);
      const data = await verifyOtp(phone, otpValue);

      toast({
        title: "Logged in successfully",
        description: data.isNewUser ? "Let’s set up your first PG." : "Welcome back!",
      });

      if (data.isNewUser || !data.hasProperties) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/kpis", { replace: true });
      }
      setShowSuccess(true);
      toast({ title: "Logged in successfully", description: data.isNewUser ? "Let's set up your first PG." : "Welcome back!" });

      setTimeout(() => {
        if (data.isNewUser || !data.hasProperties) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/kpis", { replace: true });
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
    if (e.key === "Enter" && phoneValid && !isSendingOtp) handleSendOtp();
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
                            onChange={(e) => setPhone(clampDigits(e.target.value, 10))}
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
                        <p className="text-[11px] text-white/40">{T.phoneHint}</p>
                      </div>

                      <ShimmerButton loading={isSendingOtp} onClick={handleSendOtp} disabled={!phoneValid}
                        style={{ backgroundColor: "hsl(var(--primary))" }}>
                        {isSendingOtp ? T.sending : T.sendOtp}
                      </ShimmerButton>

                      <p className="text-center text-[11px] text-white/35 leading-relaxed">{T.consent}</p>

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
                          {T.verifySub}{" "}
                          <span className="font-semibold text-white/90">+91 {phone}</span>
                          <button type="button" onClick={() => { setOtp(""); setStep("phone"); reset(); }}
                            className="ml-2 inline-flex items-center gap-1 text-primary text-xs hover:underline">
                            <Pencil className="h-3 w-3" /> {T.editNumber}
                          </button>
                        </div>
                        <div className="text-[11px] text-white/40">{T.otpWarn}</div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs text-white/60">One-time password</Label>
                        <InputOTP maxLength={4} value={otp} onChange={handleOtpChange}
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
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/40">
                          {!canResend && <CircularTimer seconds={secondsLeft} total={30} />}
                        </div>
                        <button type="button" onClick={handleResend}
                          disabled={!canResend || isSendingOtp}
                          className={`text-xs font-medium transition ${
                            canResend && !isSendingOtp
                              ? "text-primary hover:text-primary/80"
                              : "text-white/25 cursor-not-allowed"
                          }`}>
                          {canResend ? T.resend : `${T.resendIn}`}
                        </button>
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
