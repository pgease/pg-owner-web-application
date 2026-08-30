import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Check, Search, Calendar, ChevronRight, ChevronLeft } from "lucide-react";

function idStr(id: unknown): string {
  if (id === undefined || id === null) return "";
  return String(id).trim();
}

function hasSelectValue(id: unknown): boolean {
  return idStr(id) !== "";
}

export interface AddTenantFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showFooter?: boolean;
}

export function AddTenantForm({ onSuccess, onCancel, showFooter = true }: AddTenantFormProps) {
  const queryClient = useQueryClient();
  const { selectedPgId, properties } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- STEP 1: Tenant Details State ---
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantType, setTenantType] = useState("Student");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [bedNumber, setBedNumber] = useState("1");
  const [isTempBed, setIsTempBed] = useState(false);
  const [bookedBy, setBookedBy] = useState("");
  const [referredBy, setReferredBy] = useState("");

  // --- STEP 2: Stay Details State ---
  const [stayType, setStayType] = useState("Long Stay");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [moveOutDate, setMoveOutDate] = useState("");
  const [lockInPeriod, setLockInPeriod] = useState("0");
  const [noticePeriod, setNoticePeriod] = useState("30");
  const [agreementPeriod, setAgreementPeriod] = useState("11 Months");
  const [fixedRent, setFixedRent] = useState("0");
  const [rentalFrequency, setRentalFrequency] = useState("Monthly");
  const [rentDueDate, setRentDueDate] = useState("1st");
  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [electricityMeter, setElectricityMeter] = useState(false);

  // --- STEP 3: Payment Details State ---
  const [rentDueAmt, setRentDueAmt] = useState("0");
  const [rentCollAmt, setRentCollAmt] = useState("0");
  const [depositDueAmt, setDepositDueAmt] = useState("0");
  const [depositCollAmt, setDepositCollAmt] = useState("0");
  const [joiningDueAmt, setJoiningDueAmt] = useState("0");
  const [joiningCollAmt, setJoiningCollAmt] = useState("0");

  const [duesSearch, setDuesSearch] = useState("");
  const [otherDues, setOtherDues] = useState<Array<{ id: string; label: string; mode: "consumption" | "fixed"; amount: string }>>([
    { id: "rent", label: "Rent", mode: "consumption", amount: "" },
    { id: "deposit", label: "Security Deposit", mode: "consumption", amount: "" },
    { id: "electricity_meter", label: "Electricity Meter", mode: "consumption", amount: "" },
    { id: "police", label: "Police Verification", mode: "consumption", amount: "" },
    { id: "mess", label: "Mess", mode: "consumption", amount: "" },
    { id: "electricity_bill", label: "Electricity Bill", mode: "consumption", amount: "" },
    { id: "fine", label: "Manual Late Fine", mode: "consumption", amount: "" },
    { id: "wifi", label: "Wifi", mode: "consumption", amount: "" },
    { id: "maintenance", label: "Maintenance Bill", mode: "consumption", amount: "" },
    { id: "laundry", label: "Laundry Bill", mode: "consumption", amount: "" },
    { id: "agreement_charges", label: "Rental Agreement Charges", mode: "consumption", amount: "" },
    { id: "pkg_3", label: "3 Months Rent Package", mode: "consumption", amount: "" },
    { id: "pkg_6", label: "6 Months Rent Package", mode: "consumption", amount: "" },
    { id: "pkg_9", label: "9 Months Rent Package", mode: "consumption", amount: "" },
    { id: "pkg_12", label: "Yearly Rent Package", mode: "consumption", amount: "" },
    { id: "pkg_weekly", label: "Weekly Rent Package", mode: "consumption", amount: "" },
    { id: "pkg_daily", label: "Daily Rent Package", mode: "consumption", amount: "" },
    { id: "joining_fee", label: "Joining Fee", mode: "consumption", amount: "" },
    { id: "auto_joining_fee", label: "Automatic Joining Fee", mode: "consumption", amount: "" },
    { id: "auto_moveout_charges", label: "Automatic Move out Charges", mode: "consumption", amount: "" },
    { id: "others", label: "Others", mode: "consumption", amount: "" },
  ]);

  // Queries for Room Allocation
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
    if (selectedPgId && effectiveBlockId && effectiveFloorId) {
      queryClient.invalidateQueries({ queryKey: ["property", selectedPgId, "rooms-list"] });
    }
  }, [selectedPgId, effectiveBlockId, effectiveFloorId, queryClient]);

  const selectableRooms = useMemo(() => rooms.filter((r) => hasSelectValue(r.id)), [rooms]);

  const effectiveRoomId = useMemo(() => {
    if (selectableRooms.length === 0) return "";
    const sel = idStr(selectedRoomId);
    const matched = sel && selectableRooms.some((r) => idStr(r.id) === sel);
    if (matched) return sel;
    return idStr(selectableRooms[0].id);
  }, [selectableRooms, selectedRoomId]);

  const selectedPg = properties.find((p) => p.id === selectedPgId);

  // Sync Fixed Rent & Deposit to Payment details dues on change
  useEffect(() => {
    setRentDueAmt(fixedRent);
    setDepositDueAmt(securityDeposit);
  }, [fixedRent, securityDeposit]);

  const getValidationError = (): string | null => {
    if (!selectedPgId) return "Select a PG from the header.";
    if (!name.trim()) return "Enter tenant name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return "Enter valid 10-digit mobile contact.";
    if (!hasSelectValue(effectiveRoomId)) return "Select room for allocation.";
    return null;
  };

  const validationError = getValidationError();

  const handleInviteTenant = async () => {
    const err = getValidationError();
    if (err) {
      toast({ title: "Cannot Add Tenant", description: err, variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const propertyId = selectedPgId!;

      const fullPayload = {
        tenantDetails: {
          name: name.trim(),
          phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
          tenantType,
          propertyId,
          blockId: idStr(effectiveBlockId),
          floorId: idStr(effectiveFloorId),
          roomId: idStr(effectiveRoomId),
          bedNumber: parseInt(bedNumber, 10) || 1,
          isTempBed,
          bookedBy: bookedBy.trim() || null,
          referredBy: referredBy.trim() || null,
        },
        stayDetails: {
          stayType,
          moveInDate,
          moveOutDate: moveOutDate || null,
          lockInPeriodMonths: parseInt(lockInPeriod, 10) || 0,
          noticePeriodDays: parseInt(noticePeriod, 10) || 30,
          agreementPeriod,
          rentalTerms: {
            fixedRent: parseInt(fixedRent, 10) || 0,
            rentalFrequency,
            addRentOn: rentDueDate,
            securityDeposit: parseInt(securityDeposit, 10) || 0,
            electricityMeter,
          }
        },
        paymentDetails: {
          openingBalance: [
            { dueType: "Aug Rent", dueFor: "31 Aug' 26 - 31 Aug' 26", dueAmount: parseInt(rentDueAmt, 10) || 0, collection: parseInt(rentCollAmt, 10) || 0 },
            { dueType: "Security Deposit", dueFor: "One Time", dueAmount: parseInt(depositDueAmt, 10) || 0, collection: parseInt(depositCollAmt, 10) || 0 },
            { dueType: "Joining Fee", dueFor: "One Time", dueAmount: parseInt(joiningDueAmt, 10) || 0, collection: parseInt(joiningCollAmt, 10) || 0 },
          ],
          otherDues: otherDues
            .filter((d) => d.mode === "fixed" || d.amount !== "")
            .map((d) => ({
              dueType: d.label,
              mode: d.mode,
              amount: d.mode === "fixed" ? parseInt(d.amount, 10) || 0 : null,
            }))
        }
      };

      await addTenant(propertyId, {
        name: fullPayload.tenantDetails.name,
        phone: fullPayload.tenantDetails.phone,
        floorId: fullPayload.tenantDetails.floorId,
        blockId: fullPayload.tenantDetails.blockId,
        roomId: fullPayload.tenantDetails.roomId,
        bedNumber: fullPayload.tenantDetails.bedNumber,
        monthlyRent: fullPayload.stayDetails.rentalTerms.fixedRent,
        securityDeposit: fullPayload.stayDetails.rentalTerms.securityDeposit,
        rentDueDate: parseInt(rentDueDate.replace(/\D/g, "")) || 1,
        joiningDate: fullPayload.stayDetails.moveInDate,
        electricityBill: 0,
      });

      console.log("Full RentOK-Style Onboarding Form Payload Submitted to Client Hooks:", fullPayload);
      toast({ title: "Tenant Added Successfully", description: "Invite sent & room allocated." });
      onSuccess?.();
    } catch (e: unknown) {
      toast({
        title: "Could not add tenant",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDues = otherDues.filter((d) =>
    d.label.toLowerCase().includes(duesSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 3-Step Wizard Progress Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex gap-2 w-full max-w-xl">
          {[
            { stepNum: 1, label: "Tenant Details" },
            { stepNum: 2, label: "Stay Details" },
            { stepNum: 3, label: "Payment Details" },
          ].map((s) => (
            <button
              key={s.stepNum}
              type="button"
              onClick={() => setStep(s.stepNum as 1 | 2 | 3)}
              className="flex-1 text-left focus:outline-none"
            >
              <div
                className={`h-1 rounded transition-colors duration-300 ${
                  step >= s.stepNum ? "bg-primary" : "bg-muted"
                }`}
              />
              <span
                className={`text-xs font-semibold mt-2 block transition-colors duration-300 ${
                  step === s.stepNum
                    ? "text-primary"
                    : step > s.stepNum
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.stepNum}. {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: TENANT DETAILS */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Add your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  placeholder="10-digit contact number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenant Type</Label>
              <Select value={tenantType} onValueChange={setTenantType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tenant Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Working Professional">Working Professional</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property</Label>
              <Input value={selectedPg?.name || "Saksham Pg"} disabled className="bg-muted/50 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Block</Label>
              <Select
                value={hasSelectValue(effectiveBlockId) ? effectiveBlockId : "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  setSelectedBlockId(v);
                  setSelectedFloorId("");
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Block" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.filter((b) => hasSelectValue(b.id)).map((b) => (
                    <SelectItem key={idStr(b.id)} value={idStr(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                  {blocks.length === 0 && !blocksQuery.isLoading && <SelectItem value="none" disabled>No blocks</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Floor</Label>
              <Select
                value={hasSelectValue(effectiveFloorId) ? effectiveFloorId : "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  setSelectedFloorId(v);
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.filter((f) => hasSelectValue(f.id)).map((f) => (
                    <SelectItem key={idStr(f.id)} value={idStr(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                  {floors.length === 0 && !floorsQuery.isLoading && <SelectItem value="none" disabled>No floors</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Room & Bed</Label>
              <div className="flex gap-2">
                <Select
                  value={hasSelectValue(effectiveRoomId) ? effectiveRoomId : "none"}
                  onValueChange={(v) => {
                    if (v === "none") return;
                    setSelectedRoomId(v);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={roomsInitialLoading ? "Loading…" : "Room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRooms.map((r, idx) => (
                      <SelectItem key={`${idStr(r.id)}-${idx}`} value={idStr(r.id)}>
                        Room {String(r.roomNumber)}
                        {typeof r.availableBeds === "number" ? ` (${r.availableBeds} free)` : ""}
                      </SelectItem>
                    ))}
                    {selectableRooms.length === 0 && (
                      <SelectItem value="none" disabled>
                        {roomsInitialLoading ? "Loading rooms…" : "No rooms"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  placeholder="Bed"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold">Other Details</h4>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Is this a temp bed?</Label>
                <p className="text-xs text-muted-foreground">Turn on if this is a temporary bed</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTempBed(!isTempBed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isTempBed ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    isTempBed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booked By</Label>
                <Input
                  placeholder="Booked By"
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Referred By</Label>
                <Input
                  placeholder="Referred By"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: STAY DETAILS */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stay Type</Label>
              <Select value={stayType} onValueChange={setStayType}>
                <SelectTrigger>
                  <SelectValue placeholder="Stay Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Long Stay">Long Stay</SelectItem>
                  <SelectItem value="Daily Stay">Daily Stay</SelectItem>
                  <SelectItem value="Short Stay">Short Stay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Move-in</Label>
                <Input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Move-out</Label>
                <Input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Lock-in Period</Label>
              <Select value={lockInPeriod} onValueChange={setLockInPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Lock-in Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 months</SelectItem>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="2">2 months</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notice Period</Label>
              <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Notice Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="45">45 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agreement Period</Label>
              <Select value={agreementPeriod} onValueChange={setAgreementPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agreement Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 Months">3 Months</SelectItem>
                  <SelectItem value="6 Months">6 Months</SelectItem>
                  <SelectItem value="11 Months">11 Months</SelectItem>
                  <SelectItem value="12 Months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Rental Terms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fixed Rent</Label>
                <div className="flex gap-2">
                  <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={fixedRent}
                    onChange={(e) => setFixedRent(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rental Frequency</Label>
                <Select value={rentalFrequency} onValueChange={setRentalFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rental Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Add Rent On</Label>
                <Select value={rentDueDate} onValueChange={setRentDueDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add Rent On" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st of every month</SelectItem>
                    <SelectItem value="5th">5th of every month</SelectItem>
                    <SelectItem value="10th">10th of every month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Regular Security Deposit</Label>
                <div className="flex gap-2">
                  <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Electricity Meter</Label>
                <p className="text-xs text-muted-foreground">Calculate charges based on sub-meter consumption</p>
              </div>
              <button
                type="button"
                onClick={() => setElectricityMeter(!electricityMeter)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  electricityMeter ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    electricityMeter ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT DETAILS & OPENING BALANCES */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Opening Balance</h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground">Due Type</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Due For</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Due Amount (₹)</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Collection (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 font-medium text-foreground">Aug Rent</td>
                    <td className="p-3 text-muted-foreground text-xs">31 Aug' 26 - 31 Aug' 26</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={rentDueAmt}
                        onChange={(e) => setRentDueAmt(e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={rentCollAmt}
                        onChange={(e) => setRentCollAmt(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Security Deposit</td>
                    <td className="p-3 text-muted-foreground text-xs">One Time</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={depositDueAmt}
                        onChange={(e) => setDepositDueAmt(e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={depositCollAmt}
                        onChange={(e) => setDepositCollAmt(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Joining Fee</td>
                    <td className="p-3 text-muted-foreground text-xs">One Time</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={joiningDueAmt}
                        onChange={(e) => setJoiningDueAmt(e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        value={joiningCollAmt}
                        onChange={(e) => setJoiningCollAmt(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-foreground">Add Other Dues</h4>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dues here..."
                  className="pl-8 h-9 text-xs"
                  value={duesSearch}
                  onChange={(e) => setDuesSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredDues.map((d, index) => {
                const isConsumption = d.mode === "consumption";
                return (
                  <div
                    key={d.id}
                    className="flex flex-col justify-between border rounded-lg p-3 bg-muted/10 space-y-2 hover:bg-muted/25 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-semibold text-foreground leading-snug">{d.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...otherDues];
                          const realIdx = otherDues.findIndex((x) => x.id === d.id);
                          updated[realIdx].mode = isConsumption ? "fixed" : "consumption";
                          if (isConsumption) {
                            updated[realIdx].amount = "0";
                          } else {
                            updated[realIdx].amount = "";
                          }
                          setOtherDues(updated);
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                          isConsumption
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                            : "bg-primary/5 text-primary border-primary/20"
                        }`}
                      >
                        {isConsumption ? "As per consumption" : "Fixed Amount"}
                      </button>
                    </div>
                    {!isConsumption && (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          placeholder="Amount"
                          className="h-7 text-xs flex-1"
                          value={d.amount}
                          onChange={(e) => {
                            const updated = [...otherDues];
                            const realIdx = otherDues.findIndex((x) => x.id === d.id);
                            updated[realIdx].amount = e.target.value;
                            setOtherDues(updated);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER WIZARD ACTIONS */}
      {validationError && step === 3 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
          ⚠️ {validationError}
        </p>
      )}

      {showFooter && (
        <div className="flex justify-between items-center border-t pt-4">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                disabled={step === 1 && (!name.trim() || phone.replace(/\D/g, "").length < 10 || !hasSelectValue(effectiveRoomId))}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleInviteTenant}
                disabled={submitting || !!validationError}
              >
                {submitting ? "Inviting…" : "Invite & Save Tenant"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
