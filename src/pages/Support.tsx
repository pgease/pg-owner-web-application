import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Send, MessageCircle } from "lucide-react";

const tickets = [
  { id: "TKT-001", subject: "Payment gateway not working", status: "Open", date: "Feb 7, 2026" },
  { id: "TKT-002", subject: "Need help with Excel import", status: "Resolved", date: "Feb 3, 2026" },
  { id: "TKT-003", subject: "Tenant invite link expired", status: "In Progress", date: "Jan 29, 2026" },
];

const Support = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">Need help? Create a ticket or browse existing ones.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" /> Create Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea placeholder="Describe your issue in detail..." rows={4} />
            </div>
            <Button className="w-full gap-2">
              <Send className="h-4 w-4" /> Submit Ticket
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" /> Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.id} · {t.date}</p>
                </div>
                <Badge
                  variant={t.status === "Resolved" ? "default" : "outline"}
                  className={t.status === "Open" ? "border-warning text-warning" : t.status === "In Progress" ? "border-primary text-primary" : ""}
                >
                  {t.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Floating support button */}
      <button className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
        <LifeBuoy className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Support;
