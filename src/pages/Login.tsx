import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import pgeaseLogo from "@/assets/pgease-logo.jpg";

type Step = "phone" | "otp" | "register";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSendOtp = () => {
    if (phone.length === 10) {
      // Mock: treat numbers starting with 9 as new users
      setIsNewUser(phone.startsWith("9"));
      if (phone.startsWith("9")) {
        setStep("register");
      } else {
        setStep("otp");
      }
    }
  };

  const handleRegisterSendOtp = () => {
    if (firstName.trim() && phone.length === 10) {
      setStep("otp");
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      if (isNewUser) {
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardHeader className="items-center pb-2 pt-8">
          <img src={pgeaseLogo} alt="PG Ease" className="h-14 w-14 rounded-xl object-cover" />
          <h1 className="mt-3 text-xl font-bold">PG Ease</h1>
          <p className="text-sm text-muted-foreground">PG Owner Management Platform</p>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    +91
                  </div>
                  <Input
                    id="phone"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleSendOtp} disabled={phone.length !== 10}>
                Send OTP
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                New users will be asked to register first
              </p>
            </div>
          )}

          {step === "register" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Looks like you're new! Create your account.</p>
              <div className="space-y-2">
                <Label htmlFor="fname">First Name</Label>
                <Input
                  id="fname"
                  placeholder="Your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    +91
                  </div>
                  <Input value={phone} disabled className="flex-1" />
                </div>
              </div>
              <Button className="w-full" onClick={handleRegisterSendOtp} disabled={!firstName.trim()}>
                Send OTP
              </Button>
              <button onClick={() => setStep("phone")} className="w-full text-center text-sm text-primary hover:underline">
                ← Back
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit OTP sent to +91 {phone}
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>
              <Button className="w-full" onClick={handleVerifyOtp} disabled={otp.length !== 6}>
                Verify & Continue
              </Button>
              <button onClick={() => setStep("phone")} className="w-full text-center text-sm text-primary hover:underline">
                ← Change Number
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
