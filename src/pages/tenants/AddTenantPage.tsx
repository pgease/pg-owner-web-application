import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTenantForm } from "@/components/tenants/AddTenantForm";
import { CanAccessPage } from "@/components/PermissionGuard";
import { queryKeys } from "@/hooks/usePropertyOwnerQueries";
import { useApp } from "@/context/AppContext";

export default function AddTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPgId } = useApp();

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

        {!selectedPgId ? (
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
