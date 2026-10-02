import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Eye,
  RefreshCw,
  FileText,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import {
  usePropertyTenants,
  useAllRoomsAndCounts,
  useRentCollectionDashboard,
} from "@/hooks/usePropertyOwnerQueries";
import { EmptyState } from "@/components/common/EmptyState";
import { parseRentTenantRow } from "@/lib/rentDashboard";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";
import { formatINR, formatDate } from "@/lib/formatters";
import {
  exportReportToExcel,
  exportReportToCsv,
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
  badgeTone: "info" | "warning" | "success" | "error" | "neutral";
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
  const { selectedPgId, properties } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewReport, setPreviewReport] = useState<ReportConfig | null>(null);
  const [previewSearch, setPreviewSearch] = useState("");

  const [recentDownloads, setRecentDownloads] = useState<RecentDownloadItem[]>([]);

  const tenantsQuery = usePropertyTenants(selectedPgId);
  const roomsQuery = useAllRoomsAndCounts(selectedPgId);
  const now = new Date();
  const rentQuery = useRentCollectionDashboard(selectedPgId, now.getMonth() + 1, now.getFullYear());

  const rentStatusIndex = useMemo(() => {
    const unpaid = new Set<string>();
    const paid = new Set<string>();
    const add = (set: Set<string>, rows: any[] | undefined) => {
      (rows ?? []).forEach((row) => {
        const p = parseRentTenantRow(row);
        if (!p) return;
        set.add(p.roomTenantId);
        set.add(p.tenantId);
      });
    };
    add(unpaid, rentQuery.data?.unpaidTenants as any[]);
    add(paid, rentQuery.data?.paidTenants as any[]);
    return { unpaid, paid, known: rentQuery.data != null };
  }, [rentQuery.data]);

  const selectedPg = useMemo(
    () => properties.find((p) => p.id === selectedPgId),
    [properties, selectedPgId]
  );
  const pgDisplayName = selectedPg?.name || "All Properties";

  const rawTenants = useMemo(() => {
    return Array.isArray(tenantsQuery.data) ? tenantsQuery.data : [];
  }, [tenantsQuery.data]);

  const exportRows: TenantExportRow[] = useMemo(() => {
    const roomsList = Array.isArray(roomsQuery.data) ? roomsQuery.data : [];
    return rawTenants.map((t: any) => {
      const room = roomsList.find((r: any) => r.roomId === t.roomId || r.id === t.roomId);
      const rent = Number(t.rentAmount || tenantRentAmount(t) || 0);
      const ids = [t.roomTenantId, t.roomTenant?.id, t.id].filter(Boolean).map(String);
      const isUnpaid = t.rentStatus === "unpaid" || ids.some((id) => rentStatusIndex.unpaid.has(id));
      const isPaid = t.rentStatus === "paid" || ids.some((id) => rentStatusIndex.paid.has(id));
      return {
        tenant: t,
        roomDetails: {
          sharingCount: room?.totalBeds ?? 0,
          occupiedBeds: room?.occupiedBeds ?? 0,
          roomType: room?.type || "",
        },
        financials: {
          fixedRent: rent,
          securityDeposit: Number(t.securityDeposit || 0),
          monthRentDues: isUnpaid ? rent : 0,
          monthRentCollection: isPaid ? rent : 0,
          totalDues: isUnpaid ? rent : 0,
          totalCollection: isPaid ? rent : 0,
          onlinePayments: 0,
        },
      };
    });
  }, [rawTenants, roomsQuery.data, rentStatusIndex]);

  // Aggregate Metrics for top bar (Includes All-time revenue moved from Rent Collection)
  const metrics = useMemo(() => {
    const rentData = rentQuery.data;
    const collected = Number(rentData?.totalPaidAmount ?? 0);
    const pending = Number(rentData?.totalUnpaidAmount ?? 0);
    const kycVerified = rawTenants.filter((t) => t.isKycVerified).length;
    return {
      collected,
      pending,
      totalTenants: rawTenants.length,
      kycVerified,
    };
  }, [rentQuery.data, rawTenants]);

  const reportConfigs: ReportConfig[] = useMemo(
    () => [
      {
        id: "all-tenants",
        title: "All Tenant Record",
        type: "ALL_TENANTS",
        badgeText: "Master Record (95 Cols)",
        badgeTone: "info",
        description:
          "Full operational register of every tenant, including stay history, Aadhaar KYC, room/bed allocations, and billing parameters.",
        fields: [
          "Tenant Name & Phone",
          "Room / Unit & Bed",
          "Date of Joining & Notice",
          "Fixed Rent & Deposit",
          "KYC Status & Govt ID",
          "Parent & Guardian Contacts",
          "Full 95 Data Attributes",
        ],
        filterFn: () => true,
      },
      {
        id: "unpaid-tenants",
        title: "Unpaid Tenant Record",
        type: "UNPAID_TENANTS",
        badgeText: "Pending Dues",
        badgeTone: "error",
        description:
          "Tenants with outstanding rent balances, electricity dues, or carried forward arrears for follow-up and dues collection.",
        fields: [
          "Tenant Name & Phone",
          "Room / Bed Allocation",
          "Pending Rent Amount",
          "Electricity Meter Dues",
          "Carried Forward Dues",
          "Emergency Contact",
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
        badgeText: "Cleared / Zero Dues",
        badgeTone: "success",
        description:
          "Audit report of all tenants who have cleared rent and utility bills for the current billing cycle.",
        fields: [
          "Tenant Name & Room",
          "Total Rent Cleared",
          "Security Deposit Available",
          "Payment Mode (UPI/Cash)",
          "Transaction Reference",
        ],
        filterFn: (row: any) => {
          const fin = row.financials || {};
          return (fin.totalDues ?? 0) === 0 && (fin.totalCollection ?? 0) > 0;
        },
      },
      {
        id: "kyc-done",
        title: "KYC Verified Record",
        type: "KYC_DONE",
        badgeText: "Verified",
        badgeTone: "success",
        description:
          "Tenants with verified government identity proofs and completed digital check-in records.",
        fields: [
          "Govt ID / Aadhaar Details",
          "Address Proof Status",
          "Parent / Emergency Contact",
          "Verification Timestamp",
        ],
        filterFn: (row: any) => Boolean(row.tenant?.isKycVerified),
      },
      {
        id: "kyc-pending",
        title: "KYC Pending Record",
        type: "KYC_PENDING",
        badgeText: "Action Required",
        badgeTone: "warning",
        description:
          "High-priority compliance list of tenants who have missing ID documents or unverified check-ins.",
        fields: [
          "Tenant Name & Mobile",
          "Room / Bed Number",
          "Missing Documents List",
          "Days Since Joining",
          "Emergency Phone",
        ],
        filterFn: (row: any) => !row.tenant?.isKycVerified,
      },
      {
        id: "new-leads",
        title: "New Lead Record",
        type: "NEW_LEADS",
        badgeText: "Onboarding Pipeline",
        badgeTone: "neutral",
        description:
          "Inquiries, web bookings, advance reserves, and newly onboarded tenants pending bed allotment.",
        fields: [
          "Lead Name & Contact",
          "Requested Room / Sharing",
          "Target Move-in Date",
          "Advance Deposit Status",
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

  const handleDownloadExcel = (config: ReportConfig) => {
    const filteredRows = exportRows.filter(config.filterFn);
    const rowsToExport = filteredRows.length > 0 ? filteredRows : exportRows;

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
      description: `${config.title} generated with ${rowsToExport.length} records.`,
    });
  };

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
      description: `${config.title} exported as CSV.`,
    });
  };

  const previewRows = useMemo(() => {
    if (!previewReport) return [];
    const base = exportRows.filter(previewReport.filterFn);
    const list = base.length > 0 ? base : exportRows;
    if (!previewSearch.trim()) return list.slice(0, 25);
    const q = previewSearch.toLowerCase();
    return list
      .filter((r) => {
        const name = tenantDisplayName(r.tenant).toLowerCase();
        const phone = tenantPhone(r.tenant).toLowerCase();
        const room = tenantRoomNo(r.tenant).toLowerCase();
        return name.includes(q) || phone.includes(q) || room.includes(q);
      })
      .slice(0, 25);
  }, [previewReport, exportRows, previewSearch]);

  return (
    <CanAccessPage permission="report_people">
      <div className="space-y-6">
        <PageHeader
          title="Reports & Exports"
          description={`Download 95-column tenant records, billing sheets, and KYC audit registers for ${pgDisplayName}.`}
          action={
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--gray-300)] gap-1.5"
              onClick={() => {
                tenantsQuery.refetch();
                roomsQuery.refetch();
                rentQuery.refetch();
                toast({ title: "Syncing latest records..." });
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh data
            </Button>
          }
        />

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to generate and download reports."
            />
          </div>
        ) : (
          <>
            {/* Top Operational Metrics (Includes collection moved from Rent Collection) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricDisplay
                label="Month Collected"
                value={formatINR(metrics.collected)}
                hint="Current month rent collected"
                tone="success"
              />
              <MetricDisplay
                label="Month Pending"
                value={formatINR(metrics.pending)}
                hint="Outstanding dues for month"
                tone={metrics.pending > 0 ? "error" : "neutral"}
              />
              <MetricDisplay
                label="Total Residents"
                value={metrics.totalTenants}
                hint="Active occupants across rooms"
                tone="neutral"
              />
              <MetricDisplay
                label="KYC Verified"
                value={`${metrics.kycVerified} / ${metrics.totalTenants}`}
                hint="Compliance verified tenants"
                tone={metrics.kycVerified === metrics.totalTenants ? "success" : "warning"}
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-md border border-[var(--gray-200)]">
              <div className="flex-1 max-w-sm">
                <SearchInput
                  placeholder="Search reports by title or field..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>

              <Button
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-medium h-9 gap-2 shrink-0"
                onClick={() => handleDownloadExcel(reportConfigs[0])}
              >
                <Download className="h-4 w-4" /> Export All Tenants (95 Cols)
              </Button>
            </div>

            {/* 6 Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const count = exportRows.filter(report.filterFn).length;
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] transition-colors flex flex-col justify-between p-4 space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge
                          label={report.badgeText}
                          tone={report.badgeTone}
                          size="sm"
                        />
                        <span className="text-xs font-medium text-[var(--gray-600)] tabular-nums">
                          {count} {count === 1 ? "record" : "records"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                          {report.title}
                        </h3>
                        <p className="text-xs text-[var(--gray-600)] leading-relaxed mt-1">
                          {report.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[var(--gray-200)] space-y-1.5">
                        <span className="text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wider">
                          Key Columns Included
                        </span>
                        <ul className="space-y-1">
                          {report.fields.slice(0, 4).map((f, i) => (
                            <li
                              key={i}
                              className="text-xs text-[var(--gray-700)] flex items-center gap-1.5"
                            >
                              <span className="h-1 w-1 rounded-full bg-[var(--brand-600)] shrink-0" />
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--gray-200)] flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs border-[var(--gray-300)]"
                        onClick={() => setPreviewReport(report)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-[var(--gray-500)]" /> Preview
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium gap-1"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                            <ChevronDown className="h-3 w-3 opacity-80" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDownloadExcel(report)}
                            className="gap-2 cursor-pointer font-medium"
                          >
                            <FileSpreadsheet className="h-4 w-4 text-[var(--success)]" />
                            Excel Spreadsheet (.xlsx)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadCsv(report)}
                            className="gap-2 cursor-pointer font-medium"
                          >
                            <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                            CSV File (.csv)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Past Downloads Table (Session History) */}
            <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                    Session Download History
                  </h3>
                  <p className="text-xs text-[var(--gray-500)]">
                    Files downloaded during this session
                  </p>
                </div>
                <span className="text-xs text-[var(--gray-600)] tabular-nums">
                  {recentDownloads.length} files
                </span>
              </div>

              {recentDownloads.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--gray-500)]">
                  No files downloaded during this session yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                  <Table>
                    <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2 px-3">Report Name</TableHead>
                        <TableHead className="py-2 px-3">Property</TableHead>
                        <TableHead className="py-2 px-3 text-right">Records</TableHead>
                        <TableHead className="py-2 px-3">Time</TableHead>
                        <TableHead className="py-2 px-3">Format</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDownloads.map((item) => (
                        <TableRow key={item.id} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2 px-3 font-medium text-[var(--gray-900)]">
                            {item.title}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-[var(--gray-600)]">
                            {item.pgName}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right tabular-nums text-[var(--gray-800)]">
                            {item.recordCount}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-[var(--gray-500)] tabular-nums">
                            {item.timestamp}
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <span className="uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--gray-100)] text-[var(--gray-700)]">
                              {item.format}
                            </span>
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

        {/* Data Preview Modal */}
        <Dialog open={Boolean(previewReport)} onOpenChange={(open) => !open && setPreviewReport(null)}>
          <DialogContent className="max-w-4xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[var(--brand-600)]" />
                Preview: {previewReport?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Showing sample rows from this report. Download full file to inspect all 95 attributes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="max-w-xs">
                <SearchInput
                  placeholder="Filter preview rows..."
                  value={previewSearch}
                  onChange={setPreviewSearch}
                />
              </div>

              <div className="max-h-[380px] overflow-y-auto rounded border border-[var(--gray-200)]">
                <Table>
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)] sticky top-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2 px-3">Tenant</TableHead>
                      <TableHead className="py-2 px-3">Room / Bed</TableHead>
                      <TableHead className="py-2 px-3 text-right">Rent</TableHead>
                      <TableHead className="py-2 px-3 text-right">Dues</TableHead>
                      <TableHead className="py-2 px-3">KYC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((r, i) => (
                      <TableRow key={i} className="text-xs hover:bg-[var(--gray-50)]">
                        <TableCell className="py-2 px-3">
                          <div className="font-medium text-[var(--gray-900)]">
                            {tenantDisplayName(r.tenant)}
                          </div>
                          <div className="text-[11px] text-[var(--gray-500)]">
                            {tenantPhone(r.tenant)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-[var(--gray-700)]">
                          Room {tenantRoomNo(r.tenant)} · {tenantBedNo(r.tenant)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right tabular-nums text-[var(--gray-900)]">
                          {formatINR(r.financials.fixedRent)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right tabular-nums">
                          <span
                            className={
                              r.financials.totalDues > 0
                                ? "text-[#B42318] font-medium"
                                : "text-[var(--gray-600)]"
                            }
                          >
                            {formatINR(r.financials.totalDues)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <StatusBadge
                            label={r.tenant.isKycVerified ? "Verified" : "Pending"}
                            tone={r.tenant.isKycVerified ? "success" : "warning"}
                            size="sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--gray-200)]">
              <span className="text-xs text-[var(--gray-500)] tabular-nums">
                Showing {previewRows.length} sample records
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReport(null)}
                  className="border-[var(--gray-300)]"
                >
                  Close
                </Button>
                {previewReport && (
                  <Button
                    size="sm"
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-1.5"
                    onClick={() => {
                      handleDownloadExcel(previewReport);
                      setPreviewReport(null);
                    }}
                  >
                    <Download className="h-4 w-4" /> Download Excel
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
