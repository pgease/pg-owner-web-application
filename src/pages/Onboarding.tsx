import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, CheckCircle2, Building2 } from "lucide-react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { toast } from "@/components/ui/use-toast";
import { DEFAULT_PROPERTY_TYPE_ID, createProperty, updateLanguage } from "@/api/propertyOwner";

type OnboardingStep = 1 | 2 | 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    language: "" as "" | "hi-IN" | "en-US",
    pgName: "",
    bedRange: "",
    address: "",
    locationPin: "",
  });

  const update = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleUseLocation = () => {
    update("address", "123 Main Street, Andheri West, Mumbai 400058");
    update("locationPin", "400058");
  };

  const handleComplete = async () => {
    if (!form.language || !form.pgName || !form.address || !form.locationPin || !form.bedRange) return;

    try {
      setIsSubmitting(true);

      // 1. Set preferred language for the owner
      await updateLanguage(form.language);

      // 2. Create initial property
      await createProperty({
        name: form.pgName,
        address: form.address,
        latitude: 19.1367, // Static example for now; can be wired to real geolocation later
        longitude: 72.8264,
        locationPin: form.locationPin,
        bedRange: form.bedRange,
        propertyTypeId: DEFAULT_PROPERTY_TYPE_ID,
      });

      toast({
        title: "Onboarding complete",
        description: "Your PG has been created successfully.",
      });

      setStep(3);
    } catch (error: any) {
      toast({
        title: "Failed to complete onboarding",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/*", { replace: true });
  };

  const selectedLanguageLabel =
    form.language === "hi-IN" ? "हिन्दी" : form.language === "en-US" ? "English" : "Select language";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-foreground">
      <Card className="w-full max-w-[480px] border-slate-800 bg-slate-900/90 shadow-2xl shadow-emerald-500/10 backdrop-blur">
        <CardHeader className="items-center pb-3 pt-7">
          <img src={pgeaseLogo} alt="PG Ease" className="h-10 w-10 rounded-xl object-cover" />
          <CardTitle className="mt-3 text-lg font-semibold text-slate-50">Onboarding owner</CardTitle>
          <p className="text-xs text-slate-300">
            Step {step} of 3 &mdash; Let’s set up your language and PG details
          </p>
          <div className="mt-3 flex w-full gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-slate-800"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-slate-800"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-emerald-500" : "bg-slate-800"}`} />
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-3">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-100">Choose your language</p>
                <p className="text-xs text-slate-300">
                  Set your app language. You can change this later from settings.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => update("language", "en-US")}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                    form.language === "en-US"
                      ? "border-emerald-500 bg-emerald-500/10 text-slate-50"
                      : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">
                      A
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium">English</p>
                      <p className="text-[11px] text-slate-400">Best if you prefer English as primary language.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => update("language", "hi-IN")}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                    form.language === "hi-IN"
                      ? "border-emerald-500 bg-emerald-500/10 text-slate-50"
                      : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">
                      अ
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium">हिन्दी (Hindi)</p>
                      <p className="text-[11px] text-slate-400">अगर आप हिन्दी में ऐप इस्तेमाल करना पसंद करते हैं।</p>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                className="h-11 w-full rounded-xl bg-emerald-500 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                disabled={!form.language}
                onClick={() => setStep(2)}
              >
                Continue with {selectedLanguageLabel}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-100">Hey owner, let’s know about your PG</p>
                <p className="text-xs text-slate-300">
                  Add some basic details about your primary PG property to get started.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">PG name</Label>
                  <Input
                    placeholder="Sunrise PG"
                    value={form.pgName}
                    onChange={(e) => update("pgName", e.target.value)}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/40 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Select bed range</Label>
                  <Select value={form.bedRange} onValueChange={(v) => update("bedRange", v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-700 bg-slate-950/40 text-sm text-slate-50">
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

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">PG address</Label>
                  <Textarea
                    placeholder="Door no, street, area, city, state, PIN"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    rows={3}
                    className="rounded-xl border-slate-700 bg-slate-950/40 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Pincode</Label>
                  <Input
                    placeholder="400058"
                    maxLength={6}
                    value={form.locationPin}
                    onChange={(e) => update("locationPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/40 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </div>

                <Button
                  variant="outline"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-slate-600 bg-slate-950/40 text-xs text-slate-200 hover:bg-slate-900"
                  onClick={handleUseLocation}
                >
                  <MapPin className="h-4 w-4" /> Use my current location
                </Button>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border-slate-600 text-xs text-slate-100 hover:bg-slate-900"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2 rounded-xl bg-emerald-500 text-xs font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                  onClick={handleComplete}
                  disabled={!form.pgName || !form.address || !form.locationPin || !form.bedRange || isSubmitting}
                >
                  <CheckCircle2 className="h-4 w-4" /> {isSubmitting ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-5 pt-4 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
                  <Building2 className="h-9 w-9 text-emerald-400" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-emerald-950">
                    ✓
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-50">Your PG has been set up successfully</p>
                <p className="text-xs text-slate-300">
                  You can now manage your tenants, payments and staff from your PG Ease dashboard.
                </p>
              </div>
              <Button
                className="mt-2 h-11 w-full rounded-xl bg-emerald-500 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                onClick={handleGoToDashboard}
              >
                Go to dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
