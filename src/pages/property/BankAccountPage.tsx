import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CanAccessPage } from "@/components/PermissionGuard";
import { BankAccountManager } from "@/components/property/BankAccountManager";
import { useApp } from "@/context/AppContext";

export const BankAccountPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-6 animate-fade-in max-w-6xl pb-12">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/my-pgs")}
                title="Back to PG Settings"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                <CreditCard className="h-6 w-6 text-blue-600" />
                Bank Account & UPI Payouts
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-xs font-bold gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> 0% Commission
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Configure your verified bank account and UPI VPA for direct tenant rent settlements at {selectedPg?.name || "your property"}.
            </p>
          </div>
        </div>

        {/* Core Bank Account Manager component */}
        <BankAccountManager />
      </div>
    </CanAccessPage>
  );
};

export default BankAccountPage;
