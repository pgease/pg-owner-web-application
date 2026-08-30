import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import RequireAuth from "@/components/auth/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import AddTenantPage from "./pages/tenants/AddTenantPage";
import TenantDetailPage from "./pages/tenants/TenantDetailPage";
import MyPGs from "./pages/MyPGs";
import RentPayments from "./pages/RentPayments";
import Complaints from "./pages/Complaints";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Plans from "./pages/Plans";
import SettingsPage from "./pages/SettingsPage";
import Expenses from "./pages/Expenses";
import Support from "./pages/Support";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import ContactUsPage from "./pages/ContactUsPage";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Structure from "./pages/Structure";
import Kyc from "./pages/Kyc";
import { AppProvider } from "./context/AppContext";
import { PermissionProvider } from "./context/PermissionContext";
import TeamIndex from "./pages/team/TeamIndex";
import AddStaff from "./pages/team/AddStaff";
import EditStaffPermissions from "./pages/team/EditStaffPermissions";
import { FeaturePlaceholder } from "./pages/FeaturePlaceholder";
import ApiCatalogPage from "./pages/reference/ApiCatalogPage";
import LeadsPage from "./pages/tenants/LeadsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <AppProvider>
                  <Onboarding />
                </AppProvider>
              </RequireAuth>
            }
          />

          {/* App routes (with layout) */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppProvider>
                  <PermissionProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/kpis" element={<Dashboard />} />
                        <Route path="/tenants/add" element={<AddTenantPage />} />
                        <Route path="/tenants/vacant-rooms" element={<Tenants />} />
                        <Route path="/tenants/onboarding" element={<Tenants />} />
                        <Route path="/tenants/guests" element={<Tenants />} />
                        <Route path="/tenants/kyc" element={<Kyc />} />
                        <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
                        <Route path="/tenants" element={<Tenants />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/my-pgs" element={<MyPGs />} />
                        <Route path="/my-pgs/structure" element={<Structure />} />
                        <Route path="/my-pgs/rooms" element={<MyPGs />} />
                        <Route path="/my-pgs/bank" element={<MyPGs />} />
                        <Route path="/rent-payments" element={<RentPayments />} />
                        <Route path="/rent-payments/history" element={<RentPayments />} />
                        <Route path="/rent-payments/dues" element={<RentPayments />} />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/complaints" element={<Complaints />} />
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
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
                        <Route path="/contact-us" element={<ContactUsPage />} />
                        <Route path="/reference/apis" element={<ApiCatalogPage />} />
                        <Route path="/team" element={<TeamIndex />} />
                        <Route path="/team/add-staff" element={<AddStaff />} />
                        <Route path="/team/:staffId/permissions" element={<EditStaffPermissions />} />
                        <Route
                          path="/food"
                          element={<FeaturePlaceholder title="Food Menu" permission="food_view_edit" />}
                        />
                        <Route
                          path="/nightout"
                          element={<FeaturePlaceholder title="Night Out" permission="nightout_view" />}
                        />
                        <Route
                          path="/attendance"
                          element={<FeaturePlaceholder title="Attendance" permission="attend_view" />}
                        />
                        <Route
                          path="/eviction"
                          element={<FeaturePlaceholder title="Eviction" permission="eviction_approve" />}
                        />
                        <Route
                          path="/refunds"
                          element={<FeaturePlaceholder title="Refunds" permission="refund_add" />}
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </PermissionProvider>
                </AppProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
