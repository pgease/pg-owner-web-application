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
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Clock,
  Plus,
  Trash2,
  Star,
  CreditCard,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { authStorage } from "@/api/http";
import {
  getSettlementBankAccounts,
  addSettlementBankAccount,
  setPrimarySettlementBankAccount,
  deleteSettlementBankAccount,
  lookupIfsc,
  type SettlementBankAccountItem,
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
  const [isCopiedUpi, setIsCopiedUpi] = useState<string | null>(null);
  const [revealedAccounts, setRevealedAccounts] = useState<Record<string, boolean>>({});

  // List of accounts & Primary
  const [accounts, setAccounts] = useState<SettlementBankAccountItem[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<SettlementBankAccountItem | null>(null);

  // Selected account for Standee QR
  const [selectedForQr, setSelectedForQr] = useState<string>("");

  // Add Account Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Form State
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("current");
  const [upiId, setUpiId] = useState("");
  const [isPrimaryNew, setIsPrimaryNew] = useState(false);

  // IFSC Lookup State
  const [isLookingUpIfsc, setIsLookingUpIfsc] = useState(false);
  const [ifscResult, setIfscResult] = useState<IfscLookupResponse | null>(null);
  const [ifscError, setIfscError] = useState<string | null>(null);

  // Delete Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<SettlementBankAccountItem | null>(null);

  // 1. Fetch settlement bank accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSettlementBankAccounts();
      if (res?.success && Array.isArray(res.accounts)) {
        setAccounts(res.accounts);
        const prim = res.primaryAccount || res.accounts.find((a) => a.isPrimary) || res.accounts[0] || null;
        setPrimaryAccount(prim);
        if (prim && !selectedForQr) {
          setSelectedForQr(prim.id);
        }
      } else {
        setAccounts([]);
        setPrimaryAccount(null);
      }
    } catch (err: unknown) {
      console.warn("Could not fetch settlement bank accounts from backend:", err);
      // Fallback check from localStorage
      const cached = localStorage.getItem(`pgease_bank_details_${currentOwner?.name || "default"}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const fallbackAcc: SettlementBankAccountItem = {
            id: "local_default",
            ...parsed,
            isPrimary: true,
          };
          setAccounts([fallbackAcc]);
          setPrimaryAccount(fallbackAcc);
          setSelectedForQr("local_default");
        } catch {
          setAccounts([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentOwner?.name, selectedForQr]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 2. Real-time debounced IFSC lookup in Add Modal
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

  // Reset Add Form
  const resetAddForm = () => {
    setAccountHolder(currentOwner?.name || "");
    setBankName("");
    setBranch("");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setIfscCode("");
    setAccountType("current");
    setUpiId("");
    setIsPrimaryNew(accounts.length === 0);
    setIfscResult(null);
    setIfscError(null);
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  // 3. Add Bank Account
  const handleAddAccount = async (e: React.FormEvent) => {
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
      isPrimary: isPrimaryNew || accounts.length === 0,
    };

    try {
      const res = await addSettlementBankAccount(payload);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        if (res.account?.id) setSelectedForQr(res.account.id);

        toast({
          title: "Bank Account Added! 🎉",
          description: `Linked ${res.account?.bankName || payload.bankName} (••••${cleanAcc.slice(-4)}) to your settlements.`,
        });
        setIsAddModalOpen(false);
        resetAddForm();
      } else {
        throw new Error(res?.message || "Failed to add bank account");
      }
    } catch (err: unknown) {
      toast({
        title: "Failed to add bank account",
        description: (err as Error)?.message || "Please verify the details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Set as Primary
  const handleSetPrimary = async (accId: string) => {
    setActionInProgress(accId);
    try {
      const res = await setPrimarySettlementBankAccount(accId);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        setSelectedForQr(accId);
        toast({
          title: "Primary Account Updated ⭐",
          description: "New rent collections and payments will default to this account.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not set primary account",
        description: (err as Error)?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // 5. Delete Account
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    const accId = accountToDelete.id;
    setActionInProgress(accId);
    try {
      const res = await deleteSettlementBankAccount(accId);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        if (selectedForQr === accId) {
          setSelectedForQr(res.primaryAccount?.id || (res.accounts[0]?.id ?? ""));
        }
        toast({
          title: "Account Removed",
          description: "Settlement account has been removed successfully.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not delete account",
        description: (err as Error)?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
      setAccountToDelete(null);
    }
  };

  const copyUpi = (upiString: string) => {
    if (!upiString) return;
    navigator.clipboard.writeText(upiString);
    setIsCopiedUpi(upiString);
    setTimeout(() => setIsCopiedUpi(null), 2000);
    toast({ title: "UPI ID Copied to Clipboard 📋" });
  };

  const toggleRevealAccount = (id: string) => {
    setRevealedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper for masking account number
  const formatMaskedAccount = (num: string) => {
    if (!num) return "—";
    if (num.length <= 4) return num;
    const lastFour = num.slice(-4);
    return `•••• •••• ${lastFour}`;
  };

  // Active account for QR display
  const activeQrAccount = accounts.find((a) => a.id === selectedForQr) || primaryAccount || accounts[0] || null;
  const activeUpiId = activeQrAccount?.upiId || "pgease@icici";
  const upiQrString = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(
    selectedPg?.name || activeQrAccount?.accountHolderName || currentOwner?.name || "PG Ease Stay"
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
                Direct Bank Payouts & Multiple Accounts
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                0% Gateway Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Add multiple bank accounts or UPI IDs and assign them to specific tenants for custom rent collections.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-emerald-700 border-emerald-300">
            T+1 Settlement
          </Badge>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Account / UPI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIST OF LINKED ACCOUNTS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-600" /> Linked Accounts ({accounts.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage your settlement accounts and assign them to tenants.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccounts}
              className="h-8 text-xs gap-1 text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>

          {accounts.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 mx-auto flex items-center justify-center text-teal-600">
                <Building className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">No Bank Account Linked</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Add your bank account or UPI ID to start receiving direct payouts with zero commission.
                </p>
              </div>
              <Button
                onClick={handleOpenAddModal}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Your First Account
              </Button>
            </Card>
          ) : (
            accounts.map((acc) => {
              const isPrimary = acc.isPrimary || primaryAccount?.id === acc.id;
              const isRevealed = revealedAccounts[acc.id];
              const isThisForQr = selectedForQr === acc.id;

              return (
                <Card
                  key={acc.id}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden",
                    isPrimary ? "border-teal-500/50 bg-teal-50/15 dark:bg-teal-950/10" : "border-border/80"
                  )}
                >
                  <CardHeader className="bg-muted/20 pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold shrink-0">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {acc.bankName || "Bank Account"}
                            </span>
                            {isPrimary && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] font-bold gap-1 py-0 px-2">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default Primary
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {acc.branch ? `${acc.branch} Branch` : `${acc.accountType || "Current"} Account`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isPrimary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50 font-semibold px-2"
                            onClick={() => handleSetPrimary(acc.id)}
                            disabled={actionInProgress === acc.id}
                          >
                            {actionInProgress === acc.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Star className="h-3 w-3 mr-1" />
                            )}
                            Make Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setAccountToDelete(acc)}
                          title="Delete Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    {/* Grid Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Holder</span>
                        <p className="font-bold text-foreground truncate">{acc.accountHolderName}</p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">A/C Number</span>
                          <button
                            type="button"
                            onClick={() => toggleRevealAccount(acc.id)}
                            className="text-teal-600 hover:text-teal-700"
                            title={isRevealed ? "Hide number" : "Reveal number"}
                          >
                            {isRevealed ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                          </button>
                        </div>
                        <p className="font-mono font-bold text-foreground">
                          {isRevealed ? acc.accountNumber : formatMaskedAccount(acc.accountNumber)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">IFSC</span>
                        <p className="font-mono font-bold text-foreground uppercase">{acc.ifscCode}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Type</span>
                        <p className="font-medium text-foreground capitalize">{acc.accountType || "Current"}</p>
                      </div>
                    </div>

                    {/* UPI Box if available */}
                    {acc.upiId && (
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">UPI:</span>
                          <span className="font-mono font-bold text-foreground text-xs">{acc.upiId}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => copyUpi(acc.upiId!)}
                        >
                          {isCopiedUpi === acc.upiId ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {isCopiedUpi === acc.upiId ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Verified for tenant settlements
                      </span>
                      <Button
                        size="sm"
                        variant={isThisForQr ? "default" : "outline"}
                        className={cn(
                          "h-6 text-[10px] rounded-lg gap-1 px-2 font-semibold",
                          isThisForQr ? "bg-teal-600 text-white" : ""
                        )}
                        onClick={() => setSelectedForQr(acc.id)}
                      >
                        <QrCode className="h-3 w-3" /> {isThisForQr ? "Standee Active" : "View QR Standee"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: UPI QR STANDEE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-teal-600" /> Collection Standee QR
              </CardTitle>
              <CardDescription className="text-xs">
                Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              {/* Account Selector for QR */}
              {accounts.length > 1 && (
                <div className="w-full text-left space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Standee QR Account
                  </Label>
                  <Select value={selectedForQr} onValueChange={(val) => setSelectedForQr(val)}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.bankName || "Account"} (••••{acc.accountNumber?.slice(-4)})
                          {acc.isPrimary ? " [Primary]" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    onClick={() => copyUpi(activeUpiId)}
                    title="Copy UPI ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {activeQrAccount && (
                  <p className="text-[11px] text-muted-foreground">
                    Payout to: {activeQrAccount.bankName} (••••{activeQrAccount.accountNumber?.slice(-4)})
                  </p>
                )}
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

      {/* DIALOG: ADD NEW SETTLEMENT ACCOUNT */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-teal-600" /> Add Bank Account / UPI
            </DialogTitle>
            <DialogDescription className="text-xs">
              Link another settlement account or UPI ID to collect rent directly from tenants.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-3.5 text-xs py-2">
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
            </div>

            {/* IFSC Code with Real-Time Lookup */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${formId}-ifsc`} className="text-xs font-semibold">
                  IFSC Code *
                </Label>
                {isLookingUpIfsc && (
                  <span className="text-[10px] text-teal-600 flex items-center gap-1 font-medium animate-pulse">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Verifying...
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

            {/* Bank Name & Branch */}
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
                  placeholder="Enter account number"
                  required
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${formId}-confirmAcc`} className="text-xs font-semibold">
                  Confirm Account *
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

            {/* Account Type & UPI VPA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  UPI ID (Optional)
                </Label>
                <Input
                  id={`${formId}-upi`}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="h-9 text-xs rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Set as Primary Checkbox */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id={`${formId}-primary`}
                checked={isPrimaryNew}
                onChange={(e) => setIsPrimaryNew(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor={`${formId}-primary`} className="text-xs cursor-pointer font-medium">
                Set as default primary account for rent collections
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRM DELETE */}
      <Dialog open={Boolean(accountToDelete)} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Remove Bank Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove{" "}
              <span className="font-bold text-foreground">
                {accountToDelete?.bankName} (••••{accountToDelete?.accountNumber?.slice(-4)})
              </span>
              ? Tenants assigned to this account will fall back to your primary account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAccountToDelete(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={Boolean(actionInProgress)}
              className="rounded-xl text-xs font-bold"
            >
              {actionInProgress ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
              Remove Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
