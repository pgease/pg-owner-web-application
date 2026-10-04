import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireOwner from "@/components/auth/RequireOwner";
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
import PermissionsMatrixPage from "./pages/team/PermissionsMatrixPage";
import { FeaturePlaceholder } from "./pages/FeaturePlaceholder";
import LeadsPage from "./pages/tenants/LeadsPage";
import WifiManagementPage from "./pages/property/WifiManagementPage";
import PropertyNoticesPage from "./pages/property/PropertyNoticesPage";
import GuestRequestsPage from "./pages/operations/GuestRequestsPage";
import NightOutRequestsPage from "./pages/operations/NightOutRequestsPage";
import FoodDiningPage from "./pages/food/FoodDiningPage";
import { EaseBuddyAI } from "./components/common/EaseBuddyAI";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import NoticePeriodPage from "./pages/tenants/NoticePeriodPage";
import BankAccountPage from "./pages/property/BankAccountPage";
import AmenitiesPage from "./pages/property/AmenitiesPage";
import RestrictionsPage from "./pages/property/RestrictionsPage";
import ReferralsPage from "./pages/ReferralsPage";
import ApiCatalogPage from "./pages/reference/ApiCatalogPage";
import PublicListingPage from "./pages/property/PublicListingPage";
import FeatureCataloguePage from "./pages/FeatureCataloguePage";
import GroupChatPage from "./pages/chat/GroupChatPage";
import { TutorialProvider } from "./context/TutorialContext";

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
          <Route path="/signup" element={<Login initialMode="signup" />} />
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
                    <TutorialProvider>
                      <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/kpis" element={<Dashboard />} />
                        <Route path="/tenants/add" element={<AddTenantPage />} />
                        <Route path="/tenants/vacant-rooms" element={<Tenants />} />
                        <Route path="/tenants/guests" element={<GuestRequestsPage />} />
                        <Route path="/tenants/kyc" element={<Kyc />} />
                        <Route path="/tenants/notice-period" element={<NoticePeriodPage />} />
                        <Route path="/tenants/notice" element={<NoticePeriodPage />} />
                        <Route path="/tenants/onboarding" element={<NoticePeriodPage />} />
                        <Route path="/notice-period" element={<NoticePeriodPage />} />
                        <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
                        <Route path="/tenants" element={<Tenants />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/my-pgs" element={<MyPGs />} />
                        <Route path="/my-pgs/structure" element={<Structure />} />
                        <Route path="/my-pgs/amenities" element={<AmenitiesPage />} />
                        <Route path="/my-pgs/restrictions" element={<RestrictionsPage />} />
                        <Route path="/my-pgs/wifi" element={<WifiManagementPage />} />
                        <Route path="/my-pgs/notices" element={<PropertyNoticesPage />} />
                        <Route path="/notices" element={<Navigate to="/my-pgs/notices" replace />} />
                        <Route path="/my-pgs/rooms" element={<Structure />} />
                        <Route path="/my-pgs/bank" element={<RequireOwner><BankAccountPage /></RequireOwner>} />
                        <Route path="/bank" element={<RequireOwner><BankAccountPage /></RequireOwner>} />
                        <Route path="/rent-payments" element={<RentPayments />} />
                        <Route path="/rent-payments/history" element={<RentPayments />} />
                        <Route path="/rent-payments/dues" element={<RentPayments />} />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/group-chat" element={<GroupChatPage />} />
                        <Route path="/chat" element={<GroupChatPage />} />
                        <Route path="/staff/roles" element={<Staff />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/expenses/categories" element={<Expenses />} />
                        <Route path="/expenses/monthly" element={<Expenses />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/reports/payments" element={<Reports />} />
                        <Route path="/reports/export" element={<Reports />} />
                        <Route path="/plans" element={<RequireOwner><Plans /></RequireOwner>} />
                        <Route path="/referrals" element={<RequireOwner><ReferralsPage /></RequireOwner>} />
                        <Route path="/feature-catalogue" element={<FeatureCataloguePage />} />
                        <Route path="/api-catalog" element={<ApiCatalogPage />} />
                        <Route path="/reference/api-catalog" element={<ApiCatalogPage />} />
                        <Route path="/refer-and-earn" element={<RequireOwner><ReferralsPage /></RequireOwner>} />
                        <Route path="/post-pg" element={<PublicListingPage />} />
                        <Route path="/my-pgs/public-listing" element={<PublicListingPage />} />
                        <Route path="/public-listing" element={<PublicListingPage />} />
                        <Route path="/activity-logs" element={<ActivityLogsPage />} />
                        <Route path="/audit-logs" element={<ActivityLogsPage />} />
                        <Route path="/settings/activity-logs" element={<ActivityLogsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/notifications" element={<SettingsPage />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
                        <Route path="/contact-us" element={<ContactUsPage />} />
                        <Route path="/team" element={<RequireOwner><TeamIndex /></RequireOwner>} />
                        <Route path="/team/add-staff" element={<RequireOwner><AddStaff /></RequireOwner>} />
                        <Route path="/team/:staffId/permissions" element={<RequireOwner><EditStaffPermissions /></RequireOwner>} />
                        <Route path="/team/permissions" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/team/permissions-matrix" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/settings/permissions" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/food" element={<FoodDiningPage />} />
                        <Route path="/nightout" element={<NightOutRequestsPage />} />
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
                      <EaseBuddyAI />
                    </AppLayout>
                  </TutorialProvider>
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
