import { useState } from "react";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import {
  useApproveKycMutation,
  useKycApplications,
  useKycDetail,
  useRejectKycMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

function rowId(row: Record<string, unknown>): string {
  const v = row.id ?? row.roomTenantId ?? row.applicationId;
  return typeof v === "string" ? v : String(v ?? "");
}

const Kyc = () => {
  const { data: rows = [], isLoading, isError, refetch } = useKycApplications();
  const approveMut = useApproveKycMutation();
  const rejectMut = useRejectKycMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useKycDetail(detailId);

  const list = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];

  const handleApprove = async (id: string) => {
    if (!id) return;
    try {
      await approveMut.mutateAsync(id);
      toast({ title: "KYC approved" });
    } catch (e: unknown) {
      toast({
        title: "Approve failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast({ title: "Enter a reason", variant: "destructive" });
      return;
    }
    try {
      await rejectMut.mutateAsync({ applicationId: rejectId, reason: rejectReason.trim() });
      toast({ title: "KYC rejected" });
      setRejectOpen(false);
    } catch (e: unknown) {
      toast({
        title: "Reject failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <CanAccessPage permission="kyc_view">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tenant KYC"
        description="Review KYC applications (GET /property-owners/kyc/applications)"
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Failed to load KYC applications.
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No pending KYC applications.
          </CardContent>
        </Card>
      ) : (
        <DataTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="text-right w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row, i) => {
                const id = rowId(row);
                const summary = JSON.stringify(row).slice(0, 120);
                return (
                  <TableRow key={id || String(i)}>
                    <TableCell className="font-mono text-xs max-w-[140px] truncate">{id || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">{summary}…</TableCell>
                    <TableCell className="text-right space-x-2 flex flex-wrap justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        disabled={!id}
                        onClick={() => setDetailId(id)}
                      >
                        GET
                      </Button>
                      <CanAccess permission="kyc_approve">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={!id || approveMut.isPending}
                          onClick={() => handleApprove(id)}
                        >
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Approve
                        </Button>
                      </CanAccess>
                      <CanAccess permission="kyc_approve">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={!id || rejectMut.isPending}
                          onClick={() => openReject(id)}
                        >
                          <ShieldX className="h-4 w-4 text-destructive" /> Reject
                        </Button>
                      </CanAccess>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableContainer>
      )}

      <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GET /kyc/:roomTenantId</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {JSON.stringify(detailQuery.data, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          </div>
          <CanAccess permission="kyc_approve">
            <Button onClick={submitReject} disabled={rejectMut.isPending}>
              {rejectMut.isPending ? "Saving…" : "Submit rejection"}
            </Button>
          </CanAccess>
        </DialogContent>
      </Dialog>
    </div>
    </CanAccessPage>
  );
};

export default Kyc;
