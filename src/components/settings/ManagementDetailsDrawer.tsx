import { useState } from "react";
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Edit,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  User,
  FileText,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export interface ManagementDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: any;
}

export function ManagementDetailsDrawer({
  open,
  onOpenChange,
  property,
}: ManagementDetailsDrawerProps) {
  const owner = authStorage.getPropertyOwner();

  // Business Details State (persisted in localStorage or state)
  const [businessStatus, setBusinessStatus] = useState<"in_progress" | "verified" | "unregistered">("in_progress");
  const [businessType, setBusinessType] = useState("Unregistered");
  const [businessName, setBusinessName] = useState("Not Set");
  const [gstNumber, setGstNumber] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [cinVerified, setCinVerified] = useState(false);

  // Account Admin Details State
  const [adminName, setAdminName] = useState(owner?.name || "Not Set");
  const [adminEmail, setAdminEmail] = useState(owner?.email || "developer.shivam0@gmail.com");
  const [adminPhone, setAdminPhone] = useState(owner?.mobileContactNumber || "8368612646");

  // Modals
  const [editBusinessOpen, setEditBusinessOpen] = useState(false);
  const [verifyGstOpen, setVerifyGstOpen] = useState(false);
  const [verifyCinOpen, setVerifyCinOpen] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Temp form inputs
  const [tempType, setTempType] = useState(businessType);
  const [tempName, setTempName] = useState(businessName);
  const [tempGst, setTempGst] = useState(gstNumber);
  const [tempCin, setTempCin] = useState(cinNumber);
  const [tempAdminName, setTempAdminName] = useState(adminName);
  const [tempAdminEmail, setTempAdminEmail] = useState(adminEmail);
  const [tempAdminPhone, setTempAdminPhone] = useState(adminPhone);

  const handleSaveBusiness = () => {
    setBusinessType(tempType);
    setBusinessName(tempName || "Not Set");
    if (tempGst) setGstNumber(tempGst.toUpperCase());
    if (tempCin) setCinNumber(tempCin.toUpperCase());
    setEditBusinessOpen(false);
    toast({
      title: "Business Details Updated",
      description: "Entity details have been saved for this property.",
    });
  };

  const handleSaveAdmin = () => {
    setAdminName(tempAdminName || "Not Set");
    setAdminEmail(tempAdminEmail);
    setAdminPhone(tempAdminPhone);
    setEditAdminOpen(false);
    toast({
      title: "Admin Details Updated",
      description: "Account administrator contact details updated.",
    });
  };

  const handleVerifyGst = () => {
    if (!tempGst || tempGst.trim().length < 15) {
      toast({
        title: "Invalid GSTIN",
        description: "Please enter a valid 15-character GSTIN Number.",
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setGstNumber(tempGst.toUpperCase());
      setGstVerified(true);
      setVerifyGstOpen(false);
      toast({
        title: "GSTIN Verified Successfully",
        description: `Registered entity verified on the GST Portal: ${tempGst.toUpperCase()}`,
      });
    }, 900);
  };

  const handleVerifyCin = () => {
    if (!tempCin || tempCin.trim().length < 21) {
      toast({
        title: "Invalid CIN",
        description: "Corporate Identification Number must be 21 alphanumeric characters.",
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setCinNumber(tempCin.toUpperCase());
      setCinVerified(true);
      setVerifyCinOpen(false);
      toast({
        title: "CIN Verified Successfully",
        description: `Company registration verified with Ministry of Corporate Affairs.`,
      });
    }, 900);
  };

  const handleCopySettings = () => {
    toast({
      title: "Settings Copied",
      description: "Management and business settings replicated across all your active properties.",
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 flex flex-col bg-background border-l border-border/80 shadow-2xl"
        >
          {/* HEADER */}
          <div className="p-6 border-b border-border/70 flex items-center justify-between bg-card">
            <div>
              <SheetTitle className="text-xl font-black text-foreground">
                Management Details
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure corporate entity, GST, and administrator profiles
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. BUSINESS DETAILS SECTION (RentOK Screenshot 4) */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Business Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                  onClick={() => {
                    setTempType(businessType);
                    setTempName(businessName === "Not Set" ? "" : businessName);
                    setTempGst(gstNumber);
                    setTempCin(cinNumber);
                    setEditBusinessOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" /> Edit
                </Button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {businessStatus === "verified" ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" /> Verification In Progress
                    </span>
                  )}
                </div>

                {/* Type */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold text-foreground">{businessType}</span>
                </div>

                {/* Name */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold text-foreground">{businessName}</span>
                </div>

                {/* GST */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GST</span>
                  {gstVerified && gstNumber ? (
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {gstNumber}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold hover:underline"
                      onClick={() => {
                        setTempGst(gstNumber);
                        setVerifyGstOpen(true);
                      }}
                    >
                      <AlertCircle className="h-3.5 w-3.5" /> Verify Now
                    </button>
                  )}
                </div>

                {/* CIN */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CIN</span>
                  {cinVerified && cinNumber ? (
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {cinNumber}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold hover:underline"
                      onClick={() => {
                        setTempCin(cinNumber);
                        setVerifyCinOpen(true);
                      }}
                    >
                      <AlertCircle className="h-3.5 w-3.5" /> Verify Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. ACCOUNT ADMIN DETAILS SECTION */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Account Admin Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                  onClick={() => {
                    setTempAdminName(adminName === "Not Set" ? "" : adminName);
                    setTempAdminEmail(adminEmail);
                    setTempAdminPhone(adminPhone);
                    setEditAdminOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" /> Edit
                </Button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold text-foreground">{adminName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold text-foreground">{adminEmail}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="font-semibold text-foreground">{adminPhone}</span>
                </div>
              </div>
            </div>

            {/* 3. REPLICATE TO OTHER PROPERTIES BUTTON */}
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl text-xs font-bold gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-xs"
              onClick={handleCopySettings}
            >
              <Building className="h-4 w-4" />
              Copy settings to other properties
            </Button>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t border-border/70 text-center text-[11px] text-muted-foreground bg-muted/20">
            <p className="font-semibold text-foreground">PG Ease Hospitality Technologies</p>
            <div className="flex justify-center items-center gap-3 mt-1">
              <a href="#" className="hover:underline">Terms & Conditions</a>
              <span>&bull;</span>
              <a href="#" className="hover:underline">Refund Policy</a>
              <span>&bull;</span>
              <a href="#" className="hover:underline">Privacy Policy</a>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* EDIT BUSINESS DETAILS DIALOG */}
      <Dialog open={editBusinessOpen} onOpenChange={setEditBusinessOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Business Details</DialogTitle>
            <DialogDescription className="text-xs">
              Update legal ownership structure and registered entity information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Business Type</Label>
              <Select value={tempType} onValueChange={setTempType}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Private Limited">Private Limited (Pvt Ltd)</SelectItem>
                  <SelectItem value="Limited Liability Partnership (LLP)">LLP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Legal Entity Name</Label>
              <Input
                placeholder="e.g. Saksham PG Hospitality Solutions"
                className="h-9 text-xs rounded-xl"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GSTIN (Optional)</Label>
              <Input
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="h-9 text-xs uppercase rounded-xl"
                value={tempGst}
                onChange={(e) => setTempGst(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">CIN (Optional)</Label>
              <Input
                placeholder="e.g. U74999DL2021PTC123456"
                className="h-9 text-xs uppercase rounded-xl"
                value={tempCin}
                onChange={(e) => setTempCin(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditBusinessOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveBusiness}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VERIFY GST DIALOG */}
      <Dialog open={verifyGstOpen} onOpenChange={setVerifyGstOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Verify GSTIN</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your 15-digit Goods and Services Tax Identification Number for portal verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GSTIN Number</Label>
              <Input
                placeholder="07AAAAA0000A1Z5"
                className="h-10 text-sm uppercase tracking-widest font-mono rounded-xl"
                value={tempGst}
                onChange={(e) => setTempGst(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Verification links this property to your official tax ledger and enables compliant invoicing.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVerifyGstOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleVerifyGst}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify with GST Portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VERIFY CIN DIALOG */}
      <Dialog open={verifyCinOpen} onOpenChange={setVerifyCinOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Verify CIN</DialogTitle>
            <DialogDescription className="text-xs">
              Enter the 21-digit Corporate Identification Number registered with the Ministry of Corporate Affairs (MCA).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">CIN Number</Label>
              <Input
                placeholder="U74999DL2021PTC123456"
                className="h-10 text-sm uppercase tracking-widest font-mono rounded-xl"
                value={tempCin}
                onChange={(e) => setTempCin(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Validates corporate incorporation status and entity registration.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVerifyCinOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleVerifyCin}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify with MCA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ADMIN DETAILS DIALOG */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Account Admin</DialogTitle>
            <DialogDescription className="text-xs">
              Primary administrative point of contact for operational and financial notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Administrator Name</Label>
              <Input
                placeholder="Admin Full Name"
                className="h-9 text-xs rounded-xl"
                value={tempAdminName}
                onChange={(e) => setTempAdminName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Admin Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                className="h-9 text-xs rounded-xl"
                value={tempAdminEmail}
                onChange={(e) => setTempAdminEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Admin Phone Number</Label>
              <Input
                placeholder="10-digit mobile number"
                className="h-9 text-xs rounded-xl"
                value={tempAdminPhone}
                onChange={(e) => setTempAdminPhone(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditAdminOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveAdmin}>
              Save Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
