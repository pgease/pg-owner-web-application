import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Gift,
  Building,
  CreditCard,
  Globe,
  UserCheck,
  LogOut as EvictionIcon,
  CalendarCheck,
  Utensils,
  FileCheck,
  FileText,
  Bell,
  Shield,
  Loader2,
  Upload,
  ChevronRight,
  ExternalLink,
  Settings,
  Sparkles,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/propertyOwner";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/common/PageHeader";
import { useUploadPhotoMutation, useUpdateMeMutation } from "@/hooks/usePropertyOwnerQueries";
import { toast } from "@/components/ui/use-toast";
import { ManagementDetailsDrawer } from "@/components/settings/ManagementDetailsDrawer";

export default function SettingsPage() {
  const { language, setLanguage, selectedPgId, properties } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tab") === "activity") {
      navigate("/activity-logs", { replace: true });
    }
  }, [searchParams, navigate]);

  const [managementDrawerOpen, setManagementDrawerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadPhotoMutation();
  const updateMeMut = useUpdateMeMutation();
  const meQuery = useQuery({
    queryKey: ["property-owner", "me"],
    queryFn: getMe,
  });
  const me = meQuery.data;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCountryCode, setOwnerCountryCode] = useState("+91");
  const [ownerLanguage, setOwnerLanguage] = useState<"en-US" | "hi-IN">("en-US");

  useEffect(() => {
    if (me) {
      setOwnerName(me.name || "");
      setOwnerEmail(me.email || "");
      setOwnerPhone(me.mobileContactNumber || "");
      setOwnerCountryCode(me.countryCode || "+91");
      setOwnerLanguage((me.language as "en-US" | "hi-IN") || "en-US");
    }
  }, [me]);

  const handleSaveProfile = async () => {
    if (!ownerName.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMeMut.mutateAsync({
        name: ownerName.trim(),
        email: ownerEmail.trim() || undefined,
        mobileContactNumber: ownerPhone.trim() || undefined,
        countryCode: ownerCountryCode.trim() || undefined,
        language: ownerLanguage,
      });

      toast({
        title: "Profile updated successfully",
        description: "PG owner details have been updated via PUT /property-owners/me.",
      });
      setIsEditingProfile(false);
      void meQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update profile",
        variant: "destructive",
      });
    }
  };

  const currentProperty = properties.find((p) => p.id === selectedPgId);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMut.mutateAsync(file);
      toast({ title: "Profile photo updated successfully" });
      void meQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl animate-fade-in">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Settings className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Settings & Configurations
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure property business details, tenant verification, agreement templates, and administrative preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            onClick={() => setManagementDrawerOpen(true)}
          >
            <Building2 className="h-4 w-4" /> Management Details
          </Button>
        </div>
      </div>

      {/* CATEGORY 1: PROPERTY MANAGEMENT & FINANCIAL (RentOK Screenshot 4) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Property Management & Financial
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Bank Account & UPI Payouts */}
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/my-pgs/bank")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Bank Account & Payouts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure bank account and UPI details for 0% commission direct settlements
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          {/* 2. Management Details (OPENS THE SLIDE-OVER DRAWER) */}
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group bg-card"
            onClick={() => setManagementDrawerOpen(true)}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Management Details
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure business type, GSTIN, CIN, and administrator profiles
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          {/* 3. Dues & Payment Settings */}
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/rent-payments/dues")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Dues & Payment Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure payment gateways, rent due dates, and automated penalties
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          {/* 4. My Website Details */}
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/my-pgs/public-listing")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    My Website Details
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your public booking microsite and marketing links
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          {/* 5. Referral Program & Partner Rewards */}
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/referrals")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-amber-600 transition-colors flex items-center gap-2">
                    Referral Program & Rewards
                    <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border-amber-200">
                      Earn ₹1,000
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invite PG owners with your referral link and track your direct bank cash rewards ledger
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* CATEGORY 2: TENANT MANAGEMENT */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">Tenant Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/tenants/kyc")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Tenant Onboarding & KYC Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage tenant verification process, Aadhaar KYC, and document checklist
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/tenants/notice-period")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold shrink-0">
                  <EvictionIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Eviction & Notice Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure notice period days, move-out policies, and clearance requirements
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CATEGORY 3: ATTENDANCE & FOOD */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">Attendance & Food</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/attendance")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Attendance Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage biometric sync, night-out approval workflows, and check-in times
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/food-menu")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 flex items-center justify-center font-bold shrink-0">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Food Attendance Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure meal timings, weekly dining schedules, and head-count tracker
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CATEGORY 4: AGREEMENT SETTINGS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">Agreement Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/agreements")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Agreement Template
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize rental clauses, stamp paper charges, and digital signature terms
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() => navigate("/agreements")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    First Party Agreement
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage owner-side power of attorney and legal representative profiles
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CATEGORY 5: COMMUNICATION & OTHER */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">Communication & Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() =>
              toast({
                title: "WhatsApp & Notification Engine Active",
                description: "Auto payment reminders and onboarding welcome messages are enabled.",
              })
            }
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    My Notifications & Messages
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure WhatsApp notification triggers, SMS gateways, and rent alerts
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>

          <Card
            className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
            onClick={() =>
              toast({
                title: "Security & Encryption Active",
                description: "Session is encrypted with JWT and 2FA authentication.",
              })
            }
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    Security Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage login password, phone, authorized staff devices, and account credentials
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ACCOUNT PROFILE CARD */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Account Profile & Identity</span>
                {isEditingProfile && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    Editing Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Registered PG owner credentials, contact details, and platform preferences.
              </CardDescription>
            </div>

            {!isEditingProfile ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="rounded-xl text-xs font-bold gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 self-start sm:self-auto"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={updateMeMut.isPending}
                  onClick={() => {
                    if (me) {
                      setOwnerName(me.name || "");
                      setOwnerEmail(me.email || "");
                      setOwnerPhone(me.mobileContactNumber || "");
                      setOwnerCountryCode(me.countryCode || "+91");
                      setOwnerLanguage((me.language as "en-US" | "hi-IN") || "en-US");
                    }
                    setIsEditingProfile(false);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={updateMeMut.isPending || !ownerName.trim()}
                  onClick={handleSaveProfile}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {updateMeMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          {meQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Owner Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner full name"
                    className="h-9 text-xs rounded-xl focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Registered Email</Label>
                  <Input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="h-9 text-xs rounded-xl focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={ownerCountryCode}
                      onChange={(e) => setOwnerCountryCode(e.target.value)}
                      placeholder="+91"
                      className="w-16 h-9 text-xs rounded-xl text-center px-1 font-mono focus-visible:ring-blue-500"
                    />
                    <Input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="flex-1 h-9 text-xs rounded-xl focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Preferred Language</Label>
                  <select
                    value={ownerLanguage}
                    onChange={(e) => setOwnerLanguage(e.target.value as "en-US" | "hi-IN")}
                    className="w-full h-9 text-xs rounded-xl border border-input bg-background px-3 py-1 text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en-US">English (en-US)</option>
                    <option value="hi-IN">Hindi (hi-IN)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                <Label className="text-[11px] font-semibold text-muted-foreground">Owner Name</Label>
                <p className="text-xs font-bold text-foreground truncate">{me?.name || "—"}</p>
              </div>
              <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                <Label className="text-[11px] font-semibold text-muted-foreground">Registered Email</Label>
                <p className="text-xs font-bold text-foreground truncate">{me?.email || "—"}</p>
              </div>
              <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                <Label className="text-[11px] font-semibold text-muted-foreground">Phone Number</Label>
                <p className="text-xs font-bold text-foreground truncate">
                  {me?.mobileContactNumber ? `${me?.countryCode ? me.countryCode + " " : ""}${me.mobileContactNumber}` : "—"}
                </p>
              </div>
              <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                <Label className="text-[11px] font-semibold text-muted-foreground">Preferred Language</Label>
                <p className="text-xs font-bold text-foreground">
                  {me?.language === "hi-IN" ? "Hindi (hi-IN)" : "English (en-US)"}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3 border-t border-border/40">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-semibold rounded-xl"
              disabled={uploadMut.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Update Profile Photo
            </Button>
            <span className="text-xs text-muted-foreground">JPEG or PNG, up to 5MB</span>
          </div>
        </CardContent>
      </Card>

      {/* THE MANAGEMENT DETAILS SLIDE-OVER DRAWER */}
      <ManagementDetailsDrawer
        open={managementDrawerOpen}
        onOpenChange={setManagementDrawerOpen}
        property={currentProperty}
      />
    </div>
  );
}
