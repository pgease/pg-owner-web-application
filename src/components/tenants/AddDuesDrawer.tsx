import React, { useState } from "react";
import { Search, Plus, Check, AlertCircle, FileText, Calendar, IndianRupee } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { postManualRentCollection, createTenantDue } from "@/api/propertyOwner";
import { useQueryClient } from "@tanstack/react-query";

interface AddDuesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  roomTenantId: string;
  tenantName?: string;
  monthlyRent?: number;
}

interface DueTypeItem {
  id: string;
  name: string;
  fixedAmount?: number;
  fixedText?: string;
}

const DUE_TYPES: DueTypeItem[] = [
  { id: "rent", name: "Rent" },
  { id: "security_deposit", name: "Security Deposit" },
  { id: "police_verification", name: "Police Verification" },
  { id: "mess", name: "Mess" },
  { id: "electricity_bill", name: "Electricity Bill" },
  { id: "manual_late_fine", name: "Manual Late Fine" },
  { id: "wifi", name: "Wifi" },
  { id: "maintenance_bill", name: "Maintenance Bill" },
  { id: "laundry_bill", name: "Laundry Bill" },
  { id: "rental_agreement_charges", name: "Rental Agreement Charges" },
  { id: "3_months_rent_package", name: "3 Months Rent Package" },
  { id: "6_months_rent_package", name: "6 Months Rent Package" },
  { id: "9_months_rent_package", name: "9 Months Rent Package" },
  { id: "yearly_rent_package", name: "Yearly Rent Package" },
  { id: "weekly_rent_package", name: "Weekly Rent Package" },
  { id: "daily_rent_package", name: "Daily Rent Package" },
  { id: "others", name: "Others" },
  { id: "joining_fee", name: "Joining Fee" },
];

export const AddDuesDrawer: React.FC<AddDuesDrawerProps> = ({
  open,
  onOpenChange,
  propertyId,
  roomTenantId,
  tenantName = "Tenant",
  monthlyRent = 0,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDueType, setSelectedDueType] = useState<DueTypeItem | null>(null);
  
  // Form State
  const now = new Date();
  const [amount, setAmount] = useState<string>("");
  const [periodMonth, setPeriodMonth] = useState<number>(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState<number>(now.getFullYear());
  const [dueDate, setDueDate] = useState<string>(now.toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDues = DUE_TYPES.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleOpenModal = (dueType: DueTypeItem) => {
    setSelectedDueType(dueType);
    if (dueType.id === "rent") {
      setAmount(String(monthlyRent || ""));
    } else {
      setAmount("");
    }
    setNotes("");
  };

  const handleCreateDue = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Enter valid amount",
        description: "Due amount must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await createTenantDue(
          roomTenantId,
          {
            dueType: selectedDueType?.name || "Other",
            title: `${selectedDueType?.name || "Due"} (${periodMonth}/${periodYear})`,
            amount: numAmount,
            description: notes.trim() || undefined,
            dueDate: dueDate || undefined,
          },
          propertyId
        );
      } catch (dueErr) {
        console.warn("createTenantDue endpoint failed, trying fallback to postManualRentCollection:", dueErr);
        await postManualRentCollection(propertyId, {
          roomTenantId,
          amountPaid: 0, // Unsettled due created
          status: "pending",
          dueType: selectedDueType?.name || "Other",
          periodMonth,
          periodYear,
          notes: notes.trim() || undefined,
          paymentMethod: "pending_invoice",
        });
      }

      toast({
        title: `${selectedDueType?.name || "Invoice"} Dues Created`,
        description: `Added ₹${numAmount} due for ${tenantName}.`,
      });

      setSelectedDueType(null);
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["room-tenant", roomTenantId] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-all-dues"] });
      void queryClient.invalidateQueries({ queryKey: ["rent-payments", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["rent-collection-dashboard"] });
    } catch (err: any) {
      toast({
        title: "Could not create dues",
        description: err?.message || "Please check details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-slate-900">
          <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#008080]" />
              Add Invoice & Dues
            </SheetTitle>
            <SheetDescription className="text-xs">
              Select an invoice type to add outstanding dues for {tenantName}.
            </SheetDescription>

            {/* Search Input */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search dues types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </SheetHeader>

          {/* Dues Types List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredDues.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#008080] bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {item.id === "rent" && monthlyRent ? `Fixed Amount: ₹${monthlyRent.toLocaleString("en-IN")}` : "Fixed amount: Not fixed"}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-[#008080] hover:bg-[#006666] text-white gap-1"
                  onClick={() => handleOpenModal(item)}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Due Detail Form Modal */}
      <Dialog open={Boolean(selectedDueType)} onOpenChange={(o) => !o && setSelectedDueType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-[#008080]" />
              Generate Dues — {selectedDueType?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount (e.g. 2000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Billing Month</Label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="w-full h-9 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Billing Year</Label>
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="w-full h-9 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description / Notes (Optional)</Label>
              <Textarea
                placeholder="Add billing remarks or breakdown..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedDueType(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#008080] hover:bg-[#006666] text-white font-semibold"
              onClick={handleCreateDue}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Confirm & Create Dues"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
