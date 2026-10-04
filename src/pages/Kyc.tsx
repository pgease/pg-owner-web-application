import { useState } from "react";
import {
  Loader2,
  ShieldCheck,
  FileText,
  Plus,
  CreditCard,
  Send,
  Download,
  ExternalLink,
  UserCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
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
import { useEntitlements } from "@/hooks/useEntitlements";
import { FeatureGuard } from "@/components/common/FeatureGuard";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { formatINR, formatDate } from "@/lib/formatters";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function Kyc() {
  const { selectedPgId: currentPropertyId } = useApp();
  const entitlements = useEntitlements();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredFeature, setTrialExpiredFeature] = useState("");
  const [activeTab, setActiveTab] = useState<"kyc" | "agreements">("kyc");

  // KYC Queries & Mutations
  const { data: kycRows = [], isLoading: isKycLoading, refetch: refetchKyc } = useKycApplications();
  const approveMut = useApproveKycMutation();
  const rejectMut = useRejectKycMutation();
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
    houseRules: "1. No loud music after 10 PM.\n2. Visitors allowed until 8 PM.\n3. Keep common areas tidy.",
  });

  const kycList = Array.isArray(kycRows) ? (kycRows as Record<string, any>[]) : [];
  const agreementsList = agreementsData?.agreements || [];
  const creditPacks = (Array.isArray(packsData) ? packsData : packsData?.creditPacks) || [];

  const verifiedKycCount = kycList.filter((r) => {
    const s = String(r.status || "").toLowerCase();
    return s === "completed" || s === "approved" || r.processing_done;
  }).length;

  const pendingKycCount = kycList.length - verifiedKycCount;

  // Top-up Razorpay Checkout
  const handleTopupCheckout = async (packId: string) => {
    try {
      const order = await topupOrderMut.mutateAsync(packId);
      if (!window.Razorpay) {
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
              packId,
              creditPackId: packId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast({
              title: "Credits Recharged",
              description: "Your verification credits have been updated.",
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
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Tenant KYC");
      setTrialExpiredOpen(true);
      return;
    }
    if (!selectedTenantForKyc) {
      toast({ title: "Please select a tenant", variant: "destructive" });
      return;
    }
    try {
      await requestKycMut.mutateAsync(selectedTenantForKyc);
      toast({
        title: "KYC Request Sent",
        description: "Aadhaar DigiLocker verification link sent to tenant via WhatsApp.",
      });
      setRequestKycOpen(false);
      setSelectedTenantForKyc("");
      refetchKyc();
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
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Rental Agreements");
      setTrialExpiredOpen(true);
      return;
    }
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
        title: "Rental Agreement Created",
        description: "Agreement generated and sent to tenant for e-Sign.",
      });
      setCreateAgreementOpen(false);
      refetchAgreements();
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
      <div className="space-y-6">
        <PageHeader
          title="KYC & Digital Agreements"
          description="Verify tenant identity with DigiLocker Aadhaar verification and manage digital rental agreements."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--gray-300)]"
                onClick={() => setTopupOpen(true)}
              >
                Top up credits
              </Button>
              {activeTab === "kyc" ? (
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
                  onClick={() => {
                    if (entitlements.isExpired) {
                      setTrialExpiredFeature("Tenant KYC");
                      setTrialExpiredOpen(true);
                      return;
                    }
                    setRequestKycOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Request tenant KYC
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
                  onClick={() => {
                    if (entitlements.isExpired) {
                      setTrialExpiredFeature("Rental Agreements");
                      setTrialExpiredOpen(true);
                      return;
                    }
                    setCreateAgreementOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Create agreement
                </Button>
              )}
            </div>
          }
        />

        {/* Operational Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricDisplay
            label="Verification Credits"
            value={balanceData?.remainingCredits ?? "—"}
            hint={
              balanceData?.freeCreditsRemaining !== undefined
                ? `${balanceData.freeCreditsRemaining} free credits included`
                : "Available for DigiLocker KYC"
            }
            tone={Number(balanceData?.remainingCredits || 0) > 0 ? "success" : "warning"}
          />
          <MetricDisplay
            label="Verified Tenants"
            value={verifiedKycCount}
            hint="Aadhaar authenticated records"
            tone="success"
          />
          <MetricDisplay
            label="Pending KYC"
            value={pendingKycCount}
            hint="Awaiting tenant OTP submission"
            tone={pendingKycCount > 0 ? "warning" : "neutral"}
          />
          <MetricDisplay
            label="Digital Agreements"
            value={agreementsList.length}
            hint="Drafted and signed contracts"
            tone="neutral"
          />
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-[var(--gray-200)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "kyc"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
            }`}
          >
            Aadhaar KYC ({kycList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("agreements")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "agreements"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
            }`}
          >
            Rental Agreements ({agreementsList.length})
          </button>
        </div>

        {/* TAB 1: KYC APPLICATIONS */}
        {activeTab === "kyc" && (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-4">
            {isKycLoading ? (
              <div className="flex justify-center py-16 text-sm text-[var(--gray-500)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)] mr-2" />
                Loading KYC records...
              </div>
            ) : kycList.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-10 w-10 text-[var(--gray-400)]" />}
                title="No KYC applications yet"
                description="Send instant DigiLocker Aadhaar verification links to your tenants via WhatsApp."
                action={
                  <Button
                    size="sm"
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                    onClick={() => setRequestKycOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Request tenant KYC
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                <Table>
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2.5 px-3">Tenant Details</TableHead>
                      <TableHead className="py-2.5 px-3">Status</TableHead>
                      <TableHead className="py-2.5 px-3">Aadhaar Verified</TableHead>
                      <TableHead className="py-2.5 px-3">Requested On</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList.map((row, i) => {
                      const id = row.id || row.roomTenantId || row.applicationId;
                      const status = (row.status || "pending").toLowerCase();
                      const isVerified = status === "completed" || status === "approved" || row.processing_done;

                      return (
                        <TableRow key={id || String(i)} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2.5 px-3">
                            <div className="font-medium text-[var(--gray-900)]">
                              {row.tenantName || row.name || row.tenant?.name || row.roomTenant?.tenant?.name || row.roomTenant?.name || "Tenant"}
                            </div>
                            <div className="text-xs text-[var(--gray-500)] tabular-nums">
                              {row.mobileNumber || row.phone || row.tenant?.phone || row.roomTenant?.tenant?.phone || row.roomTenant?.phone || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap">
                            {isVerified ? (
                              <StatusBadge label="Verified" tone="success" size="sm" />
                            ) : status === "rejected" ? (
                              <StatusBadge label="Rejected" tone="error" size="sm" />
                            ) : (
                              <StatusBadge label="Pending OTP" tone="warning" size="sm" />
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            {row.aadhaarNumber ? (
                              <span className="font-mono text-xs text-[var(--gray-700)]">
                                XXXX-XXXX-{row.aadhaarNumber.slice(-4)}
                              </span>
                            ) : isVerified ? (
                              <span className="text-xs text-[var(--success)] font-medium">
                                DigiLocker Matched
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--gray-400)]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 tabular-nums text-[var(--gray-600)] whitespace-nowrap">
                            {row.createdAt ? formatDate(row.createdAt) : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                onClick={() => setDetailId(id)}
                              >
                                Details
                              </Button>
                              {!isVerified && (
                                <CanAccess permission="kyc_approve">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 text-[var(--success)] border-[#B4E5C5] hover:bg-[#ECFAF1]"
                                    disabled={approveMut.isPending}
                                    onClick={async () => {
                                      await approveMut.mutateAsync(id);
                                      toast({ title: "KYC Application Approved" });
                                      refetchKyc();
                                    }}
                                  >
                                    Approve
                                  </Button>
                                </CanAccess>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIGITAL RENTAL AGREEMENTS */}
        {activeTab === "agreements" && (
          <FeatureGuard
            feature="digital_rental_agreements"
            fallbackTitle="Digital Rental Agreements & Aadhaar e-Sign (Pro Feature)"
            fallbackDescription="Draft legally valid rental agreements, send online Aadhaar e-Sign links, and automate tenant stamp papers exclusively on the Pro plan."
          >
            <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-4">
            {isAgreementsLoading ? (
              <div className="flex justify-center py-16 text-sm text-[var(--gray-500)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)] mr-2" />
                Loading agreements...
              </div>
            ) : agreementsList.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-[var(--gray-400)]" />}
                title="No rental agreements drafted yet"
                description="Draft legally valid rental agreements with online Aadhaar e-Sign."
                action={
                  <Button
                    size="sm"
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                    onClick={() => setCreateAgreementOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Create agreement
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                <Table>
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2.5 px-3">Tenant & Room</TableHead>
                      <TableHead className="py-2.5 px-3">Rent & Deposit</TableHead>
                      <TableHead className="py-2.5 px-3">Terms</TableHead>
                      <TableHead className="py-2.5 px-3">Signing Status</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreementsList.map((ag) => {
                      const isSigned = ag.status === "signed";
                      return (
                        <TableRow key={ag.id} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2.5 px-3">
                            <div className="font-medium text-[var(--gray-900)]">{ag.tenantName}</div>
                            <div className="text-xs text-[var(--gray-500)]">
                              Room {ag.roomNumber} · {ag.tenantPhone}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                            <div className="font-medium text-[var(--gray-900)]">
                              {formatINR(ag.monthlyRent)}/mo
                            </div>
                            <div className="text-xs text-[var(--gray-500)]">
                              Deposit: {formatINR(ag.securityDeposit)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-xs text-[var(--gray-600)] tabular-nums whitespace-nowrap">
                            <div>Notice: {ag.noticePeriodDays} days</div>
                            <div>Lock-in: {ag.lockInPeriodMonths} months</div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap">
                            {isSigned ? (
                              <StatusBadge label="Signed" tone="success" size="sm" />
                            ) : ag.status === "sent_for_esign" ? (
                              <StatusBadge label="Sent for eSign" tone="info" size="sm" />
                            ) : (
                              <StatusBadge label="Draft" tone="neutral" size="sm" />
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {ag.signingDirectUrl && !isSigned && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  onClick={() => window.open(ag.signingDirectUrl, "_blank")}
                                >
                                  Sign link
                                </Button>
                              )}
                              {ag.signedPdfUrl || ag.agreementPdfUrl ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  onClick={() => window.open(ag.signedPdfUrl || ag.agreementPdfUrl, "_blank")}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                                </Button>
                              ) : null}
                              {!isSigned && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  disabled={sendEsignMut.isPending}
                                  onClick={async () => {
                                    await sendEsignMut.mutateAsync(ag.id);
                                    toast({
                                      title: "eSign Link Resent",
                                      description: "Agreement signing link resent to tenant.",
                                    });
                                  }}
                                >
                                  Resend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          </FeatureGuard>
        )}

        {/* DIALOG 1: CREDIT TOP-UP MODAL */}
        <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
          <DialogContent className="max-w-lg p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Top-up Verification Credits
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Verification credits enable instant DigiLocker Aadhaar KYC and digital agreement drafting. WhatsApp messages remain completely free.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              {creditPacks.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`cursor-pointer rounded-md border p-3 transition-colors ${
                      isSelected
                        ? "border-[var(--brand-600)] bg-[var(--brand-50)]"
                        : "border-[var(--gray-200)] hover:border-[var(--gray-300)] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[var(--gray-900)]">{pack.name}</span>
                      {pack.popular && (
                        <span className="text-[10px] font-semibold bg-[var(--brand-600)] text-white px-1.5 py-0.5 rounded">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-[var(--gray-900)] my-1 tabular-nums">
                      {pack.credits} <span className="text-xs font-normal text-[var(--gray-500)]">Credits</span>
                    </div>
                    <div className="text-xs font-medium text-[var(--gray-700)] tabular-nums">
                      {formatINR(pack.price)}{" "}
                      <span className="text-[var(--gray-500)] font-normal">
                        ({formatINR(Math.round(pack.price / pack.credits))}/credit)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
              <span className="text-xs text-[var(--gray-500)]">Recharge via UPI or Cards</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTopupOpen(false)}
                  className="border-[var(--gray-300)]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                  disabled={!selectedPackId || topupOrderMut.isPending}
                  onClick={() => handleTopupCheckout(selectedPackId)}
                >
                  {topupOrderMut.isPending ? "Processing..." : "Recharge credits"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: REQUEST TENANT KYC MODAL */}
        <Dialog open={requestKycOpen} onOpenChange={setRequestKycOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Request Tenant KYC
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Select a tenant to send a DigiLocker Aadhaar verification link via WhatsApp. Consumes 1 credit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Select Tenant <span className="text-[#B42318]">*</span>
                </Label>
                <Select value={selectedTenantForKyc} onValueChange={setSelectedTenantForKyc}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose resident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid} className="text-sm">
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"}) · {t.mobileNumber || t.phone}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestKycOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                disabled={!selectedTenantForKyc || requestKycMut.isPending}
                onClick={handleInitiateTenantKyc}
              >
                {requestKycMut.isPending ? "Sending..." : "Send KYC Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: CREATE DIGITAL AGREEMENT MODAL */}
        <Dialog open={createAgreementOpen} onOpenChange={setCreateAgreementOpen}>
          <DialogContent className="max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Create Digital Rental Agreement
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Draft a legally compliant rental agreement and dispatch for DigiLocker Aadhaar e-Sign.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Select Tenant <span className="text-[#B42318]">*</span>
                </Label>
                <Select
                  value={agreementForm.roomTenantId}
                  onValueChange={(val) => setAgreementForm({ ...agreementForm, roomTenantId: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose resident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid} className="text-sm">
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Monthly Rent (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.monthlyRent}
                    onChange={(e) => setAgreementForm({ ...agreementForm, monthlyRent: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.securityDeposit}
                    onChange={(e) => setAgreementForm({ ...agreementForm, securityDeposit: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Notice Period (Days)</Label>
                  <Input
                    type="number"
                    value={agreementForm.noticePeriodDays}
                    onChange={(e) => setAgreementForm({ ...agreementForm, noticePeriodDays: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Lock-in Period (Months)</Label>
                  <Input
                    type="number"
                    value={agreementForm.lockInPeriodMonths}
                    onChange={(e) => setAgreementForm({ ...agreementForm, lockInPeriodMonths: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Start Date</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementStartDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementStartDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementEndDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementEndDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">House Rules & Terms</Label>
                <Textarea
                  rows={3}
                  value={agreementForm.houseRules}
                  onChange={(e) => setAgreementForm({ ...agreementForm, houseRules: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateAgreementOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                disabled={!agreementForm.roomTenantId || createAgreementMut.isPending}
                onClick={handleCreateAgreement}
              >
                {createAgreementMut.isPending ? "Generating..." : "Generate Agreement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: VIEW KYC DETAILS MODAL */}
        <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Aadhaar Verification Details
              </DialogTitle>
            </DialogHeader>
            {detailQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
              </div>
            ) : detailQuery.data ? (
              <div className="space-y-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
                  <div>
                    <span className="text-[11px] text-[var(--gray-500)] block">Full Name</span>
                    <p className="font-semibold text-sm text-[var(--gray-900)]">{kycDetail.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--gray-500)] block">Gender / DOB</span>
                    <p className="font-semibold text-sm text-[var(--gray-900)]">{kycDetail.gender || "—"} · {kycDetail.dob || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-[var(--gray-500)] block">Permanent Address</span>
                    <p className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">{kycDetail.address || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--success)] font-medium pt-1">
                  <CheckCircle2 className="h-4 w-4" /> Authenticated directly via UIDAI DigiLocker Gateway
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--gray-500)] text-center py-4">No data available.</p>
            )}
          </DialogContent>
        </Dialog>

        <TrialExpiredGateModal
          open={trialExpiredOpen}
          onOpenChange={setTrialExpiredOpen}
          featureName={trialExpiredFeature}
        />
      </div>
    </CanAccessPage>
  );
}
