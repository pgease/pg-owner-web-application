import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wifi, Plus, Edit2, Shield, Signal, Server, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  getWifiHierarchy,
  updateFloorWifi,
  updateBlockWifi,
  updatePropertyWifiHierarchy,
} from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";

export default function WifiManagementPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const { data: wifiDetails, isLoading } = useQuery({
    queryKey: ["wifiHierarchy", selectedPgId],
    queryFn: () => (selectedPgId ? getWifiHierarchy(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const [editFloorModal, setEditFloorModal] = useState<{ open: boolean; floorId?: string; floorName?: string; ssid?: string; password?: string; speed?: number; router?: string }>({ open: false });
  const [editBlockModal, setEditBlockModal] = useState<{ open: boolean; blockId?: string; blockName?: string; ssid?: string; password?: string }>({ open: false });

  const [ssidInput, setSsidInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [speedInput, setSpeedInput] = useState<number>(100);
  const [routerInput, setRouterInput] = useState("");

  const handleOpenFloorEdit = (floor: any) => {
    setEditFloorModal({
      open: true,
      floorId: floor.floorId || floor.id,
      floorName: floor.name || floor.floorName || "Floor",
      ssid: floor.wifiSsid || "",
      password: floor.wifiPassword || "",
      speed: floor.wifiDetails?.speedMbps || 100,
      router: floor.wifiDetails?.routerModel || "",
    });
    setSsidInput(floor.wifiSsid || "");
    setPasswordInput(floor.wifiPassword || "");
    setSpeedInput(floor.wifiDetails?.speedMbps || 100);
    setRouterInput(floor.wifiDetails?.routerModel || "");
  };

  const handleOpenBlockEdit = (block: any) => {
    setEditBlockModal({
      open: true,
      blockId: block.blockId || block.id,
      blockName: block.name || block.blockName || "Block",
      ssid: block.wifiSsid || "",
      password: block.wifiPassword || "",
    });
    setSsidInput(block.wifiSsid || "");
    setPasswordInput(block.wifiPassword || "");
  };

  const updateFloorWifiMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !editFloorModal.floorId) return;
      return updateFloorWifi(selectedPgId, editFloorModal.floorId, {
        wifiSsid: ssidInput,
        wifiPassword: passwordInput,
        wifiDetails: {
          speedMbps: speedInput,
          routerModel: routerInput,
        },
      });
    },
    onSuccess: () => {
      toast({ title: "Floor WiFi Updated", description: "WiFi details saved successfully." });
      setEditFloorModal({ open: false });
      queryClient.invalidateQueries({ queryKey: ["wifiHierarchy", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update WiFi", description: e?.message, variant: "destructive" });
    },
  });

  const updateBlockWifiMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !editBlockModal.blockId) return;
      return updateBlockWifi(selectedPgId, editBlockModal.blockId, {
        wifiSsid: ssidInput,
        wifiPassword: passwordInput,
      });
    },
    onSuccess: () => {
      toast({ title: "Block WiFi Updated", description: "WiFi credentials updated successfully." });
      setEditBlockModal({ open: false });
      queryClient.invalidateQueries({ queryKey: ["wifiHierarchy", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update WiFi", description: e?.message, variant: "destructive" });
    },
  });

  const rawHierarchy = (wifiDetails as any)?.data || wifiDetails || {};
  const blocks = Array.isArray(rawHierarchy.blocks) ? rawHierarchy.blocks : Array.isArray(rawHierarchy) ? rawHierarchy : [];
  const floors = Array.isArray(rawHierarchy.floors) ? rawHierarchy.floors : [];

  return (
    <CanAccessPage permission="room_view">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wifi className="h-6 w-6 text-teal-600" /> WiFi Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure WiFi SSIDs, passwords, router specs, and speeds for {selectedPg?.name || "your property"}.
            </p>
          </div>

          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
            onClick={() => {
              if (floors.length > 0) {
                handleOpenFloorEdit(floors[0]);
              } else if (blocks.length > 0) {
                handleOpenBlockEdit(blocks[0]);
              } else {
                toast({ title: "Please create blocks/floors in PG Structure first", variant: "destructive" });
              }
            }}
          >
            <Plus className="h-4 w-4" /> Add / Configure WiFi Details
          </Button>
        </div>

        {/* HIGHLIGHT SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-teal-200 bg-teal-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                <Signal className="h-4 w-4 text-teal-600" /> Active Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-950">
                {blocks.length + floors.length} SSIDs
              </div>
              <p className="text-xs text-teal-700 mt-1">Managed block & floor WiFi zones</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600" /> Max Speed Specs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-950">200 Mbps</div>
              <p className="text-xs text-emerald-700 mt-1">High-speed optical fiber connectivity</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-600" /> WPA2/WPA3 Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Protected</div>
              <p className="text-xs text-slate-600 mt-1">Encrypted tenant network access</p>
            </CardContent>
          </Card>
        </div>

        {/* WIFI HIERARCHY CARDS */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Property Network Hierarchy</CardTitle>
            <CardDescription>Click edit on any Block or Floor to change its network credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading WiFi hierarchy details...</div>
            ) : blocks.length === 0 && floors.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Wifi className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No WiFi networks configured yet for this property.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* BLOCKS */}
                {blocks.map((block: any, idx: number) => (
                  <div key={block.blockId || idx} className="rounded-xl border border-slate-200 p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-bold">
                          Block Level
                        </Badge>
                        <h4 className="font-bold text-foreground text-base">{block.name || block.blockName || `Block ${idx + 1}`}</h4>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenBlockEdit(block)} className="gap-1.5 h-8 text-xs">
                        <Edit2 className="h-3.5 w-3.5" /> Edit WiFi
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">WiFi SSID</span>
                        <span className="font-bold text-slate-900 text-sm">{block.wifiSsid || "Not set"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">Password</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{block.wifiPassword || "••••••••"}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* FLOORS */}
                {floors.map((floor: any, idx: number) => (
                  <div key={floor.floorId || idx} className="rounded-xl border border-slate-200 p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                          Floor Level
                        </Badge>
                        <h4 className="font-bold text-foreground text-base">{floor.name || floor.floorName || `Floor ${idx + 1}`}</h4>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenFloorEdit(floor)} className="gap-1.5 h-8 text-xs">
                        <Edit2 className="h-3.5 w-3.5" /> Edit WiFi
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">WiFi SSID</span>
                        <span className="font-bold text-slate-900 text-sm">{floor.wifiSsid || "Not set"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">Password</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{floor.wifiPassword || "••••••••"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">Speed</span>
                        <span className="font-bold text-emerald-700 text-sm">{floor.wifiDetails?.speedMbps || 100} Mbps</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium block">Router Model</span>
                        <span className="font-semibold text-slate-800 truncate block">{floor.wifiDetails?.routerModel || "Standard Dual Band"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* EDIT FLOOR MODAL */}
        <Dialog open={editFloorModal.open} onOpenChange={(open) => setEditFloorModal({ ...editFloorModal, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <Wifi className="h-5 w-5" /> Edit WiFi for {editFloorModal.floorName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>WiFi SSID (Network Name)</Label>
                <Input value={ssidInput} onChange={(e) => setSsidInput(e.target.value)} placeholder="e.g. PGEase_Floor1_5G" />
              </div>
              <div className="space-y-1.5">
                <Label>WiFi Password</Label>
                <Input value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter password" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Speed (Mbps)</Label>
                  <Input type="number" value={speedInput} onChange={(e) => setSpeedInput(parseInt(e.target.value, 10) || 100)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Router Model</Label>
                  <Input value={routerInput} onChange={(e) => setRouterInput(e.target.value)} placeholder="e.g. TP-Link Archer" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditFloorModal({ open: false })}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5" onClick={() => updateFloorWifiMutation.mutate()} disabled={updateFloorWifiMutation.isPending}>
                <Save className="h-4 w-4" /> Save WiFi Config
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT BLOCK MODAL */}
        <Dialog open={editBlockModal.open} onOpenChange={(open) => setEditBlockModal({ ...editBlockModal, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <Wifi className="h-5 w-5" /> Edit WiFi for {editBlockModal.blockName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>WiFi SSID (Network Name)</Label>
                <Input value={ssidInput} onChange={(e) => setSsidInput(e.target.value)} placeholder="e.g. PGEase_BlockA_Main" />
              </div>
              <div className="space-y-1.5">
                <Label>WiFi Password</Label>
                <Input value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter password" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditBlockModal({ open: false })}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5" onClick={() => updateBlockWifiMutation.mutate()} disabled={updateBlockWifiMutation.isPending}>
                <Save className="h-4 w-4" /> Save WiFi Credentials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
