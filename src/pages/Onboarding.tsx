import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, CheckCircle2 } from "lucide-react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    pgType: "",
    bedRange: "",
    address: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleUseLocation = () => {
    update("address", "12/3, 2nd Cross, HSR Layout, Bengaluru, Karnataka 560102");
  };

  const handleComplete = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[520px] shadow-lg">
        <CardHeader className="items-center pb-2 pt-8">
          <img src={pgeaseLogo} alt="PG Ease" className="h-12 w-12 rounded-xl object-cover" />
          <CardTitle className="mt-3 text-lg">Complete Your Profile</CardTitle>
          <p className="text-sm text-muted-foreground">Step {step} of 2 — Set up your PG</p>
          {/* Progress */}
          <div className="mt-3 flex w-full gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Rajesh Patel"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="rajesh@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>PG Type</Label>
                <Select value={form.pgType} onValueChange={(v) => update("pgType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bed Range</Label>
                <Select value={form.bedRange} onValueChange={(v) => update("bedRange", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How many beds?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-20">1 – 20 beds</SelectItem>
                    <SelectItem value="21-50">21 – 50 beds</SelectItem>
                    <SelectItem value="51-100">51 – 100 beds</SelectItem>
                    <SelectItem value="100+">100+ beds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!form.fullName || !form.email || !form.pgType || !form.bedRange}
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>PG Address</Label>
                <Textarea
                  placeholder="Enter your PG address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={3}
                />
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={handleUseLocation}>
                <MapPin className="h-4 w-4" /> Use My Location
              </Button>
              {/* Map placeholder */}
              <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-primary/40" />
                  <p className="mt-2">Google Map will appear here</p>
                  <p className="text-xs">Drop a pin to auto-fill address</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleComplete} disabled={!form.address}>
                  <CheckCircle2 className="h-4 w-4" /> Complete Setup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
