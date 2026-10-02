import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, AlertTriangle, Building2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CanAccessPage } from "@/components/PermissionGuard";
import { formatINR, formatDate } from "@/lib/formatters";

interface ExpenseItem {
  id: string;
  propertyId: string;
  amount: number;
  category: "SALARY" | "ELECTRICITY" | "FOOD" | "MAINTENANCE" | "OTHERS";
  description: string;
  expenseDate: string;
}

const STORAGE_KEY = "pgease_local_expenses_v1";

function loadExpenses(): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const CATEGORY_LABELS: Record<ExpenseItem["category"], string> = {
  SALARY: "Staff Salary",
  ELECTRICITY: "Electricity & Utilities",
  FOOD: "Food & Dining",
  MAINTENANCE: "Repairs & Maintenance",
  OTHERS: "Other Expenses",
};

const Expenses = () => {
  const { selectedPgId } = useApp();
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>(loadExpenses);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allExpenses));
    } catch {
      /* storage unavailable */
    }
  }, [allExpenses]);

  const expenses = useMemo(
    () => allExpenses.filter((e) => !selectedPgId || e.propertyId === selectedPgId || e.propertyId === "general"),
    [allExpenses, selectedPgId]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseItem["category"]>("MAINTENANCE");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const categoryTotals = filteredExpenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {} as Record<ExpenseItem["category"], number>);

    return { total, categoryTotals };
  }, [filteredExpenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Validation Error", description: "Please enter a description.", variant: "destructive" });
      return;
    }

    const newItem: ExpenseItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId: selectedPgId || "general",
      amount: amt,
      category,
      description: description.trim(),
      expenseDate,
    };

    setAllExpenses((prev) => [newItem, ...prev]);
    toast({ title: "Expense recorded" });
    setAmount("");
    setDescription("");
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setAllExpenses((prev) => prev.filter((item) => item.id !== id));
    setPendingDeleteId(null);
    toast({ title: "Expense deleted" });
  };

  return (
    <CanAccessPage permission="expense_view">
      <div className="space-y-6">
        <PageHeader
          title="Expenses"
          description="Keep a simple operational register of PG running costs — staff salaries, utility bills, groceries, and repairs."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Record expense
            </Button>
          }
        />

        {/* P0 Bug 9: Prominent Device-only Storage Warning */}
        <div className="flex items-start gap-3 rounded-md border border-[var(--warning)] bg-[#FFF7E6] p-3 text-xs text-[var(--gray-800)]">
          <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#A15C07]">
              Device-Only Storage Warning
            </span>
            <p className="text-[var(--gray-700)] leading-relaxed">
              Expenses are currently stored locally in your browser cache. They will not appear on other devices or for your staff, and clearing browser history will erase these records. Cloud sync API integration is in development.
            </p>
          </div>
        </div>

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to manage expenses."
            />
          </div>
        ) : (
          <>
            {/* Outflow Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricDisplay
                label="Total Outflow"
                value={formatINR(stats.total)}
                hint={`${filteredExpenses.length} expense entries recorded`}
                tone={stats.total > 0 ? "error" : "neutral"}
              />
              <MetricDisplay
                label="Salaries"
                value={formatINR(stats.categoryTotals.SALARY || 0)}
                hint="Warden & staff compensation"
                tone="neutral"
              />
              <MetricDisplay
                label="Utilities"
                value={formatINR(stats.categoryTotals.ELECTRICITY || 0)}
                hint="Electricity, water & gas bills"
                tone="neutral"
              />
              <MetricDisplay
                label="Food & Maintenance"
                value={formatINR((stats.categoryTotals.FOOD || 0) + (stats.categoryTotals.MAINTENANCE || 0))}
                hint="Mess supplies & repair costs"
                tone="neutral"
              />
            </div>

            {/* Expenses Register Table */}
            <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
                <div className="flex-1 max-w-sm">
                  <SearchInput
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="SALARY">Staff Salary</SelectItem>
                      <SelectItem value="ELECTRICITY">Electricity & Utilities</SelectItem>
                      <SelectItem value="FOOD">Food & Dining</SelectItem>
                      <SelectItem value="MAINTENANCE">Repairs & Maintenance</SelectItem>
                      <SelectItem value="OTHERS">Other Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <EmptyState
                  title={searchQuery || categoryFilter !== "all" ? "No matching expenses" : "No expenses recorded yet"}
                  description={
                    searchQuery || categoryFilter !== "all"
                      ? "Try changing your search term or category filter."
                      : "Record maintenance expenses, utility bills, and salaries to track your PG outflow."
                  }
                  action={
                    searchQuery || categoryFilter !== "all" ? undefined : (
                      <Button
                        size="sm"
                        className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                        onClick={() => setOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Record first expense
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                  <Table>
                    <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2.5 px-3">Date</TableHead>
                        <TableHead className="py-2.5 px-3">Description</TableHead>
                        <TableHead className="py-2.5 px-3">Category</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Amount</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((e) => (
                        <TableRow key={e.id} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2.5 px-3 whitespace-nowrap tabular-nums text-[var(--gray-600)]">
                            {formatDate(e.expenseDate)}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 font-medium text-[var(--gray-900)]">
                            {e.description}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)]">
                              {CATEGORY_LABELS[e.category] || e.category}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-semibold text-[var(--gray-900)] tabular-nums whitespace-nowrap">
                            {formatINR(e.amount)}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[var(--gray-400)] hover:text-[#B42318] hover:bg-[#FEF1F0]"
                              onClick={() => setPendingDeleteId(e.id)}
                              aria-label="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Expense Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Record PG Expense
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Log operating outflow to maintain your monthly property ledger.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddExpense} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-medium text-[var(--gray-700)]">
                  Amount (₹) <span className="text-[#B42318]">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-[var(--gray-500)]">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="pl-7 h-9 text-sm tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-medium text-[var(--gray-700)]">
                  Category <span className="text-[#B42318]">*</span>
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseItem["category"])}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY">Salary (Staff / Warden)</SelectItem>
                    <SelectItem value="ELECTRICITY">Electricity & Utilities</SelectItem>
                    <SelectItem value="FOOD">Food & Dining Supplies</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance & Repairs</SelectItem>
                    <SelectItem value="OTHERS">Others (Internet, Consumables)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium text-[var(--gray-700)]">
                  Expense Date <span className="text-[#B42318]">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-medium text-[var(--gray-700)]">
                  Description <span className="text-[#B42318]">*</span>
                </Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Motor repair and plumber visit"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="border-[var(--gray-300)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                >
                  Save expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={Boolean(pendingDeleteId)}
          onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
          title="Delete expense entry?"
          description="Are you sure you want to remove this expense record from your local register?"
          confirmLabel="Delete"
          destructive
          onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)}
        />
      </div>
    </CanAccessPage>
  );
};

export default Expenses;
