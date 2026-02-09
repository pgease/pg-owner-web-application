import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const SettingsPage = () => (
  <div className="space-y-6 animate-fade-in max-w-2xl">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input defaultValue="Rajesh Patel" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="rajesh@pgease.in" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input defaultValue="Rajesh PG Management" />
          </div>
        </div>
        <Button size="sm">Save Changes</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: "Email notifications", desc: "Receive rent & complaint updates via email", checked: true },
          { label: "WhatsApp reminders", desc: "Send rent reminders to tenants", checked: true },
          { label: "SMS notifications", desc: "Receive SMS for critical alerts", checked: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch defaultChecked={n.checked} />
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">PG Rules & Terms</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Define default rules shown in tenant agreements.</p>
        <textarea
          className="w-full rounded-md border bg-muted/50 p-3 text-sm resize-none h-32 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          defaultValue="1. Rent is due by the 5th of every month.&#10;2. Security deposit is non-refundable if notice period is not served.&#10;3. Guests are not allowed to stay overnight without prior permission."
        />
        <Button size="sm" className="mt-3">Save Rules</Button>
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
