import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Gift,
  X,
  Crown,
  Zap,
  Sparkles,
  Loader2,
  Lock,
  CreditCard,
  CheckCircle2,
  Building,
  Users,
  Clock,
  ShieldCheck,
  BedDouble,
  Sliders,
  Phone,
  MessageCircle,
  AlertTriangle,
  Minus,
  Plus,
  Info,
  Building2,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useMyFeaturesQuery,
  usePlansList,
  useCurrentPlan,
  useCreatePlanCheckoutOrderMutation,
  useVerifyPlanPaymentMutation,
  useAllRoomsAndCounts,
} from "@/hooks/usePropertyOwnerQueries";
import { buildFeatureKeySet, userHasFeatureForRow, type PlanTierKey } from "@/lib/planFeatures";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const features = [
  { name: "Direct UPI Intent Collection (0% transaction fee)", featureKey: "direct_upi_intent", free: false, lite: true, pro: true },
  { name: "Manual Payment Verification (Approve/Reject)", featureKey: "manual_payment_verify", free: false, lite: true, pro: true },
  { name: "Dedicated Account Manager (Rahul Sharma)", featureKey: "dedicated_account_manager", free: false, lite: true, pro: true },
  { name: "Automated Payment Gateway Collection", featureKey: "automated_payment_gateway", free: false, lite: false, pro: true },
  { name: "Automated Settlement (T+2 Banking Days)", featureKey: "automated_settlement", free: false, lite: false, pro: true },
  { name: "Dedicated PG Subdomain Website ({pgname}.pgease.in)", featureKey: "pg_subdomain_website", free: false, lite: false, pro: true },
  { name: "Add Tenants (Excel/Invite/Manual)", featureKey: "TENANT_ADD", free: true, lite: true, pro: true },
  { name: "Room Structure & Floor Manager", featureKey: "ROOM_STRUCTURE", free: true, lite: true, pro: true },
  { name: "DigiLocker Aadhaar KYC Verification", featureKey: "KYC_VERIFICATION", free: true, lite: true, pro: true },
  { name: "Electricity Meter Billing Calculation", featureKey: "ELECTRICITY_DUES", free: true, lite: true, pro: true },
  { name: "Complaints & Maintenance Desk", featureKey: "COMPLAINTS_DESK", free: true, lite: true, pro: true },
  { name: "Live Occupancy & Revenue Analytics", featureKey: "ADVANCED_ANALYTICS", free: false, lite: true, pro: true },
  { name: "Digital Rental Agreement eSign", featureKey: "RENTAL_AGREEMENT", free: false, lite: false, pro: true },
  { name: "Automated WhatsApp Alerts & Reminders", featureKey: "WHATSAPP_AUTOMATION", free: false, lite: false, pro: true },
];

export default function Plans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();
  const { data: plansData, isLoading: isPlansLoading } = usePlansList();
  const { data: currentPlanData, isLoading: isCurrentPlanLoading, refetch: refetchCurrentPlan } = useCurrentPlan();
  const subAccess = useSubscriptionAccess();
  const { selectedPgId, properties } = useApp();
  const selectedPg = useMemo(
    () => properties.find((p) => p.id === selectedPgId),
    [properties, selectedPgId]
  );

  // Query rooms to count beds in selected PG
  const roomsQuery = useAllRoomsAndCounts(selectedPgId);
  const detectedBeds = useMemo(() => {
    const rooms = roomsQuery.data ?? [];
    return rooms.reduce((sum, r) => sum + (r.totalBeds ?? 0), 0);
  }, [roomsQuery.data]);

  // Selected bed capacity for billing (min 10)
  const [selectedBeds, setSelectedBeds] = useState<number>(25);

  // Sync detected beds when loaded
  useEffect(() => {
    if (detectedBeds > 0) {
      setSelectedBeds(Math.max(10, detectedBeds));
    }
  }, [detectedBeds]);

  const createOrderMut = useCreatePlanCheckoutOrderMutation();
  const verifyPaymentMut = useVerifyPlanPaymentMutation();

  const rawPlanName = featuresData?.planName || currentPlanData?.currentPlan?.name || "Lite";
  const currentPlanKey: PlanTierKey = rawPlanName.toLowerCase().includes("pro")
    ? "PRO"
    : "LITE";

  const apiFeatureKeys = buildFeatureKeySet(featuresData?.features);
  const hasExplicitApiList = Boolean(featuresData?.features && featuresData.features.length > 0);

  const activeFeaturesToShow = useMemo(() => {
    if (featuresData?.features && featuresData.features.length > 0) {
      return featuresData.features;
    }
    const key = (currentPlanKey === "PRO" ? "pro" : "lite") as "lite" | "pro";
    return features.filter(f => f[key]).map(f => ({
      featureKey: f.featureKey,
      name: f.name,
      description: "Included in your " + currentPlanKey + " plan"
    }));
  }, [featuresData, currentPlanKey]);

  const fallbackPlans = [
    {
      id: "d94c8085-018b-498a-b274-166b9297b155",
      name: "Lite Plan",
      code: "LITE",
      priceMonthly: 29,
      priceAnnual: 290,
      description: "Direct UPI payments with zero gateway fees, manual verify & Dedicated Account Manager.",
      features: [
        "₹29 / bed / month (45-Day Free Trial)",
        "Direct UPI intent collection (0% fee)",
        "Manual payment verification (Approve / Reject)",
        "Dedicated Account Manager (Rahul Sharma)",
        "Unlimited tenant & room operations",
        "DigiLocker Aadhaar KYC",
        "Electricity meter billing",
      ],
      popular: false,
      trialDays: 45,
    },
    {
      id: "0e5b4f85-eeb4-4fdd-9128-f00390d26fb8",
      name: "Pro Plan",
      code: "PRO",
      priceMonthly: 49,
      priceAnnual: 490,
      description: "Automated payment gateway, automated T+2 settlement & dedicated branded PG website.",
      features: [
        "₹49 / bed / month",
        "Everything included in Lite Plan",
        "Automated Payment Gateway collection",
        "Automated Settlement (T+2 bank transfer)",
        "Dedicated PG Website ({pgname}.pgease.in)",
        "Dedicated Account Manager (Rahul Sharma)",
        "Digital Rental Agreement eSign",
        "Automated WhatsApp rent alerts",
      ],
      popular: true,
      trialDays: 0,
    },
  ];

  const planCards = useMemo(() => {
    const rawPlans = plansData?.plans || (Array.isArray(plansData) ? plansData : []);
    if (rawPlans && rawPlans.length > 0) {
      const activePlans = (rawPlans as any[]).filter(
        (p: any) => p.active !== false && !p.name?.toLowerCase().includes("free") && !p.displayName?.toLowerCase().includes("free")
      );
      if (activePlans.length > 0) {
        return activePlans.map((p: any) => {
          const isPro = (p.name || p.displayName || "").toLowerCase().includes("pro");
          const fallback = isPro ? fallbackPlans[1] : fallbackPlans[0];
          const rawPrice = p.price ?? p.priceMonthly ?? (isPro ? 49 : 29);
          const priceMonthly = typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || (isPro ? 49 : 29);
          const priceAnnual = typeof p.priceAnnual === "number" ? p.priceAnnual : priceMonthly * 10;

          let featuresList = fallback.features;
          if (Array.isArray(p.features) && p.features.length > 0) {
            if (typeof p.features[0] === "string") {
              featuresList = p.features;
            } else if (typeof p.features[0] === "object") {
              featuresList = p.features.map((f: any) => f.feature?.name || f.name || f.featureKey || String(f));
            }
          }

          return {
            ...p,
            id: p.id || fallback.id,
            name: p.displayName || p.name || fallback.name,
            displayName: p.displayName || fallback.name,
            description: p.description || fallback.description,
            priceMonthly,
            priceAnnual,
            features: featuresList,
            popular: p.isPopular ?? p.popular ?? isPro,
            isPro,
          };
        });
      }
    }
    return fallbackPlans;
  }, [plansData]);

  const handleUpgradeCheckout = async (planId: string) => {
    try {
      const order = await createOrderMut.mutateAsync({
        planId,
        billingCycle,
        numberOfBeds: selectedBeds,
      });
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const options = {
        key: order.keyId || "rzp_test_TUV3u84h3zOyxB",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "PG Ease",
        description: `Upgrade to ${planId} Plan (${selectedBeds} beds, ${billingCycle})`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
              billingCycle,
              numberOfBeds: selectedBeds,
            });
            toast({
              title: "Subscription Activated! 👑",
              description: `Your account has been upgraded successfully for ${selectedBeds} beds.`,
            });
            refetchCurrentPlan();
          } catch (err: any) {
            toast({
              title: "Payment Verification Failed",
              description: err?.message || "Please contact support if amount was debited.",
              variant: "destructive",
            });
          }
        },
        theme: { color: "#008080" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({
        title: "Failed to initiate plan checkout",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Plans & Billing"
        description="Choose the ideal plan to scale your PG living management and operations."
      />

      {/* EXPIRED SUBSCRIPTION WARNING ALERT */}
      {subAccess.isExpired && (
        <Card className="border-2 border-destructive/40 bg-gradient-to-r from-destructive/10 via-destructive/5 to-amber-500/5 shadow-md">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive shrink-0 font-black">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-destructive">
                    Subscription Over • Operations Restricted
                  </h4>
                  <Badge className="bg-destructive/20 text-destructive text-[10px] font-bold">
                    ACTION REQUIRED
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Your 45-day free trial has concluded. Adding tenants, updating room structures, tracking notices, and rent collections are paused. Subscribe to Lite (₹29/bed) or Pro (₹49/bed) below to restore operations immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <a
                href="tel:+919876543210"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-teal-600" /> Call Rahul
              </a>
              <a
                href="https://wa.me/919876543210?text=Hi%20Rahul,%20my%20PG%20Ease%20trial%20has%20expired%20and%20I%20want%20to%20reactivate%20my%20subscription."
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CURRENT SUBSCRIPTION BANNER */}
      <Card className="border-teal-200 dark:border-teal-900 bg-gradient-flow backdrop-blur-md shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Active Subscription
                </span>
                <Badge className="bg-teal-600 text-white gap-1 text-xs font-semibold">
                  <Crown className="h-3 w-3" /> {subAccess.planDisplayName}
                </Badge>
                {subAccess.isTrial ? (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40">
                    <Clock className="h-3 w-3 mr-1" /> {subAccess.trialDaysRemaining} days trial remaining
                  </Badge>
                ) : subAccess.isExpired ? (
                  <Badge variant="outline" className="text-xs text-destructive border-destructive font-semibold bg-destructive/10">
                    Trial Expired ⚠️
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 font-semibold">
                    Paid Active ✓
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {currentPlanKey === "PRO"
                  ? "PG Ease Professional Suite"
                  : "PG Ease Lite Suite (Zero Gateway Fee)"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {subAccess.isTrial
                  ? `Your 45-day free trial gives you full Lite Plan access until ${subAccess.trialExpiresAt?.toLocaleDateString("en-IN") || "45 days"}.`
                  : subAccess.isExpired
                  ? "Your 45-day free trial has concluded. Please subscribe to Lite (₹29/bed) or Pro (₹49/bed) to restore operations."
                  : currentPlanData?.expiresAt
                  ? `Renewal Date: ${new Date(currentPlanData.expiresAt).toLocaleDateString("en-IN")}`
                  : "Active subscription with Dedicated Account Manager"}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Account Manager
                </div>
                <div className="text-sm font-bold text-foreground">
                  Rahul Sharma
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <Users className="h-3.5 w-3.5" /> Operations
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  {subAccess.isExpired ? "Restricted" : "Unlimited Beds"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: BED CAPACITY & PRICING CALCULATOR */}
      <Card className="border-teal-300/60 dark:border-teal-800 bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                <BedDouble className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Configure Bed Capacity & Quota</CardTitle>
                <CardDescription className="text-xs">
                  Pricing is dynamic per bed (₹29/bed Lite, ₹49/bed Pro). Select your property bed size.
                </CardDescription>
              </div>
            </div>
            {detectedBeds > 0 ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs">
                ✓ Detected: {detectedBeds} beds in PG
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-400 text-xs bg-amber-50 dark:bg-amber-950/30">
                0 Beds Configured Yet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Zero Beds Guidance Banner */}
          {detectedBeds === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-200">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  Haven't added rooms or beds yet?
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                  Select your expected total bed capacity below to preview plan costs and subscribe, or configure your PG rooms and floors first to calculate your exact count automatically.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-400 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950 font-semibold text-xs gap-1.5 rounded-xl"
                onClick={() => navigate("/my-pgs/structure")}
              >
                <Building className="h-3.5 w-3.5 text-teal-600" />
                Set Up Rooms First
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Detected <strong>{detectedBeds} beds</strong> in <strong>{selectedPg?.name || "your PG"}</strong>.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 h-7 px-2"
                onClick={() => setSelectedBeds(Math.max(10, detectedBeds))}
              >
                Reset to {detectedBeds} beds
              </Button>
            </div>
          )}

          {/* Quick Presets & Stepper */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-teal-600" />
                Select Total Bed Quota:
              </label>
              <span className="text-xs text-muted-foreground">
                Minimum 10 beds • Current Selection: <strong className="text-teal-600 font-bold">{selectedBeds} beds</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[15, 25, 50, 100, 150, 200].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={selectedBeds === preset ? "default" : "outline"}
                  className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                    selectedBeds === preset
                      ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-teal-400"
                  }`}
                  onClick={() => setSelectedBeds(preset)}
                >
                  {preset} Beds
                </Button>
              ))}

              {/* Stepper / Input */}
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  disabled={selectedBeds <= 10}
                  onClick={() => setSelectedBeds((b) => Math.max(10, b - 5))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={selectedBeds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setSelectedBeds(Math.max(10, val));
                  }}
                  className="h-8 w-20 text-center font-bold text-xs rounded-lg"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  disabled={selectedBeds >= 1000}
                  onClick={() => setSelectedBeds((b) => Math.min(1000, b + 5))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACTIVE FEATURES GRID */}
      {activeFeaturesToShow.length > 0 && (
        <Card className="border-teal-200 dark:border-teal-900 bg-gradient-flow shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 animate-pulse" />
              Active Features Unlocked ({activeFeaturesToShow.length})
            </CardTitle>
            <CardDescription className="text-xs">
              These features are fully activated and configured on your current plan tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeFeaturesToShow.map((feat: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/10 transition-colors">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">
                      {feat.name || feat.featureKey}
                    </span>
                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                      {feat.description || "Active feature module"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REFERRAL CASH INCENTIVE BANNER */}
      <Card className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-950 text-white shadow-md">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black shrink-0">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  Get Your Subscription Reimbursed via Referrals
                </h4>
                <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0">
                  Earn ₹1,000 / PG Owner
                </Badge>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5 max-w-xl">
                Refer other PG & hostel owners. When they subscribe, ₹500 - ₹1,000 cash is deposited straight to your registered settlement bank account.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/referrals")}
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold gap-1.5 h-9 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Invite PG Owners
          </Button>
        </CardContent>
      </Card>

      {/* BILLING TOGGLE */}
      <div className="flex justify-center pt-2">
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual <Badge className="ml-1.5 bg-emerald-600 text-white text-[9px] px-1 py-0">Save 17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* PRICING CARDS - DYNAMICALLY CALCULATED FOR SELECTED BEDS */}
      <div className="grid gap-6 max-w-4xl mx-auto sm:grid-cols-2 w-full">
        {planCards.map((plan: any) => {
          const isPro = plan.isPro ?? (plan.name || plan.displayName || "").toLowerCase().includes("pro");
          const isCurrent = (isPro && currentPlanKey === "PRO") || (!isPro && currentPlanKey === "LITE" && !subAccess.isTrial && !subAccess.isExpired);
          const baseMonthly = Number(plan.priceMonthly ?? plan.price ?? (isPro ? 49 : 29)) || (isPro ? 49 : 29);
          const baseAnnual = Number(plan.priceAnnual ?? baseMonthly * 10) || baseMonthly * 10;
          const unitRate = billingCycle === "annual" ? baseAnnual : baseMonthly;
          const totalBilling = unitRate * selectedBeds;
          const planTitle = plan.displayName || plan.name || (isPro ? "Pro Plan" : "Lite Plan");

          return (
            <Card
              key={plan.id || planTitle}
              className={`relative flex flex-col justify-between transition-all rounded-2xl ${
                isPro
                  ? "border-teal-600 shadow-xl shadow-teal-500/10 ring-2 ring-teal-600/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800 shadow-sm"
              } ${isCurrent ? "bg-teal-500/[0.02]" : ""}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-600 text-white text-[10px] px-2.5 shadow-sm font-bold tracking-wide">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              {!isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white text-[10px] px-2.5 shadow-sm font-bold tracking-wide">
                    45-DAY FREE TRIAL
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="text-[10px] px-2 border-teal-600 text-teal-600 bg-background font-semibold">
                    CURRENT PLAN
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8 pb-4">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center mb-3">
                  {isPro ? (
                    <Crown className="h-6 w-6 text-teal-600" />
                  ) : (
                    <Zap className="h-6 w-6 text-amber-500" />
                  )}
                </div>
                <CardTitle className="text-2xl font-black">{planTitle}</CardTitle>
                
                {/* DYNAMIC TOTAL PRICING */}
                <div className="mt-3 flex flex-col items-center justify-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-black text-foreground">
                      ₹{totalBilling.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                      / {billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-900">
                    <span>₹{unitRate.toLocaleString("en-IN")}/bed × {selectedBeds} beds</span>
                  </div>
                </div>

                <CardDescription className="text-xs mt-2 max-w-xs mx-auto">
                  {plan.description || (isPro
                    ? "Full payment automation, automated T+2 bank settlement & dedicated PG website."
                    : "Direct UPI payments with 0% gateway fee & full tenant management control.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                <div className="space-y-2.5 border-t pt-4">
                  {(plan.features || []).map((feat: any, idx: number) => {
                    const featText = typeof feat === "string" ? feat : feat?.name || feat?.feature?.name || String(feat);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="h-4 w-4 text-teal-600 shrink-0" />
                        <span>{featText}</span>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className={`w-full font-semibold rounded-xl mt-4 ${
                    isCurrent
                      ? "border-teal-600 text-teal-600"
                      : isPro
                      ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                  }`}
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || createOrderMut.isPending}
                  onClick={() => handleUpgradeCheckout(plan.id || plan.name.toLowerCase())}
                >
                  {createOrderMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Active Plan"
                  ) : (
                    `Subscribe (${selectedBeds} beds • ₹${totalBilling.toLocaleString("en-IN")})`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FEATURE COMPARISON TABLE - LITE VS PRO ONLY */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/5">
          <CardTitle className="text-base font-bold">Feature Comparison Matrix</CardTitle>
          <p className="text-xs text-muted-foreground">
            Compare Lite Plan (₹29/bed) and Pro Plan (₹49/bed). Zero hidden fees.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs">
                  <th className="text-left font-semibold px-4 py-3 min-w-[220px]">Feature</th>
                  <th className="text-center font-semibold px-3 py-3 text-slate-700 dark:text-slate-200">Lite Plan (₹29/bed)</th>
                  <th className="text-center font-semibold px-3 py-3 text-teal-600 font-bold">Pro Plan (₹49/bed)</th>
                  <th className="text-center font-semibold px-3 py-3 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 font-bold">
                    Your Plan
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => {
                  const youHave = userHasFeatureForRow(
                    f,
                    apiFeatureKeys,
                    hasExplicitApiList,
                    currentPlanKey
                  );
                  return (
                    <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="font-medium text-foreground">{f.name}</span>
                      </td>
                      {(["lite", "pro"] as const).map((tier) => (
                        <td key={tier} className="text-center px-3 py-2.5">
                          {f[tier] ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto opacity-30" />
                          )}
                        </td>
                      ))}
                      <td className="text-center px-3 py-2.5 bg-teal-50/30 dark:bg-teal-950/10">
                        {youHave ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <Lock className="h-4 w-4 text-amber-600/80 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PLAN STATUS SIMULATION TOOLBAR */}
      <div className="mt-8 p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">Plan Simulator Demo Toolbar:</span>
            <span className="text-[11px] text-slate-400 block">Test expired subscription, active trial, or pro plan UI</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-[11px] rounded-lg border-amber-500/40 text-amber-300 hover:bg-amber-950/50 ${
              subAccess.isTrial ? "bg-amber-500/20 ring-1 ring-amber-400" : "bg-transparent"
            }`}
            onClick={() => subAccess.setDemoPlan("trial")}
          >
            🟢 45-Day Trial
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-[11px] rounded-lg border-red-500/40 text-red-300 hover:bg-red-950/50 ${
              subAccess.isExpired ? "bg-red-500/20 ring-1 ring-red-400" : "bg-transparent"
            }`}
            onClick={() => subAccess.setDemoPlan("expired")}
          >
            🔴 Expired Plan ⚠️
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-[11px] rounded-lg border-teal-500/40 text-teal-300 hover:bg-teal-950/50 ${
              subAccess.currentPlan === "PRO" && !subAccess.isExpired ? "bg-teal-500/20 ring-1 ring-teal-400" : "bg-transparent"
            }`}
            onClick={() => subAccess.setDemoPlan("pro")}
          >
            👑 Pro Active
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] text-slate-400 hover:text-white rounded-lg"
            onClick={() => subAccess.setDemoPlan("reset")}
          >
            Reset (Live API)
          </Button>
        </div>
      </div>
    </div>
  );
}

