import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/propertyOwner";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/common/PageHeader";

const SettingsPage = () => {
  const { language, setLanguage } = useApp();
  const meQuery = useQuery({
    queryKey: ["property-owner", "me"],
    queryFn: getMe,
  });
  const me = meQuery.data;

  return (
  <div className="space-y-6 animate-fade-in max-w-2xl">
    <PageHeader title="Settings" description="Manage your account and preferences" />

    <Card>
      <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {meQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : meQuery.isError ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">Failed to load profile.</p>
            <Button size="sm" variant="outline" onClick={() => meQuery.refetch()}>Retry</Button>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={me?.name ?? ""} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={me?.email ?? ""} readOnly className="bg-muted/50" />
          </div>
        </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={`${me?.countryCode ?? ""}${me?.mobileContactNumber ?? ""}`} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={language === "en-US" ? "default" : "outline"} onClick={() => setLanguage("en-US")}>English</Button>
              <Button size="sm" variant={language === "hi-IN" ? "default" : "outline"} onClick={() => setLanguage("hi-IN")}>Hindi</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Notification preferences will be configurable in an upcoming update.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">PG Rules & Terms</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Custom PG rules and terms management will be available in an upcoming update.
        </p>
      </CardContent>
    </Card>
  </div>
  );
};

export default SettingsPage;
