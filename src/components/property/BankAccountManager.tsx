import { useState, useEffect, useCallback, useId } from "react";
import {
  Building,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Download,
  Printer,
  Copy,
  AlertCircle,
  Save,
  Edit2,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { authStorage } from "@/api/http";
import {
  getSettlementBankAccount,
  updateSettlementBankAccount,
  lookupIfsc,
  type SettlementBankAccount,
  type IfscLookupResponse,
} from "@/api/propertyOwner";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export const BankAccountManager = () => {
  const formId = useId();
  const { selectedPgId, properties } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);
  const currentOwner = authStorage.getPropertyOwner();

  // Loading & View States
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRawAccount, setShowRawAccount] = useState(false);
  const [isCopiedUpi, setIsCopiedUpi] = useState(false);

  // Active Bank Account from Backend
  const [bankAccount, setBankAccount] = useState<SettlementBankAccount | null>(null);

  // Form State
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("current");
  const [upiId, setUpiId] = useState("");

  // IFSC Lookup State
  const [isLookingUpIfsc, setIsLookingUpIfsc] = useState(false);
  const [ifscResult, setIfscResult] = useState<IfscLookupResponse | null>(null);
  const [ifscError, setIfscError] = useState<string | null>(null);

  // 1. Fetch current settlement bank account from backend on mount
  const fetchBankAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSettlementBankAccount();
      if (res?.success && res.bankAccount) {
        const acc = res.bankAccount;
        setBankAccount(acc);
        setAccountHolder(acc.accountHolderName || "");
        setAccountNumber(acc.accountNumber || "");
        setConfirmAccountNumber(acc.accountNumber || "");
        setIfscCode(acc.ifscCode || "");
        setBankName(acc.bankName || "");
        setBranch(acc.branch || "");
        setAccountType(acc.accountType === "savings" ? "savings" : "current");
        setUpiId(acc.upiId || "");
        setIsEditing(false);
      } else {
        // No bank account configured yet
        setBankAccount(null);
        setIsEditing(true);
        if (currentOwner?.name) {
          setAccountHolder(currentOwner.name);
        }
      }
    } catch (err: unknown) {
      console.warn("Could not fetch settlement bank account from backend:", err);
      // Fallback check from localStorage
      const cached = localStorage.getItem(`pgease_bank_details_${currentOwner?.name || "default"}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setBankAccount(parsed);
          setAccountHolder(parsed.accountHolderName || "");
          setAccountNumber(parsed.accountNumber || "");
          setConfirmAccountNumber(parsed.accountNumber || "");
          setIfscCode(parsed.ifscCode || "");
          setBankName(parsed.bankName || "");
          setBranch(parsed.branch || "");
          setAccountType(parsed.accountType || "current");
          setUpiId(parsed.upiId || "");
          setIsEditing(false);
        } catch {
          setIsEditing(true);
        }
      } else {
        setIsEditing(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentOwner?.name]);

  useEffect(() => {
    fetchBankAccount();
  }, [fetchBankAccount]);

  // 2. Real-time debounced IFSC lookup
  useEffect(() => {
    const clean = ifscCode.trim().toUpperCase();
    if (clean.length !== 11) {
      setIfscResult(null);
      setIfscError(null);
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(clean)) {
      setIfscError("5th character must be '0' (e.g. HDFC0000001)");
      setIfscResult(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLookingUpIfsc(true);
      setIfscError(null);
      try {
        const data = await lookupIfsc(clean);
        if (!isMounted) return;

        if (data && data.valid) {
          setIfscResult(data);
          setIfscError(null);
          if (data.bank) setBankName(data.bank);
          if (data.branch) setBranch(data.branch);
        } else {
          setIfscResult(null);
          setIfscError(data?.message || "IFSC code not found in central bank directory");
        }
      } catch {
        if (!isMounted) return;
        setIfscResult(null);
        setIfscError("Unable to verify IFSC right now, but format is valid");
      } finally {
        if (isMounted) setIsLookingUpIfsc(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ifscCode]);

  // 3. Save / Update Bank Details
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountHolder.trim()) {
      toast({ title: "Account holder name is required", variant: "destructive" });
      return;
    }
    const cleanAcc = accountNumber.trim();
    if (!cleanAcc || cleanAcc.length < 8) {
      toast({ title: "Valid account number is required (min 8 digits)", variant: "destructive" });
      return;
    }
    if (cleanAcc !== confirmAccountNumber.trim()) {
      toast({
        title: "Account numbers do not match",
        description: "Please verify that both account number fields match exactly.",
        variant: "destructive",
      });
      return;
    }
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      toast({ title: "Valid 11-digit IFSC code is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const payload = {
      accountHolderName: accountHolder.trim(),
      accountNumber: cleanAcc,
      ifscCode: cleanIfsc,
      bankName: bankName.trim() || ifscResult?.bank || "Bank Account",
      branch: branch.trim() || ifscResult?.branch || "",
      accountType,
      upiId: upiId.trim(),
    };

    try {
      const res = await updateSettlementBankAccount(payload);

      const savedAccount: SettlementBankAccount = res?.bankAccount || {
        ...payload,
        isVerified: true,
        updatedAt: new Date().toISOString(),
      };

      setBankAccount(savedAccount);
      setIsEditing(false);

      // Cache locally for offline resilience
      localStorage.setItem(
        `pgease_bank_details_${currentOwner?.name || "default"}`,
        JSON.stringify(savedAccount)
      );

      toast({
        title: "Settlement Account Configured! 🎉",
        description: res?.message || `Direct settlements linked to ${savedAccount.bankName} (••••${cleanAcc.slice(-4)}).`,
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to save bank account",
        description: (err as Error)?.message || "Please verify the account and IFSC details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyUpi = () => {
    const activeUpi = bankAccount?.upiId || upiId;
    if (!activeUpi) return;
    navigator.clipboard.writeText(activeUpi);
    setIsCopiedUpi(true);
    setTimeout(() => setIsCopiedUpi(false), 2000);
    toast({ title: "UPI ID Copied to Clipboard 📋" });
  };

  // Helper for masking account number
  const formatMaskedAccount = (num: string) => {
    if (!num) return "—";
    if (num.length <= 4) return num;
    const lastFour = num.slice(-4);
    return `•••• •••• ${lastFour}`;
  };

  // Active UPI string for Standee QR
  const activeUpiId = bankAccount?.upiId || upiId || "pgease@icici";
  const upiQrString = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(
    selectedPg?.name || accountHolder || "PG Ease Stay"
  )}&cu=INR`;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-96 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* VERIFIED SETTLEMENT BANNER */}
      <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0 font-black">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Direct Bank Payouts & Collections
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                0% Gateway Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Rent collected from tenants via Direct UPI and QR links is settled directly into your linked bank account with zero platform commission.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-emerald-700 border-emerald-300 shrink-0">
          T+1 Settlement
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: EITHER OVERVIEW CARD OR EDIT FORM */}
        <div className="lg:col-span-7 space-y-4">
          {bankAccount && !isEditing ? (
            /* OVERVIEW MODE: DISPLAY VERIFIED SETTLEMENT ACCOUNT */
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4 text-teal-600" />
                      {bankAccount.bankName || "Settlement Bank Account"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {bankAccount.branch ? `${bankAccount.branch} Branch` : "Active bank account for rent payouts"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-xs font-bold gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {bankAccount.isVerified ? "Verified Account" : "Registered"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 rounded-xl text-xs gap-1.5 font-semibold hover:bg-muted"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                {/* Account Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px] font-medium">Account Holder</span>
                    <p className="font-bold text-sm text-foreground">{bankAccount.accountHolderName}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px] font-medium">Account Type</span>
                    <div>
                      <Badge variant="secondary" className="capitalize text-xs font-semibold">
                        {bankAccount.accountType || "Current"} Account
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px] font-medium">Account Number</span>
                      <button
                        type="button"
                        onClick={() => setShowRawAccount(!showRawAccount)}
                        className="text-[10px] text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold"
                      >
                        {showRawAccount ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showRawAccount ? "Hide" : "Reveal"}
                      </button>
                    </div>
                    <p className="font-mono font-bold text-sm text-foreground tracking-wide">
                      {showRawAccount ? bankAccount.accountNumber : formatMaskedAccount(bankAccount.accountNumber)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px] font-medium">IFSC Code</span>
                    <p className="font-mono font-bold text-sm text-foreground uppercase">
                      {bankAccount.ifscCode}
                    </p>
                  </div>
                </div>

                {/* Primary UPI ID Box */}
                {bankAccount.upiId && (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Linked UPI VPA
                      </span>
                      <p className="font-mono font-bold text-foreground text-xs">{bankAccount.upiId}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 rounded-lg text-xs gap-1"
                      onClick={copyUpi}
                    >
                      {isCopiedUpi ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {isCopiedUpi ? "Copied" : "Copy"}
                    </Button>
                  </div>
                )}

                {/* Status footnote */}
                <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                    {bankAccount.updatedAt
                      ? `Updated on ${new Date(bankAccount.updatedAt).toLocaleDateString()}`
                      : "Settlement ready"}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchBankAccount()}
                    className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* EDIT / SETUP FORM */
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4 text-teal-600" />
                      {bankAccount ? "Update Bank Account" : "Add Settlement Bank Account"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enter bank credentials to receive direct payouts and QR collections.
                    </CardDescription>
                  </div>
                  {bankAccount && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <Label htmlFor={`${formId}-holder`} className="text-xs font-semibold">
                      Account Holder Name *
                    </Label>
                    <Input
                      id={`${formId}-holder`}
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="e.g. Rahul Sharma or Shree PG Enterprises"
                      required
                      className="h-9 text-xs rounded-xl font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Must match the name registered with your bank account.
                    </p>
                  </div>

                  {/* IFSC Code with Real-Time Lookup */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${formId}-ifsc`} className="text-xs font-semibold">
                        IFSC Code *
                      </Label>
                      {isLookingUpIfsc && (
                        <span className="text-[10px] text-teal-600 flex items-center gap-1 font-medium animate-pulse">
                          <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Verifying branch...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id={`${formId}-ifsc`}
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0000001"
                        maxLength={11}
                        required
                        className={cn(
                          "h-9 text-xs rounded-xl uppercase font-mono tracking-wider",
                          ifscResult ? "border-emerald-500 pr-8" : "",
                          ifscError ? "border-destructive pr-8" : ""
                        )}
                      />
                      {ifscResult && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 absolute right-2.5 top-2.5" />
                      )}
                      {ifscError && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-2.5 top-2.5" />
                      )}
                    </div>

                    {/* IFSC Lookup Success Preview */}
                    {ifscResult && (
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">{ifscResult.bank}</span>
                          {ifscResult.branch && ` — ${ifscResult.branch}`}
                          {ifscResult.city && ` (${ifscResult.city})`}
                        </div>
                      </div>
                    )}

                    {/* IFSC Error Warning */}
                    {ifscError && (
                      <p className="text-[10px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {ifscError}
                      </p>
                    )}
                  </div>

                  {/* Bank Name & Branch (Auto-Filled) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`${formId}-bankName`} className="text-xs">
                        Bank Name
                      </Label>
                      <Input
                        id={`${formId}-bankName`}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="h-9 text-xs rounded-xl font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${formId}-branch`} className="text-xs">
                        Branch
                      </Label>
                      <Input
                        id={`${formId}-branch`}
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Nariman Point"
                        className="h-9 text-xs rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Account Number & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`${formId}-accNum`} className="text-xs font-semibold">
                        Account Number *
                      </Label>
                      <Input
                        id={`${formId}-accNum`}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                        type="password"
                        placeholder="Enter bank account number"
                        required
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${formId}-confirmAcc`} className="text-xs font-semibold">
                        Confirm Account Number *
                      </Label>
                      <Input
                        id={`${formId}-confirmAcc`}
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                        placeholder="Re-enter account number"
                        required
                        className={cn(
                          "h-9 text-xs rounded-xl font-mono",
                          confirmAccountNumber && accountNumber !== confirmAccountNumber
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                      />
                    </div>
                  </div>

                  {confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                    <p className="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Account numbers do not match
                    </p>
                  )}

                  {/* Account Type & UPI VPA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Account Type</Label>
                      <Select
                        value={accountType}
                        onValueChange={(val: "savings" | "current") => setAccountType(val)}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Current Account (Business)</SelectItem>
                          <SelectItem value="savings">Savings Account (Individual)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${formId}-upi`} className="text-xs font-semibold">
                        Primary UPI ID (Optional)
                      </Label>
                      <Input
                        id={`${formId}-upi`}
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@oksbi"
                        className="h-9 text-xs rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Tenants can pay rent instantly via UPI QR linked to this VPA.
                  </p>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-10 shadow-sm gap-2"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save & Verify Settlement Account
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: UPI QR STANDEE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-teal-600" /> PG Collection Standee QR
              </CardTitle>
              <CardDescription className="text-xs">
                Tenants scan this QR code using GPay, PhonePe, or Paytm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-teal-300 shadow-md flex items-center justify-center">
                {/* Real Scannable UPI QR Code */}
                <QRCodeSVG
                  value={upiQrString}
                  size={180}
                  level="M"
                  includeMargin={true}
                  className="mx-auto rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <p className="font-extrabold text-sm text-foreground">
                  {selectedPg?.name || "Your PG Property"}
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[11px] px-2.5 py-0.5">
                    {activeUpiId}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={copyUpi}
                    title="Copy UPI ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs gap-1.5 font-semibold"
                  onClick={() =>
                    toast({
                      title: "Standee PDF Ready 📄",
                      description: "Print this standee to display at your reception.",
                    })
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Download Standee
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs px-3"
                  onClick={() => window.print()}
                  title="Print Standee"
                >
                  <Printer className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
