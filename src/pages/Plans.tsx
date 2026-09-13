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
  Clock,
  ShieldCheck,
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
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();
  const { data: plansData, isLoading: isPlansLoading } = usePlansList();
  const { data: currentPlanData, isLoading: isCurrentPlanLoading, refetch: refetchCurrentPlan } = useCurrentPlan();
  const subAccess = useSubscriptionAccess();

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
      const order = await createOrderMut.mutateAsync({ planId, billingCycle });
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
        description: `Upgrade to ${planId} Plan (${billingCycle})`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
              billingCycle,
            });
            toast({
              title: "Subscription Activated! 👑",
              description: "Your account has been upgraded successfully.",
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
              Annual <Badge className="ml-1.5 bg-emerald-600 text-white text-[9px] px-1 py-0">Save 17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* PRICING CARDS - ONLY 2 PLANS */}
      <div className="grid gap-6 max-w-4xl mx-auto sm:grid-cols-2 w-full">
        {planCards.map((plan: any) => {
          const isPro = plan.isPro ?? (plan.name || plan.displayName || "").toLowerCase().includes("pro");
          const isCurrent = (isPro && currentPlanKey === "PRO") || (!isPro && currentPlanKey === "LITE" && !subAccess.isTrial);
          const baseMonthly = Number(plan.priceMonthly ?? plan.price ?? (isPro ? 49 : 29)) || (isPro ? 49 : 29);
          const baseAnnual = Number(plan.priceAnnual ?? baseMonthly * 10) || baseMonthly * 10;
          const price = billingCycle === "annual" ? baseAnnual : baseMonthly;
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
                <div className="mt-2 flex items-baseline justify-center">
                  <span className="text-4xl font-black text-foreground">
                    ₹{(price ?? 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                    / bed / {billingCycle === "annual" ? "year" : "month"}
                  </span>
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
                    `Upgrade to ${plan.name}`
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
    </div>
  );
}
