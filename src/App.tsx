import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import MyPGs from "./pages/MyPGs";
import RentPayments from "./pages/RentPayments";
import Complaints from "./pages/Complaints";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Plans from "./pages/Plans";
import SettingsPage from "./pages/SettingsPage";
import Expenses from "./pages/Expenses";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App routes (with layout) */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/kpis" element={<Dashboard />} />
                  <Route path="/tenants" element={<Tenants />} />
                  <Route path="/tenants/onboarding" element={<Tenants />} />
                  <Route path="/tenants/guests" element={<Tenants />} />
                  <Route path="/my-pgs" element={<MyPGs />} />
                  <Route path="/my-pgs/rooms" element={<MyPGs />} />
                  <Route path="/my-pgs/bank" element={<MyPGs />} />
                  <Route path="/rent-payments" element={<RentPayments />} />
                  <Route path="/rent-payments/history" element={<RentPayments />} />
                  <Route path="/rent-payments/dues" element={<RentPayments />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/staff/roles" element={<Staff />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/expenses/categories" element={<Expenses />} />
                  <Route path="/expenses/monthly" element={<Expenses />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/payments" element={<Reports />} />
                  <Route path="/reports/export" element={<Reports />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/notifications" element={<SettingsPage />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
