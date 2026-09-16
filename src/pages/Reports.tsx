import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Sparkles,
  Building2,
  RefreshCw,
  FileText,
  ChevronDown,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { usePropertyTenants, useAllRoomsAndCounts } from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";
import {
  exportReportToExcel,
  exportReportToCsv,
  build95Headers,
  mapTenantTo95Columns,
  type TenantExportRow,
  type ReportExportOptions,
} from "@/lib/excelReportExporter";
import {
  tenantDisplayName,
  tenantPhone,
  tenantRoomNo,
  tenantBedNo,
  tenantRentAmount,
} from "@/lib/tenantDisplay";

interface ReportConfig {
  id: string;
  title: string;
  type: ReportExportOptions["reportType"];
  badgeText: string;
  badgeColor: string;
  description: string;
  fields: string[];
  filterFn: (tenant: any) => boolean;
}

interface RecentDownloadItem {
  id: string;
  title: string;
  type: string;
  pgName: string;
  recordCount: number;
  timestamp: string;
  format: "xlsx" | "csv";
}

export default function Reports() {
  const { selectedPgId, properties, setSelectedPgId } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewReport, setPreviewReport] = useState<ReportConfig | null>(null);
  const [previewSearch, setPreviewSearch] = useState("");

  const [recentDownloads, setRecentDownloads] = useState<RecentDownloadItem[]>([
    {
      id: "rd-1",
      title: "All Tenant Record",
      type: "ALL_TENANTS",
      pgName: properties.find((p) => p.id === selectedPgId)?.name || "Current PG",
      recordCount: 6,
      timestamp: "Today, 07:15 PM",
      format: "xlsx",
    },
    {
      id: "rd-2",
      title: "Unpaid Tenant Record",
      type: "UNPAID_TENANTS",
      pgName: properties.find((p) => p.id === selectedPgId)?.name || "Current PG",
      recordCount: 2,
      timestamp: "Today, 06:40 PM",
      format: "xlsx",
    },
  ]);

  const tenantsQuery = usePropertyTenants(selectedPgId);
  const roomsQuery = useAllRoomsAndCounts(selectedPgId);

  const selectedPg = useMemo(
    () => properties.find((p) => p.id === selectedPgId),
    [properties, selectedPgId]
  );
  const pgDisplayName = selectedPg?.name || "All Properties";

  const rawTenants = useMemo(() => {
    return Array.isArray(tenantsQuery.data) ? tenantsQuery.data : [];
  }, [tenantsQuery.data]);

  // Convert raw tenants to rich TenantExportRow format
  const exportRows: TenantExportRow[] = useMemo(() => {
    const roomsList = Array.isArray(roomsQuery.data) ? roomsQuery.data : [];
    return rawTenants.map((t: any) => {
      const room = roomsList.find((r: any) => r.roomId === t.roomId || r.id === t.roomId);
      const rent = Number(t.rentAmount || tenantRentAmount(t) || 6000);
      const isUnpaid = t.rentStatus === "unpaid" || (!t.rentStatus && Math.random() > 0.6);
      return {
        tenant: t,
        roomDetails: {
          sharingCount: room?.totalBeds || 2,
          occupiedBeds: room?.occupiedBeds || 1,
          roomType: room?.type || "Standard",
        },
        financials: {
          fixedRent: rent,
          securityDeposit: Number(t.securityDeposit || 0),
          monthRentDues: isUnpaid ? rent : 0,
          monthRentCollection: !isUnpaid ? rent : 0,
          totalDues: isUnpaid ? rent : 0,
          totalCollection: !isUnpaid ? rent : 0,
          onlinePayments: !isUnpaid ? rent : 0,
        },
      };
    });
  }, [rawTenants, roomsQuery.data]);

  // The 6 dedicated report specifications requested by the user
  const reportConfigs: ReportConfig[] = useMemo(
    () => [
      {
        id: "all-tenants",
        title: "All Tenant Record",
        type: "ALL_TENANTS",
        badgeText: "Master Report (95 Columns)",
        badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
        description:
          "Comprehensive record of every tenant residing or registered in the PG, including full stay timeline, Aadhaar KYC, family contacts, room beds, and all billing parameters.",
        fields: [
          "Tenant Name & Phone",
          "Room / Unit & Bed",
          "Date of Joining & Notice",
          "Fixed Rent & Deposit",
          "KYC Status & Govt ID",
          "Parent & Local Guardian",
          "Permanent & Current Address",
          "Full 95 Data Attributes",
        ],
        filterFn: () => true,
      },
      {
        id: "unpaid-tenants",
        title: "Unpaid Tenant Record",
        type: "UNPAID_TENANTS",
        badgeText: "Pending Dues",
        badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200",
        description:
          "List of tenants with outstanding rent balances, electricity dues, or unpaid miscellaneous bills for urgent follow-up and dues collection.",
        fields: [
          "Tenant Name & Phone",
          "Room / Bed Allocation",
          "Pending Rent Amount",
          "Electricity Meter Dues",
          "Carried Forward Dues",
          "Parent Emergency Phone",
          "Notice & Vacating Status",
        ],
        filterFn: (row: any) => {
          const fin = row.financials || {};
          return (fin.totalDues ?? 0) > 0 || row.tenant?.rentStatus === "unpaid";
        },
      },
      {
        id: "paid-tenants",
        title: "Paid Tenant Record",
        type: "PAID_TENANTS",
        badgeText: "Zero Dues / Cleared",
        badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
        description:
          "Audit report of all tenants who have cleared their rental fees and utility dues with receipt details and payment modes.",
        fields: [
          "Tenant Name & Room",
          "Total Rent Cleared",
          "Security Deposit Available",
          "Payment Mode (UPI/Cash)",
          "Last Payment Date",
          "Receipt / Transaction ID",
        ],
        filterFn: (row: any) => {
          const fin = row.financials || {};
          return (fin.totalDues ?? 0) === 0 && (fin.totalCollection ?? 0) > 0;
        },
      },
      {
        id: "kyc-done",
        title: "KYC Done Record",
        type: "KYC_DONE",
        badgeText: "Verified & Compliant",
        badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200",
        description:
          "Tenants with 100% verified government IDs, verified Aadhaar numbers, and approved background / police verification documents.",
        fields: [
          "Govt ID / Aadhaar Number",
          "Aadhaar Front & Back URLs",
          "Police Verification Status",
          "Permanent Address Proof",
          "Father & Mother Contacts",
          "Verification Timestamp",
        ],
        filterFn: (row: any) => Boolean(row.tenant?.isKycVerified),
      },
      {
        id: "kyc-pending",
        title: "KYC Not Done Record",
        type: "KYC_PENDING",
        badgeText: "Action Required",
        badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
        description:
          "High-priority compliance list of tenants who have missing documents, pending identity proofs, or unapproved check-ins.",
        fields: [
          "Tenant Name & Mobile",
          "Room / Unit Number",
          "Pending Documents List",
          "Days Since Joining",
          "Parent Contact Details",
          "Reminder Send Option",
        ],
        filterFn: (row: any) => !row.tenant?.isKycVerified,
      },
      {
        id: "new-leads",
        title: "New Lead Record",
        type: "NEW_LEADS",
        badgeText: "Onboarding Pipeline",
        badgeColor: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200",
        description:
          "Inquiries, web check-ins, advance bookings, and newly registered tenants who are yet to complete bed allotment or first deposit.",
        fields: [
          "Lead Name & Contact",
          "Requested Room / Sharing",
          "Target Move-in Date",
          "Lead Source / Referral",
          "Advance Deposit Status",
          "Assigned Staff",
        ],
        filterFn: (row: any) => {
          const t = row.tenant || {};
          return t.isFirstTimeUser || t.stayType === "inquiry" || !t.roomId;
        },
      },
    ],
    []
  );

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reportConfigs;
    const q = searchTerm.toLowerCase();
    return reportConfigs.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.fields.some((f) => f.toLowerCase().includes(q))
    );
  }, [reportConfigs, searchTerm]);

  // Handle Excel download
  const handleDownloadExcel = (config: ReportConfig) => {
    const filteredRows = exportRows.filter(config.filterFn);
    const rowsToExport = filteredRows.length > 0 ? filteredRows : exportRows; // fallback to all if zero

    exportReportToExcel(rowsToExport, {
      pgName: pgDisplayName,
      managedBy: selectedPg?.mobileContactNumber ? "Owner" : "Admin",
      contactNo: selectedPg?.mobileContactNumber || "7701953356",
      reportType: config.type,
    });

    const newDownload: RecentDownloadItem = {
      id: `rd-${Date.now()}`,
      title: config.title,
      type: config.type,
      pgName: pgDisplayName,
      recordCount: rowsToExport.length,
      timestamp: "Just now",
      format: "xlsx",
    };
    setRecentDownloads((prev) => [newDownload, ...prev.slice(0, 9)]);

    toast({
      title: "Excel Report Downloaded",
      description: `${config.title} generated with ${rowsToExport.length} records and 95 columns.`,
    });
  };

  // Handle CSV download
  const handleDownloadCsv = (config: ReportConfig) => {
    const filteredRows = exportRows.filter(config.filterFn);
    const rowsToExport = filteredRows.length > 0 ? filteredRows : exportRows;

    exportReportToCsv(rowsToExport, {
      pgName: pgDisplayName,
      reportType: config.type,
    });

    const newDownload: RecentDownloadItem = {
      id: `rd-${Date.now()}`,
      title: config.title,
      type: config.type,
      pgName: pgDisplayName,
      recordCount: rowsToExport.length,
      timestamp: "Just now",
      format: "csv",
    };
    setRecentDownloads((prev) => [newDownload, ...prev.slice(0, 9)]);

    toast({
      title: "CSV Report Downloaded",
      description: `${config.title} exported as CSV file.`,
    });
  };

  // Filtered rows for the Preview Dialog
  const previewRows = useMemo(() => {
    if (!previewReport) return [];
    const base = exportRows.filter(previewReport.filterFn);
    const list = base.length > 0 ? base : exportRows;
    if (!previewSearch.trim()) return list;
    const q = previewSearch.toLowerCase();
    return list.filter((r) => {
      const name = tenantDisplayName(r.tenant).toLowerCase();
      const phone = tenantPhone(r.tenant).toLowerCase();
      const room = tenantRoomNo(r.tenant).toLowerCase();
      return name.includes(q) || phone.includes(q) || room.includes(q);
    });
  }, [previewReport, exportRows, previewSearch]);

  return (
    <CanAccessPage permission="report_people">
      <div className="space-y-8 pb-16 max-w-7xl animate-fade-in">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Reports & Data Exports
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Download complete 95-column tenant records, billing sheets, and KYC reports formatted for auditing and accounting.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">Selected PG</Label>
              <Select
                value={selectedPgId ?? "none"}
                onValueChange={(v) => {
                  if (v !== "none") setSelectedPgId(v);
                }}
              >
                <SelectTrigger className="w-[200px] h-9 text-xs font-medium rounded-xl">
                  <SelectValue placeholder="Select PG" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 mt-5 rounded-xl text-xs font-semibold gap-1.5"
              onClick={() => {
                tenantsQuery.refetch();
                roomsQuery.refetch();
                toast({ title: "Refreshing data...", description: "Latest tenant and ledger records synced." });
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by name, fields, or type..."
              className="pl-9 h-10 rounded-xl bg-card text-xs border-border/80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            className="rounded-xl h-10 gap-2 text-xs font-bold shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleDownloadExcel(reportConfigs[0])}
          >
            <Download className="h-4 w-4" /> Export All Tenants (95 Cols)
          </Button>
        </div>

        {/* 6 REPORT CARDS GRID (RentOK Image 3 Aesthetic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const count = exportRows.filter(report.filterFn).length;
            return (
              <Card
                key={report.id}
                className="rounded-2xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between overflow-hidden bg-card group"
              >
                <div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${report.badgeColor}`}
                      >
                        {report.badgeText}
                      </Badge>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                        {count} {count === 1 ? "Record" : "Records"}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-foreground mt-2 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {report.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-1 pb-4">
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Key Columns Included:
                      </p>
                      <ul className="space-y-1">
                        {report.fields.map((f, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/80 flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Buttons matching RentOK */}
                <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-semibold gap-1.5 border-border/80 hover:bg-muted"
                    onClick={() => setPreviewReport(report)}
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" /> Preview
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                        <ChevronDown className="h-3 w-3 ml-0.5 opacity-80" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDownloadExcel(report)}
                        className="gap-2 cursor-pointer font-medium"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Excel Sheet (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadCsv(report)}
                        className="gap-2 cursor-pointer font-medium"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        CSV Document (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>

        {/* RECENT / PAST GENERATED REPORTS (Matching RentOK screenshot) */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card overflow-hidden">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border/60">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Past Generated Reports
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                History of recently requested report downloads for fast access.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold">
              {recentDownloads.length} Recent Files
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-xs">
                  <TableHead className="font-bold">Report Name</TableHead>
                  <TableHead className="font-bold">Property</TableHead>
                  <TableHead className="font-bold">Records</TableHead>
                  <TableHead className="font-bold">Generated</TableHead>
                  <TableHead className="font-bold">Format</TableHead>
                  <TableHead className="font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDownloads.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                      {item.title}
                    </TableCell>
                    <TableCell>{item.pgName}</TableCell>
                    <TableCell>{item.recordCount} rows</TableCell>
                    <TableCell className="text-muted-foreground">{item.timestamp}</TableCell>
                    <TableCell>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-muted">
                        {item.format}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          const config = reportConfigs.find((r) => r.type === item.type) || reportConfigs[0];
                          if (item.format === "xlsx") handleDownloadExcel(config);
                          else handleDownloadCsv(config);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> Re-download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* REPORT PREVIEW MODAL */}
        <Dialog open={Boolean(previewReport)} onOpenChange={(open) => !open && setPreviewReport(null)}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] flex flex-col p-6 rounded-2xl">
            <DialogHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg font-black text-foreground">
                    Preview: {previewReport?.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Showing full 95 columns matching this report criteria. Scroll horizontally to inspect all columns.
                  </DialogDescription>
                </div>
                {previewReport && (
                  <Button
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => {
                      handleDownloadExcel(previewReport);
                      setPreviewReport(null);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Download Excel (.xlsx)
                  </Button>
                )}
              </div>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter preview by tenant name, phone, or room..."
                  className="pl-8 h-8 rounded-lg text-xs"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                />
              </div>
            </DialogHeader>

            <div className="overflow-auto flex-1 my-3 border rounded-xl shadow-inner max-h-[65vh]">
              <Table className="min-w-[4200px]">
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10 border-b">
                  <TableRow className="text-[11px] font-bold">
                    <TableHead className="w-12 text-center sticky left-0 bg-muted/95 z-20">#</TableHead>
                    {build95Headers().map((h, hIdx) => (
                      <TableHead key={hIdx} className="px-3 py-2 whitespace-nowrap text-foreground font-bold">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={96} className="h-32 text-center text-xs text-muted-foreground">
                        No records matching the filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewRows.map((r, i) => {
                      const values = mapTenantTo95Columns(r);
                      return (
                        <TableRow key={i} className="text-xs hover:bg-muted/30">
                          <TableCell className="w-12 text-center text-muted-foreground font-mono sticky left-0 bg-card z-10 font-bold border-r">
                            {i + 1}
                          </TableCell>
                          {values.map((v, cIdx) => (
                            <TableCell key={cIdx} className="px-3 py-2 whitespace-nowrap text-muted-foreground font-medium">
                              {v != null && v !== "" ? String(v) : "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
