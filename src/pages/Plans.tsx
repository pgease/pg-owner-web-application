import { Check, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    current: true,
    features: [
      "Add tenants (Excel / Invite / Manual)",
      "Vacancy dashboard",
      "Manual rent tracking",
      "Complaints management",
      "Up to 2 PGs",
    ],
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/month",
    current: false,
    popular: true,
    features: [
      "Everything in Free",
      "Automatic rent collection (UPI)",
      "WhatsApp reminders",
      "Aadhaar verification",
      "Auto rent receipts",
      "Guest tracking",
      "Up to 10 PGs",
    ],
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "/month",
    current: false,
    features: [
      "Everything in Premium",
      "Staff roles & permissions",
      "Expense tracking",
      "Advanced reports & analytics",
      "PG website (pgname.pgease.in)",
      "Broadcast notifications",
      "Unlimited PGs",
    ],
  },
];

const Plans = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="text-center max-w-xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Plans & Billing</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Choose the plan that fits your PG management needs
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1"><Zap className="h-3 w-3" /> Most Popular</Badge>
            </div>
          )}
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
              disabled={plan.current}
            >
              {plan.current ? "Current Plan" : "Upgrade"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Plans;
