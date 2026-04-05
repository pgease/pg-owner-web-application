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
import { addTenant, checkRoomAvailability } from "@/api/propertyOwner";
import { toast } from "@/components/ui/use-toast";
import { useBlocks, useFloors, useRoomsList } from "@/hooks/usePropertyOwnerQueries";

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
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
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
    bedNumber: "",
    rentDueDate: "5",
    paymentMethod: "upi",
  });

  const blocks = useBlocks(selectedPgId).data ?? [];
  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floors = useFloors(selectedPgId, effectiveBlockId || undefined).data ?? [];
  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";
  const rooms = useRoomsList(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined).data ?? [];
  const vacantRooms = rooms.filter((r) => (Number(r.availableBeds) || 0) > 0);
  const effectiveRoomId = selectedRoomId || vacantRooms[0]?.id || "";

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleInviteTenant = async () => {
    if (!selectedPgId) {
      toast({ title: "Select a PG", variant: "destructive" });
      return;
    }
    const rent = parseInt(form.monthlyRent, 10) || 0;
    const security = parseInt(form.securityDeposit, 10) || 0;
    const bed = parseInt(form.bedNumber, 10) || 0;
    const due = parseInt(form.rentDueDate, 10) || 5;
    if (!form.name.trim() || !form.phone.trim() || !effectiveBlockId || !effectiveFloorId || !effectiveRoomId || bed <= 0) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const selectedRoom = vacantRooms.find((r) => r.id === effectiveRoomId);
      const roomNumParsed = selectedRoom
        ? parseInt(String(selectedRoom.roomNumber).replace(/\D/g, "").slice(0, 8), 10)
        : NaN;
      const blockName = blocks.find((b) => b.id === effectiveBlockId)?.name;
      const floorName = floors.find((f) => f.id === effectiveFloorId)?.name;
      const availability = await checkRoomAvailability(selectedPgId, {
        block: blockName,
        floorNumber: floorName,
        roomNumber: Number.isFinite(roomNumParsed) ? roomNumParsed : undefined,
        bedNumber: String(bed),
      });
      if (!availability.available) {
        toast({
          title: "Bed not available",
          description: availability.message || "Room check failed.",
          variant: "destructive",
        });
        return;
      }
      await addTenant(selectedPgId, {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.startsWith("+") ? form.phone : `+91${form.phone.replace(/\D/g, "")}`,
        floorId: effectiveFloorId,
        blockId: effectiveBlockId,
        roomId: effectiveRoomId,
        bedNumber: bed,
        rentDueDate: due,
        monthlyRent: rent,
        electricityBill: 0,
        securityDeposit: security,
        joiningDate: form.joiningDate || undefined,
      });
      toast({ title: "Invite sent", description: "Tenant will receive an invite." });
      onOpenChange(false);
      setForm({
        name: "", email: "", phone: "", joiningDate: "", monthlyRent: "", ac: "", cooler: "", geyser: "",
        securityDeposit: "", bedNumber: "", rentDueDate: "5",
        paymentMethod: "upi",
      });
      setSelectedBlockId("");
      setSelectedFloorId("");
      setSelectedRoomId("");
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
              <Select value={effectiveBlockId || "none"} onValueChange={(v) => { setSelectedBlockId(v); setSelectedFloorId(""); setSelectedRoomId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                  {blocks.length === 0 && <SelectItem value="none" disabled>No blocks</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FLOOR</Label>
              <Select value={effectiveFloorId || "none"} onValueChange={(v) => { setSelectedFloorId(v); setSelectedRoomId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                  {floors.length === 0 && <SelectItem value="none" disabled>No floors</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ROOM</Label>
              <Select value={effectiveRoomId || "none"} onValueChange={setSelectedRoomId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vacantRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {String(r.roomNumber)} ({r.availableBeds} available)
                    </SelectItem>
                  ))}
                  {vacantRooms.length === 0 && <SelectItem value="none" disabled>No vacant rooms</SelectItem>}
                </SelectContent>
              </Select>
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
