import { useEffect, useMemo, useRef, useState } from "react";
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

type Step = "phone" | "otp";
type Lang = "en" | "hi";

const PRIMARY = "#008080";

// -------------------- tiny helpers --------------------
const clampDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const EASE_SMOOTH = cubicBezier(0.16, 1, 0.3, 1);
const EASE_FAST = cubicBezier(0.2, 0.9, 0.2, 1);

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

function ShimmerButton({
  loading,
  children,
  className,
  style,
  disabled,
  onClick,
  type = "button",
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "relative overflow-hidden rounded-xl h-11 w-full font-medium text-white",
        "transition-transform active:scale-[0.99]",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {/* shimmer */}
      <span
        className={[
          "pointer-events-none absolute inset-0 opacity-0",
          loading ? "opacity-100" : "opacity-0",
          "transition-opacity duration-200",
        ].join(" ")}
      >
        <span className="absolute inset-0 bg-white/10" />
        <motion.span
          className="absolute -inset-y-2 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={loading ? { x: ["0%", "250%"] } : { x: "0%" }}
          transition={loading ? { duration: 1.1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        />
      </span>

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <motion.span
            className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </span>
    </Button>
  );
}

// -------------------- UI bits --------------------
function FloatingShapes() {
  const blobs = useMemo(
    () => [
      { size: 220, x: "8%", y: "10%", delay: 0.0, opacity: 0.18 },
      { size: 280, x: "80%", y: "16%", delay: 0.2, opacity: 0.12 },
      { size: 180, x: "70%", y: "78%", delay: 0.35, opacity: 0.10 },
      { size: 140, x: "18%", y: "78%", delay: 0.5, opacity: 0.10 },
    ],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:30px_30px]" />

      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: `radial-gradient(circle at 30% 30%, ${PRIMARY}, transparent 60%)`,
            opacity: b.opacity,
          }}
          initial={{ y: 0, x: 0, scale: 1 }}
          animate={{ y: [0, -18, 0, 14, 0], x: [0, 12, 0, -10, 0] }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: b.delay,
          }}
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
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.55, ease: EASE_SMOOTH },
};

const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.28, ease: EASE_FAST },
};


// -------------------- Main Component --------------------
export default function Login() {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { secondsLeft, start, reset, canResend } = useResendTimer(30);
  const lottieRef = useRef<any>(null);

  const T = useMemo(() => {
    const en = {
      title: "Manage your PG smarter",
      subtitle:
        "Track occupancy, rent, staff, and multiple properties in one secure dashboard.",
      owner: "PG Ease Owner",
      phoneLabel: "Mobile number",
      phoneHint: "We’ll send an OTP to verify your number.",
      sendOtp: "Send OTP",
      sending: "Sending...",
      verifyTitle: "Verify OTP",
      verifySub: "Enter the 4-digit code sent to",
      verifyBtn: "Verify & Continue",
      verifying: "Verifying...",
      changeNumber: "Use a different mobile number",
      resend: "Resend OTP",
      resendIn: "Resend in",
      otpWarn: "Do not share this code with anyone.",
      lang: "Language",
      english: "English",
      hindi: "Hindi",
    };
    const hi = {
      title: "अपना PG स्मार्ट तरीके से मैनेज करें",
      subtitle:
        "ऑक्यूपेंसी, रेंट, स्टाफ और कई प्रॉपर्टीज़ एक ही सुरक्षित डैशबोर्ड में।",
      owner: "PG Ease Owner",
      phoneLabel: "मोबाइल नंबर",
      phoneHint: "हम सत्यापन के लिए OTP भेजेंगे।",
      sendOtp: "OTP भेजें",
      sending: "भेज रहे हैं...",
      verifyTitle: "OTP सत्यापित करें",
      verifySub: "4 अंकों का कोड दर्ज करें जो भेजा गया है:",
      verifyBtn: "Verify & Continue",
      verifying: "जाँच रहे हैं...",
      changeNumber: "दूसरा मोबाइल नंबर उपयोग करें",
      resend: "OTP फिर से भेजें",
      resendIn: "फिर से भेजें",
      otpWarn: "OTP किसी से साझा न करें।",
      lang: "भाषा",
      english: "English",
      hindi: "हिन्दी",
    };
    return lang === "en" ? en : hi;
  }, [lang]);

  const goOtp = () => {
    setStep("otp");
    // restart animation on step change (optional)
    try {
      lottieRef.current?.goToAndPlay?.(0, true);
    } catch {}
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone);

      toast({
        title: "OTP sent",
        description: `Expires in ${Math.round(res.expiresIn / 60)} min`,
      });

      goOtp();
      start(30);
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

  const handleResend = async () => {
    if (!canResend || phone.length !== 10) return;
    try {
      setIsSendingOtp(true);
      const res = await requestOtp(phone);

      toast({
        title: "OTP resent",
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

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;
    try {
      setIsVerifyingOtp(true);
      const data = await verifyOtp(phone, otp);

      toast({
        title: "Logged in successfully",
        description: data.isNewUser ? "Let’s set up your first PG." : "Welcome back!",
      });

      if (data.isNewUser || !data.hasProperties) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/*", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error?.message ?? "Please double-check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#071a1a] text-white overflow-hidden">
      <FloatingShapes />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-10 lg:flex-row lg:gap-16">
        {/* Left brand / lottie */}
        <motion.div
          {...pageEnter}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl text-center lg:text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={pgeaseLogo} className="h-10 w-10 rounded-xl" alt="PG Ease" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/70">{T.owner}</div>
                <div className="text-sm text-white/80">OTP-based secure login</div>
              </div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-white/60">{T.lang}</span>
              <div className="rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setLang("en")}
                  className={[
                    "px-3 py-1 rounded-full text-xs transition",
                    lang === "en" ? "bg-white/15 text-white" : "text-white/70 hover:text-white",
                  ].join(" ")}
                >
                  {T.english}
                </button>
                <button
                  onClick={() => setLang("hi")}
                  className={[
                    "px-3 py-1 rounded-full text-xs transition",
                    lang === "hi" ? "bg-white/15 text-white" : "text-white/70 hover:text-white",
                  ].join(" ")}
                >
                  {T.hindi}
                </button>
              </div>
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {T.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ color: PRIMARY }}>{T.title.split(" ").slice(-1)}</span>
          </h1>

          <p className="mt-4 text-sm text-white/70 sm:text-base">{T.subtitle}</p>

          {/* Lottie on desktop */}
          <div className="mt-10 hidden lg:block">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30">
              <Lottie
                lottieRef={lottieRef}
                animationData={loginLottie}
                loop
                className="h-64 w-full"
              />
              <div className="mt-3 text-xs text-white/60">
                Secure onboarding • Faster setup • Multi-property ready
              </div>
            </div>
          </div>
        </motion.div>

        {/* Auth card */}
        <motion.div {...cardMotion} className="w-full max-w-md">
          <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardContent className="p-7 sm:p-8">
              <AnimatePresence mode="wait">
                {step === "phone" ? (
                  <motion.div key="phone" {...stepMotion} className="space-y-6">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/60">Login</div>
                      <div className="text-lg font-semibold">Sign in to continue</div>
                      <div className="text-sm text-white/60">Use your mobile number.</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-white/70">{T.phoneLabel}</Label>
                      <div className="flex">
                        <div className="flex h-11 items-center rounded-l-xl border border-white/10 bg-black/20 px-4 text-sm text-white/90">
                          +91
                        </div>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(clampDigits(e.target.value, 10))}
                          placeholder="Enter 10-digit number"
                          className="h-11 rounded-l-none rounded-r-xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus-visible:ring-0"
                        />
                      </div>
                      <p className="text-xs text-white/50">{T.phoneHint}</p>
                    </div>

                    <ShimmerButton
                      loading={isSendingOtp}
                      onClick={handleSendOtp}
                      disabled={phone.length !== 10}
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {isSendingOtp ? T.sending : T.sendOtp}
                    </ShimmerButton>

                    {/* extra polish: micro text */}
                    <p className="text-center text-[11px] text-white/45">
                      By continuing, you agree to receive verification SMS for login.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="otp" {...stepMotion} className="space-y-6">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                        {T.verifyTitle}
                      </div>
                      <div className="text-sm text-white/80">
                        {T.verifySub} <span className="font-medium">+91 {phone}</span>
                      </div>
                      <div className="text-xs text-white/50">{T.otpWarn}</div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs text-white/70">One-time password</Label>
                      <InputOTP
                        maxLength={4}
                        value={otp}
                        onChange={(value) => setOtp(clampDigits(value, 4))}
                        containerClassName="w-full justify-between"
                      >
                        <InputOTPGroup className="w-full justify-between">
                          {[0, 1, 2, 3].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="h-12 w-12 rounded-xl border border-white/10 bg-black/20 text-base font-semibold text-white"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <ShimmerButton
                      loading={isVerifyingOtp}
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 4}
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {isVerifyingOtp ? T.verifying : T.verifyBtn}
                    </ShimmerButton>

                    {/* Resend row */}
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOtp("");
                          setStep("phone");
                          reset();
                        }}
                        className="text-white/60 hover:text-white transition"
                      >
                        {T.changeNumber}
                      </button>

                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || isSendingOtp}
                        className={[
                          "font-medium transition",
                          canResend && !isSendingOtp
                            ? "text-white hover:opacity-90"
                            : "text-white/35 cursor-not-allowed",
                        ].join(" ")}
                        style={canResend ? { color: PRIMARY } : undefined}
                      >
                        {canResend ? (
                          T.resend
                        ) : (
                          <>
                            {T.resendIn}{" "}
                            <span className="tabular-nums">{secondsLeft}s</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Mobile Lottie below card */}
          <div className="mt-6 lg:hidden">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-xl shadow-black/30">
              <Lottie animationData={loginLottie} loop className="h-40 w-full" />
              <div className="mt-2 text-center text-xs text-white/55">
                Secure OTP login for PG owners
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
