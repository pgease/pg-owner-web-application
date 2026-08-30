import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Phone,
  MessageCircle,
  Lock,
  IndianRupee,
  ClipboardList,
  ChevronDown,
  ShieldCheck,
  Zap,
  Clock,
  Calendar,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import type { PropertyTenant } from "@/api/propertyOwner";
import { updatePropertyTenant } from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import {
  tenantBedNo,
  tenantDisplayName,
  tenantFloor,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
} from "@/lib/tenantDisplay";
import { useApp } from "@/context/AppContext";
import {
  queryKeys,
  usePropertyTenants,
  useRequestTenantKycMutation,
  usePropertyAgreements,
  useCreateAgreementMutation,
  useSendAgreementEsignMutation,
  useElectricityDues,
  useAddElectricityDuesMutation,
  useDeleteElectricityDuesMutation,
  useSetTenantNoticeMutation,
  useClearTenantNoticeMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function waLink(phone: string): string | null {
  const d = phoneDigits(phone);
  if (d.length < 10) return null;
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground sm:text-right break-words">{value || "—"}</span>
    </div>
  );
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { currentPropertyId } = useApp();
  const queryClient = useQueryClient();

  const { data: rawTenants = [], isLoading } = usePropertyTenants(currentPropertyId);
  const tenants = Array.isArray(rawTenants) ? (rawTenants as PropertyTenant[]) : [];

  const tenant = useMemo(() => {
    if (!tenantId) return undefined;
    return tenants.find((t) => (t.roomTenantId ?? t.id) === tenantId || t.id === tenantId);
  }, [tenants, tenantId]);

  const roomTenantId = tenant?.roomTenantId ?? tenant?.id ?? "";

  // React Query Mutations & Sub-resource hooks
  const requestKycMut = useRequestTenantKycMutation();
  const { data: agreementsData, refetch: refetchAgreements } = usePropertyAgreements(currentPropertyId);
  const createAgreementMut = useCreateAgreementMutation(currentPropertyId);
  const sendEsignMut = useSendAgreementEsignMutation(currentPropertyId ?? undefined);

  const { data: electricityData, isLoading: isElectricityLoading } = useElectricityDues(
    currentPropertyId,
    roomTenantId
  );
  const addElectricityMut = useAddElectricityDuesMutation(currentPropertyId, roomTenantId);
  const deleteElectricityMut = useDeleteElectricityDuesMutation(currentPropertyId, roomTenantId);

  const setNoticeMut = useSetTenantNoticeMutation(currentPropertyId);
  const clearNoticeMut = useClearTenantNoticeMutation(currentPropertyId);

  // Dialog States
  const [editing, setEditing] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    noticeGivenAt: new Date().toISOString().split("T")[0],
    expectedMoveOutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "Job relocation / End of stay",
  });

  const [electricityOpen, setElectricityOpen] = useState(false);
  const [electricityForm, setElectricityForm] = useState({
    previousReading: 120,
    currentReading: 180,
    ratePerUnit: 10,
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    notes: "Regular monthly meter reading",
  });

  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    monthlyRent: 8500,
    securityDeposit: 10000,
    noticePeriodDays: 30,
    lockInPeriodMonths: 3,
    agreementStartDate: new Date().toISOString().split("T")[0],
    houseRules: "1. No loud music after 10 PM.\n2. Guests allowed until 8 PM.\n3. Keep common areas clean.",
  });

  // Edit Profile form
  const [form, setForm] = useState({
    name: "",
    mobileNumber: "",
    emergencyContact: "",
    workAddress: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? "",
        mobileNumber: tenant.mobileNumber ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        workAddress: tenant.workAddress ?? "",
      });
      if (tenant.monthlyRent) {
        setAgreementForm((prev) => ({
          ...prev,
          monthlyRent: tenant.monthlyRent,
          securityDeposit: tenant.securityDeposit || 10000,
        }));
      }
    }
  }, [tenant]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-xl font-bold">Tenant Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested tenant could not be found in this PG.</p>
        <Button asChild variant="outline">
          <Link to="/tenants">Back to Tenants</Link>
        </Button>
      </div>
    );
  }

  const phone = tenantPhone(tenant);
  const name = tenantDisplayName(tenant);
  const initials = tenantInitials(tenant);
  const roomNo = tenantRoomNo(tenant);
  const bedNo = tenantBedNo(tenant);
  const floor = tenantFloor(tenant);
  const rent = tenantRentAmount(tenant);
  const duesLabel = tenantRentDueLabel(tenant);
  const isKycDone = Boolean(tenant.isKycVerified || tenant.kycInfo?.verified || tenant.kycStatus === "completed");

  const matchingAgreement = (agreementsData?.agreements || []).find(
    (a) => a.roomTenantId === roomTenantId || a.tenantPhone === phone
  );

  const electricityDuesList = electricityData?.dues || [];
  const hasActiveNotice = Boolean(tenant.noticeGivenAt || tenant.expectedMoveOutDate);

  const handleSaveProfile = async () => {
    if (!currentPropertyId || !tenantId) return;
    try {
      await updatePropertyTenant(currentPropertyId, tenantId, form);
      queryClient.invalidateQueries({ queryKey: queryKeys.propertyTenants(currentPropertyId) });
      toast({ title: "Profile updated successfully" });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleRequestKyc = async () => {
    try {
      await requestKycMut.mutateAsync(roomTenantId);
      toast({
        title: "DigiLocker KYC Dispatched! 📲",
        description: `Aadhaar verification link sent to ${phone} via WhatsApp.`,
      });
    } catch (e: any) {
      toast({ title: "KYC Request failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateAgreement = async () => {
    try {
      const rules = agreementForm.houseRules.split("\n").map((r) => r.trim()).filter(Boolean);
      await createAgreementMut.mutateAsync({
        roomTenantId,
        monthlyRent: Number(agreementForm.monthlyRent),
        securityDeposit: Number(agreementForm.securityDeposit),
        noticePeriodDays: Number(agreementForm.noticePeriodDays),
        lockInPeriodMonths: Number(agreementForm.lockInPeriodMonths),
        agreementStartDate: agreementForm.agreementStartDate,
        houseRules: rules,
      });
      toast({
        title: "Agreement Created & Dispatched! 📝",
        description: "Digio eSign link sent to tenant via WhatsApp.",
      });
      setAgreementOpen(false);
      refetchAgreements();
    } catch (e: any) {
      toast({ title: "Agreement creation failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleAddElectricity = async () => {
    try {
      await addElectricityMut.mutateAsync({
        previousReading: Number(electricityForm.previousReading),
        currentReading: Number(electricityForm.currentReading),
        ratePerUnit: Number(electricityForm.ratePerUnit),
        billingMonth: Number(electricityForm.billingMonth),
        billingYear: Number(electricityForm.billingYear),
        notes: electricityForm.notes,
      });
      toast({
        title: "Electricity Reading Added! ⚡",
        description: "Units calculated and dues generated for tenant.",
      });
      setElectricityOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to add reading", description: e?.message, variant: "destructive" });
    }
  };

  const handleSetNotice = async () => {
    try {
      await setNoticeMut.mutateAsync({
        roomTenantId,
        body: {
          noticeGivenAt: noticeForm.noticeGivenAt,
          expectedMoveOutDate: noticeForm.expectedMoveOutDate,
          reason: noticeForm.reason,
        },
      });
      toast({
        title: "Notice Period Initiated 🚪",
        description: `Move-out scheduled for ${noticeForm.expectedMoveOutDate}.`,
      });
      setNoticeOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to set notice", description: e?.message, variant: "destructive" });
    }
  };

  const handleClearNotice = async () => {
    try {
      await clearNoticeMut.mutateAsync(roomTenantId);
      toast({ title: "Notice Period Cancelled", description: "Tenant status reset to active residency." });
    } catch (e: any) {
      toast({ title: "Failed to clear notice", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <CanAccessPage permission="tenant_view">
      <div className="space-y-6 pb-20 animate-fade-in">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link to="/tenants">
              <ArrowLeft className="h-4 w-4" /> Back to Tenants
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <CanAccess permission="tenant_edit_basic">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 h-8">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Tenant Hero Profile Card */}
        <Card className="border-teal-100 dark:border-teal-900 bg-gradient-to-r from-teal-50/50 via-card to-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-teal-600 text-lg font-bold">
                  <AvatarFallback className="bg-teal-600 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">{name}</h1>
                    {isKycDone ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1 border-0">
                        <ShieldCheck className="h-3.5 w-3.5" /> KYC Verified ✓
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3.5 w-3.5" /> KYC Pending
                      </Badge>
                    )}
                    {hasActiveNotice && (
                      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 gap-1 border-0">
                        <AlertCircle className="h-3.5 w-3.5" /> On Notice Period
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Room {roomNo} {bedNo ? `• Bed ${bedNo}` : ""} {floor ? `• Floor ${floor}` : ""}
                  </p>
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {phone && (
                  <>
                    <Button variant="outline" size="sm" asChild className="gap-1.5 h-9 flex-1 sm:flex-none">
                      <a href={`tel:${phoneDigits(phone)}`}>
                        <Phone className="h-3.5 w-3.5 text-teal-600" /> Call
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5 h-9 flex-1 sm:flex-none text-emerald-600 border-emerald-200"
                    >
                      <a href={waLink(phone) || "#"} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  </>
                )}
                {!isKycDone && (
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 shadow-sm"
                    disabled={requestKycMut.isPending}
                    onClick={handleRequestKyc}
                  >
                    <Send className="h-3.5 w-3.5" /> Request KYC
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="electricity">Electricity</TabsTrigger>
            <TabsTrigger value="notice">Notice</TabsTrigger>
            <TabsTrigger value="agreement">Agreement</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Residency & Financials</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <DetailRow label="Room Number" value={`Room ${roomNo}`} />
                  <DetailRow label="Bed Assigned" value={bedNo || "Standard"} />
                  <DetailRow label="Floor" value={floor || "Ground Floor"} />
                  <DetailRow label="Monthly Rent" value={`₹${rent.toLocaleString("en-IN")}/mo`} />
                  <DetailRow
                    label="Security Deposit"
                    value={`₹${(tenant.securityDeposit || 10000).toLocaleString("en-IN")}`}
                  />
                  <DetailRow label="Dues Status" value={duesLabel} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Contact & Work Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <DetailRow label="Mobile Contact" value={phone} />
                  <DetailRow label="Emergency Contact" value={tenant.emergencyContact || "—"} />
                  <DetailRow label="Work / College Address" value={tenant.workAddress || "—"} />
                  <DetailRow label="Check-in Date" value={tenant.moveInDate || tenant.createdAt || "—"} />
                  <DetailRow
                    label="KYC Status"
                    value={isKycDone ? "DigiLocker Verified ✓" : "Pending Aadhaar Verification"}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: ELECTRICITY DUES */}
          <TabsContent value="electricity" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Electricity Meter Readings & Dues
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Record sub-meter units and automatically calculate monthly billing dues.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8"
                  onClick={() => setElectricityOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Meter Reading
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isElectricityLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                ) : electricityDuesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No electricity meter readings recorded yet. Click &quot;Add Meter Reading&quot; to log monthly units.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-xs">
                        <TableHead>Billing Month</TableHead>
                        <TableHead>Readings (Prev → Curr)</TableHead>
                        <TableHead>Units Consumed</TableHead>
                        <TableHead>Rate / Unit</TableHead>
                        <TableHead>Total Dues</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {electricityDuesList.map((due) => (
                        <TableRow key={due.id}>
                          <TableCell className="font-medium text-xs">
                            {due.billingMonth}/{due.billingYear}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {due.previousReading} → {due.currentReading}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{due.unitsConsumed} Units</TableCell>
                          <TableCell className="text-xs">₹{due.ratePerUnit}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-600">
                            ₹{due.totalAmount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            {due.isPaid ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Paid ✓</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">Unpaid</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={async () => {
                                await deleteElectricityMut.mutateAsync(due.id);
                                toast({ title: "Reading deleted" });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: NOTICE PERIOD */}
          <TabsContent value="notice" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600" /> Notice Period & Checkout Management
                </CardTitle>
                <CardDescription className="text-xs">
                  Track tenant move-out intentions, calculate checkout settlement, and free up bed availability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasActiveNotice ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Move-Out Notice Active
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Notice Given On: {tenant.noticeGivenAt || "Recently"} • Expected Move-Out:{" "}
                          <span className="font-semibold">{tenant.expectedMoveOutDate}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                        onClick={handleClearNotice}
                      >
                        Cancel Notice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border p-4 rounded-xl bg-muted/20">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">No Active Notice</p>
                      <p className="text-xs text-muted-foreground">
                        Tenant is currently in active stay. When the tenant submits a 30-day move-out notice, record it here.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0"
                      onClick={() => setNoticeOpen(true)}
                    >
                      <Calendar className="h-3.5 w-3.5" /> Set Move-Out Notice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: RENTAL AGREEMENT */}
          <TabsContent value="agreement" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" /> Digital Rental Agreement
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Legally binding DigiLocker Aadhaar eSign contracts via Digio.
                  </CardDescription>
                </div>
                {!matchingAgreement && (
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8"
                    onClick={() => setAgreementOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Agreement
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {matchingAgreement ? (
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            11-Month Digital Lease Agreement
                          </span>
                          {matchingAgreement.status === "signed" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Signed ✓
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Sent for eSign
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rent: ₹{matchingAgreement.monthlyRent.toLocaleString("en-IN")}/mo • Deposit: ₹
                          {matchingAgreement.securityDeposit.toLocaleString("en-IN")} • Notice:{" "}
                          {matchingAgreement.noticePeriodDays} Days
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {matchingAgreement.signingDirectUrl && matchingAgreement.status !== "signed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            onClick={() => window.open(matchingAgreement.signingDirectUrl, "_blank")}
                          >
                            Open Sign Link
                          </Button>
                        )}
                        {(matchingAgreement.signedPdfUrl || matchingAgreement.agreementPdfUrl) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            onClick={() =>
                              window.open(
                                matchingAgreement.signedPdfUrl || matchingAgreement.agreementPdfUrl,
                                "_blank"
                              )
                            }
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border p-4 rounded-xl bg-muted/20">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Standard Digital Rental Agreement</p>
                      <p className="text-xs text-muted-foreground">
                        Generates digital lease contract and sends direct WhatsApp Aadhaar eSign link to tenant.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shrink-0"
                      onClick={() => setAgreementOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Agreement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: SET NOTICE PERIOD */}
        <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" /> Set Tenant Move-Out Notice
              </DialogTitle>
              <DialogDescription>
                Initiate checkout timeline and schedule room vacancy date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Notice Given Date</Label>
                <Input
                  type="date"
                  value={noticeForm.noticeGivenAt}
                  onChange={(e) => setNoticeForm({ ...noticeForm, noticeGivenAt: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Expected Move-Out Date</Label>
                <Input
                  type="date"
                  value={noticeForm.expectedMoveOutDate}
                  onChange={(e) => setNoticeForm({ ...noticeForm, expectedMoveOutDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Reason / Notes</Label>
                <Input
                  value={noticeForm.reason}
                  onChange={(e) => setNoticeForm({ ...noticeForm, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoticeOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={setNoticeMut.isPending}
                onClick={handleSetNotice}
              >
                {setNoticeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Notice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: ADD ELECTRICITY READING */}
        <Dialog open={electricityOpen} onOpenChange={setElectricityOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" /> Add Electricity Meter Reading
              </DialogTitle>
              <DialogDescription>
                Units consumed = (Current Reading − Previous Reading).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Previous Reading</Label>
                  <Input
                    type="number"
                    value={electricityForm.previousReading}
                    onChange={(e) => setElectricityForm({ ...electricityForm, previousReading: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Current Reading</Label>
                  <Input
                    type="number"
                    value={electricityForm.currentReading}
                    onChange={(e) => setElectricityForm({ ...electricityForm, currentReading: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rate Per Unit (₹)</Label>
                  <Input
                    type="number"
                    value={electricityForm.ratePerUnit}
                    onChange={(e) => setElectricityForm({ ...electricityForm, ratePerUnit: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Total Calculated (₹)</Label>
                  <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-bold text-teal-600">
                    ₹{Math.max(0, (electricityForm.currentReading - electricityForm.previousReading) * electricityForm.ratePerUnit)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Input
                  value={electricityForm.notes}
                  onChange={(e) => setElectricityForm({ ...electricityForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setElectricityOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={addElectricityMut.isPending}
                onClick={handleAddElectricity}
              >
                {addElectricityMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Create Dues"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: CREATE DIGITAL AGREEMENT */}
        <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" /> Create Digital Agreement for {name}
              </DialogTitle>
              <DialogDescription>
                Draft lease contract and dispatch WhatsApp Aadhaar eSign link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Monthly Rent (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.monthlyRent}
                    onChange={(e) => setAgreementForm({ ...agreementForm, monthlyRent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.securityDeposit}
                    onChange={(e) => setAgreementForm({ ...agreementForm, securityDeposit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Notice Period (Days)</Label>
                  <Input
                    type="number"
                    value={agreementForm.noticePeriodDays}
                    onChange={(e) => setAgreementForm({ ...agreementForm, noticePeriodDays: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Lock-in Months</Label>
                  <Input
                    type="number"
                    value={agreementForm.lockInPeriodMonths}
                    onChange={(e) => setAgreementForm({ ...agreementForm, lockInPeriodMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={agreementForm.agreementStartDate}
                  onChange={(e) => setAgreementForm({ ...agreementForm, agreementStartDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>House Rules</Label>
                <Textarea
                  rows={3}
                  value={agreementForm.houseRules}
                  onChange={(e) => setAgreementForm({ ...agreementForm, houseRules: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAgreementOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                disabled={createAgreementMut.isPending}
                onClick={handleCreateAgreement}
              >
                {createAgreementMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Generate & Dispatch eSign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: EDIT PROFILE */}
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tenant Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Mobile Number</Label>
                <Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Emergency Contact</Label>
                <Input
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Work / College Address</Label>
                <Input value={form.workAddress} onChange={(e) => setForm({ ...form, workAddress: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
