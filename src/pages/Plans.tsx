import { useState, useMemo } from "react";
import {
  Check,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useMyFeaturesQuery,
  usePlansList,
  useCurrentPlan,
  useCreatePlanCheckoutOrderMutation,
  useVerifyPlanPaymentMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { buildFeatureKeySet, userHasFeatureForRow, type PlanTierKey } from "@/lib/planFeatures";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const features = [
  { name: "Properties/tenants scale limit", featureKey: "SCALE_LIMIT_BYPASS", free: false, lite: true, pro: true },
  { name: "Add tenants (Excel/Invite/Manual)", featureKey: "TENANT_ADD", free: true, lite: true, pro: true },
  { name: "Multi-PG / Multi-building", featureKey: "MULTI_PG", free: false, lite: true, pro: true },
  { name: "Room structure & floor manager", featureKey: "ROOM_STRUCTURE", free: true, lite: true, pro: true },
  { name: "DigiLocker Aadhaar KYC", featureKey: "KYC_VERIFICATION", free: true, lite: true, pro: true },
  { name: "Digital Rental Agreement eSign", featureKey: "RENTAL_AGREEMENT", free: false, lite: true, pro: true },
  { name: "Online Rent Collection Gateway", featureKey: "ONLINE_PAYMENTS", free: true, lite: true, pro: true },
  { name: "Electricity Meter Billing", featureKey: "ELECTRICITY_DUES", free: true, lite: true, pro: true },
  { name: "Notice Period Management", featureKey: "NOTICE_MANAGEMENT", free: true, lite: true, pro: true },
  { name: "Staff Management & Granular Roles", featureKey: "STAFF_ROLES", free: false, lite: true, pro: true },
  { name: "WhatsApp Automation & Reminders", featureKey: "WHATSAPP_AUTOMATION", free: false, lite: true, pro: true },
  { name: "Complaints & Maintenance Desk", featureKey: "COMPLAINTS_DESK", free: true, lite: true, pro: true },
  { name: "Revenue & Occupancy Analytics", featureKey: "ADVANCED_ANALYTICS", free: false, lite: false, pro: true },
];

export default function Plans() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [bedsByPlan, setBedsByPlan] = useState<Record<string, number>>({
    pro: 50,
    enterprise: 150,
    plan_pro: 50,
    plan_enterprise: 150,
  });
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();
  const { data: plansData, isLoading: isPlansLoading } = usePlansList();
  const { data: currentPlanData, isLoading: isCurrentPlanLoading, refetch: refetchCurrentPlan } = useCurrentPlan();

  const createOrderMut = useCreatePlanCheckoutOrderMutation();
  const verifyPaymentMut = useVerifyPlanPaymentMutation();

  const normalizedFeatures = (featuresData as any)?.data || featuresData;
  const rawPlanName =
    (currentPlanData as any)?.currentPlan?.name ||
    (currentPlanData as any)?.currentPlan?.code ||
    (currentPlanData as any)?.planDisplayName ||
    (currentPlanData as any)?.planName ||
    normalizedFeatures?.planDisplayName ||
    normalizedFeatures?.planName ||
    "Free";

  const currentPlanKey: PlanTierKey = rawPlanName.toLowerCase().includes("pro")
    ? "PRO"
    : rawPlanName.toLowerCase().includes("lite") || rawPlanName.toLowerCase().includes("growth") || rawPlanName.toLowerCase().includes("premium")
    ? "LITE"
    : "FREE";

  const ownerTierLevel = useMemo(() => {
    const name = rawPlanName.toLowerCase();
    if (name.includes("pro")) return 2;
    if (name.includes("premium") || name.includes("lite") || name.includes("growth")) return 1;
    return 0; // Free
  }, [rawPlanName]);

  const availableFeaturesArray = (Array.isArray((currentPlanData as any)?.features) && (currentPlanData as any).features.length > 0)
    ? (currentPlanData as any).features
    : normalizedFeatures?.features || [];
  const apiFeatureKeys = buildFeatureKeySet(availableFeaturesArray);
  const hasExplicitApiList = Boolean(availableFeaturesArray && availableFeaturesArray.length > 0);

  const activeFeaturesToShow = useMemo(() => {
    if (Array.isArray((currentPlanData as any)?.features) && (currentPlanData as any).features.length > 0) {
      return (currentPlanData as any).features.map((f: any) => ({
        featureKey: f.featureKey || f.name,
        name: f.name || f.featureName,
        description: f.description || "Included in your " + currentPlanKey + " plan",
      }));
    }
    const feats = normalizedFeatures?.features;
    if (Array.isArray(feats) && feats.length > 0) {
      return feats.map((f: any) => ({
        featureKey: f.featureKey || f.id,
        name: f.name || f.featureName,
        description: f.description || "Included in your " + currentPlanKey + " plan",
      }));
    }
    const key = currentPlanKey.toLowerCase() as "free" | "lite" | "pro";
    return features.filter((f) => f[key]).map((f) => ({
      featureKey: f.featureKey,
      name: f.name,
      description: "Included in your " + currentPlanKey + " plan",
    }));
  }, [currentPlanData, normalizedFeatures, currentPlanKey]);

  const fallbackPlans = [
    {
      id: "plan_free",
      name: "Free",
      code: "FREE",
      priceMonthly: 0,
      priceAnnual: 0,
      pricePerBed: 0,
      minBeds: 1,
      maxProperties: 1,
      maxTenants: 15,
      features: ["Up to 15 Beds", "1 Property", "Manual Rent Tracking", "5 Free KYC Credits"],
      popular: false,
    },
    {
      id: "plan_pro",
      name: "Pro",
      code: "PRO",
      priceMonthly: 999,
      priceAnnual: 9990,
      pricePerBed: 20,
      minBeds: 10,
      maxProperties: 5,
      maxTenants: 100,
      features: [
        "Dynamic Bed Quota Pricing",
        "5 Properties",
        "WhatsApp Automation",
        "Digital Rental Agreements",
        "Granular Staff Permissions",
      ],
      popular: true,
    },
    {
      id: "plan_enterprise",
      name: "Enterprise",
      code: "ENTERPRISE",
      priceMonthly: 2499,
      priceAnnual: 24990,
      pricePerBed: 18,
      minBeds: 50,
      maxProperties: 50,
      maxTenants: 1000,
      features: [
        "Unlimited Properties",
        "High Capacity Bed Allowance",
        "Priority 24/7 Support",
        "Advanced Revenue Analytics",
        "Custom Branding",
      ],
      popular: false,
    },
  ];

  const rawPlansList = useMemo(() => {
    if (Array.isArray(plansData)) return plansData;
    if (Array.isArray((plansData as any)?.plans)) return (plansData as any).plans;
    return [];
  }, [plansData]);

  const planCards = useMemo(() => {
    if (!rawPlansList || rawPlansList.length === 0) return fallbackPlans;
    return rawPlansList.map((p: any) => {
      const code = (p.code || p.name || "").toUpperCase();
      const isFree = code.includes("FREE") || p.name?.toLowerCase() === "free";
      const isPopular = p.isPopular ?? p.popular ?? code.includes("PRO");

      let featureList: string[] = [];
      if (Array.isArray(p.features)) {
        featureList = p.features.map((f: any) =>
          typeof f === "string" ? f : f.name || f.featureName || f.featureKey,
        );
      }
      if (featureList.length === 0) {
        featureList = isFree
          ? ["Up to 15 Beds", "1 Property", "Manual Rent Tracking", "5 Free KYC Credits"]
          : code.includes("PRO")
          ? ["Dynamic Bed Quota Pricing", "Full Automation & Agmts", "Staff Permissions", "WhatsApp Reminders"]
          : ["Unlimited Properties", "High Bed Allowance", "Priority 24/7 Support", "Revenue Analytics"];
      }

      const unitPrice =
        Number(p.pricePerBed) > 0
          ? Number(p.pricePerBed)
          : code.includes("ENTERPRISE")
          ? 18
          : code.includes("PRO")
          ? 20
          : Number(p.price) || 0;

      return {
        id: p.id,
        name: p.displayName || p.name,
        code,
        priceMonthly: Number(p.price) || 0,
        priceAnnual: Math.round((Number(p.price) || 0) * 10),
        pricePerBed: unitPrice,
        minBeds: p.minBeds || (isFree ? 1 : 10),
        maxProperties: p.maxProperties || (isFree ? 1 : 10),
        maxTenants: p.maxTenants || (isFree ? 15 : 100),
        features: featureList,
        popular: isPopular,
      };
    });
  }, [rawPlansList]);

  const handleUpgradeCheckout = async (planId: string, bedCount?: number) => {
    try {
      const selectedBeds = bedCount || bedsByPlan[planId] || bedsByPlan[planId.toLowerCase()] || 50;
      const durationMonths = billingCycle === "annual" ? 12 : 1;

      const order = await createOrderMut.mutateAsync({
        planId,
        numberOfBeds: selectedBeds,
        durationMonths,
        billingCycle,
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
        description: `Upgrade to ${planId} Plan (${selectedBeds} Beds, ${billingCycle})`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
              numberOfBeds: selectedBeds,
              durationMonths,
              billingCycle,
            });
            toast({
              title: "Subscription Activated! 👑",
              description: `Your account has been upgraded with ${selectedBeds} beds capacity.`,
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

      {/* CURRENT SUBSCRIPTION BANNER */}
      <Card className="border-teal-200 dark:border-teal-900 bg-gradient-flow backdrop-blur-md shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Active Subscription
                </span>
                <Badge className="bg-teal-600 text-white gap-1 text-xs">
                  <Crown className="h-3 w-3" /> {currentPlanKey} Plan
                </Badge>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                  Active ✓
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {currentPlanKey === "PRO"
                  ? "PG Ease Professional Suite"
                  : currentPlanKey === "LITE"
                  ? "PG Ease Growth Suite"
                  : "PG Ease Starter Edition"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentPlanData?.expiresAt
                  ? `Renewal Date: ${new Date(currentPlanData.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : currentPlanKey === "PRO"
                  ? "Active Subscription (50 Beds Quota)"
                  : "Free perpetual license for single property management"}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <Building className="h-3.5 w-3.5" /> Properties Limit
                </div>
                <div className="text-sm font-bold text-foreground">
                  {currentPlanData?.propertiesUsage?.used ?? 1} / {currentPlanData?.propertiesUsage?.max ?? (currentPlanKey === "FREE" ? 1 : 5)}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <Users className="h-3.5 w-3.5" /> Beds Allowance
                </div>
                <div className="text-sm font-bold text-teal-700 dark:text-teal-400">
                  {(currentPlanData as any)?.occupiedBeds ?? currentPlanData?.tenantsUsage?.used ?? 0} / {(currentPlanData as any)?.maxBeds ?? (currentPlanKey === "FREE" ? 15 : 50)} Beds
                </div>
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

      {/* BILLING TOGGLE */}
      <div className="flex justify-center pt-2">
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual <Badge className="ml-1.5 bg-emerald-600 text-white text-[9px] px-1 py-0">20% OFF</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* PRICING CARDS */}
      <div className="grid gap-6 sm:grid-cols-3">
        {planCards.map((plan: any) => {
          const planKey = (plan.code || plan.id || plan.name).toLowerCase();
          const cardTierLevel = planKey.includes("pro")
            ? 2
            : planKey.includes("premium") || planKey.includes("enterprise") || planKey.includes("lite")
            ? 1
            : 0;

          const isCurrent =
            plan.id === (currentPlanData as any)?.planId ||
            plan.id === (currentPlanData as any)?.currentPlan?.id ||
            cardTierLevel === ownerTierLevel;
          const isFree = cardTierLevel === 0;

          // 1. Most Popular only when owner is on Free plan and card is Premium
          const showPopularTag = ownerTierLevel === 0 && cardTierLevel === 1;

          // 2. Can upgrade only if card is strictly a higher tier than owner tier
          const canUpgrade = cardTierLevel > ownerTierLevel;
          
          const currentBeds = bedsByPlan[plan.id] || bedsByPlan[planKey] || (cardTierLevel === 2 ? 50 : 50);
          const unitPrice = Number(plan.pricePerBed || (cardTierLevel === 2 ? 49 : 29));
          
          const monthlyTotal = isFree ? 0 : currentBeds * unitPrice;
          const calculatedPrice = billingCycle === "annual" ? monthlyTotal * 10 : monthlyTotal;

          return (
            <Card
              key={plan.id || plan.name}
              className={`relative flex flex-col justify-between transition-all ${
                showPopularTag
                  ? "border-teal-600 shadow-xl shadow-teal-500/10 ring-2 ring-teal-600/20"
                  : isCurrent
                  ? "border-teal-600/50 bg-teal-500/[0.02]"
                  : "hover:border-teal-200 dark:hover:border-teal-800"
              }`}
            >
              {showPopularTag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-600 text-white text-[10px] px-2.5 shadow-sm">MOST POPULAR</Badge>
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
                  {plan.name.toLowerCase().includes("pro") ? (
                    <Crown className="h-6 w-6 text-teal-600" />
                  ) : plan.name.toLowerCase().includes("enterprise") ? (
                    <Sparkles className="h-6 w-6 text-teal-600" />
                  ) : (
                    <Zap className="h-6 w-6 text-teal-600" />
                  )}
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                
                <div className="mt-2">
                  <span className="text-3xl font-black text-foreground">
                    ₹{calculatedPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    /{billingCycle === "annual" ? "year" : "month"}
                  </span>
                </div>

                {!isFree && (
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
                    ₹{unitPrice} per bed / month
                  </p>
                )}

                <CardDescription className="text-xs mt-1">
                  {cardTierLevel === 0
                    ? "Essential starter tools for single property"
                    : cardTierLevel === 1
                    ? "Growing property management with automated rent collection"
                    : "Full automation & agreements with flexible beds quota"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                {/* Bed Counter for Paid Plans when active or can upgrade */}
                {!isFree && (canUpgrade || isCurrent) && (
                  <div className="bg-muted/40 p-3 rounded-xl border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Beds Capacity:</span>
                      <span className="font-bold text-teal-600">{currentBeds} Beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 font-bold"
                        onClick={() => {
                          const next = Math.max(10, currentBeds - 10);
                          setBedsByPlan((prev) => ({ ...prev, [plan.id]: next, [planKey]: next }));
                        }}
                      >
                        -10
                      </Button>
                      <Input
                        type="number"
                        min={10}
                        step={5}
                        value={currentBeds}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value) || 1);
                          setBedsByPlan((prev) => ({ ...prev, [plan.id]: v, [planKey]: v }));
                        }}
                        className="h-8 text-center text-xs font-bold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 font-bold"
                        onClick={() => {
                          const next = currentBeds + 10;
                          setBedsByPlan((prev) => ({ ...prev, [plan.id]: next, [planKey]: next }));
                        }}
                      >
                        +10
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  {(plan.features || []).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Button
                    className="w-full font-semibold border-teal-600 text-teal-600"
                    variant="outline"
                    disabled
                  >
                    Active Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                    disabled={createOrderMut.isPending}
                    onClick={() => handleUpgradeCheckout(plan.id || plan.name.toLowerCase(), currentBeds)}
                  >
                    {createOrderMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade (${currentBeds} Beds)`
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FEATURE COMPARISON TABLE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Feature Comparison Matrix</CardTitle>
          <p className="text-xs text-muted-foreground">
            Complete functional breakdown across all subscription tiers.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs">
                  <th className="text-left font-semibold px-4 py-3 min-w-[200px]">Feature</th>
                  <th className="text-center font-semibold px-3 py-3">Free</th>
                  <th className="text-center font-semibold px-3 py-3">Lite</th>
                  <th className="text-center font-semibold px-3 py-3 text-teal-600">Pro</th>
                  <th className="text-center font-semibold px-3 py-3 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300">
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
                      {(["free", "lite", "pro"] as const).map((tier) => (
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
    </div>
  );
}
