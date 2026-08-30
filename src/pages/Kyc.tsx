import { useState } from "react";
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  FileText,
  Plus,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  Send,
  Download,
  ExternalLink,
  UserCheck,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import {
  useApproveKycMutation,
  useKycApplications,
  useKycDetail,
  useRejectKycMutation,
  useCreditBalance,
  useCreditPacks,
  useCreateCreditTopupOrderMutation,
  useVerifyCreditPaymentMutation,
  useRequestTenantKycMutation,
  usePropertyAgreements,
  useCreateAgreementMutation,
  useSendAgreementEsignMutation,
  usePropertyTenants,
} from "@/hooks/usePropertyOwnerQueries";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function Kyc() {
  const { selectedPgId: currentPropertyId, properties: propertyList } = useApp();
  const [activeTab, setActiveTab] = useState("kyc");

  // KYC Queries & Mutations
  const { data: kycRows = [], isLoading: isKycLoading, refetch: refetchKyc } = useKycApplications();
  const approveMut = useApproveKycMutation();
  const rejectMut = useRejectKycMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useKycDetail(detailId);
  const kycDetail = detailQuery.data as any;

  // Credit Balance & Topup
  const { data: balanceData, isLoading: isBalanceLoading } = useCreditBalance();
  const { data: packsData } = useCreditPacks();
  const topupOrderMut = useCreateCreditTopupOrderMutation();
  const verifyPaymentMut = useVerifyCreditPaymentMutation();
  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");

  // Request KYC Modal
  const [requestKycOpen, setRequestKycOpen] = useState(false);
  const [selectedTenantForKyc, setSelectedTenantForKyc] = useState<string>("");
  const requestKycMut = useRequestTenantKycMutation();
  const { data: tenantsData = [] } = usePropertyTenants(currentPropertyId);

  // Agreements Queries & Mutations
  const { data: agreementsData, isLoading: isAgreementsLoading, refetch: refetchAgreements } =
    usePropertyAgreements(currentPropertyId);
  const createAgreementMut = useCreateAgreementMutation(currentPropertyId);
  const sendEsignMut = useSendAgreementEsignMutation(currentPropertyId ?? undefined);
  const [createAgreementOpen, setCreateAgreementOpen] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    roomTenantId: "",
    monthlyRent: 12000,
    securityDeposit: 15000,
    noticePeriodDays: 30,
    lockInPeriodMonths: 3,
    agreementStartDate: new Date().toISOString().split("T")[0],
    agreementEndDate: "",
    houseRules: "1. No loud music after 10 PM.\n2. Guests allowed until 8 PM.\n3. Keep common areas clean.",
  });

  const kycList = Array.isArray(kycRows) ? (kycRows as Record<string, any>[]) : [];
  const agreementsList = agreementsData?.agreements || [];
  const creditPacks = (Array.isArray(packsData) ? packsData : packsData?.creditPacks) || [];

  // Top-up Razorpay Checkout
  const handleTopupCheckout = async (packId: string) => {
    try {
      const order = await topupOrderMut.mutateAsync(packId);
      if (!window.Razorpay) {
        // Load Razorpay SDK script dynamically if not present
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const options = {
        key: order.keyId || "rzp_test_TUV3u84h3zOyxB",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "PG Ease",
        description: "KYC & Verification Credits Top-up",
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              creditPackId: packId,
            });
            toast({
              title: "Credits Recharged! 🎉",
              description: "Your verification credits have been added to your balance.",
            });
            setTopupOpen(false);
          } catch (err: any) {
            toast({
              title: "Payment Verification Failed",
              description: err?.message || "Please contact support if amount was deducted.",
              variant: "destructive",
            });
          }
        },
        theme: { color: "#008080" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({
        title: "Failed to initiate top-up",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Request KYC Action
  const handleInitiateTenantKyc = async () => {
    if (!selectedTenantForKyc) {
      toast({ title: "Please select a tenant", variant: "destructive" });
      return;
    }
    try {
      const res = await requestKycMut.mutateAsync(selectedTenantForKyc);
      toast({
        title: "KYC Request Dispatched! 🚀",
        description: "Aadhaar DigiLocker verification link sent to tenant via WhatsApp.",
      });
      setRequestKycOpen(false);
      setSelectedTenantForKyc("");
    } catch (err: any) {
      toast({
        title: "Failed to request KYC",
        description: err?.message || "Insufficient credits or invalid tenant.",
        variant: "destructive",
      });
    }
  };

  // Create Agreement Action
  const handleCreateAgreement = async () => {
    if (!agreementForm.roomTenantId) {
      toast({ title: "Select a tenant", variant: "destructive" });
      return;
    }
    try {
      const rules = agreementForm.houseRules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      await createAgreementMut.mutateAsync({
        roomTenantId: agreementForm.roomTenantId,
        monthlyRent: Number(agreementForm.monthlyRent),
        securityDeposit: Number(agreementForm.securityDeposit),
        noticePeriodDays: Number(agreementForm.noticePeriodDays),
        lockInPeriodMonths: Number(agreementForm.lockInPeriodMonths),
        agreementStartDate: agreementForm.agreementStartDate,
        agreementEndDate: agreementForm.agreementEndDate || undefined,
        houseRules: rules,
      });

      toast({
        title: "Rental Agreement Created! 📝",
        description: "Digital agreement drafted and dispatched to tenant for DigiLocker eSign.",
      });
      setCreateAgreementOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to create agreement",
        description: err?.message || "Please check inputs.",
        variant: "destructive",
      });
    }
  };

  return (
    <CanAccessPage permission="kyc_view">
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header with Title & Quota Balance Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Verification & Legal Hub"
            description="Manage DigiLocker Aadhaar KYC, Digital Rental Agreements & Verification Quotas"
          />

          <div className="flex items-center gap-3">
            {/* Credit Balance Card */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-2 shadow-sm">
              <div className="p-2 bg-teal-500 text-white rounded-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Verification Credits</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {isBalanceLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <span>{balanceData?.remainingCredits ?? 5} Available</span>
                      {balanceData?.freeCreditsRemaining !== undefined && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {balanceData.freeCreditsRemaining} Free
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="ml-2 bg-teal-600 hover:bg-teal-700 text-white h-8 gap-1 shadow-sm"
                onClick={() => setTopupOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" /> Top-up
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs: KYC vs Agreements */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <TabsList className="grid w-full sm:w-[380px] grid-cols-2">
              <TabsTrigger value="kyc" className="gap-2">
                <UserCheck className="h-4 w-4" /> Aadhaar KYC
              </TabsTrigger>
              <TabsTrigger value="agreements" className="gap-2">
                <FileText className="h-4 w-4" /> Rental Agreements
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === "kyc" ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => refetchKyc()}>
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm"
                    onClick={() => setRequestKycOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Request Tenant KYC
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => refetchAgreements()}>
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm"
                    onClick={() => setCreateAgreementOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Create Digital Agreement
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* TAB 1: KYC APPLICATIONS */}
          <TabsContent value="kyc" className="mt-6 space-y-4">
            {isKycLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : kycList.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-3">
                    <UserCheck className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-base font-semibold">No Pending KYC Applications</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                    Send instant DigiLocker Aadhaar verification requests to your tenants with 1 click.
                  </p>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    onClick={() => setRequestKycOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Request Tenant KYC
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DataTableContainer>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tenant Details</TableHead>
                      <TableHead>DigiLocker Status</TableHead>
                      <TableHead>Aadhaar Verified</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList.map((row, i) => {
                      const id = row.id || row.roomTenantId || row.applicationId;
                      const status = (row.status || "pending").toLowerCase();
                      const isVerified = status === "completed" || status === "approved" || row.processing_done;

                      return (
                        <TableRow key={id || String(i)}>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {row.tenantName || row.name || row.tenant?.name || row.roomTenant?.tenant?.name || row.roomTenant?.name || "Tenant"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {row.mobileNumber || row.phone || row.tenant?.phone || row.roomTenant?.tenant?.phone || row.roomTenant?.phone || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isVerified ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1 border-0">
                                <CheckCircle2 className="h-3 w-3" /> Verified ✓
                              </Badge>
                            ) : status === "rejected" ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" /> Pending OTP
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.aadhaarNumber ? (
                              <span className="font-mono text-xs">XXXX-XXXX-{row.aadhaarNumber.slice(-4)}</span>
                            ) : isVerified ? (
                              <span className="text-xs text-emerald-600 font-medium">DigiLocker Match</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => setDetailId(id)}
                            >
                              View Details
                            </Button>
                            {!isVerified && (
                              <CanAccess permission="kyc_approve">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 text-xs"
                                  disabled={approveMut.isPending}
                                  onClick={async () => {
                                    await approveMut.mutateAsync(id);
                                    toast({ title: "KYC Application Approved ✓" });
                                  }}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" /> Approve
                                </Button>
                              </CanAccess>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DataTableContainer>
            )}
          </TabsContent>

          {/* TAB 2: DIGITAL RENTAL AGREEMENTS */}
          <TabsContent value="agreements" className="mt-6 space-y-4">
            {isAgreementsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : agreementsList.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-base font-semibold">No Rental Agreements Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                    Create legally binding digital agreements with Aadhaar eSign via Digio.
                  </p>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    onClick={() => setCreateAgreementOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Create Digital Agreement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DataTableContainer>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Tenant / Room</TableHead>
                      <TableHead>Rent & Deposit</TableHead>
                      <TableHead>Terms</TableHead>
                      <TableHead>Signing Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreementsList.map((ag) => {
                      const isSigned = ag.status === "signed";
                      return (
                        <TableRow key={ag.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{ag.tenantName}</div>
                            <div className="text-xs text-muted-foreground">
                              Room {ag.roomNumber} • {ag.tenantPhone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">₹{ag.monthlyRent.toLocaleString("en-IN")}/mo</div>
                            <div className="text-xs text-muted-foreground">
                              Deposit: ₹{ag.securityDeposit.toLocaleString("en-IN")}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div>Notice: {ag.noticePeriodDays} Days</div>
                            <div>Lock-in: {ag.lockInPeriodMonths} Months</div>
                          </TableCell>
                          <TableCell>
                            {isSigned ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1 border-0">
                                <CheckCircle2 className="h-3 w-3" /> Signed ✓
                              </Badge>
                            ) : ag.status === "sent_for_esign" ? (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 gap-1 border-0">
                                <Clock className="h-3 w-3" /> Sent for eSign
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {ag.signingDirectUrl && !isSigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs"
                                onClick={() => window.open(ag.signingDirectUrl, "_blank")}
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Sign Link
                              </Button>
                            )}
                            {ag.signedPdfUrl || ag.agreementPdfUrl ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs"
                                onClick={() => window.open(ag.signedPdfUrl || ag.agreementPdfUrl, "_blank")}
                              >
                                <Download className="h-3.5 w-3.5" /> PDF
                              </Button>
                            ) : null}
                            {!isSigned && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-teal-600 hover:bg-teal-700 text-white h-8 gap-1 text-xs"
                                disabled={sendEsignMut.isPending}
                                onClick={async () => {
                                  await sendEsignMut.mutateAsync(ag.id);
                                  toast({
                                    title: "eSign Link Dispatched! 📲",
                                    description: "WhatsApp agreement signing link re-sent to tenant.",
                                  });
                                }}
                              >
                                <Send className="h-3.5 w-3.5" /> Resend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DataTableContainer>
            )}
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: CREDIT TOP-UP MODAL */}
        <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-teal-600" /> Top-up Verification Credits
              </DialogTitle>
              <DialogDescription>
                Verification credits allow you to run instant DigiLocker Aadhaar KYC & generate digital agreements.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
              {creditPacks.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 shadow-sm"
                        : "border-border hover:border-teal-200 dark:hover:border-teal-800"
                    }`}
                  >
                    {pack.popular && (
                      <Badge className="absolute -top-2.5 right-3 bg-teal-600 text-white text-[10px]">
                        MOST POPULAR
                      </Badge>
                    )}
                    <div className="font-bold text-foreground text-base">{pack.name}</div>
                    <div className="text-2xl font-black text-teal-600 my-1">
                      {pack.credits} <span className="text-xs font-normal text-muted-foreground">Credits</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      ₹{pack.price.toLocaleString("en-IN")}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (₹{(pack.price / pack.credits).toFixed(0)}/credit)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex sm:justify-between items-center gap-3">
              <div className="text-xs text-muted-foreground">⚡ Instant recharge via Razorpay UPI / Cards</div>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-medium"
                disabled={!selectedPackId || topupOrderMut.isPending}
                onClick={() => handleTopupCheckout(selectedPackId)}
              >
                {topupOrderMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pay & Recharge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: REQUEST TENANT KYC MODAL */}
        <Dialog open={requestKycOpen} onOpenChange={setRequestKycOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-600" /> Request Tenant KYC
              </DialogTitle>
              <DialogDescription>
                Select an active tenant to send an Aadhaar verification request via DigiLocker.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select value={selectedTenantForKyc} onValueChange={setSelectedTenantForKyc}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tenant from your PG" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid}>
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"}) • {t.mobileNumber || t.phone}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> DigiLocker Aadhaar Verification
                </div>
                <p className="text-muted-foreground">
                  Consumes 1 credit. The tenant will receive an instant WhatsApp notification with the official DigiLocker OTP portal.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestKycOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                disabled={!selectedTenantForKyc || requestKycMut.isPending}
                onClick={handleInitiateTenantKyc}
              >
                {requestKycMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send KYC Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: CREATE DIGITAL AGREEMENT MODAL */}
        <Dialog open={createAgreementOpen} onOpenChange={setCreateAgreementOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" /> Create Digital Rental Agreement
              </DialogTitle>
              <DialogDescription>
                Draft a legally compliant rental agreement and dispatch for Aadhaar eSign.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select
                  value={agreementForm.roomTenantId}
                  onValueChange={(val) => setAgreementForm({ ...agreementForm, roomTenantId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tenant from your PG" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid}>
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Monthly Rent (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.monthlyRent}
                    onChange={(e) => setAgreementForm({ ...agreementForm, monthlyRent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.securityDeposit}
                    onChange={(e) => setAgreementForm({ ...agreementForm, securityDeposit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Notice Period (Days)</Label>
                  <Input
                    type="number"
                    value={agreementForm.noticePeriodDays}
                    onChange={(e) => setAgreementForm({ ...agreementForm, noticePeriodDays: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lock-in Period (Months)</Label>
                  <Input
                    type="number"
                    value={agreementForm.lockInPeriodMonths}
                    onChange={(e) => setAgreementForm({ ...agreementForm, lockInPeriodMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Agreement Start Date</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementStartDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementEndDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>House Rules & Terms</Label>
                <Textarea
                  rows={3}
                  value={agreementForm.houseRules}
                  onChange={(e) => setAgreementForm({ ...agreementForm, houseRules: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateAgreementOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                disabled={!agreementForm.roomTenantId || createAgreementMut.isPending}
                onClick={handleCreateAgreement}
              >
                {createAgreementMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Generate & Dispatch eSign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: VIEW KYC DETAILS MODAL */}
        <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" /> Aadhaar Verification Details
              </DialogTitle>
            </DialogHeader>
            {detailQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : detailQuery.data ? (
              <div className="space-y-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Full Name:</span>
                    <p className="font-semibold">{kycDetail.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Gender / DOB:</span>
                    <p className="font-semibold">{kycDetail.gender || "—"} • {kycDetail.dob || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Address:</span>
                    <p className="text-xs font-medium mt-0.5">{kycDetail.address || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Authenticated directly via UIDAI DigiLocker Gateway
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No data available.</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
