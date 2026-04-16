import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Phone,
  MessageCircle,
  Lock,
  IndianRupee,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";
import type { PropertyTenant } from "@/api/propertyOwner";
import { updatePropertyTenant } from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import {
  tenantBedNo,
  tenantDisplayName,
  tenantFloor,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
} from "@/lib/tenantDisplay";
import { useApp } from "@/context/AppContext";
import { queryKeys, usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function waLink(phone: string): string | null {
  const d = phoneDigits(phone);
  if (d.length < 10) return null;
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPgId } = useApp();
  const tenantsQuery = usePropertyTenants(selectedPgId);

  const tenant = useMemo(() => {
    const rows = tenantsQuery.data ?? [];
    return rows.find((t) => t.id === tenantId) ?? null;
  }, [tenantsQuery.data, tenantId]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rentOpen, setRentOpen] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name ?? "");
    setPhone((tenant.phone ?? "").replace(/^\+91/, ""));
    setEmail(tenant.email ?? "");
    setEditing(false);
  }, [tenant]);

  const handleSave = async () => {
    if (!selectedPgId || !tenant) return;
    try {
      setSaving(true);
      const phoneOut = phone.trim().length >= 10 ? `+91${phoneDigits(phone)}` : phone.trim();
      await updatePropertyTenant(selectedPgId, tenant.id, {
        name: name.trim(),
        phone: phoneOut,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      toast({ title: "Saved", description: "Tenant details updated." });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(selectedPgId) });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Could not save", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const verified = tenant ? tenantVerificationLabel(tenant) === "verified" : false;
  const onNotice = tenant?.notice?.isOnNotice;
  const wa = tenant ? waLink(tenant.phone ?? "") : null;

  if (!selectedPgId) {
    return (
      <CanAccessPage permission="tenant_view">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Select a PG</p>
            <p className="mt-2 text-sm">Choose a property from the header, then open a tenant from the list.</p>
            <Button asChild className="mt-4">
              <Link to="/tenants">Go to tenants</Link>
            </Button>
          </CardContent>
        </Card>
      </CanAccessPage>
    );
  }

  if (tenantsQuery.isLoading) {
    return (
      <CanAccessPage permission="tenant_view">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </CanAccessPage>
    );
  }

  if (tenantsQuery.isError || !tenant) {
    return (
      <CanAccessPage permission="tenant_view">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <p className="text-muted-foreground">We could not find this tenant for the current PG.</p>
          <Button asChild variant="outline">
            <Link to="/tenants">Back to list</Link>
          </Button>
        </div>
      </CanAccessPage>
    );
  }

  const startDate =
    tenant.roomTenant?.startDate != null
      ? new Date(tenant.roomTenant.startDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <CanAccessPage permission="tenant_view">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <Link to="/tenants">
                <ArrowLeft className="h-4 w-4" />
                Tenants
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          {/* Left profile */}
          <Card className="h-fit border-border/80 shadow-sm lg:sticky lg:top-20">
            <CardContent className="p-6 text-center">
              <Avatar className="mx-auto h-20 w-20 border-2 border-primary/15">
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {tenantInitials(tenant)}
                </AvatarFallback>
              </Avatar>
              <h1 className="mt-4 text-xl font-bold tracking-tight">{tenantDisplayName(tenant)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{tenantPhone(tenant)}</p>
              <Badge
                className={cn(
                  "mt-3",
                  onNotice
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-100"
                    : "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
                )}
              >
                {onNotice ? "On notice" : "Active"}
              </Badge>

              <div className="mt-6 flex justify-center gap-2">
                {tenantPhone(tenant) !== "—" ? (
                  <Button variant="outline" size="icon" className="rounded-lg" asChild>
                    <a href={`tel:${phoneDigits(tenant.phone ?? "")}`} aria-label="Call">
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="rounded-lg" type="button" disabled aria-label="Call">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {wa ? (
                  <Button variant="outline" size="icon" className="rounded-lg text-emerald-600" asChild>
                    <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="rounded-lg" disabled>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" className="rounded-lg" type="button" disabled title="Coming soon">
                  <Lock className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
                Room: {tenantRoomNo(tenant)}
              </div>

              {onNotice ? (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  Notice — vacate on {tenant.notice?.vacateOn ?? "—"}
                </div>
              ) : null}

              <Separator className="my-6" />

              <div className="space-y-3 text-left text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stay summary</p>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">{startDate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Rent</span>
                  <span className="font-medium inline-flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {tenantRentAmount(tenant).replace("/mo", "")}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Next due</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">{tenantRentDueLabel(tenant)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right detail */}
          <div className="min-w-0 space-y-4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 sm:grid-cols-4 sm:w-auto">
                <TabsTrigger value="joining" className="text-xs sm:text-sm">
                  Joining
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="documents" disabled className="text-xs sm:text-sm">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="passbook" disabled className="text-xs sm:text-sm">
                  Passbook
                </TabsTrigger>
              </TabsList>

              <TabsContent value="joining" className="mt-4">
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Joining snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Full joining form and agreements will appear here when the product supports them. Allocation and rent
                    below reflect the current API.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="mt-4 space-y-4">
                <CanAccess permission="tenant_edit_basic">
                  <div className="flex justify-end">
                    {!editing ? (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(false);
                            setName(tenant.name ?? "");
                            setPhone((tenant.phone ?? "").replace(/^\+91/, ""));
                            setEmail(tenant.email ?? "");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CanAccess>

                {editing ? (
                  <Card className="border-border/80 shadow-sm">
                    <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="t-name">Full name</Label>
                        <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-phone">Phone</Label>
                        <Input id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="t-email">Email</Label>
                        <Input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Collapsible open={rentOpen} onOpenChange={setRentOpen}>
                  <Card className="overflow-hidden border-border/80 shadow-sm">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between border-b bg-sky-50/80 px-4 py-3 text-left text-sm font-semibold text-sky-950 dark:bg-sky-950/40 dark:text-sky-50"
                      >
                        Renting details
                        <ChevronDown className={cn("h-4 w-4 transition-transform", rentOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-4 sm:p-6">
                        <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
                          <div>
                            <DetailRow label="Full name" value={tenantDisplayName(tenant)} />
                            <DetailRow label="Phone" value={tenantPhone(tenant)} />
                            <DetailRow label="Email" value={tenant.email?.trim() ? tenant.email : "—"} />
                            <DetailRow label="Monthly rent" value={tenantRentAmount(tenant)} />
                            <DetailRow
                              label="Security deposit"
                              value={
                                tenant.roomTenant?.securityDeposit != null
                                  ? `₹${Number(tenant.roomTenant.securityDeposit).toLocaleString("en-IN")}`
                                  : "—"
                              }
                            />
                            <DetailRow label="Assignment status" value={tenant.roomTenant?.status ?? "—"} />
                          </div>
                          <div>
                            <DetailRow label="Block" value={tenant.block?.name ?? "—"} />
                            <DetailRow label="Floor" value={tenantFloor(tenant)} />
                            <DetailRow label="Room" value={tenantRoomNo(tenant)} />
                            <DetailRow label="Bed" value={tenantBedNo(tenant)} />
                            <DetailRow label="Start date" value={startDate} />
                            <DetailRow label="KYC" value={verified ? "Verified" : "Pending"} />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur-md">
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/rent-payments">
                <IndianRupee className="mr-1.5 h-4 w-4" />
                Rent & dues
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" type="button" disabled>
              <ClipboardList className="mr-1.5 h-4 w-4" />
              Activity
            </Button>
            <CanAccess permission="tenant_edit_basic">
              <Button size="sm" className="rounded-full" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit profile
              </Button>
            </CanAccess>
          </div>
        </div>
      </div>
    </CanAccessPage>
  );
}
