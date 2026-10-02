import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Edit2, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  getDiningSchedule,
  updateDiningSchedule,
  type DiningDaySchedule,
} from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

// Order starts from MONDAY (1) to SUNDAY (0)
const DAYS_MAP = [
  { dayOfWeek: 1, label: "Monday", short: "Mon" },
  { dayOfWeek: 2, label: "Tuesday", short: "Tue" },
  { dayOfWeek: 3, label: "Wednesday", short: "Wed" },
  { dayOfWeek: 4, label: "Thursday", short: "Thu" },
  { dayOfWeek: 5, label: "Friday", short: "Fri" },
  { dayOfWeek: 6, label: "Saturday", short: "Sat" },
  { dayOfWeek: 0, label: "Sunday", short: "Sun" },
];

const DEFAULT_SCHEDULE: DiningDaySchedule[] = DAYS_MAP.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  breakfast: { menu: "Poha, Tea, Boiled Eggs", startTime: "08:30", endTime: "09:30" },
  lunch: { menu: "Jeera Rice, Dal Tadka, Roti, Salad", startTime: "13:00", endTime: "14:30" },
  dinner: { menu: "Paneer Butter Masala, Roti, Rice", startTime: "20:30", endTime: "22:00" },
}));

type MealType = "breakfast" | "lunch" | "dinner";

function to12HourDisplay(time24?: string): string {
  if (!time24) return "08:30 AM";
  const parts = time24.trim().split(":");
  if (parts.length < 2) return time24;
  let hh = parseInt(parts[0], 10);
  const mm = parts[1].slice(0, 2).padStart(2, "0");
  if (isNaN(hh)) return "08:30 AM";
  const period = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${mm} ${period}`;
}

function formatHHmm(timeStr?: string, defaultVal = "08:30"): string {
  if (!timeStr) return defaultVal;
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return defaultVal;
}

export default function FoodDiningPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const { data: diningData, isLoading } = useQuery({
    queryKey: ["diningSchedule", selectedPgId],
    queryFn: () => (selectedPgId ? getDiningSchedule(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const [schedule, setSchedule] = useState<DiningDaySchedule[]>(DEFAULT_SCHEDULE);

  // Single Meal Slot Edit Modal
  const [slotEditModal, setSlotEditModal] = useState<{
    open: boolean;
    dayOfWeek: number;
    mealType: MealType;
  }>({ open: false, dayOfWeek: 1, mealType: "breakfast" });

  const [slotMenu, setSlotMenu] = useState("");
  const [slotStart, setSlotStart] = useState("08:30");
  const [slotEnd, setSlotEnd] = useState("09:30");

  // Bulk Timings Modal
  const [bulkTimingsModalOpen, setBulkTimingsModalOpen] = useState(false);
  const [bulkMealType, setBulkMealType] = useState<MealType>("breakfast");
  const [bulkStart, setBulkStart] = useState("08:00");
  const [bulkEnd, setBulkEnd] = useState("09:30");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  useEffect(() => {
    if (!diningData) return;
    const rawList = Array.isArray(diningData)
      ? diningData
      : (diningData as any)?.schedule || (diningData as any)?.data || [];

    if (rawList.length > 0) {
      const merged = DAYS_MAP.map((d) => {
        const found = rawList.find((item: any) => item.dayOfWeek === d.dayOfWeek);
        if (found) {
          return {
            dayOfWeek: d.dayOfWeek,
            breakfast: found.breakfast || { menu: "Not set", startTime: "08:30", endTime: "09:30" },
            lunch: found.lunch || { menu: "Not set", startTime: "13:00", endTime: "14:30" },
            dinner: found.dinner || { menu: "Not set", startTime: "20:30", endTime: "22:00" },
          };
        }
        return (
          DEFAULT_SCHEDULE.find((def) => def.dayOfWeek === d.dayOfWeek) || {
            dayOfWeek: d.dayOfWeek,
            breakfast: { menu: "Not set", startTime: "08:30", endTime: "09:30" },
            lunch: { menu: "Not set", startTime: "13:00", endTime: "14:30" },
            dinner: { menu: "Not set", startTime: "20:30", endTime: "22:00" },
          }
        );
      });
      setSchedule(merged);
    }
  }, [diningData]);

  const updateMutation = useMutation({
    mutationFn: async (newSchedule: DiningDaySchedule[]) => {
      if (!selectedPgId) return;
      return updateDiningSchedule(selectedPgId, newSchedule);
    },
    onSuccess: () => {
      toast({ title: "Dining Schedule Saved", description: "Food menu and meal timings updated." });
      queryClient.invalidateQueries({ queryKey: ["diningSchedule", selectedPgId] });
      setSlotEditModal({ open: false, dayOfWeek: 1, mealType: "breakfast" });
      setBulkTimingsModalOpen(false);
    },
    onError: (e: any) => {
      toast({ title: "Failed to update schedule", description: e?.message, variant: "destructive" });
    },
  });

  const handleOpenSlotEdit = (dayOfWeek: number, mealType: MealType) => {
    const dayItem = schedule.find((s) => s.dayOfWeek === dayOfWeek);
    const slot = dayItem ? dayItem[mealType] : null;

    setSlotEditModal({ open: true, dayOfWeek, mealType });
    setSlotMenu(slot?.menu || "");
    setSlotStart(formatHHmm(slot?.startTime, mealType === "breakfast" ? "08:30" : mealType === "lunch" ? "13:00" : "20:30"));
    setSlotEnd(formatHHmm(slot?.endTime, mealType === "breakfast" ? "09:30" : mealType === "lunch" ? "14:30" : "22:00"));
  };

  const handleSaveSlotEdit = () => {
    const { dayOfWeek, mealType } = slotEditModal;
    const updated = schedule.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        return {
          ...s,
          [mealType]: {
            menu: slotMenu,
            startTime: formatHHmm(slotStart),
            endTime: formatHHmm(slotEnd),
          },
        };
      }
      return s;
    });

    setSchedule(updated);
    updateMutation.mutate(updated);
  };

  const handleApplyBulkTimings = () => {
    if (selectedDays.length === 0) {
      toast({ title: "Please select at least one day", variant: "destructive" });
      return;
    }

    const updated = schedule.map((s) => {
      if (selectedDays.includes(s.dayOfWeek)) {
        const currentSlot = s[bulkMealType] || { menu: "" };
        return {
          ...s,
          [bulkMealType]: {
            ...currentSlot,
            startTime: formatHHmm(bulkStart),
            endTime: formatHHmm(bulkEnd),
          },
        };
      }
      return s;
    });

    setSchedule(updated);
    updateMutation.mutate(updated);
  };

  const toggleDaySelection = (dayOfWeek: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayOfWeek) ? prev.filter((d) => d !== dayOfWeek) : [...prev, dayOfWeek]
    );
  };

  const toggleSelectAllDays = () => {
    if (selectedDays.length === 7) {
      setSelectedDays([]);
    } else {
      setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    }
  };

  return (
    <CanAccessPage permission="food_view_edit">
      <div className="space-y-6">
        <PageHeader
          title="Food & Dining Schedule"
          description={`Weekly meal menus and dining times for residents at ${selectedPg?.name || "your PG"}.`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--gray-300)] gap-1.5"
                onClick={() => setBulkTimingsModalOpen(true)}
              >
                <Clock className="h-3.5 w-3.5" /> Set meal timings
              </Button>

              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-1.5 font-medium"
                onClick={() => updateMutation.mutate(schedule)}
                disabled={updateMutation.isPending || !selectedPgId}
              >
                <Save className="h-3.5 w-3.5" />
                {updateMutation.isPending ? "Saving..." : "Save schedule"}
              </Button>
            </div>
          }
        />

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to view and manage dining schedules."
            />
          </div>
        ) : (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                  Weekly Menu & Timing Matrix
                </h3>
                <p className="text-xs text-[var(--gray-500)]">
                  Weekly schedule from Monday to Sunday. Click on any meal slot to update menu or timings.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-[var(--gray-500)]">
                Loading food schedule...
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2.5 px-3 w-[120px]">Day of Week</TableHead>
                      <TableHead className="py-2.5 px-3">Breakfast</TableHead>
                      <TableHead className="py-2.5 px-3">Lunch</TableHead>
                      <TableHead className="py-2.5 px-3">Dinner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS_MAP.map((day) => {
                      const daySchedule = schedule.find((s) => s.dayOfWeek === day.dayOfWeek);

                      return (
                        <TableRow key={day.dayOfWeek} className="hover:bg-[var(--gray-50)] transition-colors">
                          <TableCell className="py-3 px-3 font-semibold text-sm text-[var(--gray-900)] align-top">
                            {day.label}
                          </TableCell>

                          {/* BREAKFAST CELL */}
                          <TableCell className="py-3 px-3 align-top">
                            <div className="rounded border border-[var(--gray-200)] bg-[var(--gray-50)] p-2.5 flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-[var(--gray-900)] leading-snug">
                                  {daySchedule?.breakfast?.menu || "Not set"}
                                </div>
                                <div className="text-[11px] text-[var(--gray-600)] tabular-nums flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-[var(--gray-400)]" />
                                  {to12HourDisplay(daySchedule?.breakfast?.startTime)} – {to12HourDisplay(daySchedule?.breakfast?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-[var(--gray-400)] hover:text-[var(--gray-800)] shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "breakfast")}
                                aria-label={`Edit Breakfast for ${day.label}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* LUNCH CELL */}
                          <TableCell className="py-3 px-3 align-top">
                            <div className="rounded border border-[var(--gray-200)] bg-[var(--gray-50)] p-2.5 flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-[var(--gray-900)] leading-snug">
                                  {daySchedule?.lunch?.menu || "Not set"}
                                </div>
                                <div className="text-[11px] text-[var(--gray-600)] tabular-nums flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-[var(--gray-400)]" />
                                  {to12HourDisplay(daySchedule?.lunch?.startTime)} – {to12HourDisplay(daySchedule?.lunch?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-[var(--gray-400)] hover:text-[var(--gray-800)] shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "lunch")}
                                aria-label={`Edit Lunch for ${day.label}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* DINNER CELL */}
                          <TableCell className="py-3 px-3 align-top">
                            <div className="rounded border border-[var(--gray-200)] bg-[var(--gray-50)] p-2.5 flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-[var(--gray-900)] leading-snug">
                                  {daySchedule?.dinner?.menu || "Not set"}
                                </div>
                                <div className="text-[11px] text-[var(--gray-600)] tabular-nums flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-[var(--gray-400)]" />
                                  {to12HourDisplay(daySchedule?.dinner?.startTime)} – {to12HourDisplay(daySchedule?.dinner?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-[var(--gray-400)] hover:text-[var(--gray-800)] shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "dinner")}
                                aria-label={`Edit Dinner for ${day.label}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* DIALOG 1: SINGLE SLOT EDIT MODAL */}
        <Dialog
          open={slotEditModal.open}
          onOpenChange={(open) => setSlotEditModal((p) => ({ ...p, open }))}
        >
          <DialogContent className="sm:max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] capitalize">
                Edit {slotEditModal.mealType} ({DAYS_MAP.find((d) => d.dayOfWeek === slotEditModal.dayOfWeek)?.label})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">Menu Items</Label>
                <Input
                  value={slotMenu}
                  onChange={(e) => setSlotMenu(e.target.value)}
                  placeholder="e.g. Aloo Paratha, Curd, Pickle"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Start Time</Label>
                  <Input
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">End Time</Label>
                  <Input
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSlotEditModal((p) => ({ ...p, open: false }))}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                onClick={handleSaveSlotEdit}
                disabled={updateMutation.isPending}
              >
                Save slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: BULK TIMINGS MODAL */}
        <Dialog open={bulkTimingsModalOpen} onOpenChange={setBulkTimingsModalOpen}>
          <DialogContent className="sm:max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Set Meal Timings Across Days
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">Meal Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["breakfast", "lunch", "dinner"] as MealType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBulkMealType(type)}
                      className={`h-9 text-xs font-medium rounded-md border capitalize transition-colors ${
                        bulkMealType === type
                          ? "border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                          : "border-[var(--gray-200)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Start Time</Label>
                  <Input
                    type="time"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">End Time</Label>
                  <Input
                    type="time"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Apply to Days</Label>
                  <button
                    type="button"
                    onClick={toggleSelectAllDays}
                    className="text-xs text-[var(--brand-600)] hover:underline"
                  >
                    {selectedDays.length === 7 ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_MAP.map((d) => {
                    const checked = selectedDays.includes(d.dayOfWeek);
                    return (
                      <label
                        key={d.dayOfWeek}
                        className={`flex items-center gap-1.5 p-2 rounded border cursor-pointer text-xs ${
                          checked ? "border-[var(--brand-600)] bg-[var(--brand-50)]" : "border-[var(--gray-200)]"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleDaySelection(d.dayOfWeek)}
                        />
                        <span>{d.short}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkTimingsModalOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                onClick={handleApplyBulkTimings}
                disabled={updateMutation.isPending}
              >
                Apply timings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
