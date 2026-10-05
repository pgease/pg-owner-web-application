import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Coffee, Edit2, Moon, Save, Building2, UtensilsCrossed } from "lucide-react";
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
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

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

const EMPTY_SLOT = { menu: "", startTime: "", endTime: "" };

const EMPTY_SCHEDULE: DiningDaySchedule[] = DAYS_MAP.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  breakfast: { ...EMPTY_SLOT },
  lunch: { ...EMPTY_SLOT },
  dinner: { ...EMPTY_SLOT },
}));

type MealType = "breakfast" | "lunch" | "dinner";

const MEALS: { type: MealType; label: string; icon: typeof Coffee }[] = [
  { type: "breakfast", label: "Breakfast", icon: Coffee },
  { type: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { type: "dinner", label: "Dinner", icon: Moon },
];

function to12HourDisplay(time24?: string): string {
  if (!time24) return "";
  const parts = time24.trim().split(":");
  if (parts.length < 2) return time24;
  let hh = parseInt(parts[0], 10);
  const mm = parts[1].slice(0, 2).padStart(2, "0");
  if (isNaN(hh)) return "";
  const period = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${mm} ${period}`;
}

function mealWindow(start?: string, end?: string): string {
  const from = to12HourDisplay(start);
  const to = to12HourDisplay(end);
  if (from && to) return `${from} – ${to}`;
  return "Time not set";
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

  const { data: diningData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["diningSchedule", selectedPgId],
    queryFn: () => (selectedPgId ? getDiningSchedule(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const [schedule, setSchedule] = useState<DiningDaySchedule[]>(EMPTY_SCHEDULE);
  const today = new Date().getDay();

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
            breakfast: found.breakfast || { ...EMPTY_SLOT },
            lunch: found.lunch || { ...EMPTY_SLOT },
            dinner: found.dinner || { ...EMPTY_SLOT },
          };
        }
        return {
          dayOfWeek: d.dayOfWeek,
          breakfast: { ...EMPTY_SLOT },
          lunch: { ...EMPTY_SLOT },
          dinner: { ...EMPTY_SLOT },
        };
      });
      setSchedule(merged);
    } else {
      setSchedule(EMPTY_SCHEDULE.map((day) => ({ ...day, breakfast: { ...EMPTY_SLOT }, lunch: { ...EMPTY_SLOT }, dinner: { ...EMPTY_SLOT } })));
    }
  }, [diningData]);

  const updateMutation = useMutation({
    mutationFn: async (newSchedule: DiningDaySchedule[]) => {
      if (!selectedPgId) return;
      return updateDiningSchedule(selectedPgId, { schedule: newSchedule });
    },
    onSuccess: () => {
      toast({ title: "Meals saved", description: "Menus and timings are updated for this property." });
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
          title="Food & Meals"
          description={selectedPg ? `Weekly menus and meal times for ${selectedPg.name}.` : "Weekly menus and meal times for this property."}
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
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  {MEALS.map((meal) => <Skeleton key={meal.type} className="h-28" />)}
                </div>
                {DAYS_MAP.map((day) => <Skeleton key={day.dayOfWeek} className="h-24" />)}
              </div>
            ) : isError ? (
              <ErrorState
                title="Couldn't load meals"
                description="The weekly menu didn't load. Try again."
                onRetry={() => void refetch()}
                retrying={isFetching}
              />
            ) : (
              <>
                <section className="rounded-md border border-[var(--brand-100)] bg-[var(--brand-50)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">Today · {DAYS_MAP.find((d) => d.dayOfWeek === today)?.label}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {MEALS.map((meal) => {
                      const slot = schedule.find((s) => s.dayOfWeek === today)?.[meal.type];
                      const Icon = meal.icon;
                      return (
                        <button
                          key={meal.type}
                          type="button"
                          onClick={() => handleOpenSlotEdit(today, meal.type)}
                          className="flex min-h-[7rem] flex-col rounded-md border border-[var(--gray-200)] bg-white p-3 text-left transition-colors hover:border-[var(--brand-600)]"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-xs font-medium text-[var(--gray-600)]">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-50)] text-[var(--brand-700)]">
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                              </span>
                              {meal.label}
                            </span>
                            <Edit2 className="h-3.5 w-3.5 text-[var(--gray-400)]" aria-hidden />
                          </span>
                          <span className="mt-3 text-sm font-medium leading-snug text-[var(--gray-900)]">{slot?.menu?.trim() || "Not set"}</span>
                          <span className="mt-auto pt-2 text-xs tabular-nums text-[var(--gray-500)]">{mealWindow(slot?.startTime, slot?.endTime)}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="overflow-hidden rounded-md border border-[var(--gray-200)] bg-white">
                  <div className="border-b border-[var(--gray-200)] px-4 py-3">
                    <h2 className="text-sm font-semibold text-[var(--gray-900)]">This week</h2>
                    <p className="text-xs text-[var(--gray-500)]">Tap a meal to change the menu or the time.</p>
                  </div>
                  <div className="divide-y divide-[var(--gray-200)]">
                    {DAYS_MAP.map((day) => {
                      const daySchedule = schedule.find((s) => s.dayOfWeek === day.dayOfWeek);
                      const isToday = day.dayOfWeek === today;
                      return (
                        <div key={day.dayOfWeek} className={`grid gap-3 px-4 py-3 md:grid-cols-[7rem_1fr_1fr_1fr] ${isToday ? "bg-[var(--brand-50)]" : ""}`}>
                          <div className="flex items-center md:items-start md:pt-2">
                            <p className="text-sm font-semibold text-[var(--gray-900)]">{day.short}</p>
                            {isToday ? <span className="ml-2 rounded-sm bg-[var(--brand-600)] px-1.5 py-0.5 text-[10px] font-medium text-white">Today</span> : null}
                          </div>
                          {MEALS.map((meal) => {
                            const slot = daySchedule?.[meal.type];
                            return (
                              <button
                                key={meal.type}
                                type="button"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, meal.type)}
                                className="rounded-md border border-[var(--gray-200)] bg-white px-3 py-2 text-left transition-colors hover:border-[var(--brand-600)]"
                              >
                                <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--gray-500)]">{meal.label}</span>
                                <span className="mt-0.5 block text-sm leading-snug text-[var(--gray-900)]">{slot?.menu?.trim() || "Not set"}</span>
                                <span className="mt-1 block text-[11px] tabular-nums text-[var(--gray-500)]">{mealWindow(slot?.startTime, slot?.endTime)}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
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
