import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/api/http";
import pgeaseLogo from "@/assets/pgease-logo.jpg";

export const StaffExpiredLockout = () => {
  const handleLogout = () => {
    authStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F6F7F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#E2E6EA] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={pgeaseLogo} alt="PG Ease" className="h-6 w-6 rounded object-cover" />
          <span className="font-semibold text-sm tracking-tight text-[#18212B]">PG Ease</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#18212B] mb-2">
          Property Subscription Expired
        </h1>

        <p className="text-sm text-[#556270] mb-6 leading-relaxed">
          The subscription for this property has expired. Operational access for staff members is temporarily suspended until the property owner renews their plan.
        </p>

        <div className="rounded-xl bg-[#F6F7F8] p-4 text-xs text-[#556270] mb-6 text-left border border-[#E2E6EA] space-y-1.5">
          <p className="font-medium text-[#18212B]">What should I do?</p>
          <p>
            Please contact the property owner or primary administrator. Once they renew their subscription, your operational access will be immediately restored.
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full gap-2 border-[#E2E6EA] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default StaffExpiredLockout;
