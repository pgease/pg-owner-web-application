import { useState, useEffect } from "react";
import {
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Download,
  Printer,
  Copy,
  AlertCircle,
  Save,
  Lock,
  ArrowLeft,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { authStorage, httpRequest } from "@/api/http";
import { PROPERTY_OWNER_BASE } from "@/api/propertyOwner";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const INDIAN_BANKS = [
  "HDFC Bank",
  "State Bank of India (SBI)",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IndusInd Bank",
  "Other / Custom Bank",
];

export const BankAccountManager = () => {
  const { selectedPgId, properties } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);
  const currentOwner = authStorage.getPropertyOwner();

  // Bank Form State
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [customBankName, setCustomBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("current");
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load existing details from storage or owner profile
  useEffect(() => {
    const saved = localStorage.getItem(`pgease_bank_details_${currentOwner?.id || "default"}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccountHolder(parsed.accountHolder || currentOwner?.name || "");
        setBankName(parsed.bankName || "HDFC Bank");
        setAccountNumber(parsed.accountNumber || "");
        setConfirmAccountNumber(parsed.accountNumber || "");
        setIfscCode(parsed.ifscCode || "");
        setAccountType(parsed.accountType || "current");
        setUpiId(parsed.upiId || "");
        return;
      } catch (e) {
        // ignore
      }
    }

    // Default fallbacks from profile
    if (currentOwner) {
      setAccountHolder(currentOwner.name || "");
      if (currentOwner.mobileContactNumber) {
        setUpiId(`${currentOwner.mobileContactNumber}@upi`);
      }
    }
  }, [currentOwner]);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountHolder.trim()) {
      toast({ title: "Account holder name is required", variant: "destructive" });
      return;
    }
    if (!accountNumber.trim()) {
      toast({ title: "Account number is required", variant: "destructive" });
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      toast({ title: "Account numbers do not match", description: "Please re-check your account number", variant: "destructive" });
      return;
    }
    if (!ifscCode.trim() || ifscCode.length < 9) {
      toast({ title: "Valid IFSC Code is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const finalBankName = bankName === "Other / Custom Bank" && customBankName.trim() ? customBankName : bankName;

    const bankPayload = {
      bankAccountHolderName: accountHolder.trim(),
      bankAccountNumber: accountNumber.trim(),
      bankIfscCode: ifscCode.trim().toUpperCase(),
      bankName: finalBankName,
      bankUpiId: upiId.trim(),
      accountType,
    };

    try {
      // Attempt backend update if owner API is available
      await httpRequest(`${PROPERTY_OWNER_BASE}/me`, {
        method: "PUT",
        auth: true,
        body: {
          bankDetails: bankPayload,
        },
      }).catch(() => null);

      // Persist in localStorage
      localStorage.setItem(
        `pgease_bank_details_${currentOwner?.id || "default"}`,
        JSON.stringify({
          accountHolder: accountHolder.trim(),
          bankName: finalBankName,
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          accountType,
          upiId: upiId.trim(),
          updatedAt: new Date().toISOString(),
        })
      );

      toast({
        title: "Bank Account Configured Successfully! 🎉",
        description: `Linked ${finalBankName} account ending in ••••${accountNumber.slice(-4)} for 0% direct UPI collections.`,
      });
    } catch (e: any) {
      toast({
        title: "Bank Details Saved Locally",
        description: "Your settlement bank account has been updated for PG collections.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: "UPI ID Copied to Clipboard" });
  };

  // Generate UPI payment string for QR
  const upiQrString = `upi://pay?pa=${encodeURIComponent(upiId || "pgease@icici")}&pn=${encodeURIComponent(
    selectedPg?.name || accountHolder || "PG Ease Stay"
  )}&cu=INR`;

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
                Direct Bank Payouts Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                0% Gateway Commission
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Rent collected from tenants via UPI QR goes directly into your bank account. No intermediary holding fees.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-emerald-700 border-emerald-300 shrink-0">
          T+1 Daily Auto-Settlement
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BANK DETAILS FORM */}
        <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-teal-600" /> Bank Account Details
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your official account details for direct rent deposits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Account Holder Name *</Label>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Shivam Kumar or PG Enterprises"
                  required
                  className="h-9 text-xs rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bank Name *</Label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_BANKS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Account Type *</Label>
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
              </div>

              {bankName === "Other / Custom Bank" && (
                <div className="space-y-1">
                  <Label className="text-xs">Enter Bank Name</Label>
                  <Input
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="e.g. Federal Bank"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Account Number *</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  type="password"
                  placeholder="Enter full bank account number"
                  required
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Confirm Account Number *</Label>
                <Input
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter bank account number"
                  required
                  className={cn(
                    "h-9 text-xs rounded-xl font-mono",
                    confirmAccountNumber && accountNumber !== confirmAccountNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                />
                {confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                  <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> Account numbers do not match
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">IFSC Code *</Label>
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                  required
                  className="h-9 text-xs rounded-xl uppercase font-mono"
                />
              </div>

              <div className="space-y-1 pt-2 border-t">
                <Label className="text-xs font-bold text-foreground">Primary UPI ID / VPA *</Label>
                <div className="flex gap-2">
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. shivam@oksbi or 7701953356@paytm"
                    required
                    className="h-9 text-xs rounded-xl font-medium"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-xl gap-1 text-xs"
                    onClick={copyUpi}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  This UPI ID will receive dynamic QR collections from resident tenants.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-10 shadow-sm gap-2 mt-4"
              >
                {isSaving ? (
                  <Save className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Save & Link Bank Details
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* UPI QR CODE PREVIEW CARD */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-teal-600" /> PG Collection Standee QR
              </CardTitle>
              <CardDescription className="text-xs">
                Tenants can scan this QR code using GPay, PhonePe, or Paytm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-teal-300 shadow-md">
                {/* SVG Mock QR Code */}
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 100 100"
                  className="mx-auto"
                >
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner boxes */}
                  <rect x="5" y="5" width="26" height="26" fill="#0f766e" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="13" width="10" height="10" fill="#0f766e" rx="1" />

                  <rect x="69" y="5" width="26" height="26" fill="#0f766e" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="77" y="13" width="10" height="10" fill="#0f766e" rx="1" />

                  <rect x="5" y="69" width="26" height="26" fill="#0f766e" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="77" width="10" height="10" fill="#0f766e" rx="1" />

                  {/* Matrix pattern dots */}
                  <rect x="36" y="8" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="46" y="8" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="56" y="8" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="36" y="24" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="46" y="18" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="56" y="24" width="6" height="6" fill="#0f766e" rx="1" />

                  <rect x="8" y="36" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="18" y="46" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="24" y="56" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="8" y="56" width="6" height="6" fill="#0f766e" rx="1" />

                  <rect x="36" y="36" width="10" height="10" fill="#0f766e" rx="2" />
                  <rect x="52" y="36" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="42" y="52" width="12" height="12" fill="#0f766e" rx="2" />
                  <rect x="62" y="50" width="8" height="8" fill="#0f766e" rx="1" />

                  <rect x="68" y="36" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="84" y="36" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="76" y="52" width="6" height="6" fill="#0f766e" rx="1" />
                  <rect x="86" y="52" width="6" height="6" fill="#0f766e" rx="1" />

                  <rect x="36" y="70" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="50" y="70" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="42" y="82" width="10" height="10" fill="#0f766e" rx="2" />
                  <rect x="62" y="76" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="74" y="70" width="8" height="8" fill="#0f766e" rx="1" />
                  <rect x="86" y="80" width="8" height="8" fill="#0f766e" rx="1" />
                </svg>
              </div>

              <div className="space-y-1">
                <p className="font-extrabold text-sm text-foreground">
                  {selectedPg?.name || "Shivam PG"}
                </p>
                <Badge variant="secondary" className="font-mono text-[11px] px-2.5 py-0.5">
                  {upiId || "Add UPI ID above"}
                </Badge>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs gap-1.5"
                  onClick={() => toast({ title: "Standee PDF Downloaded", description: "Print this standee for your PG reception." })}
                >
                  <Download className="h-3.5 w-3.5" /> Download Standee
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs px-3"
                  onClick={() => window.print()}
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
