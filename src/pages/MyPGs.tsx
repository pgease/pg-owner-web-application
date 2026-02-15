import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Users,
  CreditCard,
  Wifi,
  Image,
  IndianRupee,
  UtensilsCrossed,
  Clock,
  Home,
  Ban,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const infoItems = [
  { title: "Contact Information", desc: "Save and manage your contact details", icon: Users, url: "/my-pgs" },
  { title: "Payment Details", desc: "View and update payment information", icon: CreditCard, url: "/my-pgs/bank" },
  { title: "Wi-Fi Information", desc: "Access your Wi-Fi details", icon: Wifi, url: "/my-pgs" },
  { title: "Photos & Videos", desc: "Manage PG photos and videos", icon: Image, url: "/my-pgs" },
  { title: "Rent details", desc: "Manage sharing-wise room pricing", icon: IndianRupee, url: "/my-pgs" },
];

const facilityItems = [
  { title: "Meal Menu", desc: "Set and manage your PG meal menu", icon: UtensilsCrossed, url: "/my-pgs" },
  { title: "Dining Schedule", desc: "Define dining timings for your PG", icon: Clock, url: "/my-pgs" },
  { title: "Facilities", desc: "Configure available PG facilities", icon: Home, url: "/my-pgs" },
  { title: "Pg restriction", desc: "Set PG rules and restrictions", icon: Ban, url: "/my-pgs" },
];

const MyPGs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBankPage = location.pathname === "/my-pgs/bank";

  if (isBankPage) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/my-pgs")}>
          <ArrowLeft className="h-4 w-4" /> Back to My PG
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank account</h1>
          <p className="text-sm text-muted-foreground">Add bank or UPI details for collecting PG rent</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account holder name</Label>
                <Input placeholder="Name as in bank" />
              </div>
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input placeholder="e.g. HDFC Bank" />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input placeholder="Account number" />
              </div>
              <div className="space-y-2">
                <Label>IFSC</Label>
                <Input placeholder="IFSC code" />
              </div>
              <div className="space-y-2">
                <Label>UPI ID (optional)</Label>
                <Input placeholder="yourname@upi" />
              </div>
            </div>
            <Button>Save bank details</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My PG</h1>
        <p className="text-sm text-muted-foreground">Manage your PG info and facilities</p>
      </div>

      {/* My Pg Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">My Pg Info</h2>
        <div className="space-y-2">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(item.url)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-muted p-2.5">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="border-t border-dashed" />

      {/* My Pg Facilities */}
      <section>
        <h2 className="text-lg font-semibold mb-4">My Pg Facilities</h2>
        <div className="space-y-2">
          {facilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(item.url)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-muted p-2.5">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bank details section (add bank for collecting rent) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Bank details for collecting PG rent</h2>
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-4 p-4" onClick={() => navigate("/my-pgs/bank")}>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Add bank account</p>
              <p className="text-sm text-muted-foreground">Link UPI or bank account to receive rent payments</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default MyPGs;
