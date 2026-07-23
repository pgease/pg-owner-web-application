import React, { useMemo, useState } from "react";
import { Receipt, Plus, Search, Trash2, Calendar, IndianRupee, PieChart, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CanAccessPage } from "@/components/PermissionGuard";

interface ExpenseItem {
  id: string;
  propertyId: string;
  amount: number;
  category: "SALARY" | "ELECTRICITY" | "FOOD" | "MAINTENANCE" | "OTHERS";
  description: string;
  expenseDate: string;
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: "1", propertyId: "prop1", amount: 12000, category: "SALARY", description: "Warden helper monthly salary", expenseDate: "2026-07-15" },
  { id: "2", propertyId: "prop1", amount: 8400, category: "ELECTRICITY", description: "Main line electric bill", expenseDate: "2026-07-10" },
  { id: "3", propertyId: "prop1", amount: 4500, category: "FOOD", description: "Weekly dairy and vegetables supply", expenseDate: "2026-07-18" },
  { id: "4", propertyId: "prop1", amount: 3200, category: "MAINTENANCE", description: "Plumbing repair room 204", expenseDate: "2026-07-12" },
  { id: "5", propertyId: "prop1", amount: 1500, category: "OTHERS", description: "High-speed Wi-Fi router recharge", expenseDate: "2026-07-05" }
];

const CATEGORY_COLORS = {
  SALARY: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  ELECTRICITY: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  FOOD: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MAINTENANCE: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  OTHERS: "bg-slate-500/10 text-slate-600 border-slate-500/20"
};

const Expenses = () => {
  const { selectedPgId } = useApp();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
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

    const newExpense: ExpenseItem = {
      id: Math.random().toString(),
      propertyId: selectedPgId || "general",
      amount: amt,
      category,
      description: description.trim(),
      expenseDate: expenseDate || new Date().toISOString().split("T")[0],
    };

    setExpenses((prev) => [newExpense, ...prev]);
    toast({ title: "Expense Added", description: `Recorded ₹${amt.toLocaleString()} under ${category}.` });
    setAmount("");
    setDescription("");
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Expense Deleted", description: "Expense item deleted successfully." });
  };

  return (
    <CanAccessPage permission="expense_view">
      <div className="space-y-6 animate-fade-in pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <PageHeader title="Expense Tracker" description="Record monthly operating expenses, analyze cash outflows, and track categories." />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm shrink-0">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record PG Expense</DialogTitle>
                <DialogDescription>Log operating expenses to maintain your monthly ledger.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1500" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseItem["category"])}>
                    <SelectTrigger>
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
                <div className="grid gap-2">
                  <Label htmlFor="date">Expense Date</Label>
                  <Input id="date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this spent on?" required />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expense Analytics Banner */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/80 shadow-sm bg-rose-50/20 dark:bg-rose-950/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Total Outflow</p>
                <p className="text-3xl font-bold mt-1 tabular-nums">₹{stats.total.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <IndianRupee className="h-6 w-6 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm sm:col-span-2">
            <CardHeader className="py-2.5 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5" /> Outflow by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap gap-x-6 gap-y-3">
              {(["SALARY", "ELECTRICITY", "FOOD", "MAINTENANCE", "OTHERS"] as const).map((cat) => {
                const value = stats.categoryTotals[cat] || 0;
                const percentage = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
                return (
                  <div key={cat} className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                    <span className="text-sm font-bold mt-0.5 tabular-nums">
                      ₹{value.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border rounded-lg bg-card p-4">
          <div className="relative min-w-0 flex-1 max-w-lg w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="SALARY">Salary</SelectItem>
                <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                <SelectItem value="FOOD">Food</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="OTHERS">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expense List */}
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30">
                  <TableHead className="font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="font-semibold text-foreground">Description</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Amount</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50 text-muted-foreground" />
                      <p className="font-semibold">No expenses found</p>
                      <p className="text-xs">Try adjusting filter criteria or log a new expense.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(row.expenseDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CATEGORY_COLORS[row.category]}>
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium text-foreground">
                        {row.description}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        ₹{row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(row.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </CanAccessPage>
  );
};

export default Expenses;
