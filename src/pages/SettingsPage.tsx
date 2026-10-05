import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Gift,
  CreditCard,
  Globe,
  UserCheck,
  CalendarCheck,
  Utensils,
  FileCheck,
  Bell,
  Shield,
  Loader2,
  Upload,
  ChevronRight,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useUploadPhotoMutation,
  useUpdateMeMutation,
  useAccountDeleteRequest,
  useCreateAccountDeleteRequestMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { toast } from "@/components/ui/use-toast";
import { ManagementDetailsDrawer } from "@/components/settings/ManagementDetailsDrawer";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function SettingsPage() {
  const { language, setLanguage, selectedPgId, properties } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tab") === "activity") {
      navigate("/activity-logs", { replace: true });
    } else if (searchParams.get("editProfile") === "true" || searchParams.get("edit") === "profile") {
      setIsEditingProfile(true);
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

  const isOwner = authStorage.isOwner();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const deleteReqQuery = useAccountDeleteRequest();
  const createDeleteReqMut = useCreateAccountDeleteRequestMutation();
  const deleteRequest = deleteReqQuery.data?.request;

  const handleSubmitDeleteRequest = async () => {
    try {
      await createDeleteReqMut.mutateAsync(deleteReason.trim() || undefined);
      toast({
        title: "Account Deletion Request Submitted",
        description: "Your request has been received. Our compliance team will review it within 24-48 hours.",
      });
      setDeleteDialogOpen(false);
      setDeleteReason("");
      void deleteReqQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Could not submit deletion request",
        variant: "destructive",
      });
    }
  };

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
      const updated = await updateMeMut.mutateAsync({
        name: ownerName.trim(),
        email: ownerEmail.trim() || undefined,
        mobileContactNumber: ownerPhone.trim() || undefined,
        countryCode: ownerCountryCode.trim() || undefined,
        language: ownerLanguage,
      });

      if (updated) {
        authStorage.setPropertyOwner(updated);
      }

      toast({
        title: "Profile updated successfully",
        description: "Your name and contact email have been updated.",
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
    <div className="space-y-6 max-w-[1200px]">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Configure property business profiles, payouts, tenant verification, and platform preferences."
        action={
          <Button
            size="sm"
            className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            onClick={() => setManagementDrawerOpen(true)}
          >
            <Building2 className="h-4 w-4" /> Management Details
          </Button>
        }
      />

      {/* SECTION 1: ACCOUNT PROFILE */}
      <div className="bg-white rounded-md border border-[var(--gray-200)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--gray-900)]">
              Account Profile & Identity
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Registered PG owner credentials, contact details, and default language.
            </p>
          </div>

          {!isEditingProfile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className="h-8 text-xs border-[var(--gray-300)] gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5 text-[var(--brand-600)]" /> Edit Name & Email
            </Button>
          ) : (
            <div className="flex items-center gap-2">
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
                className="h-8 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateMeMut.isPending || !ownerName.trim()}
                onClick={handleSaveProfile}
                className="h-8 text-xs bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-1.5"
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

        {meQuery.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gray-400)]" />
          </div>
        ) : isEditingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">
                Owner Name <span className="text-[#B42318]">*</span>
              </Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Full Name"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Registered Email</Label>
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  value={ownerCountryCode}
                  onChange={(e) => setOwnerCountryCode(e.target.value)}
                  placeholder="+91"
                  className="w-16 h-9 text-sm text-center px-1 font-mono"
                />
                <Input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Language</Label>
              <select
                value={ownerLanguage}
                onChange={(e) => setOwnerLanguage(e.target.value as "en-US" | "hi-IN")}
                className="w-full h-9 text-sm rounded-md border border-[var(--gray-300)] bg-white px-3 py-1 text-[var(--gray-900)] focus:outline-none focus:border-[var(--brand-600)]"
              >
                <option value="en-US">English (en-US)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Owner Name</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 truncate">
                {me?.name || "—"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Registered Email</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 truncate">
                {me?.email || "—"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Phone Number</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 tabular-nums truncate">
                {me?.mobileContactNumber ? `${me?.countryCode ? me.countryCode + " " : ""}${me.mobileContactNumber}` : "—"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Language Preference</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5">
                {me?.language === "hi-IN" ? "Hindi (हिंदी)" : "English"}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center gap-3 border-t border-[var(--gray-200)]">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs border-[var(--gray-300)] gap-1.5"
            disabled={uploadMut.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {uploadMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload profile photo
          </Button>
          <span className="text-xs text-[var(--gray-500)]">JPG or PNG up to 5MB</span>
        </div>
      </div>

      {/* SECTION 2: PROPERTY & BANKING */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Property Management & Banking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/my-pgs/bank")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Bank Account & UPI Payouts
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Configure account and QR code for direct tenant payment settlements
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => setManagementDrawerOpen(true)}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Business & Management Profile
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                GSTIN, business registration type, and legal admin details
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/rent-payments/dues")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Rent Dues & Billing Rules
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Configure monthly rent cycle due date, grace period, and late fee rules
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/my-pgs/public-listing")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Public Website & Marketing
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Manage your pgname.pgease.com booking website and public photos
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 3: OPERATIONS & POLICIES */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Operations & Resident Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/tenants/kyc")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Tenant Onboarding & KYC
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Manage Aadhaar verification, document checklist, and credit balance
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/tenants/notice-period")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Notice Period & Move-Out Rules
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Default notice duration (30 days), vacate clearance, and room turnover
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/food")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Dining & Food Timings
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Meal timings (Breakfast, Lunch, Dinner) and weekly menu schedule
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 4: PLATFORM & REWARDS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Plan, Rewards & Security
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/plans")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Subscription & Billing
                </h4>
                <StatusBadge label="Active" tone="success" size="sm" />
              </div>
              <p className="text-xs text-[var(--gray-500)]">
                Manage Lite / Pro plan subscription and payment invoices
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/referrals")}
            className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Referral Rewards
                </h4>
                <span className="text-[11px] font-medium text-[var(--success)] bg-[#ECFAF1] px-1.5 py-0.5 rounded">
                  Earn ₹1,000 / PG
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)]">
                Invite fellow PG owners and track cash rewards directly to your bank
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 5: DANGER ZONE (OWNER ONLY) */}
      {isOwner && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>
          <div className="bg-white rounded-md border border-red-200 p-4 space-y-4">
            {deleteRequest && deleteRequest.status === "pending" ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-md p-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Deletion Request Under Review
                    </span>
                    <StatusBadge label="Pending Review" tone="warning" size="sm" />
                  </div>
                  <p className="text-xs text-amber-700">
                    Submitted on{" "}
                    {new Date(deleteRequest.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {deleteRequest.reason ? ` • Reason: "${deleteRequest.reason}"` : ""}.
                  </p>
                  <p className="text-xs text-amber-600">
                    Our compliance team is reviewing your request. Your properties and data remain accessible until approved.
                  </p>
                </div>
              </div>
            ) : deleteRequest && deleteRequest.status === "rejected" ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-md p-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                        Deletion Request Declined
                      </span>
                      <StatusBadge label="Rejected" tone="danger" size="sm" />
                    </div>
                    <p className="text-xs text-red-700">
                      Your deletion request was declined
                      {deleteRequest.adminNote ? `: "${deleteRequest.adminNote}"` : "."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 shrink-0"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Submit New Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                    Delete Property Owner Account
                  </h4>
                  <p className="text-xs text-[var(--gray-500)] max-w-xl">
                    Permanently delete your account along with all properties, rooms, beds, tenant records, and payment history.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 shrink-0 gap-1.5"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Request Deletion
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-[var(--gray-900)]">
              Request Account Deletion
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[var(--gray-500)]">
              This request will be submitted to the PG Ease administrative team. Once approved, all your properties, tenant data, bed assignments, and financial records will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Important Notice:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All tenant records and lease agreements will be closed.</li>
                <li>Any active subscription will be terminated upon approval.</li>
                <li>This action is irreversible once processed.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delete-reason" className="text-xs font-medium text-[var(--gray-700)]">
                Reason for leaving (Optional)
              </Label>
              <Textarea
                id="delete-reason"
                rows={3}
                placeholder="Let us know why you wish to delete your account..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={createDeleteReqMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSubmitDeleteRequest}
              disabled={createDeleteReqMut.isPending}
              className="gap-1.5"
            >
              {createDeleteReqMut.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Deletion Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over Drawer for Management Details */}
      <ManagementDetailsDrawer
        open={managementDrawerOpen}
        onOpenChange={setManagementDrawerOpen}
        property={currentProperty}
      />
    </div>
  );
}
