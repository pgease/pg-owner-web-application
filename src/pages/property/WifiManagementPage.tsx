import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Wifi,
  Plus,
  Edit2,
  Shield,
  Signal,
  Server,
  Save,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  RefreshCw,
  Sparkles,
  Building2,
  Layers,
  Search,
  ArrowRight,
  Printer,
  Share2,
  Check,
  AlertCircle,
  Radio,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  getWifiHierarchy,
  updateFloorWifi,
  updateBlockWifi,
  updatePropertyWifiHierarchy,
  BlockWifiHierarchyItem,
  FloorWifiHierarchyItem,
} from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";

export default function WifiManagementPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "configured" | "unconfigured">("all");

  // Visibility toggle state for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Hierarchy Data Query
  const {
    data: wifiHierarchyResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["wifiHierarchy", selectedPgId],
    queryFn: () => (selectedPgId ? getWifiHierarchy(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const rawData = wifiHierarchyResponse?.data || (wifiHierarchyResponse as any) || {};
  const blocks: BlockWifiHierarchyItem[] = Array.isArray(rawData.blocks)
    ? rawData.blocks
    : Array.isArray(rawData)
    ? rawData
    : [];

  // Flattened floors with block context
  const allFloorsWithBlock = useMemo(() => {
    const list: Array<FloorWifiHierarchyItem & { blockName: string; blockId: string }> = [];
    blocks.forEach((b) => {
      if (Array.isArray(b.floors)) {
        b.floors.forEach((f) => {
          list.push({
            ...f,
            blockName: b.blockName,
            blockId: b.blockId,
          });
        });
      }
    });
    return list;
  }, [blocks]);

  // Statistics
  const stats = useMemo(() => {
    let configuredCount = 0;
    let maxSpeed = 100;

    blocks.forEach((b) => {
      if (b.wifiSsid?.trim()) configuredCount++;
      b.floors?.forEach((f) => {
        if (f.wifiSsid?.trim()) configuredCount++;
        const sp = f.wifiDetails?.speedMbps;
        if (typeof sp === "number" && sp > maxSpeed) {
          maxSpeed = sp;
        }
      });
    });

    const totalZones = blocks.length + allFloorsWithBlock.length;
    return {
      configuredCount,
      totalZones,
      totalBlocks: blocks.length,
      totalFloors: allFloorsWithBlock.length,
      maxSpeed,
    };
  }, [blocks, allFloorsWithBlock]);

  // Configure / Edit Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configScope, setConfigScope] = useState<"floor" | "block" | "sync_all">("floor");
  const [targetBlockId, setTargetBlockId] = useState<string>("");
  const [targetFloorId, setTargetFloorId] = useState<string>("");

  const [ssidInput, setSsidInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [speedInput, setSpeedInput] = useState<number>(100);
  const [routerInput, setRouterInput] = useState("");
  const [bandInput, setBandInput] = useState("Dual Band (2.4 GHz & 5 GHz)");
  const [notesInput, setNotesInput] = useState("");

  // QR Code Standee Modal State
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    title: string;
    subtitle: string;
    ssid: string;
    password: string;
    speed?: number;
    router?: string;
  }>({
    open: false,
    title: "",
    subtitle: "",
    ssid: "",
    password: "",
  });

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string, label: string) => {
    if (!text) {
      toast({ title: "No details to copy", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  // Open Edit for Specific Floor
  const handleOpenFloorEdit = (floor: FloorWifiHierarchyItem, block: BlockWifiHierarchyItem) => {
    setConfigScope("floor");
    setTargetBlockId(block.blockId);
    setTargetFloorId(floor.floorId);
    setSsidInput(floor.wifiSsid || "");
    setPasswordInput(floor.wifiPassword || "");
    setShowPasswordInModal(false);
    setSpeedInput(floor.wifiDetails?.speedMbps || 100);
    setRouterInput(floor.wifiDetails?.routerModel || "TP-Link");
    setBandInput(floor.wifiDetails?.band || "Dual Band (2.4 GHz & 5 GHz)");
    setNotesInput(floor.wifiDetails?.notes || "");
    setConfigModalOpen(true);
  };

  // Open Edit for Specific Block
  const handleOpenBlockEdit = (block: BlockWifiHierarchyItem) => {
    setConfigScope("block");
    setTargetBlockId(block.blockId);
    setTargetFloorId("");
    setSsidInput(block.wifiSsid || "");
    setPasswordInput(block.wifiPassword || "");
    setShowPasswordInModal(false);
    setSpeedInput(100);
    setRouterInput("");
    setBandInput("Dual Band (2.4 GHz & 5 GHz)");
    setNotesInput("");
    setConfigModalOpen(true);
  };

  // Open Bulk Sync Modal for a Block
  const handleOpenSyncBlock = (block: BlockWifiHierarchyItem) => {
    setConfigScope("sync_all");
    setTargetBlockId(block.blockId);
    setTargetFloorId("");
    setSsidInput(block.wifiSsid || `${selectedPg?.name?.replace(/\s+/g, "_") || "PGEase"}_${block.blockName}_WiFi`);
    setPasswordInput(block.wifiPassword || "");
    setShowPasswordInModal(false);
    setSpeedInput(100);
    setRouterInput("Dual-Band AP");
    setBandInput("Dual Band (2.4 GHz & 5 GHz)");
    setNotesInput("");
    setConfigModalOpen(true);
  };

  // Primary "Add / Configure WiFi" button clicked
  const handleOpenGeneralAdd = () => {
    if (blocks.length === 0) {
      toast({
        title: "No Blocks Found",
        description: "Please configure blocks and floors under 'Structure & Rooms' first.",
        variant: "destructive",
      });
      return;
    }
    const defaultBlock = blocks[0];
    const defaultFloor = defaultBlock.floors?.[0];

    setConfigScope("floor");
    setTargetBlockId(defaultBlock.blockId);
    setTargetFloorId(defaultFloor?.floorId || "");
    setSsidInput(defaultFloor?.wifiSsid || `${selectedPg?.name?.replace(/\s+/g, "_") || "PGEase"}_${defaultFloor?.floorName || "WiFi"}`);
    setPasswordInput(defaultFloor?.wifiPassword || "");
    setShowPasswordInModal(false);
    setSpeedInput(defaultFloor?.wifiDetails?.speedMbps || 100);
    setRouterInput(defaultFloor?.wifiDetails?.routerModel || "TP-Link");
    setBandInput(defaultFloor?.wifiDetails?.band || "Dual Band (2.4 GHz & 5 GHz)");
    setNotesInput(defaultFloor?.wifiDetails?.notes || "");
    setConfigModalOpen(true);
  };

  // Auto suggest SSID
  const handleSuggestSsid = () => {
    const cleanPgName = (selectedPg?.name || "PGEase").replace(/[^a-zA-Z0-9]/g, "");
    const curBlock = blocks.find((b) => b.blockId === targetBlockId);
    const curFloor = curBlock?.floors?.find((f) => f.floorId === targetFloorId);

    if (configScope === "block") {
      setSsidInput(`${cleanPgName}_${(curBlock?.blockName || "Block").replace(/[^a-zA-Z0-9]/g, "")}_Main`);
    } else if (configScope === "sync_all") {
      setSsidInput(`${cleanPgName}_${(curBlock?.blockName || "Block").replace(/[^a-zA-Z0-9]/g, "")}_Mesh`);
    } else {
      const floorStr = (curFloor?.floorName || "Floor").replace(/[^a-zA-Z0-9]/g, "");
      setSsidInput(`${cleanPgName}_${floorStr}_5G`);
    }
  };

  // Generate strong password
  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const year = new Date().getFullYear();
    setPasswordInput(`PGEase@${year}_${rand}`);
    setShowPasswordInModal(true);
  };

  // Mutations
  const updateFloorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !targetFloorId) throw new Error("Please select a floor");
      return updateFloorWifi(selectedPgId, targetFloorId, {
        wifiSsid: ssidInput.trim(),
        wifiPassword: passwordInput.trim(),
        wifiDetails: {
          speedMbps: speedInput,
          routerModel: routerInput.trim(),
          band: bandInput,
          notes: notesInput.trim(),
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Floor WiFi Saved",
        description: "Floor network credentials and hardware specs updated successfully.",
      });
      setConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wifiHierarchy", selectedPgId] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Update Floor WiFi",
        description: err?.message || "Please check your network connection and try again.",
        variant: "destructive",
      });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !targetBlockId) throw new Error("Please select a block");
      return updateBlockWifi(selectedPgId, targetBlockId, {
        wifiSsid: ssidInput.trim(),
        wifiPassword: passwordInput.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Block WiFi Saved",
        description: "Master block WiFi credentials updated successfully.",
      });
      setConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wifiHierarchy", selectedPgId] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Update Block WiFi",
        description: err?.message || "Please check your network connection and try again.",
        variant: "destructive",
      });
    },
  });

  const syncBlockToAllFloorsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !targetBlockId) throw new Error("Please select a block");
      const curBlock = blocks.find((b) => b.blockId === targetBlockId);
      if (!curBlock) throw new Error("Block not found");

      const floorsPayload = (curBlock.floors || []).map((f) => ({
        floorId: f.floorId,
        wifiSsid: ssidInput.trim(),
        wifiPassword: passwordInput.trim(),
        wifiDetails: {
          speedMbps: speedInput,
          routerModel: routerInput.trim(),
          band: bandInput,
          notes: notesInput.trim(),
        },
      }));

      return updatePropertyWifiHierarchy(selectedPgId, {
        blocks: [
          {
            blockId: targetBlockId,
            wifiSsid: ssidInput.trim(),
            wifiPassword: passwordInput.trim(),
            floors: floorsPayload,
          },
        ],
      });
    },
    onSuccess: () => {
      toast({
        title: "Synced to All Floors",
        description: "Master WiFi credentials and router specs applied to all floors in this block.",
      });
      setConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wifiHierarchy", selectedPgId] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Sync Block WiFi",
        description: err?.message || "Unable to sync WiFi across floors.",
        variant: "destructive",
      });
    },
  });

  const isSaving =
    updateFloorMutation.isPending ||
    updateBlockMutation.isPending ||
    syncBlockToAllFloorsMutation.isPending;

  const handleSaveConfig = () => {
    if (!ssidInput.trim()) {
      toast({ title: "WiFi SSID Required", description: "Please enter a network name (SSID).", variant: "destructive" });
      return;
    }
    if (configScope === "floor") {
      updateFloorMutation.mutate();
    } else if (configScope === "block") {
      updateBlockMutation.mutate();
    } else {
      syncBlockToAllFloorsMutation.mutate();
    }
  };

  // Filtered blocks & floors
  const filteredBlocks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return blocks
      .map((b) => {
        const blockMatches =
          !q ||
          b.blockName.toLowerCase().includes(q) ||
          (b.wifiSsid && b.wifiSsid.toLowerCase().includes(q));

        const matchedFloors = (b.floors || []).filter((f) => {
          const matchesQuery =
            !q ||
            f.floorName.toLowerCase().includes(q) ||
            (f.wifiSsid && f.wifiSsid.toLowerCase().includes(q)) ||
            (f.wifiDetails?.routerModel && f.wifiDetails.routerModel.toLowerCase().includes(q));

          if (!matchesQuery) return false;

          const isConfigured = Boolean(f.wifiSsid?.trim());
          if (filterType === "configured") return isConfigured;
          if (filterType === "unconfigured") return !isConfigured;
          return true;
        });

        return {
          ...b,
          matchedFloors,
          blockMatches,
        };
      })
      .filter((b) => b.blockMatches || b.matchedFloors.length > 0);
  }, [blocks, searchQuery, filterType]);

  return (
    <CanAccessPage permission="room_view">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  WiFi Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure high-speed internet, passwords, router specs, and QR codes for{" "}
                  <span className="font-semibold text-foreground">
                    {selectedPg?.name || "your property"}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5 h-9 shadow-sm"
              onClick={handleOpenGeneralAdd}
            >
              <Plus className="h-4 w-4" /> Add / Configure WiFi
            </Button>
          </div>
        </div>

        {/* METRICS / HIGHLIGHT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-teal-200/70 bg-gradient-to-br from-teal-50/70 to-white dark:from-teal-950/20 dark:to-card shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <Signal className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Active Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-950 dark:text-teal-100">
                  {stats.configuredCount}
                </span>
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  / {stats.totalZones} zones configured
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {stats.totalBlocks} Blocks &bull; {stats.totalFloors} Floors total
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-card shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Max Fiber Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                {stats.maxSpeed} Mbps
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Optical fiber high-speed gigabit ready
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50/70 to-white dark:from-sky-950/20 dark:to-card shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-2">
                <Shield className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Network Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-sky-950 dark:text-sky-100">
                WPA2 / WPA3
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Encrypted password protection enabled
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/20 dark:to-card shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Instant Connect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
                QR Standees
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Printable QR codes for seamless tenant onboarding
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SSID, Floor, Block, Router..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
              className={`h-8 text-xs font-semibold ${filterType === "all" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}`}
            >
              All Zones ({blocks.length + allFloorsWithBlock.length})
            </Button>
            <Button
              variant={filterType === "configured" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("configured")}
              className={`h-8 text-xs font-semibold ${filterType === "configured" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}`}
            >
              Configured ({stats.configuredCount})
            </Button>
            <Button
              variant={filterType === "unconfigured" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("unconfigured")}
              className={`h-8 text-xs font-semibold ${filterType === "unconfigured" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}`}
            >
              Needs Setup ({stats.totalZones - stats.configuredCount})
            </Button>
          </div>
        </div>

        {/* LOADING OR EMPTY STATE */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3 bg-white dark:bg-card rounded-2xl border border-border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading property WiFi hierarchy...
            </p>
          </div>
        ) : blocks.length === 0 ? (
          <Card className="border-dashed border-2 text-center py-16 px-4 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">No Building Structure Configured</h3>
              <p className="text-sm text-muted-foreground">
                To manage WiFi by block and floor, please set up your blocks, floors, and rooms first in Structure & Rooms.
              </p>
            </div>
            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Link to="/my-pgs/structure">
                Configure PG Structure <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ) : filteredBlocks.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-card rounded-2xl border border-border">
            <Search className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="font-semibold text-foreground">No matching WiFi networks found</h4>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search term or filter criteria.
            </p>
          </div>
        ) : (
          /* HIERARCHICAL BLOCKS & FLOORS */
          <div className="space-y-6">
            {filteredBlocks.map((block) => {
              const hasBlockWifi = Boolean(block.wifiSsid?.trim());
              const blockPassVisible = visiblePasswords[block.blockId] || false;

              return (
                <Card
                  key={block.blockId}
                  className="border-border shadow-xs overflow-hidden transition-all hover:border-teal-200 dark:hover:border-teal-800"
                >
                  {/* BLOCK HEADER */}
                  <div className="bg-gradient-to-r from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/20 p-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-xs">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground">
                              {block.blockName}
                            </h3>
                            <Badge variant="outline" className="text-xs bg-white/80 dark:bg-slate-800">
                              {block.floors?.length || 0} Floors
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Building block network zone
                          </p>
                        </div>
                      </div>

                      {/* BLOCK MASTER WIFI PREVIEW & ACTIONS */}
                      <div className="flex flex-wrap items-center gap-2">
                        {hasBlockWifi ? (
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Radio className="h-3.5 w-3.5 text-teal-600" />
                              <span className="font-bold">{block.wifiSsid}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-muted-foreground font-semibold">
                                {blockPassVisible
                                  ? block.wifiPassword || "(No password)"
                                  : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(block.blockId)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                title={blockPassVisible ? "Hide password" : "Show password"}
                              >
                                {blockPassVisible ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(block.wifiPassword, block.blockId, "Block Password")
                                }
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                title="Copy password"
                              >
                                {copiedId === block.blockId ? (
                                  <Check className="h-3 w-3 text-teal-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-normal">
                            No Block Master WiFi
                          </Badge>
                        )}

                        {hasBlockWifi && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() =>
                              setQrModal({
                                open: true,
                                title: `${selectedPg?.name || "PG Ease"} - ${block.blockName}`,
                                subtitle: "Block Master WiFi Network",
                                ssid: block.wifiSsid,
                                password: block.wifiPassword,
                              })
                            }
                          >
                            <QrCode className="h-3.5 w-3.5 text-teal-600" /> QR Code
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleOpenBlockEdit(block)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          {hasBlockWifi ? "Edit Block WiFi" : "Set Master WiFi"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                          onClick={() => handleOpenSyncBlock(block)}
                          title="Apply master WiFi to all floors of this block"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Sync to All Floors</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* FLOORS IN THIS BLOCK */}
                  <CardContent className="p-4 sm:p-5">
                    {block.matchedFloors.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No floors in this block match current filter.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {block.matchedFloors.map((floor) => {
                          const hasFloorWifi = Boolean(floor.wifiSsid?.trim());
                          const effectiveSsid = hasFloorWifi
                            ? floor.wifiSsid
                            : block.wifiSsid || "Not set";
                          const effectivePassword = hasFloorWifi
                            ? floor.wifiPassword
                            : block.wifiPassword || "";
                          const isInheriting = !hasFloorWifi && Boolean(block.wifiSsid?.trim());
                          const isPasswordShown = visiblePasswords[floor.floorId] || false;
                          const speed = floor.wifiDetails?.speedMbps || 100;
                          const router = floor.wifiDetails?.routerModel || "Dual Band Router";

                          return (
                            <div
                              key={floor.floorId}
                              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                                hasFloorWifi
                                  ? "bg-white dark:bg-card border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-300"
                                  : isInheriting
                                  ? "bg-teal-50/20 dark:bg-teal-950/10 border-teal-200/60 dark:border-teal-800/40"
                                  : "bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <div>
                                {/* FLOOR TITLE & BADGE */}
                                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Layers className="h-4 w-4 text-teal-600 shrink-0" />
                                    <h4 className="font-bold text-sm text-foreground truncate">
                                      {floor.floorName}
                                    </h4>
                                  </div>
                                  {hasFloorWifi ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold shrink-0">
                                      Floor WiFi
                                    </Badge>
                                  ) : isInheriting ? (
                                    <Badge className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 text-[10px] font-medium shrink-0">
                                      Inheriting Block WiFi
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                                      No WiFi Set
                                    </Badge>
                                  )}
                                </div>

                                {/* CREDENTIALS DETAILS */}
                                <div className="py-3 space-y-2.5 text-xs">
                                  {/* SSID */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">SSID:</span>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`font-semibold max-w-[170px] truncate ${
                                          effectiveSsid === "Not set"
                                            ? "text-muted-foreground italic"
                                            : "text-foreground font-bold"
                                        }`}
                                      >
                                        {effectiveSsid}
                                      </span>
                                      {effectiveSsid !== "Not set" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopy(effectiveSsid, `ssid-${floor.floorId}`, "SSID")
                                          }
                                          className="text-muted-foreground hover:text-foreground p-0.5"
                                          title="Copy SSID"
                                        >
                                          {copiedId === `ssid-${floor.floorId}` ? (
                                            <Check className="h-3 w-3 text-teal-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* PASSWORD */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Password:</span>
                                    <div className="flex items-center gap-1.5">
                                      {effectivePassword ? (
                                        <>
                                          <span className="font-mono font-bold text-foreground">
                                            {isPasswordShown ? effectivePassword : "••••••••"}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility(floor.floorId)}
                                            className="text-muted-foreground hover:text-foreground p-0.5"
                                            title={isPasswordShown ? "Hide" : "Show"}
                                          >
                                            {isPasswordShown ? (
                                              <EyeOff className="h-3 w-3" />
                                            ) : (
                                              <Eye className="h-3 w-3" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCopy(
                                                effectivePassword,
                                                `pass-${floor.floorId}`,
                                                "Password"
                                              )
                                            }
                                            className="text-muted-foreground hover:text-foreground p-0.5"
                                            title="Copy Password"
                                          >
                                            {copiedId === `pass-${floor.floorId}` ? (
                                              <Check className="h-3 w-3 text-teal-600" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-muted-foreground italic">None</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* SPEED & ROUTER */}
                                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <Signal className="h-3 w-3" /> {speed} Mbps
                                    </span>
                                    <span className="text-muted-foreground truncate max-w-[130px]" title={router}>
                                      {router}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS FOOTER */}
                              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
                                {effectiveSsid !== "Not set" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                    onClick={() =>
                                      setQrModal({
                                        open: true,
                                        title: `${selectedPg?.name || "PG Ease"}`,
                                        subtitle: `${block.blockName} &bull; ${floor.floorName} WiFi`,
                                        ssid: effectiveSsid,
                                        password: effectivePassword,
                                        speed: speed,
                                        router: router,
                                      })
                                    }
                                  >
                                    <QrCode className="h-3.5 w-3.5 text-teal-600" /> QR
                                  </Button>
                                )}

                                <div className="flex items-center gap-1 ml-auto">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1 font-medium"
                                    onClick={() => handleOpenFloorEdit(floor, block)}
                                  >
                                    <Edit2 className="h-3 w-3" /> Configure
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ========================================================== */}
        {/* UNIFIED ADD / CONFIGURE WIFI DIALOG */}
        {/* ========================================================== */}
        <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-lg">
                <Wifi className="h-5 w-5" />
                {configScope === "floor"
                  ? "Configure Floor WiFi"
                  : configScope === "block"
                  ? "Configure Block Master WiFi"
                  : "Sync Master WiFi to All Floors"}
              </DialogTitle>
              <DialogDescription>
                {configScope === "floor"
                  ? "Set dedicated high-speed WiFi credentials and hardware specs for a specific floor."
                  : configScope === "block"
                  ? "Set property block credentials that tenants in this block can connect to."
                  : "Apply WiFi network credentials and router specs across every floor in this block in one click."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              {/* SCOPE SELECTION TABS */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Configuration Target
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigScope("floor")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      configScope === "floor"
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Layers className="h-4 w-4 mb-1 text-teal-600" />
                    <div className="text-xs font-semibold">Single Floor</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Floor router</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfigScope("block")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      configScope === "block"
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-4 w-4 mb-1 text-teal-600" />
                    <div className="text-xs font-semibold">Block Master</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Block gateway</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfigScope("sync_all")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      configScope === "sync_all"
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mb-1 text-teal-600" />
                    <div className="text-xs font-semibold">Sync All Floors</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Bulk update</div>
                  </button>
                </div>
              </div>

              {/* TARGET SELECTION: BLOCK & FLOOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Target Block</Label>
                  <Select
                    value={targetBlockId}
                    onValueChange={(val) => {
                      setTargetBlockId(val);
                      const blk = blocks.find((b) => b.blockId === val);
                      if (blk && blk.floors && blk.floors.length > 0) {
                        setTargetFloorId(blk.floors[0].floorId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((b) => (
                        <SelectItem key={b.blockId} value={b.blockId}>
                          {b.blockName} ({b.floors?.length || 0} floors)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {configScope === "floor" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Target Floor</Label>
                    <Select
                      value={targetFloorId}
                      onValueChange={(val) => {
                        setTargetFloorId(val);
                        const curBlock = blocks.find((b) => b.blockId === targetBlockId);
                        const f = curBlock?.floors?.find((fl) => fl.floorId === val);
                        if (f) {
                          setSsidInput(f.wifiSsid || "");
                          setPasswordInput(f.wifiPassword || "");
                          setSpeedInput(f.wifiDetails?.speedMbps || 100);
                          setRouterInput(f.wifiDetails?.routerModel || "");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Floor" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks
                          .find((b) => b.blockId === targetBlockId)
                          ?.floors?.map((fl) => (
                            <SelectItem key={fl.floorId} value={fl.floorId}>
                              {fl.floorName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* SSID FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">WiFi SSID (Network Name) *</Label>
                  <button
                    type="button"
                    onClick={handleSuggestSsid}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Suggest
                  </button>
                </div>
                <Input
                  value={ssidInput}
                  onChange={(e) => setSsidInput(e.target.value)}
                  placeholder="e.g. PGEase_BlockA_Floor1_5G"
                  className="font-medium"
                />
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">WiFi Password</Label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Generate Secure Key
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswordInModal ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter network password"
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswordInModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* SPEED & ROUTER MODEL (Shown for Floor & Sync All) */}
              {configScope !== "block" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Fiber Speed (Mbps)</Label>
                      <Input
                        type="number"
                        min={10}
                        max={10000}
                        value={speedInput}
                        onChange={(e) => setSpeedInput(parseInt(e.target.value, 10) || 100)}
                      />
                      <div className="flex gap-1.5 pt-1 overflow-x-auto">
                        {[50, 100, 200, 300, 500].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setSpeedInput(spd)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              speedInput === spd
                                ? "bg-teal-600 text-white border-teal-600"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {spd}M
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Router Brand / Model</Label>
                      <Input
                        value={routerInput}
                        onChange={(e) => setRouterInput(e.target.value)}
                        placeholder="e.g. TP-Link Archer AX55"
                      />
                      <div className="flex gap-1 pt-1 overflow-x-auto">
                        {["TP-Link", "JioFiber", "Airtel", "Netgear"].map((brd) => (
                          <button
                            key={brd}
                            type="button"
                            onClick={() => setRouterInput(brd)}
                            className="px-1.5 py-0.5 rounded text-[10px] border border-border text-muted-foreground hover:bg-muted"
                          >
                            {brd}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">WiFi Band</Label>
                      <Select value={bandInput} onValueChange={setBandInput}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dual Band (2.4 GHz & 5 GHz)">
                            Dual Band (2.4 GHz & 5 GHz)
                          </SelectItem>
                          <SelectItem value="5 GHz High Speed">5 GHz High Speed Only</SelectItem>
                          <SelectItem value="2.4 GHz Long Range">2.4 GHz Long Range Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Location / Notes (Optional)</Label>
                      <Input
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="e.g. Hallway ceiling near room 103"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setConfigModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
                onClick={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save WiFi Config
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================== */}
        {/* QR CODE STANDEE & SHARE DIALOG */}
        {/* ========================================================== */}
        <Dialog open={qrModal.open} onOpenChange={(open) => setQrModal({ ...qrModal, open })}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-lg">
                <QrCode className="h-5 w-5" /> WiFi Access Standee
              </DialogTitle>
              <DialogDescription>
                Tenants can scan this QR code using their smartphone camera to connect immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700/60 shadow-md space-y-4 my-2">
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-teal-950 dark:text-teal-100">
                  {qrModal.title}
                </h3>
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {qrModal.subtitle}
                </p>
              </div>

              {/* REAL SCANNABLE WIFI QR CODE */}
              <div className="flex justify-center py-2">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `WIFI:T:WPA;S:${qrModal.ssid};P:${qrModal.password};;`
                    )}`}
                    alt={`WiFi QR for ${qrModal.ssid}`}
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      // Fallback SVG if offline
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add("bg-teal-50");
                    }}
                  />
                </div>
              </div>

              {/* CREDENTIALS BOX */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Network (SSID):</span>
                  <span className="font-bold text-foreground text-sm font-mono">{qrModal.ssid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Password:</span>
                  <span className="font-bold text-foreground text-sm font-mono">
                    {qrModal.password || "(None)"}
                  </span>
                </div>
                {qrModal.speed && (
                  <div className="flex justify-between items-center pt-1 border-t border-border">
                    <span className="text-muted-foreground font-semibold">Speed:</span>
                    <span className="font-bold text-emerald-600">{qrModal.speed} Mbps Fiber</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Point your iPhone or Android camera at the QR code to connect automatically.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto gap-1.5"
                onClick={() =>
                  handleCopy(
                    `📶 WiFi Credentials - ${qrModal.title}\n📍 ${qrModal.subtitle}\n🔹 Network (SSID): ${qrModal.ssid}\n🔑 Password: ${qrModal.password}\n⚡ High Speed Internet Connection`,
                    "share-msg",
                    "WhatsApp message"
                  )
                }
              >
                <Share2 className="h-4 w-4" /> Share on WhatsApp
              </Button>
              <Button
                size="sm"
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Print Standee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
