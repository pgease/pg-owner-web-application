import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { addTenant, type BlockItem, type FloorItem } from "@/api/propertyOwner";
import { toast } from "@/components/ui/use-toast";
import { useBlocks, useFloors, useRoomsList } from "@/hooks/usePropertyOwnerQueries";

const paymentOptions = [
  { id: "upi", label: "UPI" },
  { id: "bank", label: "Bank Transfer" },
  { id: "cash", label: "Cash" },
];

function idStr(id: unknown): string {
  if (id === undefined || id === null) return "";
  return String(id).trim();
}

function hasSelectValue(id: unknown): boolean {
  return idStr(id) !== "";
}

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTenantDialog({ open, onOpenChange, onSuccess }: AddTenantDialogProps) {
  const queryClient = useQueryClient();
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

  const blocksQuery = useBlocks(selectedPgId);
  const blocks: BlockItem[] = Array.isArray(blocksQuery.data) ? (blocksQuery.data as BlockItem[]) : [];

  const effectiveBlockId = useMemo(() => {
    if (hasSelectValue(selectedBlockId)) return idStr(selectedBlockId);
    const first = blocks[0];
    return first ? idStr(first.id) : "";
  }, [selectedBlockId, blocks]);

  const floorsQuery = useFloors(selectedPgId, effectiveBlockId || undefined);
  const floors: FloorItem[] = Array.isArray(floorsQuery.data) ? (floorsQuery.data as FloorItem[]) : [];

  const effectiveFloorId = useMemo(() => {
    if (hasSelectValue(selectedFloorId)) return idStr(selectedFloorId);
    const first = floors[0];
    return first ? idStr(first.id) : "";
  }, [selectedFloorId, floors]);

  const roomsQuery = useRoomsList(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined);
  const rooms = roomsQuery.data ?? [];
  const roomsInitialLoading =
    Boolean(selectedPgId && effectiveBlockId && effectiveFloorId) &&
    roomsQuery.isPending &&
    rooms.length === 0;

  useEffect(() => {
    if (open && selectedPgId && effectiveBlockId && effectiveFloorId) {
      queryClient.invalidateQueries({ queryKey: ["property", selectedPgId, "rooms-list"] });
    }
  }, [open, selectedPgId, effectiveBlockId, effectiveFloorId, queryClient]);

  useEffect(() => {
    if (open) {
      setSelectedBlockId("");
      setSelectedFloorId("");
      setSelectedRoomId("");
    }
  }, [open]);

  const selectableRooms = useMemo(() => rooms.filter((r) => hasSelectValue(r.id)), [rooms]);

  const effectiveRoomId = useMemo(() => {
    if (selectableRooms.length === 0) return "";
    const sel = idStr(selectedRoomId);
    const matched = sel && selectableRooms.some((r) => idStr(r.id) === sel);
    if (matched) return sel;
    return idStr(selectableRooms[0].id);
  }, [selectableRooms, selectedRoomId]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const getValidationError = (): string | null => {
    if (!selectedPgId) return "Select a PG from the header.";
    if (blocksQuery.isLoading && blocks.length === 0) return "Loading blocks…";
    if (!hasSelectValue(effectiveBlockId)) return "Select a block.";
    if (floorsQuery.isLoading && floors.length === 0) return "Loading floors…";
    if (!hasSelectValue(effectiveFloorId)) return "Select a floor.";
    if (roomsInitialLoading) return "Loading rooms…";
    if (selectableRooms.length === 0) {
      return "No rooms for this block and floor. Add rooms under My PGs → Structure.";
    }
    if (!hasSelectValue(effectiveRoomId)) return "Select a room.";
    if (!form.name.trim()) return "Enter the tenant’s name.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) return "Enter a valid 10-digit mobile number.";
    const bed = parseInt(form.bedNumber, 10);
    if (!Number.isFinite(bed) || bed < 1) return "Enter bed number (1 or more).";
    return null;
  };

  const validationError = getValidationError();
  const canSubmit = !submitting && validationError === null;

  const handleInviteTenant = async () => {
    const err = getValidationError();
    if (err) {
      toast({ title: "Can’t send invite", description: err, variant: "destructive" });
      return;
    }

    const rent = parseInt(form.monthlyRent, 10) || 0;
    const security = parseInt(form.securityDeposit, 10) || 0;
    const bed = parseInt(form.bedNumber, 10) || 0;
    const due = Math.min(28, Math.max(1, parseInt(form.rentDueDate, 10) || 5));

    try {
      setSubmitting(true);
      const propertyId = selectedPgId!;
      const electricityBill =
        (parseInt(form.ac, 10) || 0) +
        (parseInt(form.cooler, 10) || 0) +
        (parseInt(form.geyser, 10) || 0);

      // URL: …/add-tenant/:propertyId — body: floorId, blockId, roomId (UUIDs)
      await addTenant(propertyId, {
        name: form.name.trim(),
        phone: form.phone.startsWith("+") ? form.phone : `+91${form.phone.replace(/\D/g, "")}`,
        floorId: idStr(effectiveFloorId),
        blockId: idStr(effectiveBlockId),
        roomId: idStr(effectiveRoomId),
        bedNumber: bed,
        monthlyRent: rent,
        securityDeposit: security,
        rentDueDate: due,
        joiningDate: form.joiningDate || undefined,
        electricityBill,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Failed to invite tenant", description: message, variant: "destructive" });
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
          <DialogDescription className="sr-only">
            Enter tenant details and choose block, floor, room, and bed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NAME</Label>
              <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>NUMBER (10 digits)</Label>
            <Input placeholder="10-digit mobile" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </div>
          <div className="space-y-2">
            <Label>JOINING DATE (optional)</Label>
            <Input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>RENT (Monthly rent, AC, Cooler, Geyser)</Label>
            <div className="flex gap-2">
              <Input type="number" min={0} placeholder="Rent" value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} />
              <Input type="number" min={0} placeholder="AC" value={form.ac} onChange={(e) => update("ac", e.target.value)} className="w-20" />
              <Input type="number" min={0} placeholder="Cooler" value={form.cooler} onChange={(e) => update("cooler", e.target.value)} className="w-20" />
              <Input type="number" min={0} placeholder="Geyser" value={form.geyser} onChange={(e) => update("geyser", e.target.value)} className="w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SECURITY (optional)</Label>
              <Input type="number" min={0} placeholder="Security deposit" value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>RENT DUE DATE (day 1–28)</Label>
              <Input type="number" min={1} max={28} placeholder="5" value={form.rentDueDate} onChange={(e) => update("rentDueDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>BLOCK</Label>
              <Select
                value={hasSelectValue(effectiveBlockId) ? effectiveBlockId : "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  setSelectedBlockId(v);
                  setSelectedFloorId("");
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Block" /></SelectTrigger>
                <SelectContent>
                  {blocks.filter((b) => hasSelectValue(b.id)).map((b) => (
                    <SelectItem key={idStr(b.id)} value={idStr(b.id)}>{b.name}</SelectItem>
                  ))}
                  {blocks.length === 0 && !blocksQuery.isLoading && (
                    <SelectItem value="none" disabled>No blocks</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FLOOR</Label>
              <Select
                value={hasSelectValue(effectiveFloorId) ? effectiveFloorId : "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  setSelectedFloorId(v);
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Floor" /></SelectTrigger>
                <SelectContent>
                  {floors.filter((f) => hasSelectValue(f.id)).map((f) => (
                    <SelectItem key={idStr(f.id)} value={idStr(f.id)}>{f.name}</SelectItem>
                  ))}
                  {floors.length === 0 && !floorsQuery.isLoading && (
                    <SelectItem value="none" disabled>No floors</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ROOM</Label>
              <Select
                value={hasSelectValue(effectiveRoomId) ? effectiveRoomId : "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  setSelectedRoomId(v);
                }}
              >
                <SelectTrigger><SelectValue placeholder={roomsInitialLoading ? "Loading…" : "Room"} /></SelectTrigger>
                <SelectContent>
                  {selectableRooms.map((r, idx) => (
                    <SelectItem key={`${idStr(r.id)}-${idx}`} value={idStr(r.id)}>
                      {String(r.roomNumber)}
                      {typeof r.availableBeds === "number" ? ` (${r.availableBeds} available)` : ""}
                    </SelectItem>
                  ))}
                  {selectableRooms.length === 0 && (
                    <SelectItem value="none" disabled>
                      {roomsInitialLoading ? "Loading rooms…" : rooms.length === 0 ? "No rooms for this block/floor" : "No rooms with valid id"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>BED NO.</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 1"
                value={form.bedNumber}
                onChange={(e) => update("bedNumber", e.target.value)}
              />
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
            <Button onClick={handleInviteTenant} disabled={!canSubmit}>
              {submitting ? "Sending..." : "Invite tenant"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
