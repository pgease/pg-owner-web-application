import React, { useEffect, useState } from "react";
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
  History,
  MessageSquare,
  UserMinus,
  Link2,
} from "lucide-react";
import { TenantActivityLogsDrawer } from "@/components/tenants/TenantActivityLogsDrawer";
import { SharePaymentLinkDialog } from "@/components/tenants/SharePaymentLinkDialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
import {
  updatePropertyTenant,
  sendWhatsAppRentReminder,
  sendWhatsAppKycReminder,
  sendWhatsAppAgreementReminder,
} from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import {
  tenantBedNo,
  tenantBlock,
  tenantDisplayName,
  tenantFloor,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantStayStatus,
  tenantStatusDisplay,
  tenantCode,
  tenantMoveOutDate,
} from "@/lib/tenantDisplay";
import { useApp } from "@/context/AppContext";
import {
  queryKeys,
  usePropertyTenantDetail,
  useRequestTenantKycMutation,
  usePostManualRentMutation,
  usePropertyAgreements,
  useCreateAgreementMutation,
  useSendAgreementEsignMutation,
  useElectricityDues,
  useAddElectricityDuesMutation,
  useDeleteElectricityDuesMutation,
  useSetTenantNoticeMutation,
  useClearTenantNoticeMutation,
  useCancelTenantNoticeMutation,
  useMoveOutTenantMutation,
  useMoveTenantMutation,
  useRoomsList,
} from "@/hooks/usePropertyOwnerQueries";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
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

export function parseFlexibleDate(dateVal?: string | Date | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal !== "string") return null;
  const trimmed = dateVal.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed.toLowerCase() === "null") return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateText(dateVal?: string | Date | null): string {
  if (!dateVal) return "—";
  const d = parseFlexibleDate(dateVal);
  if (!d) return typeof dateVal === "string" ? dateVal : "—";
  const day = d.getDate().toString().padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function safeDateInputString(dateVal?: string | Date | null): string {
  if (!dateVal) return "";
  const d = parseFlexibleDate(dateVal);
  if (!d) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getStayDurationText(
  joiningDate?: string | Date | null,
  moveOutDate?: string | Date | null,
  isOnNotice?: boolean,
  expectedMoveOutDate?: string | Date | null
): { label: string; text: string; isPast: boolean } {
  if (!joiningDate) {
    return { label: "Staying Since", text: "—", isPast: false };
  }
  const start = new Date(joiningDate);
  if (isNaN(start.getTime())) {
    return { label: "Staying Since", text: "—", isPast: false };
  }

  const now = new Date();

  // If tenant has already moved out
  if (moveOutDate) {
    const end = new Date(moveOutDate);
    if (!isNaN(end.getTime()) && end <= now) {
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      let durationStr = `${diffDays} days`;
      if (diffDays >= 30) {
        const months = Math.floor(diffDays / 30);
        durationStr = `${months} month${months > 1 ? "s" : ""}`;
      } else if (diffDays >= 7) {
        const weeks = Math.floor(diffDays / 7);
        durationStr = `${weeks} week${weeks > 1 ? "s" : ""}`;
      }
      return {
        label: "Stayed For",
        text: `${durationStr} (Left on ${formatDateText(end)})`,
        isPast: true,
      };
    }
  }

  // Future move-in
  if (start > now) {
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      label: "Move-in In",
      text: `${diffDays} day${diffDays > 1 ? "s" : ""}`,
      isPast: false,
    };
  }

  // Currently active tenant
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let stayText = "";
  if (diffDays < 7) {
    stayText = `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;
    stayText = remDays > 0 ? `${weeks} wk${weeks > 1 ? "s" : ""} ${remDays}d` : `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    stayText = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remMonths = Math.floor((diffDays % 365) / 30);
    stayText = remMonths > 0 ? `${years} yr${years > 1 ? "s" : ""} ${remMonths} mo` : `${years} year${years > 1 ? "s" : ""}`;
  }

  if (isOnNotice && expectedMoveOutDate) {
    const vacate = new Date(expectedMoveOutDate);
    const daysLeft = Math.ceil((vacate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      return {
        label: "On Notice",
        text: `${stayText} (Leaving in ${daysLeft} days)`,
        isPast: false,
      };
    } else {
      return {
        label: "Notice Expired",
        text: `${stayText} (Vacate was due ${formatDateText(vacate)})`,
        isPast: true,
      };
    }
  }

  return { label: "Staying Since", text: stayText, isPast: false };
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-4 border-b border-border/60 py-2.5 last:border-0 items-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground sm:text-right break-words">{value ?? "—"}</span>
    </div>
  );
}

function EditField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 py-1.5 border-b border-border/40 last:border-0 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { selectedPgId: currentPropertyId } = useApp();
  const queryClient = useQueryClient();
  const subAccess = useSubscriptionAccess();

  const { data: tenant, isLoading } = usePropertyTenantDetail(currentPropertyId, tenantId);

  const roomTenantId = tenant?.roomTenant?.id ?? (tenant as any)?.roomTenantId ?? tenant?.id ?? "";

  // Manual payment collection state
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentMethod: "upi",
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    reference: "",
    notes: "Manual rent collection",
  });
  const postManualRentMut = usePostManualRentMutation(currentPropertyId);

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
  const cancelNoticeMut = useCancelTenantNoticeMutation(currentPropertyId);
  const moveOutMut = useMoveOutTenantMutation(currentPropertyId);

  // Move-Out State
  const [moveOutModalOpen, setMoveOutModalOpen] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [moveOutReason, setMoveOutReason] = useState<string>("Tenancy completed smoothly");
  const [moveOutRemarks, setMoveOutRemarks] = useState<string>("");

  const handleOpenMoveOutModal = () => {
    setMoveOutDate(new Date().toISOString().split("T")[0]);
    setMoveOutReason("Tenancy completed smoothly");
    setMoveOutRemarks("");
    setMoveOutModalOpen(true);
  };

  const handleConfirmMoveOut = async () => {
    const effectiveRtId = roomTenantId || (tenant as any)?.roomTenant?.id || tenant?.id;
    if (!currentPropertyId || !effectiveRtId) {
      toast({ title: "Stay assignment not found", variant: "destructive" });
      return;
    }
    try {
      await moveOutMut.mutateAsync({
        roomTenantId: effectiveRtId,
        body: {
          moveOutDate: moveOutDate || new Date().toISOString().split("T")[0],
          reason: moveOutReason.trim() || "Tenancy completed smoothly",
          remarks: moveOutRemarks.trim() || undefined,
        },
      });
      toast({
        title: "Tenant Move-Out Completed 🚪",
        description: `${tenantDisplayName(tenant)} has moved out. The bed is now freed and recurring rent invoicing is halted.`,
      });
      setMoveOutModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
    } catch (e: any) {
      toast({
        title: "Failed to complete move-out",
        description: e?.message || "Unable to process move-out",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancelNotice = async () => {
    const effectiveRtId = roomTenantId || (tenant as any)?.roomTenant?.id || tenant?.id;
    if (!effectiveRtId) return;
    try {
      await cancelNoticeMut.mutateAsync(effectiveRtId);
      toast({
        title: "Notice Cancelled Successfully",
        description: `${tenantDisplayName(tenant)} has been restored to active stay.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
    } catch (e: any) {
      toast({
        title: "Failed to cancel notice",
        description: e?.message || "Unable to cancel notice",
        variant: "destructive",
      });
    }
  };

  // Move Tenant State
  const { properties } = useApp();
  const propertyList = Array.isArray(properties) ? properties : [];
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [gateFeature, setGateFeature] = useState("Notice Period Tracking");
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

  // Edit state (Inline edit directly on the page, no modal)
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
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

  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);

  // Edit Profile form matching RentOk comprehensive fields
  const [form, setForm] = useState({
    // Renting Details
    name: "",
    monthlyRent: "",
    securityDeposit: "",
    rentDueDate: "1",
    rentalFrequency: "Monthly",
    stayType: "Long Stay",
    lockinPeriodMonths: "0",
    noticePeriodDays: "30",
    agreementPeriodMonths: "0",
    joiningDate: "",
    expectedMoveOutDate: "",
    billingStartDate: "",
    gracePeriodDays: "0",
    rentDisabled: false,
    referredBy: "",
    bookedBy: "",
    checkinTime: "",
    checkoutTime: "",
    lastMeterReading: "",
    lastReadingDate: "",
    rentingType: "Bed",
    collectOnlinePayments: true,
    gstApplicable: false,
    gstPercentage: "18",

    // Personal Details
    mobileNumber: "",
    alternatePhone: "",
    email: "",
    dob: "",
    gender: "",
    tenantType: "Student",
    bloodGroup: "",
    permanentAddress: "",
    currentAddress: "",
    permHouseNumber: "",
    permStreet: "",
    permLocality: "",
    permCity: "",
    permDistrict: "",
    permState: "",
    permCountry: "India",
    permPincode: "",
    currHouseNumber: "",
    currStreet: "",
    currLocality: "",
    currCity: "",
    currDistrict: "",
    currState: "",
    currCountry: "India",
    currPincode: "",
    nationality: "Indian",
    govtIdNumber: "",
    foodPreference: "",
    remarks: "",
    emergencyContact: "",
    workAddress: "",

    // Guardian Details
    fatherName: "",
    fatherPhone: "",
    fatherOccupation: "",
    motherName: "",
    motherPhone: "",
    motherOccupation: "",
    guardianName: "",
    guardianPhone: "",
    guardianAddress: "",

    // GST Details
    gstNumber: "",
    panNumber: "",
    companyName: "",
    companyAddress: "",
    businessOwnerName: "",

    // Bank Details
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  useEffect(() => {
    if (tenant) {
      const rt = (tenant as any).roomTenant || (tenant as any).currentStay || {};
      setForm({
        // Renting Details
        name: tenant.name ?? "",
        monthlyRent: String(tenant.monthlyRent ?? rt.rentAmount ?? (tenant as any).rentAmount ?? ""),
        securityDeposit: String(tenant.securityDeposit ?? rt.securityDeposit ?? ""),
        rentDueDate: String(tenant.rentDueDate ?? rt.rentDueDate ?? (tenant as any).rentDueDate ?? "1"),
        rentalFrequency: rt.rentalFrequency ?? (tenant as any).rentalFrequency ?? "Monthly",
        stayType: rt.stayType ?? (tenant as any).stayType ?? "Long Stay",
        lockinPeriodMonths: String(rt.lockinPeriodMonths ?? (tenant as any).lockinPeriodMonths ?? "0"),
        noticePeriodDays: String(rt.noticePeriodDays ?? (tenant as any).noticePeriodDays ?? "30"),
        agreementPeriodMonths: String(rt.agreementPeriodMonths ?? (tenant as any).agreementPeriodMonths ?? "0"),
        joiningDate: safeDateInputString(
          tenant.joiningDate ||
          tenant.moveInDate ||
          rt.startDate ||
          (tenant as any).startDate ||
          (tenant as any).moveInDate
        ),
        expectedMoveOutDate: safeDateInputString(
          tenant.expectedMoveOutDate ||
          rt.vacateOn ||
          (tenant as any).notice?.vacateOn
        ),
        billingStartDate: safeDateInputString(
          (tenant as any).billingStartDate ||
          rt.billingStartDate ||
          tenant.joiningDate ||
          tenant.moveInDate ||
          rt.startDate
        ),
        gracePeriodDays: String(rt.gracePeriodDays ?? (tenant as any).gracePeriodDays ?? "0"),
        rentDisabled: Boolean(rt.rentDisabled ?? (tenant as any).rentDisabled ?? false),
        referredBy: rt.referredBy ?? (tenant as any).referredBy ?? "",
        bookedBy: rt.bookedBy ?? (tenant as any).bookedBy ?? "",
        checkinTime: rt.checkinTime ?? (tenant as any).checkinTime ?? "",
        checkoutTime: rt.checkoutTime ?? (tenant as any).checkoutTime ?? "",
        lastMeterReading: String(rt.lastMeterReading ?? (tenant as any).lastMeterReading ?? ""),
        lastReadingDate: rt.lastReadingDate ? new Date(rt.lastReadingDate).toISOString().split("T")[0] : (tenant as any).lastReadingDate ? new Date((tenant as any).lastReadingDate).toISOString().split("T")[0] : "",
        rentingType: rt.rentingType ?? (tenant as any).rentingType ?? "Bed",
        collectOnlinePayments: rt.collectOnlinePayments !== undefined ? Boolean(rt.collectOnlinePayments) : true,
        gstApplicable: rt.gstApplicable !== undefined ? Boolean(rt.gstApplicable) : false,
        gstPercentage: String(rt.gstPercentage ?? (tenant as any).gstPercentage ?? "18"),

        // Personal Details
        email: tenant.email ?? "",
        mobileNumber: tenant.mobileNumber ?? tenant.phone ?? "",
        alternatePhone: (tenant as any).alternatePhone ?? (tenant as any).alternateNumber ?? "",
        dob: safeDateInputString(
          (tenant as any).personalDetails?.dob ||
          (tenant as any).tenant?.personalDetails?.dob ||
          (tenant as any).dob ||
          (tenant as any).tenant?.dob ||
          (tenant as any).dateOfBirth ||
          (tenant as any).tenant?.dateOfBirth ||
          (tenant as any).kycInfo?.dob ||
          (tenant as any).kyc?.dob
        ),
        gender: (tenant as any).gender ?? (tenant as any).personalDetails?.gender ?? (tenant as any).tenant?.gender ?? "",
        tenantType: (tenant as any).tenantType ?? (tenant as any).personalDetails?.tenantType ?? (tenant as any).tenant?.tenantType ?? "Student",
        bloodGroup: (tenant as any).bloodGroup ?? (tenant as any).personalDetails?.bloodGroup ?? (tenant as any).tenant?.bloodGroup ?? "",
        permanentAddress:
          (tenant as any).personalDetails?.permanentAddress ||
          (tenant as any).tenant?.personalDetails?.permanentAddress ||
          (tenant as any).permanentAddress ||
          (tenant as any).tenant?.permanentAddress ||
          (tenant as any).address ||
          (tenant as any).tenant?.address ||
          (tenant as any).personalDetails?.address ||
          "",
        currentAddress: (tenant as any).currentAddress ?? "",
        permHouseNumber: (tenant as any).permHouseNumber ?? (tenant as any).personalDetails?.permHouseNumber ?? "",
        permStreet: (tenant as any).permStreet ?? (tenant as any).personalDetails?.permStreet ?? "",
        permLocality: (tenant as any).permLocality ?? (tenant as any).personalDetails?.permLocality ?? "",
        permCity: (tenant as any).permCity ?? (tenant as any).personalDetails?.permCity ?? "",
        permDistrict: (tenant as any).permDistrict ?? (tenant as any).personalDetails?.permDistrict ?? "",
        permState: (tenant as any).permState ?? (tenant as any).personalDetails?.permState ?? "",
        permCountry: (tenant as any).permCountry ?? (tenant as any).personalDetails?.permCountry ?? "India",
        permPincode: (tenant as any).permPincode ?? (tenant as any).personalDetails?.permPincode ?? "",
        currHouseNumber: (tenant as any).currHouseNumber ?? (tenant as any).personalDetails?.currHouseNumber ?? "",
        currStreet: (tenant as any).currStreet ?? (tenant as any).personalDetails?.currStreet ?? "",
        currLocality: (tenant as any).currLocality ?? (tenant as any).personalDetails?.currLocality ?? "",
        currCity: (tenant as any).currCity ?? (tenant as any).personalDetails?.currCity ?? "",
        currDistrict: (tenant as any).currDistrict ?? (tenant as any).personalDetails?.currDistrict ?? "",
        currState: (tenant as any).currState ?? (tenant as any).personalDetails?.currState ?? "",
        currCountry: (tenant as any).currCountry ?? (tenant as any).personalDetails?.currCountry ?? "India",
        currPincode: (tenant as any).currPincode ?? (tenant as any).personalDetails?.currPincode ?? "",
        nationality: (tenant as any).nationality ?? "Indian",
        govtIdNumber: (tenant as any).govtIdNumber ?? (tenant as any).govtId ?? (tenant as any).aadhaarNumber ?? "",
        foodPreference: (tenant as any).foodPreference ?? (tenant as any).foodPreferences ?? "",
        remarks: (tenant as any).remarks ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        workAddress: tenant.workAddress ?? "",

        // GST Details
        gstNumber: (tenant as any).gstNumber ?? (tenant as any).gstin ?? "",
        panNumber: (tenant as any).panNumber ?? "",
        companyName: (tenant as any).companyName ?? "",
        companyAddress: (tenant as any).companyAddress ?? "",
        businessOwnerName: (tenant as any).businessOwnerName ?? "",

        // Guardian Details
        fatherName: (tenant as any).fatherName ?? "",
        fatherPhone: (tenant as any).fatherPhone ?? (tenant as any).fatherContact ?? "",
        fatherOccupation: (tenant as any).fatherOccupation ?? "",
        motherName: (tenant as any).motherName ?? "",
        motherPhone: (tenant as any).motherPhone ?? (tenant as any).motherContact ?? "",
        motherOccupation: (tenant as any).motherOccupation ?? "",
        guardianName: (tenant as any).guardianName ?? "",
        guardianPhone: (tenant as any).guardianPhone ?? (tenant as any).guardianContact ?? "",
        guardianAddress: (tenant as any).guardianAddress ?? (tenant as any).localGuardianAddress ?? "",

        // Bank Details
        bankName: (tenant as any).bankName ?? (tenant as any).bankDetails?.bankName ?? (tenant as any).bank?.bankName ?? "",
        accountHolderName: (tenant as any).accountHolderName ?? (tenant as any).bankAccountHolderName ?? tenant.name ?? "",
        accountNumber: (tenant as any).accountNumber ?? (tenant as any).bankAccountNumber ?? "",
        ifscCode: (tenant as any).ifscCode ?? (tenant as any).bankIfscCode ?? "",
        upiId: (tenant as any).upiId ?? (tenant as any).bankUpiId ?? "",
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
  const stayStatus = tenantStayStatus(tenant);
  const photo = (tenant as any)?.photoUrl || (tenant as any)?.imageUrl || (tenant as any)?.profilePhotoUrl;
  const rawRoomNo = tenantRoomNo(tenant);
  const rawBedNo = tenantBedNo(tenant);
  const rawFloor = tenantFloor(tenant);
  const rent = tenantRentAmount(tenant);
  const duesLabel = tenantRentDueLabel(tenant);

  const matchingRoomFromList = (targetRooms || []).find(
    (r: any) =>
      r.id === tenant.roomId ||
      r.id === (tenant as any).currentStay?.roomId ||
      r.id === (tenant as any).roomTenant?.roomId
  );

  const effectiveRoomNo =
    rawRoomNo !== "—"
      ? rawRoomNo
      : (tenant as any).roomNumber ||
        (tenant as any).roomNo ||
        (tenant as any).currentStay?.roomNumber ||
        (tenant as any).roomTenant?.roomNumber ||
        (tenant as any).room?.roomNumber ||
        (tenant as any).room?.name ||
        matchingRoomFromList?.roomNumber ||
        "—";

  const effectiveBedNo =
    rawBedNo !== "—"
      ? rawBedNo
      : (tenant as any).bedNumber ||
        (tenant as any).bedNo ||
        (tenant as any).currentStay?.bedNumber ||
        (tenant as any).roomTenant?.bedNumber ||
        (tenant as any).bed?.bedNumber ||
        "—";

  const effectiveFloor =
    rawFloor !== "—"
      ? rawFloor
      : (tenant as any).floor?.name ||
        (tenant as any).floor ||
        (tenant as any).currentStay?.floor ||
        (tenant as any).roomTenant?.floor ||
        (matchingRoomFromList as any)?.floorName ||
        "—";

  const effectiveBlock =
    tenantBlock(tenant) !== "—"
      ? tenantBlock(tenant)
      : (tenant as any)?.block?.name ||
        (tenant as any)?.block ||
        (tenant as any)?.room?.block ||
        (tenant as any)?.roomTenant?.block ||
        (tenant as any)?.currentStay?.block ||
        "Block A";

  const roomNo = effectiveRoomNo;
  const bedNo = effectiveBedNo;
  const floor = effectiveFloor;
  const block = effectiveBlock;
  const isKycDone = Boolean(
    tenant.isKycVerified ||
    (tenant as any).is_kyc_verified ||
    tenant.kycInfo?.isVerified ||
    tenant.kycInfo?.status === "completed" ||
    tenant.kycInfo?.status === "verified" ||
    tenant.kycInfo?.verified ||
    tenant.kycStatus === "completed" ||
    tenant.kycStatus === "verified"
  );
  const isKycRequested = Boolean(
    (tenant as any).isKycRequested ||
    tenant.kycInfo?.status === "requested" ||
    tenant.kycInfo?.status === "pending_verification" ||
    tenant.kycStatus === "requested" ||
    tenant.kycInfo?.requestedAt
  );

  const handleRecordManualPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPropertyId || !roomTenantId) {
      toast({ title: "Tenant stay assignment missing", variant: "destructive" });
      return;
    }
    const amt = Number(paymentForm.amountPaid);
    if (!amt || amt <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      await postManualRentMut.mutateAsync({
        roomTenantId,
        tenantId: tenant.id,
        amountPaid: amt,
        paymentMethod: paymentForm.paymentMethod,
        periodMonth: Number(paymentForm.periodMonth),
        periodYear: Number(paymentForm.periodYear),
        reference: paymentForm.reference.trim() || undefined,
        notes: paymentForm.notes.trim() || undefined,
        status: "paid",
      } as any);

      toast({
        title: "Payment Recorded Successfully! 🎉",
        description: `₹${amt.toLocaleString("en-IN")} recorded for ${name}.`,
      });
      setRecordPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      queryClient.invalidateQueries({ queryKey: ["rent-collections", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["propertyTenants"] });
    } catch (err: any) {
      toast({
        title: "Failed to record payment",
        description: err?.message || "Please check details and try again.",
        variant: "destructive",
      });
    }
  };

  const matchingAgreement = (agreementsData?.agreements || []).find(
    (a) => a.roomTenantId === roomTenantId || a.tenantPhone === phone
  );

  const electricityDuesList = electricityData?.dues || [];
  const hasActiveNotice = Boolean(
    (tenant as any).isOnNotice ||
    (tenant as any).is_on_notice ||
    (tenant as any).currentStay?.notice?.isOnNotice ||
    tenant.noticeGivenAt ||
    (tenant as any).notice?.noticeStartedAt ||
    tenant.expectedMoveOutDate ||
    (tenant as any).notice?.vacateOn ||
    (tenant as any).currentStay?.vacateOn
  );
  const noticeStartDate = tenant.noticeGivenAt || (tenant as any).notice?.noticeStartedAt || (tenant as any).currentStay?.notice?.noticeStartedAt || "Recently";
  const noticeVacateDate = tenant.expectedMoveOutDate || (tenant as any).notice?.vacateOn || (tenant as any).currentStay?.notice?.vacateOn || (tenant as any).currentStay?.vacateOn;

  const blockName = (tenant as any)?.block?.name || (tenant as any)?.room?.block || (tenant as any)?.roomTenant?.block || "Block A";
  const currentProperty = (propertyList || []).find((p: any) => p.id === currentPropertyId);
  const currentPropertyName = currentProperty?.name || (tenant as any)?.property?.name || "PG Ease";

  const stayDuration = getStayDurationText(
    form.joiningDate || tenant?.joiningDate || tenant?.moveInDate,
    form.expectedMoveOutDate || tenant?.expectedMoveOutDate,
    hasActiveNotice,
    noticeVacateDate
  );

  const handleCancelEditing = () => {
    if (tenant) {
      const rt = (tenant as any).roomTenant || (tenant as any).currentStay || {};
      setForm({
        name: tenant.name ?? "",
        monthlyRent: String(tenant.monthlyRent ?? rt.rentAmount ?? (tenant as any).rentAmount ?? ""),
        securityDeposit: String(tenant.securityDeposit ?? rt.securityDeposit ?? ""),
        rentDueDate: String(tenant.rentDueDate ?? rt.rentDueDate ?? (tenant as any).rentDueDate ?? "1"),
        rentalFrequency: rt.rentalFrequency ?? (tenant as any).rentalFrequency ?? "Monthly",
        stayType: rt.stayType ?? (tenant as any).stayType ?? "Long Stay",
        lockinPeriodMonths: String(rt.lockinPeriodMonths ?? (tenant as any).lockinPeriodMonths ?? "0"),
        noticePeriodDays: String(rt.noticePeriodDays ?? (tenant as any).noticePeriodDays ?? "30"),
        agreementPeriodMonths: String(rt.agreementPeriodMonths ?? (tenant as any).agreementPeriodMonths ?? "0"),
        joiningDate: safeDateInputString(
          tenant.joiningDate ||
          tenant.moveInDate ||
          rt.startDate ||
          (tenant as any).startDate ||
          (tenant as any).moveInDate
        ),
        expectedMoveOutDate: safeDateInputString(
          tenant.expectedMoveOutDate ||
          rt.vacateOn ||
          (tenant as any).notice?.vacateOn
        ),
        referredBy: rt.referredBy ?? (tenant as any).referredBy ?? "",
        bookedBy: rt.bookedBy ?? (tenant as any).bookedBy ?? "",
        checkinTime: rt.checkinTime ?? (tenant as any).checkinTime ?? "",
        checkoutTime: rt.checkoutTime ?? (tenant as any).checkoutTime ?? "",
        lastMeterReading: String(rt.lastMeterReading ?? (tenant as any).lastMeterReading ?? ""),
        lastReadingDate: rt.lastReadingDate ? new Date(rt.lastReadingDate).toISOString().split("T")[0] : "",
        rentingType: rt.rentingType ?? (tenant as any).rentingType ?? "Bed",
        collectOnlinePayments: rt.collectOnlinePayments !== undefined ? Boolean(rt.collectOnlinePayments) : true,
        gstApplicable: rt.gstApplicable !== undefined ? Boolean(rt.gstApplicable) : false,
        gstPercentage: String(rt.gstPercentage ?? (tenant as any).gstPercentage ?? "18"),
        mobileNumber: tenant.mobileNumber ?? tenant.phone ?? "",
        alternatePhone: (tenant as any).alternatePhone ?? (tenant as any).alternateNumber ?? "",
        email: tenant.email ?? "",
        dob: safeDateInputString(
          (tenant as any).personalDetails?.dob ||
          (tenant as any).tenant?.personalDetails?.dob ||
          (tenant as any).dob ||
          (tenant as any).tenant?.dob ||
          (tenant as any).dateOfBirth ||
          (tenant as any).tenant?.dateOfBirth ||
          (tenant as any).kycInfo?.dob ||
          (tenant as any).kyc?.dob
        ),
        gender: (tenant as any).gender ?? (tenant as any).personalDetails?.gender ?? (tenant as any).tenant?.gender ?? "",
        tenantType: (tenant as any).tenantType ?? (tenant as any).personalDetails?.tenantType ?? (tenant as any).tenant?.tenantType ?? "Student",
        bloodGroup: (tenant as any).bloodGroup ?? (tenant as any).personalDetails?.bloodGroup ?? (tenant as any).tenant?.bloodGroup ?? "",
        permanentAddress:
          (tenant as any).personalDetails?.permanentAddress ||
          (tenant as any).tenant?.personalDetails?.permanentAddress ||
          (tenant as any).permanentAddress ||
          (tenant as any).tenant?.permanentAddress ||
          (tenant as any).address ||
          (tenant as any).tenant?.address ||
          (tenant as any).personalDetails?.address ||
          "",
        currentAddress: (tenant as any).currentAddress ?? "",
        nationality: (tenant as any).nationality ?? "Indian",
        govtIdNumber: (tenant as any).govtIdNumber ?? (tenant as any).govtId ?? (tenant as any).aadhaarNumber ?? "",
        foodPreference: (tenant as any).foodPreference ?? (tenant as any).foodPreferences ?? "",
        remarks: (tenant as any).remarks ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        workAddress: tenant.workAddress ?? "",
        gstNumber: (tenant as any).gstNumber ?? "",
        panNumber: (tenant as any).panNumber ?? "",
        companyName: (tenant as any).companyName ?? "",
        companyAddress: (tenant as any).companyAddress ?? "",
        businessOwnerName: (tenant as any).businessOwnerName ?? "",
        fatherName: (tenant as any).fatherName ?? "",
        fatherPhone: (tenant as any).fatherPhone ?? (tenant as any).fatherContact ?? "",
        fatherOccupation: (tenant as any).fatherOccupation ?? "",
        motherName: (tenant as any).motherName ?? "",
        motherPhone: (tenant as any).motherPhone ?? (tenant as any).motherContact ?? "",
        motherOccupation: (tenant as any).motherOccupation ?? "",
        guardianName: (tenant as any).guardianName ?? "",
        guardianPhone: (tenant as any).guardianPhone ?? (tenant as any).guardianContact ?? "",
        guardianAddress: (tenant as any).guardianAddress ?? "",
        accountHolderName: (tenant as any).accountHolderName ?? "",
        accountNumber: (tenant as any).accountNumber ?? "",
        ifscCode: (tenant as any).ifscCode ?? "",
        upiId: (tenant as any).upiId ?? "",
      });
    }
    setEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!currentPropertyId || !tenantId) return;
    setIsSaving(true);
    const rt = (tenant as any)?.roomTenant || (tenant as any)?.currentStay || {};
    const matchingRoom = (targetRooms || []).find(
      (r: any) =>
        r.id === tenant.roomId ||
        r.id === rt.roomId ||
        (roomNo && String(r.roomNumber) === String(roomNo)) ||
        (tenant.roomNumber && String(r.roomNumber) === String(tenant.roomNumber))
    );
    const resolvedRoomId =
      tenant.roomId ||
      rt.roomId ||
      (tenant as any).room?.id ||
      matchingRoom?.id ||
      (targetRooms && targetRooms.length > 0 ? targetRooms[0].id : "");

    const resolvedBedNumber = Number(
      bedNo ||
      tenant.bedNo ||
      tenant.bedNumber ||
      rt.bedNumber ||
      (tenant as any).bed?.bedNumber ||
      1
    );

    const resolvedElectricityBill = Number(
      (tenant as any).electricityBill ||
      rt.electricityBill ||
      (tenant as any).room?.electricityBill ||
      matchingRoom?.electricityBill ||
      0
    );

    const resolvedJoiningDate =
      form.joiningDate ||
      tenant.joiningDate ||
      tenant.moveInDate ||
      rt.startDate ||
      (tenant as any).startDate ||
      new Date().toISOString().split("T")[0];

    if (!resolvedRoomId) {
      toast({
        title: "Room information missing",
        description: "Could not identify tenant's assigned room. Please verify room allocation.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      await updatePropertyTenant(currentPropertyId, roomTenantId || tenantId, {
        // Required fields by backend AddTenantDto
        name: form.name.trim() || tenant.name || "",
        phone: form.mobileNumber.trim() || tenant.phone || "",
        roomId: resolvedRoomId,
        bedNumber: resolvedBedNumber,
        rentDueDate: form.rentDueDate ? Number(form.rentDueDate) : Number(tenant.rentDueDate || rt.rentDueDate || 1),
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : Number(tenant.monthlyRent || rt.rentAmount || 0),
        joiningDate: resolvedJoiningDate,
        electricityBill: resolvedElectricityBill,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : Number(tenant.securityDeposit || rt.securityDeposit || 0),

        // Stay & Agreement Settings
        rentalFrequency: form.rentalFrequency || undefined,
        stayType: form.stayType || undefined,
        lockinPeriodMonths: form.lockinPeriodMonths ? Number(form.lockinPeriodMonths) : 0,
        noticePeriodDays: form.noticePeriodDays ? Number(form.noticePeriodDays) : 30,
        agreementPeriodMonths: form.agreementPeriodMonths ? Number(form.agreementPeriodMonths) : 0,
        referredBy: form.referredBy.trim() || undefined,
        bookedBy: form.bookedBy.trim() || undefined,
        checkinTime: form.checkinTime.trim() || undefined,
        checkoutTime: form.checkoutTime.trim() || undefined,
        rentingType: form.rentingType || undefined,
        collectOnlinePayments: Boolean(form.collectOnlinePayments),
        gstApplicable: Boolean(form.gstApplicable),
        gstPercentage: form.gstApplicable && form.gstPercentage ? Number(form.gstPercentage) : undefined,
        lastMeterReading: form.lastMeterReading.trim() || undefined,
        lastReadingDate: form.lastReadingDate || undefined,

        // Rent Engine Invoicing Rules
        billingStartDate: form.billingStartDate || undefined,
        gracePeriodDays: form.gracePeriodDays ? Number(form.gracePeriodDays) : 0,
        rentDisabled: Boolean(form.rentDisabled),

        // Discrete Address Parts
        permHouseNumber: form.permHouseNumber.trim() || undefined,
        permStreet: form.permStreet.trim() || undefined,
        permLocality: form.permLocality.trim() || undefined,
        permCity: form.permCity.trim() || undefined,
        permDistrict: form.permDistrict.trim() || undefined,
        permState: form.permState.trim() || undefined,
        permCountry: form.permCountry.trim() || undefined,
        permPincode: form.permPincode.trim() || undefined,
        currHouseNumber: form.currHouseNumber.trim() || undefined,
        currStreet: form.currStreet.trim() || undefined,
        currLocality: form.currLocality.trim() || undefined,
        currCity: form.currCity.trim() || undefined,
        currDistrict: form.currDistrict.trim() || undefined,
        currState: form.currState.trim() || undefined,
        currCountry: form.currCountry.trim() || undefined,
        currPincode: form.currPincode.trim() || undefined,

        // Personal Details (Whitelisted property names)
        email: form.email.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        alternatePhone: form.alternatePhone.trim() || undefined,
        alternateNumber: form.alternatePhone.trim() || undefined,
        foodPreferences: form.foodPreference.trim() || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        tenantType: form.tenantType || undefined,
        bloodGroup: form.bloodGroup.trim() || undefined,
        currentAddress: form.currentAddress.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        address: form.permanentAddress.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        govtIdNumber: form.govtIdNumber.trim() || undefined,
        officeOrCollegeName: form.workAddress.trim() || undefined,

        // GST Details
        gstNumber: form.gstNumber.trim() || undefined,
        gstin: form.gstNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        companyAddress: form.companyAddress.trim() || undefined,
        businessOwnerName: form.businessOwnerName.trim() || undefined,

        // Guardian Details
        fatherName: form.fatherName.trim() || undefined,
        fatherPhone: form.fatherPhone.trim() || undefined,
        fatherContact: form.fatherPhone.trim() || undefined,
        fatherOccupation: form.fatherOccupation.trim() || undefined,
        motherName: form.motherName.trim() || undefined,
        motherPhone: form.motherPhone.trim() || undefined,
        motherContact: form.motherPhone.trim() || undefined,
        motherOccupation: form.motherOccupation.trim() || undefined,
        guardianName: form.guardianName.trim() || undefined,
        guardianPhone: form.guardianPhone.trim() || undefined,
        guardianContact: form.guardianPhone.trim() || undefined,
        guardianAddress: form.guardianAddress.trim() || undefined,
        localGuardianAddress: form.guardianAddress.trim() || undefined,

        // Bank Details
        bankName: form.bankName.trim() || undefined,
        bankAccountHolderName: form.accountHolderName.trim() || undefined,
        bankAccountNumber: form.accountNumber.trim() || undefined,
        bankIfscCode: form.ifscCode.trim() || undefined,
        bankUpiId: form.upiId.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      toast({ title: "Profile updated successfully! 🎉" });
      setEditing(false);
    } catch (e: any) {
      const errMsg =
        Array.isArray(e?.response?.data?.message)
          ? e.response.data.message.join(", ")
          : Array.isArray(e?.message)
          ? e.message.join(", ")
          : e?.message || "Could not save details";
      toast({ title: "Update failed", description: errMsg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestKyc = async () => {
    if (!roomTenantId) {
      toast({ title: "Room tenant ID missing", variant: "destructive" });
      return;
    }
    try {
      await requestKycMut.mutateAsync(roomTenantId);
      toast({
        title: "DigiLocker KYC Dispatched! 📲",
        description: `Aadhaar verification link sent to ${phone} via WhatsApp.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      queryClient.invalidateQueries({ queryKey: ["kycApplications"] });
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
    if (!subAccess.canTrackNotice) {
      setGateFeature("Notice Period Tracking");
      setGateModalOpen(true);
      return;
    }
    if (!roomTenantId) {
      toast({ title: "Room tenant assignment missing", variant: "destructive" });
      return;
    }
    const vacate = noticeForm.expectedMoveOutDate || noticeForm.noticeGivenAt;
    if (!vacate) {
      toast({ title: "Please select an expected move-out date", variant: "destructive" });
      return;
    }
    try {
      await setNoticeMut.mutateAsync({
        roomTenantId,
        body: {
          noticeGivenAt: noticeForm.noticeGivenAt,
          expectedMoveOutDate: vacate,
          reason: noticeForm.reason,
        },
      });
      toast({
        title: "Notice Period Initiated 🚪",
        description: `Move-out scheduled for ${vacate}.`,
      });
      setNoticeOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
    } catch (e: any) {
      toast({ title: "Failed to set notice", description: e?.message, variant: "destructive" });
    }
  };

  const handleClearNotice = async () => {
    if (!subAccess.canTrackNotice) {
      setGateFeature("Notice Period Tracking");
      setGateModalOpen(true);
      return;
    }
    if (!roomTenantId) {
      toast({ title: "Room tenant assignment missing", variant: "destructive" });
      return;
    }
    try {
      await clearNoticeMut.mutateAsync(roomTenantId);
      toast({ title: "Notice Period Cancelled", description: "Tenant status reset to active residency." });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantDetail(currentPropertyId, tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
    } catch (e: any) {
      toast({ title: "Failed to clear notice", description: e?.message, variant: "destructive" });
    }
  };

  const handleSendWhatsAppReminder = async (type: "rent" | "kyc" | "agreement") => {
    if (!currentPropertyId || !roomTenantId) {
      toast({ title: "Tenant room assignment required", variant: "destructive" });
      return;
    }
    try {
      if (type === "rent") {
        const res = await sendWhatsAppRentReminder(currentPropertyId, roomTenantId);
        toast({ title: "WhatsApp Rent Reminder Sent 💬", description: res.message });
      } else if (type === "kyc") {
        const res = await sendWhatsAppKycReminder(currentPropertyId, roomTenantId);
        toast({ title: "WhatsApp KYC Reminder Sent 🛡️", description: res.message });
      } else if (type === "agreement") {
        const res = await sendWhatsAppAgreementReminder(currentPropertyId, roomTenantId);
        toast({ title: "WhatsApp Agreement Link Sent 📄", description: res.message });
      }
    } catch (err: any) {
      toast({
        title: "Failed to send WhatsApp reminder",
        description: err?.message || "Could not dispatch WhatsApp message.",
        variant: "destructive",
      });
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold shadow-xs"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" /> WhatsApp
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setPaymentLinkOpen(true)}
                  className="cursor-pointer gap-2"
                >
                  <Link2 className="h-3.5 w-3.5 text-teal-600" /> Share Payment Link & Dues
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSendWhatsAppReminder("rent")}
                  className="cursor-pointer gap-2"
                >
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Send Rent Due Reminder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSendWhatsAppReminder("kyc")}
                  className="cursor-pointer gap-2"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Send Aadhaar KYC Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSendWhatsAppReminder("agreement")}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-purple-600" /> Send Agreement Signing Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentLinkOpen(true)}
              className="gap-1.5 border-teal-300 text-teal-700 dark:text-teal-300 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 font-bold shadow-xs"
            >
              <Link2 className="h-4 w-4 text-teal-600" /> Payment Link
            </Button>

            {editing ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="h-8 px-3 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="h-8 px-3.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-teal-600 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950 font-bold shadow-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-teal-300 text-teal-700 font-bold hover:bg-teal-50 shadow-xs"
              onClick={() => {
                if (!subAccess.canPerformOperations) {
                  setGateFeature("Tenant Relocation");
                  setGateModalOpen(true);
                } else {
                  setMoveModalOpen(true);
                }
              }}
            >
              <ArrowRightLeft className="h-4 w-4" /> Move Tenant
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold"
              onClick={() => setActivityDrawerOpen(true)}
            >
              <History className="h-4 w-4" /> Activity Log
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
                <DropdownMenuItem
                  onClick={() => {
                    if (!subAccess.canDeleteTenant) {
                      setGateFeature("Delete Tenant");
                      setGateModalOpen(true);
                      return;
                    }
                    toast({ title: "Delete action triggered", description: "This tenant will be removed." });
                  }}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* UNDER_NOTICE LIFECYCLE BANNER */}
        {stayStatus === "UNDER_NOTICE" && (
          <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  Tenant On Move-Out Notice
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Notice served on <strong>{noticeStartDate ? formatDateText(noticeStartDate) : "Recently"}</strong>. Scheduled to vacate on{" "}
                  <strong className="underline">{noticeVacateDate ? formatDateText(noticeVacateDate) : "Scheduled date"}</strong>. Room bed remains occupied until move-out.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-amber-400 text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40 text-xs font-semibold"
                onClick={handleConfirmCancelNotice}
                disabled={cancelNoticeMut.isPending}
              >
                {cancelNoticeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Cancel Notice
              </Button>
              <Button
                size="sm"
                className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                onClick={handleOpenMoveOutModal}
              >
                <UserMinus className="h-3.5 w-3.5" /> Complete Move-Out
              </Button>
            </div>
          </div>
        )}

        {/* MOVED_OUT LIFECYCLE BANNER */}
        {stayStatus === "MOVED_OUT" && (
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tenant Stay Completed (Moved Out)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tenant moved out on <strong>{tenantMoveOutDate(tenant) ? formatDateText(tenantMoveOutDate(tenant)) : "Recorded Date"}</strong>. Bed allocation has been released and recurring rent stopped.
              </p>
            </div>
          </div>
        )}

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
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
              
              {/* Left Column (Profile & Renting Summary) - Span 4 */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Profile Card */}
                <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                  <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-teal-500/30 text-xl font-bold shadow-xs">
                        {photo ? <AvatarImage src={photo} alt={name} className="object-cover" /> : null}
                        <AvatarFallback className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="space-y-1.5 flex flex-col items-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">{name}</h2>
                        {tenantCode(tenant) && (
                          <Badge variant="outline" className="font-mono text-[10px] bg-muted/60 text-muted-foreground font-semibold px-2 py-0.5">
                            {tenantCode(tenant)}
                          </Badge>
                        )}
                      </div>

                      {(() => {
                        const statusInfo = tenantStatusDisplay(tenant);
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] py-0.5 px-2.5 font-medium flex items-center gap-1.5",
                              statusInfo.badgeClass
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusInfo.label}
                          </Badge>
                        );
                      })()}
                      <p className="text-xs text-muted-foreground font-medium">{phone || "No mobile number"}</p>
                    </div>

                    {/* Quick Action Buttons: Call, WhatsApp, Move Room */}
                    <div className="grid grid-cols-3 gap-2 w-full pt-1">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground"
                        >
                          <Phone className="h-4 w-4 text-teal-600" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-muted/10 opacity-50 text-xs font-semibold">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>Call</span>
                        </div>
                      )}

                      {phone ? (
                        <a
                          href={`https://wa.me/${phoneDigits(phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground"
                        >
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-muted/10 opacity-50 text-xs font-semibold">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span>WhatsApp</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!subAccess.canPerformOperations) {
                            setGateFeature("Tenant Relocation");
                            setGateModalOpen(true);
                          } else {
                            setMoveModalOpen(true);
                          }
                        }}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground"
                      >
                        <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                        <span>Move</span>
                      </button>
                    </div>

                    {/* Room allocation pill */}
                    <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border text-xs font-semibold text-muted-foreground">
                      <span>Room : <strong className="text-foreground">{effectiveRoomNo !== "—" ? `Room ${effectiveRoomNo}` : "—"} {effectiveBedNo !== "—" ? `- Bed ${effectiveBedNo}` : ""}</strong></span>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit Details"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Aadhaar KYC Card with FIXED Non-Cramped UI */}
                    <div className="w-full p-3.5 rounded-xl border bg-muted/15 text-left space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Aadhaar KYC</span>
                        {isKycDone ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] font-semibold">
                            Verified ✓
                          </Badge>
                        ) : isKycRequested ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 text-[10px] font-semibold">
                            Dispatched ⏳
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] font-semibold">
                            Pending
                          </Badge>
                        )}
                      </div>

                      {isKycDone ? (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verified via DigiLocker e-KYC
                        </p>
                      ) : isKycRequested ? (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] text-muted-foreground">
                            Verification link was dispatched via WhatsApp. Click below if you need to resend it.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white dark:bg-slate-900 border-blue-300 rounded-lg shadow-2xs gap-1.5"
                            onClick={handleRequestKyc}
                            disabled={requestKycMut.isPending}
                          >
                            {requestKycMut.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            Resend WhatsApp KYC Link
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs gap-1.5"
                            onClick={handleRequestKyc}
                            disabled={requestKycMut.isPending}
                          >
                            {requestKycMut.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            Send WhatsApp KYC Link
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* RENTING SUMMARY CARD (EXACT RENTOK MATCH) */}
                    <div className="w-full p-4 rounded-xl border bg-card text-left space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-foreground">Renting Summary</span>
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit Renting Details"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date Of Joining</span>
                          <span className="font-semibold text-foreground">
                            {formatDateText(form.joiningDate || tenant.joiningDate || tenant.moveInDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Move Out Date</span>
                          <span className="font-semibold text-foreground">
                            {formatDateText(form.expectedMoveOutDate || tenant.expectedMoveOutDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{stayDuration.label}</span>
                          <span className="font-bold text-teal-700 dark:text-teal-400">
                            {stayDuration.text}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Rent Amount</span>
                          <span className="font-bold text-foreground">
                            {form.monthlyRent || tenant.monthlyRent
                              ? `₹${Number(form.monthlyRent || tenant.monthlyRent).toLocaleString("en-IN")}`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Add Rent On</span>
                          <span className="font-semibold text-foreground">
                            {form.rentDueDate || tenant.rentDueDate
                              ? `${form.rentDueDate || tenant.rentDueDate}st of every month`
                              : "1st of every month"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Rent Cycle & Dues Card */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/15 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Next Rent Cycle</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      onClick={() => {
                        setPaymentForm((p) => ({
                          ...p,
                          amountPaid: Number(form.monthlyRent || tenant.monthlyRent || rent || 0),
                        }));
                        setRecordPaymentOpen(true);
                      }}
                    >
                      + Record
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deposit Held</span>
                      <span className="font-bold text-foreground">
                        {form.securityDeposit || tenant.securityDeposit
                          ? `₹${Number(form.securityDeposit || tenant.securityDeposit).toLocaleString("en-IN")}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Next Due Date</span>
                      <span className="font-semibold text-foreground">{duesLabel}</span>
                    </div>
                    {phone && (
                      <Button className="w-full h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 rounded-lg shadow-2xs mt-2" asChild>
                        <a
                          href={`https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(
                            `Hi ${name}, this is a friendly reminder that your rent of ₹${form.monthlyRent || tenant.monthlyRent} for room ${roomNo} is due on ${duesLabel}. Please clear it. Thank you!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Send Rent Due Reminder
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column (All Editable Sections & Payments) - Span 8 */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* STICKY INLINE EDIT MODE BANNER */}
                {editing && (
                  <div className="sticky top-2 z-30 flex items-center justify-between p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 backdrop-blur-md shadow-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Pencil className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-teal-950 dark:text-teal-100">
                          Inline Edit Mode Active
                        </h4>
                        <p className="text-[11px] text-teal-700 dark:text-teal-300">
                          Edit every field directly on this page below, then click Save.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium"
                        onClick={handleCancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-xs"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECTION 1: RENTING DETAILS (MATCHING RENTOK SCREENSHOT) */}
                <details className="group border rounded-xl bg-card overflow-hidden shadow-xs" open>
                  <summary className="flex justify-between items-center p-4 font-bold text-sm cursor-pointer hover:bg-muted/30 select-none border-b bg-muted/15">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4.5 w-4.5 text-primary" />
                      <span>Renting Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-card">
                    {/* PG Hierarchy Fields */}
                    {editing ? (
                      <EditField label="PG Name">
                        <Input value={currentPropertyName} disabled className="bg-muted text-xs font-medium" />
                      </EditField>
                    ) : (
                      <DetailRow label="PG Name" value={currentPropertyName} />
                    )}

                    {editing ? (
                      <EditField label="Block">
                        <Input value={effectiveBlock} disabled className="bg-muted text-xs font-medium" />
                      </EditField>
                    ) : (
                      <DetailRow label="Block" value={effectiveBlock} />
                    )}

                    {editing ? (
                      <EditField label="Floor">
                        <Input value={effectiveFloor} disabled className="bg-muted text-xs font-medium" />
                      </EditField>
                    ) : (
                      <DetailRow label="Floor" value={effectiveFloor} />
                    )}

                    {editing ? (
                      <EditField label="Room Number">
                        <Input value={effectiveRoomNo} disabled className="bg-muted text-xs font-medium" />
                      </EditField>
                    ) : (
                      <DetailRow label="Room Number" value={effectiveRoomNo} />
                    )}

                    {editing ? (
                      <EditField label="Bed Number">
                        <Input value={effectiveBedNo} disabled className="bg-muted text-xs font-medium" />
                      </EditField>
                    ) : (
                      <DetailRow label="Bed Number" value={effectiveBedNo} />
                    )}

                    {/* Renting Parameters */}
                    {editing ? (
                      <EditField label="Full Name">
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Tenant's full name"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Full Name" value={form.name || name} />
                    )}

                    {editing ? (
                      <EditField label="Fixed Monthly Rent (₹)">
                        <Input
                          type="number"
                          value={form.monthlyRent}
                          onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. 12000"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Fixed Rent"
                        value={form.monthlyRent ? `₹${Number(form.monthlyRent).toLocaleString("en-IN")}` : "—"}
                      />
                    )}

                    {editing ? (
                      <EditField label="Add Rent On (Cycle Day: 1-31)">
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={form.rentDueDate}
                          onChange={(e) => setForm({ ...form, rentDueDate: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="1"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Add Rent On"
                        value={`${form.rentDueDate || "1"}st of every cycle`}
                      />
                    )}

                    {editing ? (
                      <EditField label="Rental Frequency">
                        <select
                          aria-label="Rental Frequency"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.rentalFrequency}
                          onChange={(e) => setForm({ ...form, rentalFrequency: e.target.value })}
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half-Yearly">Half-Yearly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </EditField>
                    ) : (
                      <DetailRow label="Rental Frequency" value={form.rentalFrequency || "Monthly"} />
                    )}

                    {editing ? (
                      <EditField label="Stay Type">
                        <select
                          aria-label="Stay Type"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.stayType}
                          onChange={(e) => setForm({ ...form, stayType: e.target.value })}
                        >
                          <option value="Long Stay">Long Stay</option>
                          <option value="Short Stay">Short Stay</option>
                          <option value="Daily">Daily</option>
                        </select>
                      </EditField>
                    ) : (
                      <DetailRow label="Stay Type" value={form.stayType || "Long Stay"} />
                    )}

                    {editing ? (
                      <EditField label="Lock-in Period (Months)">
                        <Input
                          type="number"
                          value={form.lockinPeriodMonths}
                          onChange={(e) => setForm({ ...form, lockinPeriodMonths: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="0"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Lockin Period (Months)" value={form.lockinPeriodMonths || "0"} />
                    )}

                    {editing ? (
                      <EditField label="Security Deposit (₹)">
                        <Input
                          type="number"
                          value={form.securityDeposit}
                          onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. 15000"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Security Deposit"
                        value={form.securityDeposit ? `₹${Number(form.securityDeposit).toLocaleString("en-IN")}` : "—"}
                      />
                    )}

                    {editing ? (
                      <EditField label="Renting Type">
                        <Input
                          value={form.rentingType}
                          onChange={(e) => setForm({ ...form, rentingType: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Bed / Private Room"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Renting Type" value={form.rentingType || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Date Of Joining / Move-in">
                        <Input
                          type="date"
                          value={form.joiningDate}
                          onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Date Of Joining"
                        value={formatDateText(form.joiningDate || tenant.joiningDate || tenant.moveInDate)}
                      />
                    )}

                    {editing ? (
                      <EditField label="Expected Move Out Date">
                        <Input
                          type="date"
                          value={form.expectedMoveOutDate}
                          onChange={(e) => setForm({ ...form, expectedMoveOutDate: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Move Out Date"
                        value={formatDateText(form.expectedMoveOutDate || tenant.expectedMoveOutDate)}
                      />
                    )}

                    {/* Staying Since duration */}
                    <DetailRow label={stayDuration.label} value={<span className="text-teal-700 dark:text-teal-400 font-bold">{stayDuration.text}</span>} />

                    {editing ? (
                      <EditField label="Notice Period (Days)">
                        <Input
                          type="number"
                          value={form.noticePeriodDays}
                          onChange={(e) => setForm({ ...form, noticePeriodDays: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="30"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Notice Period (Days)" value={`${form.noticePeriodDays || "30"} Days`} />
                    )}

                    {editing ? (
                      <EditField label="Agreement Period (Months)">
                        <Input
                          type="number"
                          value={form.agreementPeriodMonths}
                          onChange={(e) => setForm({ ...form, agreementPeriodMonths: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="11"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Agreement Period (Months)" value={form.agreementPeriodMonths || "0"} />
                    )}

                    {editing ? (
                      <EditField label="Invoicing Starts Date">
                        <Input
                          type="date"
                          value={form.billingStartDate}
                          onChange={(e) => setForm({ ...form, billingStartDate: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Invoicing Starts Date"
                        value={form.billingStartDate ? formatDateText(form.billingStartDate) : "Same as Move-in"}
                      />
                    )}

                    {editing ? (
                      <EditField label="Grace Period (Days)">
                        <Input
                          type="number"
                          min="0"
                          value={form.gracePeriodDays}
                          onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="0"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Grace Period"
                        value={`${form.gracePeriodDays || "0"} Days`}
                      />
                    )}

                    {editing ? (
                      <EditField label="Rent Invoicing Control">
                        <div className="flex items-center gap-2 pt-1.5">
                          <Switch
                            id="rentDisabledToggle"
                            checked={!form.rentDisabled}
                            onCheckedChange={(checked) => setForm({ ...form, rentDisabled: !checked })}
                          />
                          <Label htmlFor="rentDisabledToggle" className="text-xs font-semibold cursor-pointer">
                            {!form.rentDisabled ? "Invoicing Active" : "Invoicing Suppressed / Paused"}
                          </Label>
                        </div>
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Invoicing Status"
                        value={
                          form.rentDisabled ? (
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                              Suppressed / Paused
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                              Active Auto-Invoicing
                            </Badge>
                          )
                        }
                      />
                    )}

                    {editing ? (
                      <EditField label="Referred By">
                        <Input
                          value={form.referredBy}
                          onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Friend, Agent, or Portal"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Referred By" value={form.referredBy || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Booked By">
                        <Input
                          value={form.bookedBy}
                          onChange={(e) => setForm({ ...form, bookedBy: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Manager name"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Booked By" value={form.bookedBy || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Checkin Time">
                        <Input
                          value={form.checkinTime}
                          onChange={(e) => setForm({ ...form, checkinTime: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. 11:00 AM"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Checkin Time" value={form.checkinTime || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Checkout Time">
                        <Input
                          value={form.checkoutTime}
                          onChange={(e) => setForm({ ...form, checkoutTime: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. 12:00 PM"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Checkout Time" value={form.checkoutTime || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Last Meter Reading">
                        <Input
                          value={form.lastMeterReading}
                          onChange={(e) => setForm({ ...form, lastMeterReading: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. 1420"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Last Meter Reading" value={form.lastMeterReading || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Last Reading Date">
                        <Input
                          type="date"
                          value={form.lastReadingDate}
                          onChange={(e) => setForm({ ...form, lastReadingDate: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Last Reading Date" value={formatDateText(form.lastReadingDate)} />
                    )}

                    {/* Toggles */}
                    {editing ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                        <div>
                          <Label className="text-xs font-semibold cursor-pointer">Collect Online Payments</Label>
                          <p className="text-[10px] text-muted-foreground">Allow UPI/Netbanking payments</p>
                        </div>
                        <Switch
                          checked={form.collectOnlinePayments}
                          onCheckedChange={(checked) => setForm({ ...form, collectOnlinePayments: checked })}
                        />
                      </div>
                    ) : (
                      <DetailRow
                        label="Collect Online Payments"
                        value={form.collectOnlinePayments ? "Yes ✓" : "No ✗"}
                      />
                    )}

                    {editing ? (
                      <div className="space-y-2 p-2.5 rounded-lg border bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-semibold cursor-pointer">GST Applicable</Label>
                            <p className="text-[10px] text-muted-foreground">Tax charges applied on rent</p>
                          </div>
                          <Switch
                            checked={form.gstApplicable}
                            onCheckedChange={(checked) => setForm({ ...form, gstApplicable: checked })}
                          />
                        </div>
                        {form.gstApplicable && (
                          <div className="space-y-1 pt-1">
                            <Label className="text-[10px]">GST Percentage (%)</Label>
                            <Input
                              type="number"
                              value={form.gstPercentage}
                              onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                              className="h-8 text-xs"
                              placeholder="18"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <DetailRow
                        label="GST Applicable"
                        value={form.gstApplicable ? `Yes (${form.gstPercentage}%) ✓` : "No ✗"}
                      />
                    )}

                    <DetailRow
                      label="Tenant Added On"
                      value={formatDateText(tenant.createdAt)}
                    />
                  </div>
                </details>

                {/* SECTION 2: TENANT PERSONAL DETAILS */}
                <details className="group border rounded-xl bg-card overflow-hidden shadow-xs" open>
                  <summary className="flex justify-between items-center p-4 font-bold text-sm cursor-pointer hover:bg-muted/30 select-none border-b bg-muted/15">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4.5 w-4.5 text-primary" />
                      <span>Tenant Personal Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-card">
                    {editing ? (
                      <EditField label="Remarks">
                        <Input
                          value={form.remarks}
                          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Special remarks or notes"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Remarks" value={form.remarks || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Permanent Address">
                        <Input
                          value={form.permanentAddress}
                          onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="House, Street, City, State, PIN"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Permanent Address"
                        value={
                          form.permanentAddress ||
                          (tenant as any).personalDetails?.permanentAddress ||
                          (tenant as any).tenant?.personalDetails?.permanentAddress ||
                          (tenant as any).permanentAddress ||
                          (tenant as any).tenant?.permanentAddress ||
                          (tenant as any).address ||
                          (tenant as any).tenant?.address ||
                          (tenant as any).personalDetails?.address ||
                          "—"
                        }
                      />
                    )}

                    {editing ? (
                      <EditField label="Contact Number (Mobile) *">
                        <Input
                          value={form.mobileNumber}
                          onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="10-digit mobile"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Contact Number" value={phone} />
                    )}

                    {editing ? (
                      <EditField label="Current Address">
                        <Input
                          value={form.currentAddress}
                          onChange={(e) => setForm({ ...form, currentAddress: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Local city address"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Current Address" value={form.currentAddress || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Alternate Number">
                        <Input
                          value={form.alternatePhone}
                          onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Alternate phone"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Alternate Number" value={form.alternatePhone || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Nationality">
                        <Input
                          value={form.nationality}
                          onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Indian"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Nationality" value={form.nationality || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Email Address">
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="tenant@example.com"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Email" value={form.email || tenant.email || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Work / College Address">
                        <Input
                          value={form.workAddress}
                          onChange={(e) => setForm({ ...form, workAddress: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Company or College name & address"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Work / College Address" value={form.workAddress || tenant.workAddress || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Date Of Birth">
                        <Input
                          type="date"
                          value={form.dob}
                          onChange={(e) => setForm({ ...form, dob: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </EditField>
                    ) : (
                      <DetailRow
                        label="Date Of Birth"
                        value={formatDateText(
                          form.dob ||
                          (tenant as any).personalDetails?.dob ||
                          (tenant as any).tenant?.personalDetails?.dob ||
                          (tenant as any).dob ||
                          (tenant as any).tenant?.dob ||
                          (tenant as any).dateOfBirth ||
                          (tenant as any).tenant?.dateOfBirth ||
                          (tenant as any).kycInfo?.dob ||
                          (tenant as any).kyc?.dob
                        )}
                      />
                    )}

                    {editing ? (
                      <EditField label="Govt. ID / Aadhaar Number">
                        <Input
                          value={form.govtIdNumber}
                          onChange={(e) => setForm({ ...form, govtIdNumber: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="12-digit Aadhaar / Passport"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Govt. ID / Aadhaar" value={form.govtIdNumber || (tenant as any).aadhaarNumber || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Gender">
                        <select
                          aria-label="Gender"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.gender}
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </EditField>
                    ) : (
                      <DetailRow label="Gender" value={form.gender || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Food Preferences">
                        <Input
                          value={form.foodPreference}
                          onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Veg, Non-Veg, Jain"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Food Preferences" value={form.foodPreference || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Tenant Type">
                        <select
                          aria-label="Tenant Type"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.tenantType}
                          onChange={(e) => setForm({ ...form, tenantType: e.target.value })}
                        >
                          <option value="Student">Student</option>
                          <option value="Working Professional">Working Professional</option>
                          <option value="Other">Other</option>
                        </select>
                      </EditField>
                    ) : (
                      <DetailRow label="Tenant Type" value={form.tenantType || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Emergency Contact">
                        <Input
                          value={form.emergencyContact}
                          onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="Name & phone"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Emergency Contact" value={form.emergencyContact || tenant.emergencyContact || "—"} />
                    )}

                    {editing ? (
                      <EditField label="Blood Group">
                        <Input
                          value={form.bloodGroup}
                          onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                          className="h-9 text-xs"
                          placeholder="e.g. B+, O+, AB+"
                        />
                      </EditField>
                    ) : (
                      <DetailRow label="Blood Group" value={form.bloodGroup || "—"} />
                    )}
                  </div>
                </details>

                {/* SECTION 3: GUARDIAN & PARENT DETAILS */}
                <details className="group border rounded-xl bg-card overflow-hidden shadow-xs">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none border-b bg-muted/15">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span>Guardian & Parent Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="p-4 bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {editing ? (
                        <EditField label="Father Name">
                          <Input
                            value={form.fatherName}
                            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Father's full name"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Father Name" value={form.fatherName || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Mother Contact">
                          <Input
                            value={form.motherPhone}
                            onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Mother's phone"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Mother Contact" value={form.motherPhone || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Father Contact">
                          <Input
                            value={form.fatherPhone}
                            onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Father's phone"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Father Contact" value={form.fatherPhone || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Local Guardian Name">
                          <Input
                            value={form.guardianName}
                            onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Guardian's name"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Local Guardian Name" value={form.guardianName || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Father Occupation">
                          <Input
                            value={form.fatherOccupation}
                            onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. Businessman"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Father Occupation" value={form.fatherOccupation || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Local Guardian Phone">
                          <Input
                            value={form.guardianPhone}
                            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Guardian's phone"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Local Guardian Phone" value={form.guardianPhone || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Mother Name">
                          <Input
                            value={form.motherName}
                            onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Mother's full name"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Mother Name" value={form.motherName || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Local Guardian Address" className="sm:col-span-2">
                          <Input
                            value={form.guardianAddress}
                            onChange={(e) => setForm({ ...form, guardianAddress: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Guardian's local residence address"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Local Guardian Address" value={form.guardianAddress || "—"} />
                      )}
                    </div>
                  </div>
                </details>

                {/* SECTION 4: GST DETAILS */}
                <details className="group border rounded-xl bg-card overflow-hidden shadow-xs">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none border-b bg-muted/15">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>GST Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="p-4 bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {editing ? (
                        <EditField label="GST Number (GSTIN)">
                          <Input
                            value={form.gstNumber}
                            onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. 07AAAAA0000A1Z5"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="GST Number" value={form.gstNumber || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Business Owner Name">
                          <Input
                            value={form.businessOwnerName}
                            onChange={(e) => setForm({ ...form, businessOwnerName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Owner name"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Business Owner Name" value={form.businessOwnerName || "—"} />
                      )}

                      {editing ? (
                        <EditField label="PAN Number">
                          <Input
                            value={form.panNumber}
                            onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. ABCDE1234F"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="PAN Number" value={form.panNumber || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Company Address">
                          <Input
                            value={form.companyAddress}
                            onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Official billing address"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Company Address" value={form.companyAddress || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Company Name" className="sm:col-span-2">
                          <Input
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Registered business name"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Company Name" value={form.companyName || "—"} />
                      )}
                    </div>
                  </div>
                </details>

                {/* SECTION 5: BANK DETAILS */}
                <details className="group border rounded-xl bg-card overflow-hidden shadow-xs">
                  <summary className="flex justify-between items-center p-4 font-semibold text-sm cursor-pointer hover:bg-muted/30 select-none border-b bg-muted/15">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Bank Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="p-4 bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {editing ? (
                        <EditField label="Bank Name" className="sm:col-span-2">
                          <Input
                            value={form.bankName}
                            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. HDFC Bank, SBI, ICICI"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Bank Name" value={form.bankName || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Bank Holder Name" className="sm:col-span-2">
                          <Input
                            value={form.accountHolderName}
                            onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Name on bank passbook"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Bank Holder Name" value={form.accountHolderName || name || "—"} />
                      )}

                      {editing ? (
                        <EditField label="Account Number">
                          <Input
                            value={form.accountNumber}
                            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="Bank account number"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="Account Number" value={form.accountNumber || "—"} />
                      )}

                      {editing ? (
                        <EditField label="IFSC Code">
                          <Input
                            value={form.ifscCode}
                            onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. HDFC0001234"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="IFSC Code" value={form.ifscCode || "—"} />
                      )}

                      {editing ? (
                        <EditField label="UPI ID (VPA)" className="sm:col-span-2">
                          <Input
                            value={form.upiId}
                            onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                            className="h-9 text-xs"
                            placeholder="e.g. name@okhdfcbank"
                          />
                        </EditField>
                      ) : (
                        <DetailRow label="UPI ID" value={form.upiId || "—"} />
                      )}
                    </div>
                  </div>
                </details>

                {/* SECTION 6: RECENT PAYMENTS */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/15 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold">Recent Payments</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      onClick={() => {
                        setPaymentForm((p) => ({
                          ...p,
                          amountPaid: Number(form.monthlyRent || tenant.monthlyRent || rent || 0),
                        }));
                        setRecordPaymentOpen(true);
                      }}
                    >
                      + Record
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    {((tenant as any).recentPayments && (tenant as any).recentPayments.length > 0) ? (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {(tenant as any).recentPayments.map((pay: any, pIdx: number) => {
                          const payAmount = Number(pay.amount || pay.amountPaid || pay.amount_paid || 0);
                          const payDate = pay.paidAt || pay.paid_at || pay.createdAt || pay.created_at;
                          const method = pay.paymentMethod || pay.payment_method || "Payment";
                          let noteText = "";
                          if (typeof pay.notes === "string" && pay.notes.startsWith("{")) {
                            try {
                              const parsed = JSON.parse(pay.notes);
                              noteText = parsed.notes || "";
                            } catch(e) {}
                          } else if (typeof pay.notes === "string") {
                            noteText = pay.notes;
                          }
                          return (
                            <div key={pay.id || pIdx} className="flex items-center gap-3 p-2.5 rounded-lg border bg-emerald-50/20 dark:bg-emerald-950/10">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {noteText || pay.dueType || `Rent via ${String(method).toUpperCase()}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {payDate ? formatDateText(payDate) : "Recently"}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  +₹{payAmount.toLocaleString("en-IN")}
                                </p>
                                <Badge variant="outline" className="text-[9px] py-0 border-emerald-300 text-emerald-700 uppercase">
                                  {pay.status || "Paid"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <IndianRupee className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground mb-3">No payment records yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-teal-600 border-teal-600 hover:bg-teal-50 gap-1.5"
                          onClick={() => {
                            setPaymentForm((p) => ({
                              ...p,
                              amountPaid: Number(tenant.monthlyRent || rent || 0),
                            }));
                            setRecordPaymentOpen(true);
                          }}
                        >
                          <IndianRupee className="h-3.5 w-3.5" /> Record Payment
                        </Button>
                      </div>
                    )}
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
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-xs"
                      onClick={() => {
                        setPaymentForm((p) => ({
                          ...p,
                          amountPaid: Number(tenant.monthlyRent || rent || 0),
                        }));
                        setRecordPaymentOpen(true);
                      }}
                    >
                      <IndianRupee className="h-4 w-4" /> Collect Rent / Mark Paid
                    </Button>
                    {phone && (
                      <Button variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-2" asChild>
                        <a href={waLink(phone) || "#"} target="_blank" rel="noreferrer">
                          <MessageCircle className="h-4 w-4" /> Remind via WhatsApp
                        </a>
                      </Button>
                    )}
                    {!isKycDone && (
                      <Button
                        variant="outline"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 gap-2"
                        onClick={handleRequestKyc}
                        disabled={requestKycMut.isPending}
                      >
                        {requestKycMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {isKycRequested ? "Resend KYC Link" : "Request KYC Verification"}
                      </Button>
                    )}
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
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-11"
                onClick={() => {
                  setPaymentForm((p) => ({
                    ...p,
                    amountPaid: Number(tenant.monthlyRent || rent || 0),
                  }));
                  setRecordPaymentOpen(true);
                }}
              >
                <IndianRupee className="h-4 w-4 mr-2" /> Collect rent
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: ELECTRICITY DUES */}
          <TabsContent value="electricity" className="mt-6 space-y-4">
            <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b bg-muted/10">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Electricity Meter Readings & Dues
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Record sub-meter units and automatically calculate monthly billing dues.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8 shrink-0 self-start sm:self-auto"
                  onClick={() => setElectricityOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Meter Reading
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isElectricityLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    <span className="text-xs text-muted-foreground">Loading electricity readings...</span>
                  </div>
                ) : electricityDuesList.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center mx-auto">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">No electricity readings recorded yet</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Log initial and monthly sub-meter readings to automatically generate electricity dues.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8 mt-2"
                      onClick={() => setElectricityOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add First Reading
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="py-3 px-4">Billing Month / Date</TableHead>
                          <TableHead className="py-3 px-4">Readings (Prev → Curr)</TableHead>
                          <TableHead className="py-3 px-4">Units Consumed</TableHead>
                          <TableHead className="py-3 px-4">Rate / Unit</TableHead>
                          <TableHead className="py-3 px-4">Total Dues</TableHead>
                          <TableHead className="py-3 px-4">Status</TableHead>
                          <TableHead className="py-3 px-4 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {electricityDuesList.map((due: any) => {
                          const prev = Number(due.initialReading ?? due.previousReading ?? 0);
                          const curr = Number(due.finalReading ?? due.currentReading ?? 0);
                          const units = Number(due.unitsConsumed ?? Math.max(0, curr - prev));
                          const rate = Number(due.amountPerUnit ?? due.ratePerUnit ?? 10);
                          const total = Number(due.totalAmount ?? (units * rate));
                          const dateStr = due.finalReadingDate || due.readingDate || due.createdAt;
                          return (
                            <TableRow key={due.id} className="hover:bg-muted/10 transition-colors">
                              <TableCell className="py-3 px-4 font-semibold text-xs whitespace-nowrap">
                                {dateStr
                                  ? new Date(dateStr).toLocaleDateString("en-IN", {
                                      month: "short",
                                      year: "numeric",
                                      day: "numeric",
                                    })
                                  : `Month ${due.billingMonth || 1}/${due.billingYear || 2026}`}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                                {prev} → {curr}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-xs font-semibold whitespace-nowrap">
                                {units.toFixed(1)} kWh
                              </TableCell>
                              <TableCell className="py-3 px-4 text-xs whitespace-nowrap">
                                ₹{rate}/unit
                              </TableCell>
                              <TableCell className="py-3 px-4 text-xs font-bold text-teal-600 whitespace-nowrap">
                                ₹{total.toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap">
                                {due.isPaid ? (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                    Paid ✓
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Unpaid
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    try {
                                      await deleteElectricityMut.mutateAsync(due.id);
                                      toast({ title: "Reading deleted successfully" });
                                    } catch (e: any) {
                                      toast({ title: "Failed to delete reading", description: e?.message, variant: "destructive" });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: NOTICE PERIOD */}
          <TabsContent value="notice" className="mt-6 space-y-4">
            <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b bg-muted/15 p-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600" /> Notice Period & Checkout Management
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Track tenant move-out intentions, calculate checkout settlement, and schedule bed vacancy.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {stayStatus === "MOVED_OUT" ? (
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/30 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5 text-slate-600" /> Tenancy Completed & Moved Out
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Tenant vacated on <strong>{tenantMoveOutDate(tenant) ? formatDateText(tenantMoveOutDate(tenant)) : "Recorded date"}</strong>. Room bed has been freed and automatic rent invoices have been stopped.
                    </p>
                  </div>
                ) : hasActiveNotice ? (
                  <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Move-Out Notice Active
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Notice Given On:{" "}
                          <span className="font-semibold">
                            {noticeStartDate ? formatDateText(noticeStartDate) : "Recently"}
                          </span>
                          {" "}• Expected Move-Out:{" "}
                          <span className="font-bold underline">
                            {noticeVacateDate ? formatDateText(noticeVacateDate) : "Scheduled"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0 text-xs font-semibold"
                          onClick={handleConfirmCancelNotice}
                          disabled={cancelNoticeMut.isPending}
                        >
                          {cancelNoticeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                          Cancel Notice
                        </Button>
                        <Button
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shrink-0 text-xs shadow-xs"
                          onClick={handleOpenMoveOutModal}
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Complete Move-Out
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border p-5 rounded-xl bg-muted/20">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">No Active Notice</p>
                      <p className="text-xs text-muted-foreground">
                        Tenant is currently in active stay. When the tenant submits a 30-day move-out notice, record it here to schedule checkout.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0"
                        onClick={() => {
                          if (!subAccess.canTrackNotice) {
                            setGateFeature("Notice Period Tracking");
                            setGateModalOpen(true);
                          } else {
                            setNoticeOpen(true);
                          }
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" /> Set Move-Out Notice
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-600 hover:bg-rose-50 gap-1.5 shrink-0 text-xs font-semibold"
                        onClick={handleOpenMoveOutModal}
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Direct Move-Out
                      </Button>
                    </div>
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



        {/* RECORD MANUAL PAYMENT MODAL */}
        <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <IndianRupee className="h-5 w-5 text-teal-600" />
                Collect Rent / Mark Payment Done
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record offline or direct payment received from {name} (Room {roomNo}, Bed {bedNo}).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordManualPayment} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amount Paid (₹) *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={paymentForm.amountPaid || ""}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amountPaid: Number(e.target.value) }))}
                  required
                  className="font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm((p) => ({ ...p, paymentMethod: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI (GPay / PhonePe / Paytm)</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Net Banking / IMPS / NEFT</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Billing Period</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Select
                      value={String(paymentForm.periodMonth)}
                      onValueChange={(val) => setPaymentForm((p) => ({ ...p, periodMonth: Number(val) }))}
                    >
                      <SelectTrigger className="h-9 text-xs px-2">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {new Date(2026, m - 1).toLocaleString("default", { month: "short" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={String(paymentForm.periodYear)}
                      onValueChange={(val) => setPaymentForm((p) => ({ ...p, periodYear: Number(val) }))}
                    >
                      <SelectTrigger className="h-9 text-xs px-2">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2025, 2026, 2027].map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reference / Transaction ID (Optional)</Label>
                <Input
                  placeholder="e.g. UPI Ref / Bank UTR / Cheque No"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Remarks / Notes (Optional)</Label>
                <Input
                  placeholder="e.g. Received via cash at desk"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordPaymentOpen(false)}
                  disabled={postManualRentMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                  disabled={postManualRentMut.isPending}
                >
                  {postManualRentMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Confirm Payment
                </Button>
              </DialogFooter>
            </form>
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

        {/* MODAL: VACATE / MOVE-OUT */}
        <Dialog open={moveOutModalOpen} onOpenChange={setMoveOutModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-rose-600">
                <UserMinus className="h-5 w-5" /> Complete Move-Out & Free Bed
              </DialogTitle>
              <DialogDescription className="text-xs">
                Check out <strong className="text-foreground">{name}</strong> and release bed allocation. Recurring rent invoices will be halted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Move-Out / Vacate Date *</Label>
                <Input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Exit Reason / Notes (Optional)</Label>
                <Textarea
                  value={moveOutReason}
                  onChange={(e) => setMoveOutReason(e.target.value)}
                  placeholder="e.g. Job change, tenancy completed, personal reasons"
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Remarks (Optional)</Label>
                <Input
                  value={moveOutRemarks}
                  onChange={(e) => setMoveOutRemarks(e.target.value)}
                  placeholder="e.g. Deposit refunded, keys handed over"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Completing move-out immediately transitions this tenant stay to MOVED_OUT, frees the bed for new allocations, and halts recurring rent invoicing. Historical payment records remain intact.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setMoveOutModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
                onClick={handleConfirmMoveOut}
                disabled={moveOutMut.isPending}
              >
                {moveOutMut.isPending ? "Processing..." : "Confirm Move-Out & Free Bed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TrialExpiredGateModal
          open={gateModalOpen}
          onOpenChange={setGateModalOpen}
          featureName={gateFeature}
        />

        <TenantActivityLogsDrawer
          open={activityDrawerOpen}
          onOpenChange={setActivityDrawerOpen}
          tenant={tenant}
          propertyId={currentPropertyId}
        />

        {currentPropertyId && roomTenantId && (
          <SharePaymentLinkDialog
            open={paymentLinkOpen}
            onOpenChange={setPaymentLinkOpen}
            propertyId={currentPropertyId}
            roomTenantId={roomTenantId}
            tenantName={tenant?.name}
            roomNumber={tenant?.roomNumber || (tenant as any)?.room_number}
            phone={tenant?.mobileNumber || tenant?.phone}
          />
        )}
      </div>
    </CanAccessPage>
  );
}
