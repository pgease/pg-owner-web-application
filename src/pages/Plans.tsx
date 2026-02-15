import { Check, X, Crown, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const features = [
  { name: "Add tenants (Excel / Invite / Manual)", free: true, premium: true, pro: true },
  { name: "Multi-PG / Multi-Building", free: true, premium: true, pro: true },
  { name: "Notice period tracker", free: true, premium: true, pro: true },
  { name: "Vacancy & tenant dashboard", free: true, premium: true, pro: true },
  { name: "Manual rent add", free: true, premium: true, pro: true },
  { name: "Manual receipts upload", free: true, premium: true, pro: true },
  { name: "Complaint logging", free: true, premium: true, pro: true },
  { name: "Automatic rent collection (UPI)", free: false, premium: true, pro: true },
  { name: "WhatsApp rent reminders", free: false, premium: true, pro: true },
  { name: "Aadhaar verification", free: false, premium: true, pro: true },
  { name: "Auto rent receipts", free: false, premium: true, pro: true },
  { name: "Guest tracking (automatic)", free: false, premium: true, pro: true },
  { name: "Automated late fees", free: false, premium: true, pro: true },
  { name: "Staff roles & permissions", free: false, premium: false, pro: true },
  { name: "Expense & bill tracking", free: false, premium: false, pro: true },
  { name: "Complaint threading & assignment", free: false, premium: false, pro: true },
  { name: "PG Website (pgname.pgease.in)", free: false, premium: false, pro: true },
  { name: "Group notifications / Broadcast", free: false, premium: false, pro: true },
  { name: "Advanced reports (PDF / Excel)", free: false, premium: false, pro: true },
  { name: "Priority support", free: false, premium: true, pro: true },
];

// Mock current plan — replace with real data from API/context
const CURRENT_PLAN: string = "FREE";

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
  const totalFeatures = features.length;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Plans & Pricing</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Simple, transparent pricing. Upgrade anytime as your PG grows.
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {CURRENT_PLAN === "FREE" && <Zap className="h-5 w-5 text-primary" />}
              {CURRENT_PLAN === "PREMIUM" && <Sparkles className="h-5 w-5 text-primary" />}
              {CURRENT_PLAN === "PRO" && <Crown className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-semibold">
                You're on the <span className="text-primary">{CURRENT_PLAN}</span> plan
              </p>
              <p className="text-xs text-muted-foreground">
                {CURRENT_PLAN === "FREE"
                  ? "Upgrade to unlock automation & advanced features"
                  : CURRENT_PLAN === "PREMIUM"
                  ? "You have access to automation features"
                  : "You have full access to all features"}
              </p>
            </div>
          </div>
          {CURRENT_PLAN !== "PRO" && (
            <Button size="sm" className="shrink-0">
              Upgrade Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === CURRENT_PLAN;
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
                {/* Feature coverage bar */}
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
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-medium px-4 py-3 min-w-[200px]">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} className="text-center font-medium px-3 py-3 min-w-[100px]">
                      <span className={p.key === CURRENT_PLAN ? "text-primary" : ""}>{p.key}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-2.5 text-sm">{f.name}</td>
                    {(["free", "premium", "pro"] as const).map((tier) => (
                      <td key={tier} className="text-center px-3 py-2.5">
                        {f[tier] ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto opacity-40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Plans;
