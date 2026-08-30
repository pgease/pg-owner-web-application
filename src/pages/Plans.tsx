import { useState } from "react";
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
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();
  const { data: plansData, isLoading: isPlansLoading } = usePlansList();
  const { data: currentPlanData, isLoading: isCurrentPlanLoading, refetch: refetchCurrentPlan } = useCurrentPlan();

  const createOrderMut = useCreatePlanCheckoutOrderMutation();
  const verifyPaymentMut = useVerifyPlanPaymentMutation();

  const rawPlanName = featuresData?.planName || currentPlanData?.currentPlan?.name || "Free";
  const currentPlanKey: PlanTierKey = rawPlanName.toLowerCase().includes("pro")
    ? "Pro"
    : rawPlanName.toLowerCase().includes("lite")
    ? "Lite"
    : "Free";

  const apiFeatureKeys = buildFeatureKeySet(featuresData?.features);
  const hasExplicitApiList = Boolean(featuresData?.features && featuresData.features.length > 0);

  const fallbackPlans = [
    {
      id: "plan_free",
      name: "Free",
      code: "FREE",
      priceMonthly: 0,
      priceAnnual: 0,
      maxProperties: 1,
      maxTenants: 15,
      features: ["Up to 15 Tenants", "1 Property", "Manual Rent Tracking", "5 Free KYC Credits"],
      popular: false,
    },
    {
      id: "plan_pro",
      name: "Pro",
      code: "PRO",
      priceMonthly: 999,
      priceAnnual: 9990,
      maxProperties: 5,
      maxTenants: 100,
      features: [
        "Up to 100 Tenants",
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
      maxProperties: 50,
      maxTenants: 1000,
      features: [
        "Unlimited Properties",
        "Unlimited Tenants",
        "Priority 24/7 Support",
        "Advanced Revenue Analytics",
        "Custom Branding",
      ],
      popular: false,
    },
  ];

  const planCards = plansData?.plans && plansData.plans.length > 0 ? plansData.plans : fallbackPlans;

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
      <Card className="border-teal-200 dark:border-teal-900 bg-gradient-to-br from-teal-500/5 via-emerald-500/5 to-transparent">
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
                {currentPlanKey === "Pro"
                  ? "PG Ease Professional Suite"
                  : currentPlanKey === "Lite"
                  ? "PG Ease Growth Suite"
                  : "PG Ease Starter Edition"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentPlanData?.expiresAt
                  ? `Renewal Date: ${new Date(currentPlanData.expiresAt).toLocaleDateString("en-IN")}`
                  : "Free perpetual license for single property management"}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <Building className="h-3.5 w-3.5" /> Properties Limit
                </div>
                <div className="text-sm font-bold text-foreground">
                  {currentPlanData?.propertiesUsage?.used ?? 1} / {currentPlanData?.propertiesUsage?.max ?? (currentPlanKey === "Free" ? 1 : 5)}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 sm:justify-end">
                  <Users className="h-3.5 w-3.5" /> Tenants Limit
                </div>
                <div className="text-sm font-bold text-foreground">
                  {currentPlanData?.tenantsUsage?.used ?? 2} / {currentPlanData?.tenantsUsage?.max ?? (currentPlanKey === "Free" ? 15 : 100)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          const isCurrent = plan.name.toLowerCase() === currentPlanKey.toLowerCase();
          const price =
            billingCycle === "annual" ? plan.priceAnnual || plan.priceMonthly * 10 : plan.priceMonthly;

          return (
            <Card
              key={plan.id || plan.name}
              className={`relative flex flex-col justify-between transition-all ${
                plan.popular
                  ? "border-teal-600 shadow-xl shadow-teal-500/10 ring-2 ring-teal-600/20"
                  : "hover:border-teal-200 dark:hover:border-teal-800"
              } ${isCurrent ? "bg-teal-500/[0.02]" : ""}`}
            >
              {plan.popular && (
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
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    /{billingCycle === "annual" ? "year" : "month"}
                  </span>
                </div>
                <CardDescription className="text-xs mt-1">
                  {plan.name.toLowerCase() === "free"
                    ? "Essential features for single property"
                    : plan.name.toLowerCase() === "pro"
                    ? "Full automation & agreements for growing PGs"
                    : "Tailored for large multi-property chains"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                <div className="space-y-2 border-t pt-4">
                  {(plan.features || []).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full font-semibold ${
                    isCurrent
                      ? "border-teal-600 text-teal-600"
                      : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
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
                    "Upgrade to " + plan.name
                  )}
                </Button>
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
