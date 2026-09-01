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
  MoreVertical,
  Building2,
  ArrowRightLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  usePropertyTenantDetail,
  useRequestTenantKycMutation,
  usePropertyAgreements,
  useCreateAgreementMutation,
  useSendAgreementEsignMutation,
  useElectricityDues,
  useAddElectricityDuesMutation,
  useDeleteElectricityDuesMutation,
  useSetTenantNoticeMutation,
  useClearTenantNoticeMutation,
  useMoveTenantMutation,
  useRoomsList,
} from "@/hooks/usePropertyOwnerQueries";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { selectedPgId: currentPropertyId } = useApp();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = usePropertyTenantDetail(currentPropertyId, tenantId);

  const roomTenantId = tenant?.roomTenant?.id ?? tenant?.id ?? "";

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

  // Move Tenant State
  const { properties } = useApp();
  const propertyList = Array.isArray(properties) ? properties : [];
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState<string>("");
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [targetBedNumber, setTargetBedNumber] = useState<number>(1);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newRent, setNewRent] = useState<string>("");
  const [newDeposit, setNewDeposit] = useState<string>("");
  const [transferDeposit, setTransferDeposit] = useState<boolean>(true);
  const [moveRemarks, setMoveRemarks] = useState<string>("");

  const moveMutation = useMoveTenantMutation(currentPropertyId);

  const effectiveTargetPropertyId = targetPropertyId || currentPropertyId || "";
  const targetRoomsQuery = useRoomsList(effectiveTargetPropertyId, undefined, undefined, { requireBlockAndFloor: false });
  const targetRooms = targetRoomsQuery.data ?? [];

  const handleConfirmMove = async () => {
    if (!tenant || !targetRoomId) {
      toast({ title: "Please select target room", variant: "destructive" });
      return;
    }
    try {
      await moveMutation.mutateAsync({
        roomTenantId: tenant.id,
        targetPropertyId: effectiveTargetPropertyId,
        targetRoomId,
        targetBedNumber: Number(targetBedNumber) || 1,
        transferDate: transferDate || new Date().toISOString().split("T")[0],
        newMonthlyRent: newRent ? Number(newRent) : undefined,
        newSecurityDeposit: newDeposit ? Number(newDeposit) : undefined,
        transferSecurityDeposit: transferDeposit,
        remarks: moveRemarks.trim() || undefined,
      });
      toast({
        title: "Tenant Relocated Successfully! 🚚",
        description: `${tenantDisplayName(tenant)} has been moved to room.`,
      });
      setMoveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      if (tenantId) queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
    } catch (e: any) {
      toast({ title: "Could not move tenant", description: e?.message, variant: "destructive" });
    }
  };

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
    monthlyRent: 12000,
    securityDeposit: 15000,
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
    email: "",
    remarks: "",
    alternatePhone: "",
    foodPreference: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    currentAddress: "",
    permanentAddress: "",
    nationality: "",
    gstNumber: "",
    panNumber: "",
    companyName: "",
    companyAddress: "",
    businessOwnerName: "",
    fatherName: "",
    fatherPhone: "",
    fatherOccupation: "",
    motherName: "",
    motherPhone: "",
    motherOccupation: "",
    guardianName: "",
    guardianPhone: "",
    guardianAddress: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? "",
        mobileNumber: tenant.mobileNumber ?? tenant.phone ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        workAddress: tenant.workAddress ?? "",
        email: tenant.email ?? "",
        remarks: (tenant as any).remarks ?? "",
        alternatePhone: (tenant as any).alternatePhone ?? "",
        foodPreference: (tenant as any).foodPreference ?? "",
        dob: (tenant as any).dob ?? "",
        gender: (tenant as any).gender ?? "",
        bloodGroup: (tenant as any).bloodGroup ?? "",
        currentAddress: (tenant as any).currentAddress ?? "",
        permanentAddress: (tenant as any).permanentAddress ?? "",
        nationality: (tenant as any).nationality ?? "",
        gstNumber: (tenant as any).gstNumber ?? "",
        panNumber: (tenant as any).panNumber ?? "",
        companyName: (tenant as any).companyName ?? "",
        companyAddress: (tenant as any).companyAddress ?? "",
        businessOwnerName: (tenant as any).businessOwnerName ?? "",
        fatherName: (tenant as any).fatherName ?? "",
        fatherPhone: (tenant as any).fatherPhone ?? "",
        fatherOccupation: (tenant as any).fatherOccupation ?? "",
        motherName: (tenant as any).motherName ?? "",
        motherPhone: (tenant as any).motherPhone ?? "",
        motherOccupation: (tenant as any).motherOccupation ?? "",
        guardianName: (tenant as any).guardianName ?? "",
        guardianPhone: (tenant as any).guardianPhone ?? "",
        guardianAddress: (tenant as any).guardianAddress ?? "",
        accountNumber: (tenant as any).accountNumber ?? "",
        ifscCode: (tenant as any).ifscCode ?? "",
        upiId: (tenant as any).upiId ?? "",
      });
      if (tenant.monthlyRent) {
        setAgreementForm((prev) => ({
          ...prev,
          monthlyRent: Number(tenant.monthlyRent),
          securityDeposit: Number(tenant.securityDeposit || 10000),
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
      await updatePropertyTenant(currentPropertyId, tenantId, {
        name: form.name.trim(),
        phone: form.mobileNumber.trim(),
        email: form.email.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        alternatePhone: form.alternatePhone.trim() || undefined,
        foodPreference: form.foodPreference.trim() || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup.trim() || undefined,
        currentAddress: form.currentAddress.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        companyAddress: form.companyAddress.trim() || undefined,
        businessOwnerName: form.businessOwnerName.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        fatherPhone: form.fatherPhone.trim() || undefined,
        fatherOccupation: form.fatherOccupation.trim() || undefined,
        motherName: form.motherName.trim() || undefined,
        motherPhone: form.motherPhone.trim() || undefined,
        motherOccupation: form.motherOccupation.trim() || undefined,
        guardianName: form.guardianName.trim() || undefined,
        guardianPhone: form.guardianPhone.trim() || undefined,
        guardianAddress: form.guardianAddress.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
        upiId: form.upiId.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        workAddress: form.workAddress.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
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
        {/* Top bar with back button & Dropdown Options */}
        <div className="flex items-center justify-between border-b pb-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground -ml-2">
            <Link to="/tenants">
              <ArrowLeft className="h-4 w-4" /> Back to Tenants
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-teal-300 text-teal-700 font-bold hover:bg-teal-50 shadow-xs"
              onClick={() => setMoveModalOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4" /> Move Tenant
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({ title: "Delete action triggered", description: "This tenant will be removed." });
                }} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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
            <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
              
              {/* Left Column (Details & Collapsibles) - Span 7 */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Profile header block */}
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/10">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 text-lg font-bold">
                    <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isKycDone ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0.5 px-2">
                          Aadhar Verified ✓
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0.5 px-2">
                          Aadhar Pending
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">Joined at : {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString("en-IN") : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Tenant Details Card (Rent & Deposit) */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/15 flex flex-row items-center gap-2">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                    <CardTitle className="text-sm font-bold">Rent & Deposit</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block">block name</span>
                      <span className="font-semibold text-sm text-foreground">{(tenant as any).block?.name || "Block A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Floor no</span>
                      <span className="font-semibold text-sm text-foreground">{(tenant as any).floor?.name || floor || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Room No.</span>
                      <span className="font-semibold text-sm text-foreground">{roomNo || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Bed No</span>
                      <span className="font-semibold text-sm text-foreground">{bedNo || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block">Bed Sharing</span>
                      <span className="font-semibold text-sm text-foreground">{(tenant as any).room?.capacity ? `${(tenant as any).room.capacity} Bed Sharing` : "2 Bed Sharing"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Collapsible Personal Info */}
                <details className="group border rounded-lg bg-card overflow-hidden">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span>Personal info</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="p-4 border-t bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow label="Gender" value={(tenant as any).gender || "—"} />
                      <DetailRow label="Date Of Birth" value={(tenant as any).dob || "—"} />
                      <DetailRow label="Blood Group" value={(tenant as any).bloodGroup || "—"} />
                      <DetailRow label="Remarks" value={(tenant as any).remarks || "—"} />
                      <DetailRow label="Food Preference" value={(tenant as any).foodPreference || "—"} />
                      <DetailRow label="Nationality" value={(tenant as any).nationality || "—"} />
                      <DetailRow label="Office / College Name" value={tenant.workAddress || "—"} />
                      <DetailRow label="Current Address" value={(tenant as any).currentAddress || "—"} />
                    </div>
                  </div>
                </details>

                {/* Collapsible Contact Info */}
                <details className="group border rounded-lg bg-card overflow-hidden">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Contact info</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="p-4 border-t bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow label="Contact Number" value={phone} />
                      <DetailRow label="Alternate Number" value={(tenant as any).alternatePhone || "—"} />
                      <DetailRow label="Email" value={tenant.email || "—"} />
                      <DetailRow label="Emergency Contact" value={tenant.emergencyContact || "—"} />
                      <DetailRow label="Permanent Address" value={(tenant as any).permanentAddress || "—"} />
                    </div>
                  </div>
                </details>

                {/* Collapsible GST Details */}
                <details className="group border rounded-lg bg-card overflow-hidden">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>GST details</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="p-4 border-t bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow label="GST Number" value={(tenant as any).gstNumber || "—"} />
                      <DetailRow label="PAN Number" value={(tenant as any).panNumber || "—"} />
                      <DetailRow label="Company Name" value={(tenant as any).companyName || "—"} />
                      <DetailRow label="Business Owner Name" value={(tenant as any).businessOwnerName || "—"} />
                      <DetailRow label="Company Address" value={(tenant as any).companyAddress || "—"} />
                    </div>
                  </div>
                </details>

                {/* Collapsible Parent Details */}
                <details className="group border rounded-lg bg-card overflow-hidden">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span>Parent & Guardian details</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="p-4 border-t bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow label="Father Name" value={(tenant as any).fatherName || "—"} />
                      <DetailRow label="Father Contact" value={(tenant as any).fatherPhone || "—"} />
                      <DetailRow label="Father Occupation" value={(tenant as any).fatherOccupation || "—"} />
                      <DetailRow label="Mother Name" value={(tenant as any).motherName || "—"} />
                      <DetailRow label="Mother Contact" value={(tenant as any).motherPhone || "—"} />
                      <DetailRow label="Mother Occupation" value={(tenant as any).motherOccupation || "—"} />
                      <DetailRow label="Local Guardian Name" value={(tenant as any).guardianName || "—"} />
                      <DetailRow label="Local Guardian Phone" value={(tenant as any).guardianPhone || "—"} />
                      <DetailRow label="Local Guardian Address" value={(tenant as any).guardianAddress || "—"} />
                    </div>
                  </div>
                </details>

                {/* Collapsible Bank Details */}
                <details className="group border rounded-lg bg-card overflow-hidden">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Bank details</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="p-4 border-t bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow label="Account Number" value={(tenant as any).accountNumber || "—"} />
                      <DetailRow label="IFSC Code" value={(tenant as any).ifscCode || "—"} />
                      <DetailRow label="UPI ID" value={(tenant as any).upiId || "—"} />
                    </div>
                  </div>
                </details>
              </div>

              {/* Right Column (Rent info & Payments) - Span 5 */}
              <div className="md:col-span-5 space-y-4">
                
                {/* Rent info Card */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/15 flex flex-row items-center gap-2">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" />
                    <CardTitle className="text-sm font-bold">Rent info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground block">Deposit amount</span>
                        <span className="font-bold text-sm text-foreground">
                          {tenant.securityDeposit ? `₹${Number(tenant.securityDeposit).toLocaleString("en-IN")}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Rent per month</span>
                        <span className="font-bold text-sm text-foreground">
                          {tenant.monthlyRent ? `₹${Number(tenant.monthlyRent).toLocaleString("en-IN")}/mo` : "—"}
                        </span>
                      </div>
                      <div className="col-span-2 border-t pt-2">
                        <span className="text-xs text-muted-foreground block">Next Rent due date</span>
                        <span className="font-semibold text-sm text-foreground">{duesLabel}</span>
                      </div>
                    </div>
                    {phone && (
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2" asChild>
                        <a
                          href={`https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(
                            `Hi ${name}, this is a friendly reminder that your rent of ₹${tenant.monthlyRent} for room ${roomNo} is due on ${duesLabel}. Please clear it. Thank you!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" /> Remind to Pay
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Payments Card */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/15">
                    <CardTitle className="text-sm font-bold">Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/20 dark:bg-emerald-950/10">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">Amount Credited from {name}</p>
                          <p className="text-[10px] text-muted-foreground">Received on {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-IN") : "Recently"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+₹{Number(tenant.monthlyRent || 0).toLocaleString("en-IN")}</p>
                          <Badge variant="outline" className="text-[9px] py-0 border-emerald-300 text-emerald-700">monthly Rent</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Panel (Desktop view) */}
                <Card className="border-border/60 shadow-sm hidden md:block">
                  <CardHeader className="pb-3 border-b bg-muted/15">
                    <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <Button variant="outline" className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 gap-2" asChild>
                      <a href={`tel:${phoneDigits(phone || "")}`}>
                        <Phone className="h-4 w-4" /> Call Tenant
                      </a>
                    </Button>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2" asChild>
                      <a href={waLink(phone) || "#"} target="_blank" rel="noreferrer">
                        <IndianRupee className="h-4 w-4" /> Collect Rent
                      </a>
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Responsive Sticky bottom action footer bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur z-40 flex gap-4 md:hidden">
              <Button variant="outline" className="flex-1 border-teal-600 text-teal-600 h-11" asChild>
                <a href={`tel:${phoneDigits(phone)}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </a>
              </Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-11" asChild>
                <a href={waLink(phone) || "#"} target="_blank" rel="noreferrer">
                  <IndianRupee className="h-4 w-4 mr-2" /> Collect rent
                </a>
              </Button>
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
        {/* DIALOG 1: SET NOTICE PERIOD */}
        <Sheet open={noticeOpen} onOpenChange={setNoticeOpen}>
          <SheetContent side="right" className="w-[400px] max-w-full space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" /> Set Tenant Move-Out Notice
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                Initiate checkout timeline and schedule room vacancy date.
              </p>
            </SheetHeader>
            <div className="space-y-4 py-4">
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
                  placeholder="e.g. Relocating, family emergency"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" onClick={() => setNoticeOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                  disabled={setNoticeMut.isPending}
                  onClick={async () => {
                    await handleSetNotice();
                    setNoticeOpen(false);
                  }}
                >
                  {setNoticeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Notice"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tenant Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Basic Details */}
              <div className="border-b pb-3 space-y-3">
                <h3 className="font-semibold text-sm text-teal-600">Basic Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="border-b pb-3 space-y-3">
                <h3 className="font-semibold text-sm text-teal-600">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Remarks</Label>
                    <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Alternate Contact Number</Label>
                    <Input value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Food Preference</Label>
                    <Input value={form.foodPreference} onChange={(e) => setForm({ ...form, foodPreference: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Gender</Label>
                    <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Blood Group</Label>
                    <Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nationality</Label>
                    <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Current Address</Label>
                    <Input value={form.currentAddress} onChange={(e) => setForm({ ...form, currentAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Permanent Address</Label>
                    <Input value={form.permanentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* GST Details */}
              <div className="border-b pb-3 space-y-3">
                <h3 className="font-semibold text-sm text-teal-600">GST Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>GST Number</Label>
                    <Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>PAN Number</Label>
                    <Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Company Name</Label>
                    <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Company Address</Label>
                    <Input value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Business Owner Name</Label>
                    <Input value={form.businessOwnerName} onChange={(e) => setForm({ ...form, businessOwnerName: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Parents & Local Guardian Details */}
              <div className="border-b pb-3 space-y-3">
                <h3 className="font-semibold text-sm text-teal-600">Parents & Guardian Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Father Name</Label>
                    <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Father Contact</Label>
                    <Input value={form.fatherPhone} onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Father Occupation</Label>
                    <Input value={form.fatherOccupation} onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mother Name</Label>
                    <Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mother Contact</Label>
                    <Input value={form.motherPhone} onChange={(e) => setForm({ ...form, motherPhone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mother Occupation</Label>
                    <Input value={form.motherOccupation} onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Guardian Name</Label>
                    <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Guardian Contact</Label>
                    <Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Guardian Address</Label>
                    <Input value={form.guardianAddress} onChange={(e) => setForm({ ...form, guardianAddress: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-teal-600">Bank Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Account Number</Label>
                    <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>IFSC Code</Label>
                    <Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>UPI ID</Label>
                    <Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
                  </div>
                </div>
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

        {/* MOVE TENANT DIALOG MODAL */}
        <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <ArrowRightLeft className="h-5 w-5" /> Relocate Tenant - {tenant ? tenantDisplayName(tenant) : ""}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1.5">
                <Label>Target PG Property</Label>
                <Select value={effectiveTargetPropertyId} onValueChange={setTargetPropertyId}>
                  <SelectTrigger><SelectValue placeholder="Select Target PG" /></SelectTrigger>
                  <SelectContent>
                    {propertyList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target Room</Label>
                  <Select value={targetRoomId} onValueChange={setTargetRoomId}>
                    <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                    <SelectContent>
                      {targetRooms.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.availableBeds ?? 1} bed free)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Bed Number</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={targetBedNumber}
                    onChange={(e) => setTargetBedNumber(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Transfer Effective Date</Label>
                  <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>New Monthly Rent (Optional)</Label>
                  <Input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>New Security Deposit (Optional)</Label>
                <Input
                  type="number"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="detailTransferDeposit"
                  checked={transferDeposit}
                  onCheckedChange={(c) => setTransferDeposit(Boolean(c))}
                />
                <Label htmlFor="detailTransferDeposit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Transfer existing paid Security Deposit to new stay
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label>Relocation Reason / Remarks</Label>
                <Textarea
                  value={moveRemarks}
                  onChange={(e) => setMoveRemarks(e.target.value)}
                  placeholder="e.g. Relocating to larger room on 2nd floor"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMoveModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
                onClick={handleConfirmMove}
                disabled={moveMutation.isPending || !tenant || !targetRoomId}
              >
                {moveMutation.isPending ? "Relocating..." : "Confirm Tenant Relocation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
