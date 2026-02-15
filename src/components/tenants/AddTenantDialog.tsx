import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { addTenant } from "@/api/propertyOwner";
import { toast } from "@/components/ui/use-toast";

const paymentOptions = [
  { id: "upi", label: "UPI" },
  { id: "bank", label: "Bank Transfer" },
  { id: "cash", label: "Cash" },
];

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTenantDialog({ open, onOpenChange, onSuccess }: AddTenantDialogProps) {
  const { selectedPgId, properties } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    joiningDate: "",
    monthlyRent: "",
    ac: "",
    cooler: "",
    geyser: "",
    securityDeposit: "",
    block: "A",
    floorNumber: "1",
    roomNumber: "",
    bedNumber: "",
    rentDueDate: "5",
    paymentMethod: "upi",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleInviteTenant = async () => {
    if (!selectedPgId) {
      toast({ title: "Select a PG", variant: "destructive" });
      return;
    }
    const rent = parseInt(form.monthlyRent, 10) || 0;
    const security = parseInt(form.securityDeposit, 10) || 0;
    const floor = parseInt(form.floorNumber, 10) || 1;
    const room = parseInt(form.roomNumber, 10) || 0;
    const bed = parseInt(form.bedNumber, 10) || 0;
    const due = parseInt(form.rentDueDate, 10) || 5;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || room <= 0 || bed <= 0) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await addTenant(selectedPgId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.startsWith("+") ? form.phone : `+91${form.phone.replace(/\D/g, "")}`,
        floorNumber: floor,
        block: form.block,
        roomNumber: room,
        bedNumber: bed,
        rentDueDate: due,
        monthlyRent: rent,
        electricityBill: 0,
        securityDeposit: security,
        joiningDate: form.joiningDate || undefined,
        isNewRoom: true,
      });
      toast({ title: "Invite sent", description: "Tenant will receive an invite." });
      onOpenChange(false);
      setForm({
        name: "", email: "", phone: "", joiningDate: "", monthlyRent: "", ac: "", cooler: "", geyser: "",
        securityDeposit: "", block: "A", floorNumber: "1", roomNumber: "", bedNumber: "", rentDueDate: "5",
        paymentMethod: "upi",
      });
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Failed to invite tenant", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPg = properties.find((p) => p.id === selectedPgId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add tenant {selectedPg ? `— ${selectedPg.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NAME</Label>
              <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email (for receipt & agreement)</Label>
              <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>NUMBER</Label>
            <Input placeholder="10-digit mobile" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </div>
          <div className="space-y-2">
            <Label>JOINING DATE</Label>
            <Input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>RENT (Monthly rent, AC, Cooler, Geyser)</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="Rent" value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} />
              <Input type="number" placeholder="AC" value={form.ac} onChange={(e) => update("ac", e.target.value)} className="w-20" />
              <Input type="number" placeholder="Cooler" value={form.cooler} onChange={(e) => update("cooler", e.target.value)} className="w-20" />
              <Input type="number" placeholder="Geyser" value={form.geyser} onChange={(e) => update("geyser", e.target.value)} className="w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SECURITY</Label>
              <Input type="number" placeholder="Security deposit" value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>RENT DUE DATE (day of month)</Label>
              <Input type="number" min={1} max={28} placeholder="5" value={form.rentDueDate} onChange={(e) => update("rentDueDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>BLOCK</Label>
              <Select value={form.block} onValueChange={(v) => update("block", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FLOOR</Label>
              <Input placeholder="Floor" value={form.floorNumber} onChange={(e) => update("floorNumber", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ROOM</Label>
              <Input placeholder="Room no" value={form.roomNumber} onChange={(e) => update("roomNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>BED NO.</Label>
              <Input placeholder="Bed no" value={form.bedNumber} onChange={(e) => update("bedNumber", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Collect rent via (payment method)</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => update("paymentMethod", v)}>
              <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
              <SelectContent>
                {paymentOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleInviteTenant} disabled={submitting}>
              {submitting ? "Sending..." : "Invite tenant"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
