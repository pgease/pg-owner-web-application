import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import {
  addTenant,
  updatePropertyTenant,
  createBlock,
  createFloor,
  createRoom,
  updateRoom,
  type BlockItem,
  type FloorItem,
} from "@/api/propertyOwner";
import { toast } from "@/components/ui/use-toast";
import { useBlocks, useFloors, useRoomsList, usePropertyTenants, queryKeys } from "@/hooks/usePropertyOwnerQueries";
import { Check, Search, ChevronRight, ChevronLeft, Plus, Minus, DoorOpen, Bed as BedIcon, Lock, Layers, Building, Phone } from "lucide-react";

function idStr(id: unknown): string {
  if (id === undefined || id === null) return "";
  return String(id).trim();
}

function hasSelectValue(id: unknown): boolean {
  return idStr(id) !== "";
}

const STEPS = [
  { number: 1 as const, label: "Tenant Details" },
  { number: 2 as const, label: "Stay Details" },
  { number: 3 as const, label: "Payment Details" },
];

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
  const [otherDetailsOpen, setOtherDetailsOpen] = useState(false);

  // --- STEP 1: Tenant Details State ---
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantType, setTenantType] = useState("Student");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [bedNumber, setBedNumber] = useState("1");
  const [bookedBy, setBookedBy] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [sendWhatsappReminder, setSendWhatsappReminder] = useState(true);
  const [expandedOtherDetails, setExpandedOtherDetails] = useState<string>("none");

  // Personal Details
  const [remarks, setRemarks] = useState("");
  const [email, setEmail] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [foodPreference, setFoodPreference] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  
  // Structured Permanent Address (8 fields per spec)
  const [permHouseNumber, setPermHouseNumber] = useState("");
  const [permStreet, setPermStreet] = useState("");
  const [permLocality, setPermLocality] = useState("");
  const [permCity, setPermCity] = useState("");
  const [permDistrict, setPermDistrict] = useState("");
  const [permState, setPermState] = useState("");
  const [permCountry, setPermCountry] = useState("India");
  const [permPincode, setPermPincode] = useState("");

  // Structured Current Address (8 fields per spec)
  const [currHouseNumber, setCurrHouseNumber] = useState("");
  const [currStreet, setCurrStreet] = useState("");
  const [currLocality, setCurrLocality] = useState("");
  const [currCity, setCurrCity] = useState("");
  const [currDistrict, setCurrDistrict] = useState("");
  const [currState, setCurrState] = useState("");
  const [currCountry, setCurrCountry] = useState("India");
  const [currPincode, setCurrPincode] = useState("");
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  const [nationality, setNationality] = useState("Indian");

  // Sync Current Address when "sameAsPermanent" is checked
  useEffect(() => {
    if (sameAsPermanent) {
      setCurrHouseNumber(permHouseNumber);
      setCurrStreet(permStreet);
      setCurrLocality(permLocality);
      setCurrCity(permCity);
      setCurrDistrict(permDistrict);
      setCurrState(permState);
      setCurrCountry(permCountry);
      setCurrPincode(permPincode);
    }
  }, [
    sameAsPermanent,
    permHouseNumber,
    permStreet,
    permLocality,
    permCity,
    permDistrict,
    permState,
    permCountry,
    permPincode,
  ]);

  // GST Details
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [businessOwnerName, setBusinessOwnerName] = useState("");

  // Parent Details
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");

  // Local Guardian Details
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");

  // Bank Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // Stay timing
  const [checkinTime, setCheckinTime] = useState("12:00 PM");
  const [checkoutTime, setCheckoutTime] = useState("11:00 AM");

  // --- STEP 2: Stay Details State ---
  const [stayType, setStayType] = useState("Long Stay");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [moveOutDate, setMoveOutDate] = useState("");
  const [lockInPeriod, setLockInPeriod] = useState("0");
  const [noticePeriod, setNoticePeriod] = useState("30");
  const [agreementPeriod, setAgreementPeriod] = useState("11 Months");
  const [fixedRent, setFixedRent] = useState("");
  const [rentalFrequency, setRentalFrequency] = useState("Monthly");
  const [rentDueDate, setRentDueDate] = useState("1st");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [electricityBill, setElectricityBill] = useState("0");
  const [electricityMeter, setElectricityMeter] = useState(false);

  // Rent Engine Invoicing Rules
  const [billingStartDate, setBillingStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [gracePeriodDays, setGracePeriodDays] = useState("0");
  const [rentDisabled, setRentDisabled] = useState(false);

  // --- STEP 3: Payment Details State ---
  const [rentDueAmt, setRentDueAmt] = useState("0");
  const [rentCollAmt, setRentCollAmt] = useState("0");
  const [depositDueAmt, setDepositDueAmt] = useState("0");
  const [depositCollAmt, setDepositCollAmt] = useState("0");
  const [joiningDueAmt, setJoiningDueAmt] = useState("0");
  const [joiningCollAmt, setJoiningCollAmt] = useState("0");

  const [showOtherDues, setShowOtherDues] = useState(false);
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

  const tenantsQuery = usePropertyTenants(selectedPgId);
  const currentRoomTenants = useMemo(() => {
    if (!effectiveRoomId || !Array.isArray(tenantsQuery.data)) return [];
    return (tenantsQuery.data as any[]).filter((t) => {
      const rId = idStr(t.roomId || t.room_id || t.room?.id || t.roomInfo?.id || t.roomTenant?.roomId);
      return rId === effectiveRoomId;
    });
  }, [effectiveRoomId, tenantsQuery.data]);

  const selectedRoomObj = useMemo(() => {
    return rooms.find((r) => idStr(r.id) === effectiveRoomId);
  }, [rooms, effectiveRoomId]);

  const bedOptions = useMemo(() => {
    const totalBeds = selectedRoomObj?.numberOfBeds ?? (selectedRoomObj as any)?.totalBeds ?? 4;
    const list = [];
    for (let i = 1; i <= totalBeds; i++) {
      const occupant = currentRoomTenants.find((t) => {
        const bNum = Number(
          t.bedNumber ??
          t.roomTenant?.bedNumberOnAssignment ??
          t.bed?.bedNumber ??
          t.bed_number ??
          t.bedNumberOnAssignment
        );
        return bNum === i;
      });
      list.push({
        number: i,
        isOccupied: Boolean(occupant),
        occupantName: occupant?.name || occupant?.tenantName || occupant?.tenant_name || "",
        occupantPhone: occupant?.phone || occupant?.mobileNumber || occupant?.contactNumber || "",
        occupantMoveIn: occupant?.moveInDate || occupant?.joiningDate || occupant?.createdAt || "",
      });
    }
    return list;
  }, [selectedRoomObj, currentRoomTenants]);

  // Reset bed selection when room changes (no auto-selection)
  useEffect(() => {
    setBedNumber("");
  }, [effectiveRoomId]);

  // Quick Structure Creation Modals & Double Check Confirmation States
  const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [creatingBlock, setCreatingBlock] = useState(false);
  const [confirmBlockStage, setConfirmBlockStage] = useState(false);

  const [addFloorModalOpen, setAddFloorModalOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [creatingFloor, setCreatingFloor] = useState(false);
  const [confirmFloorStage, setConfirmFloorStage] = useState(false);

  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomBeds, setNewRoomBeds] = useState(2);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [confirmRoomStage, setConfirmRoomStage] = useState(false);

  const [addBedConfirmOpen, setAddBedConfirmOpen] = useState(false);
  const [addingBed, setAddingBed] = useState(false);

  const handleAddBed = async () => {
    if (!selectedPgId || !effectiveRoomId || !selectedRoomObj) {
      toast({ title: "Select a Room first", description: "Please select a room before adding a bed.", variant: "destructive" });
      return;
    }
    try {
      setAddingBed(true);
      const currentBeds = selectedRoomObj.numberOfBeds ?? (selectedRoomObj as any)?.totalBeds ?? 4;
      const newBedNum = currentBeds + 1;
      await updateRoom(selectedPgId, effectiveRoomId, { numberOfBeds: newBedNum });
      toast({ title: "Bed Added", description: `Added Bed ${newBedNum} to Room ${selectedRoomObj.roomNumber || ""}.` });
      setBedNumber(String(newBedNum));
      await queryClient.refetchQueries({ queryKey: ["property", selectedPgId, "rooms-list"] });
      await queryClient.refetchQueries({ queryKey: ["property", selectedPgId, "tenants"] });
    } catch (e: any) {
      toast({ title: "Could not add bed", description: e.message || "Failed to update room beds", variant: "destructive" });
    } finally {
      setAddingBed(false);
    }
  };

  const handleCreateBlock = async () => {
    if (!selectedPgId || !newBlockName.trim()) return;
    try {
      setCreatingBlock(true);
      const res = await createBlock(selectedPgId, { name: newBlockName.trim() });
      toast({ title: "Block Created", description: `Block "${newBlockName}" added successfully.` });
      const createdItem = (res && typeof res === "object" && ("block" in res ? res.block : "data" in res ? res.data : res)) || res;
      const newId = idStr((createdItem as any)?.id || res);

      setNewBlockName("");
      setAddBlockModalOpen(false);
      setConfirmBlockStage(false);

      if (createdItem && newId) {
        queryClient.setQueryData(queryKeys.blocks(selectedPgId), (old: any) => {
          const list = Array.isArray(old) ? old : (old?.data || []);
          return [...list, createdItem];
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["property", selectedPgId] });
      if (newId) {
        setSelectedBlockId(newId);
        setSelectedFloorId("");
        setSelectedRoomId("");
      }
    } catch (e: any) {
      toast({ title: "Failed to create block", description: e.message, variant: "destructive" });
    } finally {
      setCreatingBlock(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!selectedPgId || !effectiveBlockId || !newFloorName.trim()) return;
    try {
      setCreatingFloor(true);
      const res = await createFloor(selectedPgId, effectiveBlockId, { name: newFloorName.trim() });
      toast({ title: "Floor Created", description: `Floor "${newFloorName}" added successfully.` });
      const createdItem = (res && typeof res === "object" && ("floor" in res ? res.floor : "data" in res ? res.data : res)) || res;
      const newId = idStr((createdItem as any)?.id || res);

      setNewFloorName("");
      setAddFloorModalOpen(false);
      setConfirmFloorStage(false);

      if (createdItem && newId) {
        queryClient.setQueryData(queryKeys.floors(selectedPgId, effectiveBlockId), (old: any) => {
          const list = Array.isArray(old) ? old : (old?.data || []);
          return [...list, createdItem];
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["property", selectedPgId] });
      if (newId) {
        setSelectedFloorId(newId);
        setSelectedRoomId("");
      }
    } catch (e: any) {
      toast({ title: "Failed to create floor", description: e.message, variant: "destructive" });
    } finally {
      setCreatingFloor(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedPgId || !effectiveFloorId || !newRoomNumber.trim()) return;
    try {
      setCreatingRoom(true);
      const res = await createRoom(selectedPgId, {
        floorId: effectiveFloorId,
        roomNumber: newRoomNumber.trim(),
        numberOfBeds: newRoomBeds || 2,
      });
      toast({ title: "Room Created", description: `Room "${newRoomNumber}" added successfully.` });
      const createdItem = (res && typeof res === "object" && ("room" in res ? res.room : "data" in res ? res.data : res)) || res;
      const newId = idStr((createdItem as any)?.id || res);

      setNewRoomNumber("");
      setNewRoomBeds(2);
      setAddRoomModalOpen(false);
      setConfirmRoomStage(false);

      if (createdItem && newId) {
        queryClient.setQueryData(queryKeys.roomsList(selectedPgId, effectiveBlockId, effectiveFloorId), (old: any) => {
          const list = Array.isArray(old) ? old : (old?.data || []);
          return [...list, createdItem];
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["property", selectedPgId] });
      if (newId) setSelectedRoomId(newId);
    } catch (e: any) {
      toast({ title: "Failed to create room", description: e.message, variant: "destructive" });
    } finally {
      setCreatingRoom(false);
    }
  };

  const selectedPg = properties.find((p) => p.id === selectedPgId);

  // Sync Fixed Rent & Deposit to Payment details dues on change
  useEffect(() => {
    setRentDueAmt(fixedRent || "0");
    setDepositDueAmt(securityDeposit || "0");
  }, [fixedRent, securityDeposit]);

  // Dynamically compute rent due label (e.g. "Sep Rent") and cycle date range based on move-in date
  const { rentDueType, rentDueFor } = useMemo(() => {
    try {
      const parts = (moveInDate || new Date().toISOString().split("T")[0]).split("-");
      const y = parseInt(parts[0], 10) || new Date().getFullYear();
      const m = (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
      const d = parseInt(parts[2], 10) || new Date().getDate();

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthShort = monthNames[m] || "Sep";
      const yearShort = String(y).slice(-2);
      const lastDay = new Date(y, m + 1, 0).getDate();

      return {
        rentDueType: `${monthShort} Rent`,
        rentDueFor: `${String(d).padStart(2, "0")} ${monthShort}' ${yearShort} - ${String(lastDay).padStart(2, "0")} ${monthShort}' ${yearShort}`,
      };
    } catch {
      return {
        rentDueType: "Rent",
        rentDueFor: "Current Month Cycle",
      };
    }
  }, [moveInDate]);

  const getStepOneError = (): string | null => {
    if (!selectedPgId) return "Select a PG property from the header.";
    if (!name.trim()) return "Enter tenant full name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return "Enter a valid 10-digit contact number.";
    if (!hasSelectValue(effectiveRoomId)) return "Select a room for allocation.";
    if (!bedNumber) return "Select an available bed for allocation.";
    return null;
  };

  const getStepTwoError = (): string | null => {
    if (!moveInDate) return "Enter move-in / joining date.";
    const rentNum = parseInt(fixedRent, 10);
    if (isNaN(rentNum) || rentNum <= 0) return "Enter monthly fixed rent amount (must be greater than 0).";
    return null;
  };

  const stepOneError = getStepOneError();
  const stepTwoError = getStepTwoError();

  const goNext = () => {
    if (step === 1 && stepOneError) {
      toast({ title: "Incomplete Tenant Details", description: stepOneError, variant: "destructive" });
      return;
    }
    if (step === 2 && stepTwoError) {
      toast({ title: "Incomplete Stay Details", description: stepTwoError, variant: "destructive" });
      return;
    }
    setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3));

  const handleInviteTenant = async () => {
    const err1 = getStepOneError();
    if (err1) {
      setStep(1);
      toast({ title: "Cannot Add Tenant", description: err1, variant: "destructive" });
      return;
    }
    const err2 = getStepTwoError();
    if (err2) {
      setStep(2);
      toast({ title: "Cannot Add Tenant", description: err2, variant: "destructive" });
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
            { dueType: rentDueType, dueFor: rentDueFor, dueAmount: parseInt(rentDueAmt, 10) || 0, collection: parseInt(rentCollAmt, 10) || 0 },
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

      const formattedPermanentAddress = [
        permHouseNumber,
        permStreet,
        permLocality,
        permCity,
        permDistrict,
        permState,
        permCountry,
        permPincode,
      ]
        .filter(Boolean)
        .join(", ");

      const formattedCurrentAddress = sameAsPermanent
        ? formattedPermanentAddress
        : [
            currHouseNumber,
            currStreet,
            currLocality,
            currCity,
            currDistrict,
            currState,
            currCountry,
            currPincode,
          ]
            .filter(Boolean)
            .join(", ");

      const addedTenant = await addTenant(propertyId, {
        name: name.trim(),
        phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
        floorId: idStr(effectiveFloorId),
        blockId: idStr(effectiveBlockId),
        roomId: idStr(effectiveRoomId),
        bedNumber: parseInt(bedNumber, 10) || 1,
        monthlyRent: parseInt(fixedRent, 10) || 0,
        securityDeposit: parseInt(securityDeposit, 10) || 0,
        rentDueDate: parseInt(rentDueDate.replace(/\D/g, "")) || 1,
        joiningDate: moveInDate,
        electricityBill: parseInt(electricityBill, 10) || 0,
        email: email.trim() || undefined,
        gender: gender || undefined,
        dob: dob || undefined,
        alternateNumber: alternatePhone ? `+91${alternatePhone.replace(/\D/g, "")}` : undefined,
        alternatePhone: alternatePhone ? `+91${alternatePhone.replace(/\D/g, "")}` : undefined,
        tenantType: tenantType || undefined,
        bloodGroup: bloodGroup || undefined,
        foodPreferences: foodPreference.trim() || undefined,
        currentAddress: formattedCurrentAddress || undefined,
        permanentAddress: formattedPermanentAddress || undefined,
        // Discrete 8-part address fields
        permHouseNumber: permHouseNumber.trim() || undefined,
        permStreet: permStreet.trim() || undefined,
        permLocality: permLocality.trim() || undefined,
        permCity: permCity.trim() || undefined,
        permDistrict: permDistrict.trim() || undefined,
        permState: permState.trim() || undefined,
        permCountry: permCountry.trim() || "India",
        permPincode: permPincode.trim() || undefined,
        currHouseNumber: (sameAsPermanent ? permHouseNumber : currHouseNumber).trim() || undefined,
        currStreet: (sameAsPermanent ? permStreet : currStreet).trim() || undefined,
        currLocality: (sameAsPermanent ? permLocality : currLocality).trim() || undefined,
        currCity: (sameAsPermanent ? permCity : currCity).trim() || undefined,
        currDistrict: (sameAsPermanent ? permDistrict : currDistrict).trim() || undefined,
        currState: (sameAsPermanent ? permState : currState).trim() || undefined,
        currCountry: (sameAsPermanent ? permCountry : currCountry).trim() || "India",
        currPincode: (sameAsPermanent ? permPincode : currPincode).trim() || undefined,
        // Rent Engine Invoicing Rules
        billingStartDate: billingStartDate || moveInDate,
        gracePeriodDays: parseInt(gracePeriodDays, 10) || 0,
        rentDisabled: Boolean(rentDisabled),
        nationality: nationality || "India",
        remarks: remarks.trim() || undefined,
        gstin: gstNumber.trim() || undefined,
        businessName: companyName.trim() || undefined,
        fatherName: fatherName.trim() || undefined,
        fatherContact: fatherPhone ? `+91${fatherPhone.replace(/\D/g, "")}` : undefined,
        fatherPhone: fatherPhone ? `+91${fatherPhone.replace(/\D/g, "")}` : undefined,
        fatherOccupation: fatherOccupation.trim() || undefined,
        motherName: motherName.trim() || undefined,
        motherContact: motherPhone ? `+91${motherPhone.replace(/\D/g, "")}` : undefined,
        motherPhone: motherPhone ? `+91${motherPhone.replace(/\D/g, "")}` : undefined,
        motherOccupation: motherOccupation.trim() || undefined,
        guardianName: guardianName.trim() || undefined,
        guardianContact: guardianPhone ? `+91${guardianPhone.replace(/\D/g, "")}` : undefined,
        guardianPhone: guardianPhone ? `+91${guardianPhone.replace(/\D/g, "")}` : undefined,
        guardianAddress: guardianAddress.trim() || undefined,
        bankName: bankName.trim() || undefined,
        bankAccountHolderName: name.trim() || undefined,
        bankAccountNumber: accountNumber.trim() || undefined,
        bankIfscCode: ifscCode.trim() || undefined,
        bankUpiId: upiId.trim() || undefined,
        stayType: stayType || "Long Stay",
        lockinPeriodMonths: parseInt(lockInPeriod, 10) || 0,
        noticePeriodDays: parseInt(noticePeriod, 10) || 30,
        agreementPeriodMonths: parseInt(agreementPeriod, 10) || 11,
        referredBy: referredBy.trim() || undefined,
        bookedBy: bookedBy.trim() || undefined,
        rentingType: rentalFrequency || "Monthly",
        collectOnlinePayments: true,
        paymentDetails: {
          openingBalance: [
            { dueType: rentDueType, dueFor: rentDueFor, dueAmount: parseInt(rentDueAmt, 10) || 0, collection: parseInt(rentCollAmt, 10) || 0 },
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
      });

      // Save secondary custom profile fields
      const targetId = (addedTenant as any)?.roomTenant?.id || (addedTenant as any)?.tenant?.id || addedTenant?.id;
      if (targetId) {
        await updatePropertyTenant(propertyId, targetId, {
          // Required stay fields
          roomId: idStr(effectiveRoomId),
          bedNumber: parseInt(bedNumber, 10) || 1,
          monthlyRent: parseInt(fixedRent, 10) || 0,
          securityDeposit: parseInt(securityDeposit, 10) || 0,
          rentDueDate: parseInt(rentDueDate.replace(/\D/g, "")) || 1,
          joiningDate: moveInDate,
          electricityBill: parseInt(electricityBill, 10) || 0,
          name: name.trim(),
          phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,

          // Rent Engine Invoicing Rules
          billingStartDate: billingStartDate || moveInDate,
          gracePeriodDays: parseInt(gracePeriodDays, 10) || 0,
          rentDisabled: Boolean(rentDisabled),

          // Whitelisted personal & secondary fields
          remarks: remarks.trim() || undefined,
          email: email.trim() || undefined,
          alternatePhone: alternatePhone.trim() || undefined,
          alternateNumber: alternatePhone.trim() || undefined,
          foodPreferences: foodPreference || undefined,
          dob: dob || undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup.trim() || undefined,
          currentAddress: formattedCurrentAddress || undefined,
          permanentAddress: formattedPermanentAddress || undefined,
          permHouseNumber: permHouseNumber.trim() || undefined,
          permStreet: permStreet.trim() || undefined,
          permLocality: permLocality.trim() || undefined,
          permCity: permCity.trim() || undefined,
          permDistrict: permDistrict.trim() || undefined,
          permState: permState.trim() || undefined,
          permCountry: permCountry.trim() || "India",
          permPincode: permPincode.trim() || undefined,
          currHouseNumber: (sameAsPermanent ? permHouseNumber : currHouseNumber).trim() || undefined,
          currStreet: (sameAsPermanent ? permStreet : currStreet).trim() || undefined,
          currLocality: (sameAsPermanent ? permLocality : currLocality).trim() || undefined,
          currCity: (sameAsPermanent ? permCity : currCity).trim() || undefined,
          currDistrict: (sameAsPermanent ? permDistrict : currDistrict).trim() || undefined,
          currState: (sameAsPermanent ? permState : currState).trim() || undefined,
          currCountry: (sameAsPermanent ? permCountry : currCountry).trim() || "India",
          currPincode: (sameAsPermanent ? permPincode : currPincode).trim() || undefined,
          nationality: nationality.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
          panNumber: panNumber.trim() || undefined,
          companyName: companyName.trim() || undefined,
          companyAddress: companyAddress.trim() || undefined,
          businessOwnerName: businessOwnerName.trim() || undefined,
          fatherName: fatherName.trim() || undefined,
          fatherPhone: fatherPhone.trim() || undefined,
          fatherOccupation: fatherOccupation.trim() || undefined,
          motherName: motherName.trim() || undefined,
          motherPhone: motherPhone.trim() || undefined,
          motherOccupation: motherOccupation.trim() || undefined,
          guardianName: guardianName.trim() || undefined,
          guardianPhone: guardianPhone.trim() || undefined,
          guardianAddress: guardianAddress.trim() || undefined,
          bankName: bankName.trim() || undefined,
          bankAccountNumber: accountNumber.trim() || undefined,
          bankIfscCode: ifscCode.trim() || undefined,
          bankUpiId: upiId.trim() || undefined,
          checkinTime: checkinTime || undefined,
          checkoutTime: checkoutTime || undefined,
          officeOrCollegeName: referredBy.trim() || undefined,
        } as any);
      }

      console.log("Full RentOK-Style Onboarding Form Payload Submitted to Client Hooks:", fullPayload);
      toast({ title: "Tenant Added Successfully", description: "Invite sent & room allocated." });
      queryClient.invalidateQueries({ queryKey: ["property", propertyId, "tenants"] });
      onSuccess?.();
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const isDuplicatePhone =
        (err?.status === 400 || (e instanceof Error && e.message.toLowerCase().includes("mobile number already exists"))) &&
        (err?.message?.toLowerCase().includes("active tenant") || err?.message?.toLowerCase().includes("mobile number already exists"));

      if (isDuplicatePhone) {
        toast({
          title: "Duplicate Mobile Number",
          description: "Tenant with this phone number is already actively residing in this PG.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Could not add tenant",
          description: e instanceof Error ? e.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDues = otherDues.filter((d) =>
    d.label.toLowerCase().includes(duesSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full pb-6">
      {/* HEADER + STEPPER */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Add Tenant</h2>
          <p className="text-sm text-muted-foreground">
            {selectedPg?.name ? `Onboarding to ${selectedPg.name}` : "Fill in a few details to onboard a new tenant."}
          </p>
        </div>

        <div className="flex items-center">
          {STEPS.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step > s.number
                      ? "bg-teal-600 text-white"
                      : step === s.number
                      ? "bg-teal-600 text-white ring-4 ring-teal-100"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </div>
                <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    step === s.number ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 rounded transition-colors ${step > s.number ? "bg-teal-600" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: TENANT DETAILS */}
      {step === 1 && (
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-sm font-bold text-foreground">Tenant Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Tenant Full Name <span className="text-destructive font-bold">*</span>
                </Label>
                <Input
                  placeholder="Enter tenant full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Contact Number <span className="text-destructive font-bold">*</span>
                </Label>
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
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="whatsapp-reminder"
                    checked={sendWhatsappReminder}
                    onChange={(e) => setSendWhatsappReminder(e.target.checked)}
                    className="rounded border-input text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <Label htmlFor="whatsapp-reminder" className="text-xs font-normal text-muted-foreground cursor-pointer select-none">
                    Send Whatsapp Rent Reminder
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tenant Type</Label>
                <Select value={tenantType} onValueChange={setTenantType}>
                  <SelectTrigger className="w-full">
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
                <Label>
                  Gender <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Block</Label>
                <Select
                  value={hasSelectValue(effectiveBlockId) ? effectiveBlockId : "none"}
                  onValueChange={(v) => {
                    if (v === "action_add_block") {
                      setAddBlockModalOpen(true);
                      return;
                    }
                    if (v === "none") return;
                    setSelectedBlockId(v);
                    setSelectedFloorId("");
                    setSelectedRoomId("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.filter((b) => hasSelectValue(b.id)).map((b) => (
                      <SelectItem key={idStr(b.id)} value={idStr(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                    {blocks.length === 0 && !blocksQuery.isLoading && <SelectItem value="none" disabled>No blocks</SelectItem>}
                    <SelectItem value="action_add_block" className="font-bold text-teal-700 border-t mt-1 pt-1.5 cursor-pointer">
                      + Add New Block
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Floor</Label>
                <Select
                  value={hasSelectValue(effectiveFloorId) ? effectiveFloorId : "none"}
                  onValueChange={(v) => {
                    if (v === "action_add_floor") {
                      setAddFloorModalOpen(true);
                      return;
                    }
                    if (v === "none") return;
                    setSelectedFloorId(v);
                    setSelectedRoomId("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.filter((f) => hasSelectValue(f.id)).map((f) => (
                      <SelectItem key={idStr(f.id)} value={idStr(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                    {floors.length === 0 && !floorsQuery.isLoading && <SelectItem value="none" disabled>No floors</SelectItem>}
                    <SelectItem value="action_add_floor" className="font-bold text-teal-700 border-t mt-1 pt-1.5 cursor-pointer">
                      + Add New Floor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Room Selection <span className="text-destructive font-bold">*</span>
                </Label>
                <Select
                  value={hasSelectValue(effectiveRoomId) ? effectiveRoomId : "none"}
                  onValueChange={(v) => {
                    if (v === "action_add_room") {
                      setAddRoomModalOpen(true);
                      return;
                    }
                    if (v === "none") return;
                    setSelectedRoomId(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={roomsInitialLoading ? "Loading…" : "Room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRooms.map((r, idx) => {
                      const rawNum = String(r.roomNumber || r.name || "");
                      const roomLabel = rawNum.toLowerCase().startsWith("room") ? rawNum : `Room ${rawNum}`;
                      return (
                        <SelectItem key={`${idStr(r.id)}-${idx}`} value={idStr(r.id)}>
                          {roomLabel}
                        </SelectItem>
                      );
                    })}
                    {selectableRooms.length === 0 && (
                      <SelectItem value="none" disabled>
                        {roomsInitialLoading ? "Loading rooms…" : "No rooms"}
                      </SelectItem>
                    )}
                    <SelectItem value="action_add_room" className="font-bold text-teal-700 border-t mt-1 pt-1.5 cursor-pointer">
                      + Add New Room
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RENTOK-STYLE VISUAL ROOMS & BEDS ALLOCATION CARD */}
            {selectedRoomObj && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        Room {selectedRoomObj.roomNumber || selectedRoomObj.name || "Allocation"}
                      </h4>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 text-xs rounded-full">
                    {selectedRoomObj.numberOfBeds || (selectedRoomObj as any)?.totalBeds || 4} Sharing
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      BED OCCUPANCY & ALLOCATION <span className="text-destructive font-bold">*</span>
                    </span>
                    {!bedNumber ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        Bed selection required *
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                        Bed {bedNumber} Selected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                    {bedOptions.map((b) => {
                      const isSelected = String(b.number) === bedNumber;
                      if (b.isOccupied) {
                        return (
                          <div
                            key={b.number}
                            className="relative rounded-xl p-4 bg-slate-100/90 border border-slate-300 text-slate-600 opacity-85 pointer-events-none cursor-not-allowed select-none shadow-2xs flex flex-col justify-between h-28"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                                <BedIcon className="h-4 w-4 text-slate-400" />
                                <span>Bed {b.number}</span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                <Lock className="h-3 w-3 text-slate-500" />
                                Occupied
                              </span>
                            </div>

                            <div className="pt-1 space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {b.occupantName || "Active Resident"}
                              </div>
                              {b.occupantPhone ? (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{b.occupantPhone}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 italic">Occupied Bed</div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={b.number}
                          onClick={() => {
                            setBedNumber(String(b.number));
                          }}
                          className={`relative rounded-xl p-4 flex flex-col justify-between h-28 transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-teal-50/90 border-2 border-teal-600 ring-4 ring-teal-500/20 text-teal-950 font-bold shadow-md"
                              : "bg-emerald-50/80 border border-emerald-400 hover:border-emerald-600 text-emerald-950 shadow-2xs hover:bg-emerald-100/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <BedIcon className={`h-4 w-4 ${isSelected ? "text-teal-600" : "text-emerald-600"}`} />
                              <span>Bed {b.number}</span>
                            </div>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isSelected ? "bg-teal-600 animate-pulse" : "bg-emerald-500"
                              }`}
                            />
                          </div>

                          <div className="pt-1">
                            <div className="text-xs font-semibold">
                              {isSelected ? (
                                <span className="text-teal-700 font-extrabold flex items-center gap-1">
                                  <Check className="h-4 w-4 stroke-[3]" /> Selected Bed
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium">🟢 Available Bed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* + ADD BED IN ROOM INTERACTIVE CARD */}
                    <div
                      onClick={() => setAddBedConfirmOpen(true)}
                      className="relative rounded-xl p-4 border-2 border-dashed border-emerald-300/90 bg-emerald-50/40 hover:bg-emerald-100/70 hover:border-emerald-500 text-emerald-800 flex flex-col items-center justify-center gap-1.5 h-28 cursor-pointer transition-all text-center select-none shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 transition-colors">
                        <Plus className="h-4 w-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-extrabold text-emerald-900">+ Add Bed in Room</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedRoomObj && (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground bg-muted/10">
                Please select a room above to view and allocate available beds.
              </div>
            )}

            {/* Optional extra info, collapsed behind a single select drawer so the base form stays short */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Add more information (optional)</Label>
                <button
                  type="button"
                  onClick={() => setOtherDetailsOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:w-72"
                >
                  <span className="text-muted-foreground text-xs font-semibold">
                    {expandedOtherDetails === "configured" ? "Other Details Configured" : "Add Other Details"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* SHEET SLIDE-OUT DRAWER */}
              <Sheet open={otherDetailsOpen} onOpenChange={setOtherDetailsOpen}>
                <SheetContent side="right" className="w-[500px] max-w-full overflow-y-auto space-y-6">
                  <SheetHeader>
                    <SheetTitle>Other Details</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 py-4">
                    {/* (A) Personal Details */}
                    <details className="group border rounded-lg overflow-hidden bg-card/50" open>
                      <summary className="flex justify-between items-center p-3 font-semibold text-xs cursor-pointer bg-muted/15 select-none border-b">
                        <span>Personal Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground" />
                      </summary>
                      <div className="p-3.5 space-y-3.5 bg-background text-sm">
                        <div className="space-y-1">
                          <Label>Remarks</Label>
                          <Input placeholder="Add your remarks here" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Email address</Label>
                          <Input type="email" placeholder="Add your email here" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Alternate Contact Number</Label>
                          <div className="flex gap-2">
                            <span className="flex items-center rounded-md border border-input bg-muted px-2.5 text-xs text-muted-foreground">
                              +91
                            </span>
                            <Input
                              placeholder="10-digit alternate contact"
                              maxLength={10}
                              value={alternatePhone}
                              onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Food Preference</Label>
                          <Select value={foodPreference} onValueChange={setFoodPreference}>
                            <SelectTrigger><SelectValue placeholder="Select food preference" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                              <SelectItem value="Eggitarian">Eggitarian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Blood Group</Label>
                          <Select value={bloodGroup} onValueChange={setBloodGroup}>
                            <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Structured Permanent Address (8 Discrete Fields) */}
                        <div className="space-y-2 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold text-xs uppercase text-teal-700">Permanent Address (8 Discrete Fields)</Label>
                            <span className="text-[10px] text-muted-foreground">Auto-normalized</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="House / Flat No." value={permHouseNumber} onChange={(e) => setPermHouseNumber(e.target.value)} />
                            <Input placeholder="Street / Road" value={permStreet} onChange={(e) => setPermStreet(e.target.value)} />
                            <Input placeholder="Locality / Area" value={permLocality} onChange={(e) => setPermLocality(e.target.value)} />
                            <Input placeholder="City" value={permCity} onChange={(e) => setPermCity(e.target.value)} />
                            <Input placeholder="District" value={permDistrict} onChange={(e) => setPermDistrict(e.target.value)} />
                            <Input placeholder="State" value={permState} onChange={(e) => setPermState(e.target.value)} />
                            <Input placeholder="Country" value={permCountry} onChange={(e) => setPermCountry(e.target.value)} />
                            <Input placeholder="PIN Code (6 digits)" maxLength={6} value={permPincode} onChange={(e) => setPermPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                          </div>
                        </div>

                        {/* Structured Current Address (8 Discrete Fields) */}
                        <div className="space-y-2 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold text-xs uppercase text-teal-700">Current Address</Label>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={sameAsPermanent}
                                onChange={(e) => setSameAsPermanent(e.target.checked)}
                                className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                              />
                              Same as permanent
                            </label>
                          </div>
                          {!sameAsPermanent ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input placeholder="House / Flat No." value={currHouseNumber} onChange={(e) => setCurrHouseNumber(e.target.value)} />
                              <Input placeholder="Street / Road" value={currStreet} onChange={(e) => setCurrStreet(e.target.value)} />
                              <Input placeholder="Locality / Area" value={currLocality} onChange={(e) => setCurrLocality(e.target.value)} />
                              <Input placeholder="City" value={currCity} onChange={(e) => setCurrCity(e.target.value)} />
                              <Input placeholder="District" value={currDistrict} onChange={(e) => setCurrDistrict(e.target.value)} />
                              <Input placeholder="State" value={currState} onChange={(e) => setCurrState(e.target.value)} />
                              <Input placeholder="Country" value={currCountry} onChange={(e) => setCurrCountry(e.target.value)} />
                              <Input placeholder="PIN Code (6 digits)" maxLength={6} value={currPincode} onChange={(e) => setCurrPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              Current address set same as permanent address.
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 border-t pt-3">
                          <Label>Nationality</Label>
                          <Select value={nationality} onValueChange={setNationality}>
                            <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Indian">Indian</SelectItem>
                              <SelectItem value="NRI">NRI</SelectItem>
                              <SelectItem value="Foreign National">Foreign National</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </details>

                    {/* (B) GST Details */}
                    <details className="group border rounded-lg overflow-hidden bg-card/50">
                      <summary className="flex justify-between items-center p-3 font-semibold text-xs cursor-pointer bg-muted/15 select-none border-b">
                        <span>GST Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground" />
                      </summary>
                      <div className="p-3.5 space-y-3.5 bg-background text-sm">
                        <div className="space-y-1">
                          <Label>GST Number</Label>
                          <Input placeholder="Enter GST number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>PAN Number</Label>
                          <Input placeholder="Enter PAN number" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Company Name</Label>
                          <Input placeholder="Enter company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Company Address</Label>
                          <Input placeholder="Enter company address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Business Owner Name</Label>
                          <Input placeholder="Enter business owner name" value={businessOwnerName} onChange={(e) => setBusinessOwnerName(e.target.value)} />
                        </div>
                      </div>
                    </details>

                    {/* (C) Parent Details */}
                    <details className="group border rounded-lg overflow-hidden bg-card/50">
                      <summary className="flex justify-between items-center p-3 font-semibold text-xs cursor-pointer bg-muted/15 select-none border-b">
                        <span>Parent Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground" />
                      </summary>
                      <div className="p-3.5 space-y-3.5 bg-background text-sm">
                        <div className="space-y-1">
                          <Label>Father Name</Label>
                          <Input placeholder="Enter father name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Father Contact Number</Label>
                          <div className="flex gap-2">
                            <span className="flex items-center rounded-md border border-input bg-muted px-2.5 text-xs text-muted-foreground">
                              +91
                            </span>
                            <Input
                              placeholder="10-digit father contact"
                              maxLength={10}
                              value={fatherPhone}
                              onChange={(e) => setFatherPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Father Occupation</Label>
                          <Input placeholder="Enter occupation" value={fatherOccupation} onChange={(e) => setFatherOccupation(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Mother Name</Label>
                          <Input placeholder="Enter mother name" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Mother Contact Number</Label>
                          <div className="flex gap-2">
                            <span className="flex items-center rounded-md border border-input bg-muted px-2.5 text-xs text-muted-foreground">
                              +91
                            </span>
                            <Input
                              placeholder="10-digit mother contact"
                              maxLength={10}
                              value={motherPhone}
                              onChange={(e) => setMotherPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Mother Occupation</Label>
                          <Input placeholder="Enter occupation" value={motherOccupation} onChange={(e) => setMotherOccupation(e.target.value)} />
                        </div>
                      </div>
                    </details>

                    {/* (D) Local Guardian Details */}
                    <details className="group border rounded-lg overflow-hidden bg-card/50">
                      <summary className="flex justify-between items-center p-3 font-semibold text-xs cursor-pointer bg-muted/15 select-none border-b">
                        <span>Local Guardian Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground" />
                      </summary>
                      <div className="p-3.5 space-y-3.5 bg-background text-sm">
                        <div className="space-y-1">
                          <Label>Guardian Name</Label>
                          <Input placeholder="Enter guardian name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Guardian Contact Number</Label>
                          <div className="flex gap-2">
                            <span className="flex items-center rounded-md border border-input bg-muted px-2.5 text-xs text-muted-foreground">
                              +91
                            </span>
                            <Input
                              placeholder="10-digit guardian contact"
                              maxLength={10}
                              value={guardianPhone}
                              onChange={(e) => setGuardianPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Guardian Address</Label>
                          <Input placeholder="Enter guardian address" value={guardianAddress} onChange={(e) => setGuardianAddress(e.target.value)} />
                        </div>
                      </div>
                    </details>

                    {/* (E) Bank Details */}
                    <details className="group border rounded-lg overflow-hidden bg-card/50">
                      <summary className="flex justify-between items-center p-3 font-semibold text-xs cursor-pointer bg-muted/15 select-none border-b">
                        <span>Bank Details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground" />
                      </summary>
                      <div className="p-3.5 space-y-3.5 bg-background text-sm">
                        <div className="space-y-1">
                          <Label>Bank Name</Label>
                          <Input placeholder="e.g. HDFC Bank, SBI, ICICI" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Account Number</Label>
                          <Input placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>IFSC Code</Label>
                          <Input placeholder="Enter IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>UPI ID</Label>
                          <Input placeholder="Enter UPI ID" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                        </div>
                      </div>
                    </details>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      onClick={() => {
                        setExpandedOtherDetails("configured");
                        setOtherDetailsOpen(false);
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold"
                    >
                      Submit
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booked By</Label>
                <Input placeholder="Booked By" value={bookedBy} onChange={(e) => setBookedBy(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Referred By</Label>
                <Input placeholder="Referred By" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: STAY DETAILS */}
      {step === 2 && (
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-sm font-bold text-foreground">Stay Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
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
                  <Label>
                    Move-in Date <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Move-out</Label>
                  <Input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
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
              <h4 className="text-sm font-bold text-foreground">Rental Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Monthly Fixed Rent <span className="text-destructive font-bold">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 8000"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Add Rent On <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Select value={rentDueDate} onValueChange={setRentDueDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add Rent On" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st of every month</SelectItem>
                      <SelectItem value="5th">5th of every month</SelectItem>
                      <SelectItem value="10th">10th of every month</SelectItem>
                      <SelectItem value="15th">15th of every month</SelectItem>
                      <SelectItem value="20th">20th of every month</SelectItem>
                      <SelectItem value="25th">25th of every month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Regular Security Deposit <span className="text-destructive font-bold">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 5000 (enter 0 if none)"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Default Electricity Charges <span className="text-destructive font-bold">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <span className="flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 500 (0 if in rent)"
                      value={electricityBill}
                      onChange={(e) => setElectricityBill(e.target.value)}
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
                    electricityMeter ? "bg-teal-600" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                      electricityMeter ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* RENT ENGINE INVOICING RULES */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Rent Engine Invoicing Rules</h4>
                    <p className="text-xs text-muted-foreground">Automated invoicing parameters and suspension rules</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoicing Start Date</Label>
                    <Input
                      type="date"
                      value={billingStartDate}
                      onChange={(e) => setBillingStartDate(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">No recurring rent invoices generated before this date (defaults to joining date)</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Grace Period (Days)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">Buffer days before overdue reminder alerts and late penalties apply</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Suppress Automated Rent Invoicing</Label>
                    <p className="text-xs text-muted-foreground">Completely disables monthly rent generation (for caretakers / complimentary stays)</p>
                  </div>
                  <Switch
                    checked={rentDisabled}
                    onCheckedChange={setRentDisabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PAYMENT DETAILS */}
      {step === 3 && (
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-sm font-bold text-foreground">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">Opening Balance</h4>
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
                      <td className="p-3 font-medium text-foreground">{rentDueType}</td>
                      <td className="p-3 text-muted-foreground text-xs">{rentDueFor}</td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={rentDueAmt} onChange={(e) => setRentDueAmt(e.target.value)} />
                      </td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={rentCollAmt} onChange={(e) => setRentCollAmt(e.target.value)} />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-foreground">Security Deposit</td>
                      <td className="p-3 text-muted-foreground text-xs">One Time</td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={depositDueAmt} onChange={(e) => setDepositDueAmt(e.target.value)} />
                      </td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={depositCollAmt} onChange={(e) => setDepositCollAmt(e.target.value)} />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-foreground">Joining Fee</td>
                      <td className="p-3 text-muted-foreground text-xs">One Time</td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={joiningDueAmt} onChange={(e) => setJoiningDueAmt(e.target.value)} />
                      </td>
                      <td className="p-2">
                        <Input type="number" className="w-28 h-8 text-sm" value={joiningCollAmt} onChange={(e) => setJoiningCollAmt(e.target.value)} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other dues collapsed by default — most tenants don't need this */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowOtherDues((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                {showOtherDues ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showOtherDues ? "Hide other dues" : "Add other dues (optional)"}
              </button>

              {showOtherDues && (
                <div className="space-y-4 mt-4 animate-fade-in">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search dues here..."
                      className="pl-8 h-9 text-xs"
                      value={duesSearch}
                      onChange={(e) => setDuesSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1">
                    {filteredDues.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-col justify-between border rounded-lg p-3.5 bg-muted/10 space-y-2.5 hover:bg-muted/20 transition-all shadow-sm"
                      >
                        <div className="flex flex-col gap-1.5 w-full">
                          <span className="text-xs font-bold text-foreground leading-snug">{d.label}</span>
                          <div className="flex gap-2 w-full">
                            <Select
                              value={d.mode}
                              onValueChange={(val: "consumption" | "fixed") => {
                                const updated = [...otherDues];
                                const realIdx = otherDues.findIndex((x) => x.id === d.id);
                                updated[realIdx].mode = val;
                                updated[realIdx].amount = val === "fixed" ? "0" : "";
                                setOtherDues(updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="consumption">As per consumption</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>

                            {d.mode === "fixed" && (
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  className="h-8 pl-6 pr-1 text-xs w-full font-bold"
                                  placeholder="0"
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && stepOneError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <span>⚠️ {stepOneError}</span>
        </div>
      )}
      {step === 2 && stepTwoError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <span>⚠️ {stepTwoError}</span>
        </div>
      )}

      {/* WIZARD NAVIGATION */}
      {showFooter && (
        <div className="flex justify-between items-center gap-3 border-t pt-4">
          <div>
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )
            )}
          </div>

          {step < 3 ? (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white min-w-32"
              onClick={goNext}
              disabled={step === 1 ? !!stepOneError : !!stepTwoError}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white min-w-32"
              onClick={handleInviteTenant}
              disabled={submitting || !!stepOneError || !!stepTwoError}
            >
              {submitting ? "Adding…" : "Add Tenant"}
            </Button>
          )}
        </div>
      )}

      {/* QUICK STRUCTURE CREATION MODALS WITH DOUBLE CHECK CONFIRMATION */}
      {/* 0. Add Bed Confirmation Modal */}
      <Dialog open={addBedConfirmOpen} onOpenChange={setAddBedConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 font-bold">
              <BedIcon className="h-5 w-5" /> Confirm Bed Addition
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3 text-sm">
            <p className="text-foreground">
              Are you sure you want to add an additional bed (Bed {(selectedRoomObj?.numberOfBeds || (selectedRoomObj as any)?.totalBeds || 4) + 1}) to <strong className="text-teal-700 font-bold">Room {selectedRoomObj?.roomNumber || selectedRoomObj?.name || ""}</strong>?
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
              ✓ Bed capacity will increase to {(selectedRoomObj?.numberOfBeds || (selectedRoomObj as any)?.totalBeds || 4) + 1} sharing.<br />
              ✓ A new green available bed card will immediately appear in the grid.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddBedConfirmOpen(false)}>Deny / Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              onClick={() => {
                setAddBedConfirmOpen(false);
                handleAddBed();
              }}
              disabled={addingBed}
            >
              {addingBed ? "Adding..." : "Yes, Confirm & Add Bed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1. Add Block Dialog */}
      <Dialog open={addBlockModalOpen} onOpenChange={(open) => { setAddBlockModalOpen(open); if (!open) setConfirmBlockStage(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
              <Building className="h-5 w-5" /> {confirmBlockStage ? "Confirm New Block" : "Add New Block"}
            </DialogTitle>
          </DialogHeader>
          {!confirmBlockStage ? (
            <div className="space-y-3 py-2">
              <Label>Block Name</Label>
              <Input
                placeholder="e.g. Block A, Main Wing, North Tower"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3 py-2 text-sm">
              <p className="text-foreground">
                Are you sure you want to create new block <strong className="text-teal-700 font-bold">"{newBlockName}"</strong> in {selectedPg?.name || "this property"}?
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { if (confirmBlockStage) setConfirmBlockStage(false); else setAddBlockModalOpen(false); }}>
              {confirmBlockStage ? "Back / Deny" : "Cancel"}
            </Button>
            {!confirmBlockStage ? (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setConfirmBlockStage(true)} disabled={!newBlockName.trim()}>
                Continue to Confirm →
              </Button>
            ) : (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleCreateBlock} disabled={creatingBlock}>
                {creatingBlock ? "Saving..." : "Yes, Confirm Creation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Add Floor Dialog */}
      <Dialog open={addFloorModalOpen} onOpenChange={(open) => { setAddFloorModalOpen(open); if (!open) setConfirmFloorStage(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
              <Layers className="h-5 w-5" /> {confirmFloorStage ? "Confirm New Floor" : "Add New Floor"}
            </DialogTitle>
          </DialogHeader>
          {!confirmFloorStage ? (
            <div className="space-y-3 py-2">
              <Label>Floor Name</Label>
              <Input
                placeholder="e.g. Ground Floor, 1st Floor, 2nd Floor"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3 py-2 text-sm">
              <p className="text-foreground">
                Are you sure you want to create new floor <strong className="text-teal-700 font-bold">"{newFloorName}"</strong>?
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { if (confirmFloorStage) setConfirmFloorStage(false); else setAddFloorModalOpen(false); }}>
              {confirmFloorStage ? "Back / Deny" : "Cancel"}
            </Button>
            {!confirmFloorStage ? (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setConfirmFloorStage(true)} disabled={!newFloorName.trim()}>
                Continue to Confirm →
              </Button>
            ) : (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleCreateFloor} disabled={creatingFloor}>
                {creatingFloor ? "Saving..." : "Yes, Confirm Creation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Add Room Dialog */}
      <Dialog open={addRoomModalOpen} onOpenChange={(open) => { setAddRoomModalOpen(open); if (!open) setConfirmRoomStage(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
              <DoorOpen className="h-5 w-5" /> {confirmRoomStage ? "Confirm New Room" : "Add New Room"}
            </DialogTitle>
          </DialogHeader>
          {!confirmRoomStage ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Room Number / Name</Label>
                <Input
                  placeholder="e.g. 101, G005, Room 202"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Beds (Sharing Capacity)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newRoomBeds}
                  onChange={(e) => setNewRoomBeds(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-sm">
              <p className="text-foreground">
                Are you sure you want to create <strong className="text-teal-700 font-bold">Room "{newRoomNumber}"</strong> with <strong>{newRoomBeds} Beds capacity</strong>?
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { if (confirmRoomStage) setConfirmRoomStage(false); else setAddRoomModalOpen(false); }}>
              {confirmRoomStage ? "Back / Deny" : "Cancel"}
            </Button>
            {!confirmRoomStage ? (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setConfirmRoomStage(true)} disabled={!newRoomNumber.trim()}>
                Continue to Confirm →
              </Button>
            ) : (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleCreateRoom} disabled={creatingRoom}>
                {creatingRoom ? "Saving..." : "Yes, Confirm Creation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}