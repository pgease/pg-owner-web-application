import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTenantForm } from "@/components/tenants/AddTenantForm";
import { CanAccessPage } from "@/components/PermissionGuard";
import { queryKeys } from "@/hooks/usePropertyOwnerQueries";
import { useApp } from "@/context/AppContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";

export default function AddTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPgId } = useApp();
  const subAccess = useSubscriptionAccess();

  const handleSuccess = () => {
    if (selectedPgId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(selectedPgId) });
      queryClient.invalidateQueries({ queryKey: ["property", selectedPgId, "rooms-list"] });
    }
    navigate("/tenants", { replace: true });
  };

  return (
    <CanAccessPage permission="tenant_add">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/tenants" aria-label="Back to tenants">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Add tenant</h1>
            <p className="text-sm text-muted-foreground">Allocate a guest to a room and bed. Changes apply immediately.</p>
          </div>
        </div>

        {!subAccess.canAddTenant ? (
          <Card className="border-destructive/30 bg-destructive/[0.02] shadow-sm max-w-xl mx-auto text-center p-8 rounded-2xl">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Trial Expired: Tenant Addition Restricted</CardTitle>
            <CardDescription className="text-sm mt-2 max-w-md mx-auto">
              Your 45-day free trial has expired. To add new tenants, manage allocations, and keep your property organized, please subscribe to Lite (₹29/bed) or Pro (₹49/bed).
            </CardDescription>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => navigate("/plans")} className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl">
                View Subscription Plans
              </Button>
              <Button variant="outline" onClick={() => navigate("/tenants")} className="rounded-xl">
                Back to Tenants
              </Button>
            </div>
          </Card>
        ) : !selectedPgId ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Select a PG</CardTitle>
              <CardDescription>Use the property dropdown in the top header, then return here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/tenants">Back to tenant list</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Tenant & allocation</CardTitle>
              <CardDescription>Contact details, rent, and room assignment for the selected property.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AddTenantForm onSuccess={handleSuccess} onCancel={() => navigate("/tenants")} />
            </CardContent>
          </Card>
        )}
      </div>
    </CanAccessPage>
  );
}
