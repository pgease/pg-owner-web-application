import { Check, X, Crown, Zap, Sparkles, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common/PageHeader";
import { useMyFeaturesQuery } from "@/hooks/usePropertyOwnerQueries";
import { buildFeatureKeySet, userHasFeatureForRow, type PlanTierKey } from "@/lib/planFeatures";

/** `featureKey` must match `featureKey` from GET /property-owners/my-features so “Your plan” can show locked/unlocked. */
const features = [
  { name: "Add tenants (Excel / Invite / Manual)", featureKey: "TENANT_ONBOARDING_EXCEL", free: true, premium: true, pro: true },
  { name: "Multi-PG / Multi-Building", featureKey: "MULTI_PROPERTY", free: true, premium: true, pro: true },
  { name: "Notice period tracker", featureKey: "NOTICE_PERIOD", free: true, premium: true, pro: true },
  { name: "Vacancy & tenant dashboard", featureKey: "VACANCY_DASHBOARD", free: true, premium: true, pro: true },
  { name: "Manual rent add", featureKey: "MANUAL_RENT", free: true, premium: true, pro: true },
  { name: "Manual receipts upload", featureKey: "MANUAL_RECEIPTS", free: true, premium: true, pro: true },
  { name: "Complaint logging", featureKey: "COMPLAINTS_BASIC", free: true, premium: true, pro: true },
  { name: "Automatic rent collection (UPI)", featureKey: "AUTO_RENT_UPI", free: false, premium: true, pro: true },
  { name: "WhatsApp rent reminders", featureKey: "WHATSAPP_REMINDERS", free: false, premium: true, pro: true },
  { name: "Aadhaar verification", featureKey: "AADHAAR_KYC", free: false, premium: true, pro: true },
  { name: "Auto rent receipts", featureKey: "AUTO_RECEIPTS", free: false, premium: true, pro: true },
  { name: "Guest tracking (automatic)", featureKey: "GUEST_TRACKING", free: false, premium: true, pro: true },
  { name: "Automated late fees", featureKey: "LATE_FEES", free: false, premium: true, pro: true },
  { name: "Staff roles & permissions", featureKey: "STAFF_ROLES", free: false, premium: false, pro: true },
  { name: "Expense & bill tracking", featureKey: "EXPENSE_TRACKING", free: false, premium: false, pro: true },
  { name: "Complaint threading & assignment", featureKey: "COMPLAINTS_ADVANCED", free: false, premium: false, pro: true },
  { name: "PG Website (pgname.pgease.in)", featureKey: "PG_WEBSITE", free: false, premium: false, pro: true },
  { name: "Group notifications / Broadcast", featureKey: "BROADCAST", free: false, premium: false, pro: true },
  { name: "Advanced reports (PDF / Excel)", featureKey: "ADVANCED_REPORTS", free: false, premium: false, pro: true },
  { name: "Priority support", featureKey: "PRIORITY_SUPPORT", free: false, premium: true, pro: true },
];

function normalizePlanKey(planName?: string, planDisplayName?: string): PlanTierKey {
  const raw = (planDisplayName || planName || "").toUpperCase();
  if (raw.includes("FREE")) return "FREE";
  if (raw.includes("PREMIUM")) return "PREMIUM";
  if (raw.includes("PRO")) return "PRO";
  return "FREE";
}

const plans = [
  {
    key: "FREE",
    icon: Zap,
    price: "₹0",
    period: "",
    tagline: "Get started for free",
    featureCount: features.filter((f) => f.free).length,
  },
  {
    key: "PREMIUM",
    icon: Sparkles,
    price: "₹19",
    period: "/bed/mo",
    tagline: "Best for growing PGs",
    popular: true,
    featureCount: features.filter((f) => f.premium).length,
  },
  {
    key: "PRO",
    icon: Crown,
    price: "₹39",
    period: "/bed/mo",
    tagline: "For professional operators",
    featureCount: features.filter((f) => f.pro).length,
  },
];

const Plans = () => {
  const { data: featuresData, isLoading, isError, refetch } = useMyFeaturesQuery();
  const currentPlanKey = featuresData
    ? normalizePlanKey(featuresData.planName, featuresData.planDisplayName)
    : "FREE";

  const apiFeatureKeys = buildFeatureKeySet(featuresData?.features);
  const hasExplicitApiList = (featuresData?.features?.length ?? 0) > 0;

  const totalFeatures = features.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-sm text-muted-foreground">Failed to load plan information.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="text-center">
        <PageHeader
          title="Plans & Pricing"
          description="Simple, transparent pricing. Upgrade anytime as your PG grows."
        />
      </div>

      {/* Current Plan Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {currentPlanKey === "FREE" && <Zap className="h-5 w-5 text-primary" />}
              {currentPlanKey === "PREMIUM" && <Sparkles className="h-5 w-5 text-primary" />}
              {currentPlanKey === "PRO" && <Crown className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-semibold">
                You're on the <span className="text-primary">{currentPlanKey}</span> plan
              </p>
              <p className="text-xs text-muted-foreground">
                {currentPlanKey === "FREE"
                  ? "Upgrade to unlock automation & advanced features"
                  : currentPlanKey === "PREMIUM"
                  ? "You have access to automation features"
                  : "You have full access to all features"}
              </p>
            </div>
          </div>
          {currentPlanKey !== "PRO" && (
            <Button size="sm" className="shrink-0" disabled>
              Contact sales
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Live features from API: GET /property-owners/my-features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Features in your plan</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Loaded from <code className="rounded bg-muted px-1 py-0.5 text-[11px]">GET /property-owners/my-features</code>
            . Keys here should match the <span className="font-medium">featureKey</span> column in the comparison table
            below.
          </p>
        </CardHeader>
        <CardContent>
          {!hasExplicitApiList ? (
            <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No feature rows returned yet. When the backend sends a non-empty <code className="text-[11px]">features</code>{" "}
              array, each item appears here. Until then, &quot;Your plan&quot; in the table uses your plan name (Free /
              Premium / Pro) only.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {featuresData!.features.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border bg-card px-3 py-2.5 text-left shadow-sm"
                >
                  <p className="text-sm font-medium leading-snug">{f.featureName}</p>
                  {f.featureDescription ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{f.featureDescription}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {f.featureKey}
                    </Badge>
                    {f.category ? (
                      <span className="rounded bg-muted px-1.5 py-0.5">{f.category}</span>
                    ) : null}
                    {f.limit != null ? <span>Limit: {f.limit}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlanKey;
          const Icon = plan.icon;
          return (
            <Card
              key={plan.key}
              className={`relative transition-all ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                  : ""
              } ${isCurrent ? "bg-primary/[0.03]" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-[10px] px-2">Most Popular</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="text-[10px] px-2 border-primary text-primary bg-background">
                    Current Plan
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-7 pb-3">
                <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{plan.key}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Features included</span>
                    <span className="font-medium text-foreground">
                      {plan.featureCount}/{totalFeatures}
                    </span>
                  </div>
                  <Progress value={(plan.featureCount / totalFeatures) * 100} className="h-1.5" />
                </div>

                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  disabled
                >
                  {isCurrent ? "Current Plan" : "Contact sales"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feature Comparison</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            The <span className="font-medium">Your plan</span> column uses your enabled{" "}
            <span className="font-medium">featureKey</span>s when the API returns them; otherwise it follows Free /
            Premium / Pro tiers.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-medium px-4 py-3 min-w-[200px]">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} className="text-center font-medium px-3 py-3 min-w-[100px]">
                      <span className={p.key === currentPlanKey ? "text-primary" : ""}>{p.key}</span>
                    </th>
                  ))}
                  <th className="text-center font-medium px-3 py-3 min-w-[88px] bg-primary/5">
                    <span className="text-primary">Your plan</span>
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
                    <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-4 py-2.5 text-sm">
                        <span>{f.name}</span>
                        {f.featureKey ? (
                          <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{f.featureKey}</span>
                        ) : null}
                      </td>
                      {(["free", "premium", "pro"] as const).map((tier) => (
                        <td key={tier} className="text-center px-3 py-2.5">
                          {f[tier] ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto opacity-40" />
                          )}
                        </td>
                      ))}
                      <td className="text-center px-3 py-2.5 bg-primary/[0.03]">
                        {youHave ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" aria-label="Included" />
                        ) : (
                          <span className="inline-flex items-center justify-center" title="Not included in your plan">
                            <Lock className="h-4 w-4 text-amber-600/90 mx-auto" aria-label="Locked" />
                          </span>
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
};

export default Plans;
