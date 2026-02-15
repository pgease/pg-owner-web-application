import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

const plans = [
  {
    name: "FREE",
    price: "₹0",
    period: "",
    popular: false,
  },
  {
    name: "PREMIUM",
    price: "₹19",
    period: "/bed",
    popular: true,
  },
  {
    name: "PRO",
    price: "₹39",
    period: "/bed",
    popular: false,
  },
];

const Plans = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="text-center max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Plans & Pricing</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Choose the plan that fits your PG management needs. All plans billed per bed.
      </p>
    </div>

    {/* Feature Comparison Table */}
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-4">
        <CardTitle className="text-lg">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[300px] font-semibold">Feature / Plan</TableHead>
                <TableHead className="text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">FREE</span>
                    <span className="text-xs text-muted-foreground">₹0</span>
                  </div>
                </TableHead>
                <TableHead className="text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">PREMIUM</span>
                    <span className="text-xs text-muted-foreground">₹19/bed</span>
                    {plans.find((p) => p.name === "PREMIUM")?.popular && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Popular
                      </Badge>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">PRO</span>
                    <span className="text-xs text-muted-foreground">₹39/bed</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature, idx) => (
                <TableRow key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                  <TableCell className="font-medium text-sm">{feature.name}</TableCell>
                  <TableCell className="text-center">
                    {feature.free ? (
                      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.premium ? (
                      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.pro ? (
                      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Plan Cards */}
    <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative transition-all ${
            plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-105" : ""
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1 bg-primary">
                <span>Most Popular</span>
              </Badge>
            </div>
          )}
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <div className="mt-3">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              disabled={plan.name === "FREE"}
            >
              {plan.name === "FREE" ? "Current Plan" : "Upgrade"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {plan.name === "FREE" && "Perfect for getting started"}
              {plan.name === "PREMIUM" && "Best for growing PGs"}
              {plan.name === "PRO" && "For professional PG operators"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Plans;
