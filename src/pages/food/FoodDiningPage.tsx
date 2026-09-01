import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UtensilsCrossed, Clock, Edit2, Save, Coffee, Sun, Moon, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { getDiningSchedule, updateDiningSchedule, type DiningDaySchedule } from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";

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
        return (
          found || {
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
    mutationFn: async (updatedSchedule: DiningDaySchedule[]) => {
      if (!selectedPgId) return;
      const payload = {
        schedule: updatedSchedule.map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          breakfast: {
            menu: s.breakfast?.menu || "",
            startTime: formatHHmm(s.breakfast?.startTime, "08:30"),
            endTime: formatHHmm(s.breakfast?.endTime, "09:30"),
          },
          lunch: {
            menu: s.lunch?.menu || "",
            startTime: formatHHmm(s.lunch?.startTime, "13:00"),
            endTime: formatHHmm(s.lunch?.endTime, "14:30"),
          },
          dinner: {
            menu: s.dinner?.menu || "",
            startTime: formatHHmm(s.dinner?.startTime, "20:30"),
            endTime: formatHHmm(s.dinner?.endTime, "22:00"),
          },
        })),
      };
      return updateDiningSchedule(selectedPgId, payload);
    },
    onSuccess: () => {
      toast({ title: "Dining Schedule Saved 🍲", description: "Food menu and timings updated successfully." });
      setSlotEditModal({ open: false, dayOfWeek: 1, mealType: "breakfast" });
      setBulkTimingsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["diningSchedule", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save schedule", description: e?.message, variant: "destructive" });
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
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-teal-600" /> Food & Dining Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage weekly food menus and meal timing slots for residents at {selectedPg?.name || "your PG"}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1.5 font-bold text-teal-700 border-teal-200 hover:bg-teal-50 shadow-xs"
              onClick={() => setBulkTimingsModalOpen(true)}
            >
              <Clock className="h-4 w-4" /> Set Timings Across Days
            </Button>

            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5 shadow-sm"
              onClick={() => updateMutation.mutate(schedule)}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>

        {/* WEEKLY FOOD TIMETABLE */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Weekly Food Menu & Timings Matrix</CardTitle>
            <CardDescription className="text-xs">
              Weekly schedule starts from Monday. Click the edit icon on any meal slot to update its menu or timing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading food schedule...</div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                <Table className="min-w-[850px]">
                  <TableHeader className="bg-slate-100/80">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900 w-[140px] text-sm">Day of Week</TableHead>
                      <TableHead className="font-bold text-slate-900 text-sm">Breakfast ☕</TableHead>
                      <TableHead className="font-bold text-slate-900 text-sm">Lunch ☀️</TableHead>
                      <TableHead className="font-bold text-slate-900 text-sm">Dinner 🌙</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS_MAP.map((day) => {
                      const daySchedule = schedule.find((s) => s.dayOfWeek === day.dayOfWeek);

                      return (
                        <TableRow key={day.dayOfWeek} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-bold text-slate-900 text-base">
                            {day.label}
                          </TableCell>

                          {/* BREAKFAST CELL */}
                          <TableCell>
                            <div className="flex items-start justify-between gap-2 bg-teal-50/50 p-3 rounded-xl border border-teal-200/80">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-base leading-snug">
                                  {daySchedule?.breakfast?.menu || "Not set"}
                                </div>
                                <div className="text-xs font-bold text-teal-800 flex items-center gap-1.5 bg-teal-100/70 w-fit px-2 py-0.5 rounded-md">
                                  <Clock className="h-3.5 w-3.5" />
                                  {to12HourDisplay(daySchedule?.breakfast?.startTime)} - {to12HourDisplay(daySchedule?.breakfast?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-teal-700 hover:bg-teal-200/60 rounded-full shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "breakfast")}
                                title={`Edit Breakfast for ${day.label}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* LUNCH CELL */}
                          <TableCell>
                            <div className="flex items-start justify-between gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-base leading-snug">
                                  {daySchedule?.lunch?.menu || "Not set"}
                                </div>
                                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 bg-amber-100/70 w-fit px-2 py-0.5 rounded-md">
                                  <Clock className="h-3.5 w-3.5" />
                                  {to12HourDisplay(daySchedule?.lunch?.startTime)} - {to12HourDisplay(daySchedule?.lunch?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-amber-700 hover:bg-amber-200/60 rounded-full shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "lunch")}
                                title={`Edit Lunch for ${day.label}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* DINNER CELL */}
                          <TableCell>
                            <div className="flex items-start justify-between gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200/80">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-base leading-snug">
                                  {daySchedule?.dinner?.menu || "Not set"}
                                </div>
                                <div className="text-xs font-bold text-indigo-800 flex items-center gap-1.5 bg-indigo-100/70 w-fit px-2 py-0.5 rounded-md">
                                  <Clock className="h-3.5 w-3.5" />
                                  {to12HourDisplay(daySchedule?.dinner?.startTime)} - {to12HourDisplay(daySchedule?.dinner?.endTime)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-indigo-700 hover:bg-indigo-200/60 rounded-full shrink-0"
                                onClick={() => handleOpenSlotEdit(day.dayOfWeek, "dinner")}
                                title={`Edit Dinner for ${day.label}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
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
          </CardContent>
        </Card>

        {/* SINGLE MEAL SLOT FOCUSED EDIT MODAL */}
        <Dialog open={slotEditModal.open} onOpenChange={(open) => setSlotEditModal({ ...slotEditModal, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold capitalize">
                <UtensilsCrossed className="h-5 w-5" /> Edit {slotEditModal.mealType} - {DAYS_MAP.find((d) => d.dayOfWeek === slotEditModal.dayOfWeek)?.label}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-900">{slotEditModal.mealType.toUpperCase()} Menu Items</Label>
                <Input
                  value={slotMenu}
                  onChange={(e) => setSlotMenu(e.target.value)}
                  placeholder="e.g. Jeera Rice, Dal Tadka, Roti"
                  className="font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-900">Start Time (Clock)</Label>
                  <Input
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="font-semibold text-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-teal-700 font-bold">{to12HourDisplay(slotStart)}</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-900">End Time (Clock)</Label>
                  <Input
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="font-semibold text-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-teal-700 font-bold">{to12HourDisplay(slotEnd)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSlotEditModal({ ...slotEditModal, open: false })}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleSaveSlotEdit} disabled={updateMutation.isPending}>
                Save {slotEditModal.mealType.toUpperCase()} Slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* BULK / MULTI-DAY TIMINGS MODAL */}
        <Dialog open={bulkTimingsModalOpen} onOpenChange={setBulkTimingsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <Clock className="h-5 w-5" /> Bulk Meal Timings Manager
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-900">Select Meal Slot to Apply Timing</Label>
                <div className="flex gap-2">
                  {(["breakfast", "lunch", "dinner"] as MealType[]).map((mt) => (
                    <Button
                      key={mt}
                      variant={bulkMealType === mt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBulkMealType(mt)}
                      className={`capitalize flex-1 font-bold text-xs ${
                        bulkMealType === mt ? "bg-teal-600 text-white" : ""
                      }`}
                    >
                      {mt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-900">Start Time (Clock)</Label>
                  <Input
                    type="time"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    className="font-semibold text-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-teal-700 font-bold">{to12HourDisplay(bulkStart)}</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-900">End Time (Clock)</Label>
                  <Input
                    type="time"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    className="font-semibold text-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-teal-700 font-bold">{to12HourDisplay(bulkEnd)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs text-slate-900">Apply Timing to Selected Days</Label>
                  <Button variant="ghost" size="sm" onClick={toggleSelectAllDays} className="text-xs h-6 text-teal-700 font-semibold px-1">
                    {selectedDays.length === 7 ? "Deselect All" : "Select All Days"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {DAYS_MAP.map((d) => {
                    const isChecked = selectedDays.includes(d.dayOfWeek);
                    return (
                      <div
                        key={d.dayOfWeek}
                        onClick={() => toggleDaySelection(d.dayOfWeek)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs font-semibold ${
                          isChecked
                            ? "bg-teal-50 border-teal-300 text-teal-900"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleDaySelection(d.dayOfWeek)} />
                        <span>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkTimingsModalOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleApplyBulkTimings} disabled={updateMutation.isPending}>
                Apply Timings to {selectedDays.length} Day(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
