import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Upload,
  Check,
  Building,
  DollarSign,
  ShieldCheck,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getPublicListing,
  updatePublicListing,
  type PublicListingDetails,
} from "@/api/propertyOwner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const COMMON_AMENITIES = [
  "High-speed WiFi",
  "RO Water",
  "Daily Housekeeping",
  "Power Backup",
  "Washing Machine",
  "Geyser",
  "Biometric Security",
  "CCTV Surveillance",
  "Refrigerator",
  "Attached Washroom",
  "Lift / Elevator",
  "Study Desk & Chair",
];

const COMMON_RULES = [
  "No smoking inside rooms",
  "Gate closes at 11:00 PM",
  "Visitors allowed in lobby only",
  "Quiet hours after 10:00 PM",
  "No alcohol or illegal substances",
  "Keep common areas clean",
];

export default function PublicListingPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const currentProperty = properties.find((p) => p.id === selectedPgId);

  // Form states
  const [isPublished, setIsPublished] = useState(false);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");
  const [noticeDays, setNoticeDays] = useState(30);
  const [depositMonths, setDepositMonths] = useState(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [houseRules, setHouseRules] = useState<string[]>([]);

  // Room pricing states
  const [pricing, setPricing] = useState({
    single: { withFood: 14000, withoutFood: 12000, withAc: 16000, withoutAc: 14000 },
    double: { withFood: 9000, withoutFood: 7500, withAc: 10500, withoutAc: 9000 },
    triple: { withFood: 7500, withoutFood: 6000, withAc: 8500, withoutAc: 7500 },
    fourSharing: { withFood: 6000, withoutFood: 5000, withAc: 7000, withoutAc: 6000 },
  });

  // Query listing
  const listingQuery = useQuery({
    queryKey: ["public-listing", selectedPgId],
    queryFn: async () => {
      if (!selectedPgId) return null;
      return await getPublicListing(selectedPgId);
    },
    enabled: !!selectedPgId,
  });

  useEffect(() => {
    if (listingQuery.data) {
      const d = listingQuery.data;
      setIsPublished(Boolean(d.isPublished));
      setDescription(d.description || "");
      if (Array.isArray(d.photos)) setPhotos(d.photos);
      if (Array.isArray(d.videoUrls)) setVideoUrls(d.videoUrls);
      if (d.noticePeriodDays !== undefined) setNoticeDays(d.noticePeriodDays);
      if (d.securityDepositMonths !== undefined) setDepositMonths(d.securityDepositMonths);
      if (Array.isArray(d.amenities)) setAmenities(d.amenities);
      if (Array.isArray(d.houseRules)) setHouseRules(d.houseRules);
      if (d.pricing) {
        setPricing((prev) => ({
          ...prev,
          ...d.pricing,
        }));
      }
    } else if (currentProperty) {
      setDescription(
        currentProperty.description ||
          `Welcome to ${currentProperty.name}. Premium accommodation located in ${currentProperty.address || "prime location"}. Hygienic food, high-speed WiFi, and 24/7 security.`
      );
      if (currentProperty.photos && Array.isArray(currentProperty.photos)) {
        setPhotos(currentProperty.photos.map((p: any) => (typeof p === "string" ? p : p.url)).filter(Boolean));
      }
    }
  }, [listingQuery.data, currentProperty]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId) throw new Error("Please select a PG property first");
      const payload: PublicListingDetails = {
        isPublished,
        description,
        photos,
        videoUrls,
        pricing,
        amenities,
        houseRules,
        noticePeriodDays: Number(noticeDays),
        securityDepositMonths: Number(depositMonths),
      };
      return await updatePublicListing(selectedPgId, payload);
    },
    onSuccess: () => {
      toast({
        title: "Public listing saved successfully!",
        description: isPublished
          ? "Your PG is now live on the PG Ease website search portal."
          : "Draft saved. Turn on publication when ready to go live.",
      });
      void queryClient.invalidateQueries({ queryKey: ["public-listing", selectedPgId] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Failed to save listing",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleRule = (rule: string) => {
    setHouseRules((prev) =>
      prev.includes(rule) ? prev.filter((x) => x !== rule) : [...prev, rule]
    );
  };

  const addPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addVideo = () => {
    if (!videoInput.trim()) return;
    setVideoUrls((prev) => [...prev, videoInput.trim()]);
    setVideoInput("");
  };

  const removeVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
              <Globe className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Public Listing & Website Details
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Publish {currentProperty?.name || "your PG"} to the public search engine, manage room pricing matrix, photos, and house rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-xl text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save & Update Listing
          </Button>
        </div>
      </div>

      {/* PUBLICATION STATUS BANNER */}
      <Card className={`rounded-2xl border ${isPublished ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-border/80 bg-card"}`}>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${isPublished ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Public Search Visibility
                </h3>
                <Badge className={isPublished ? "bg-emerald-600 text-white text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                  {isPublished ? "LIVE / PUBLISHED" : "UNPUBLISHED / DRAFT"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublished
                  ? "Tenants can search, discover, and enquire about your PG online on the PG Ease portal."
                  : "Your listing is hidden from public searches. Turn on to start receiving tenant enquiries."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </CardContent>
      </Card>

      {/* LISTING DESCRIPTION */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Public Description & About</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Introduce your PG, distance to tech parks, metro stations, colleges, and food highlights.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Write an appealing description of your PG accommodations, meal timings, and neighborhood..."
            className="w-full text-xs rounded-xl border border-input bg-background p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground leading-relaxed resize-y"
          />
        </CardContent>
      </Card>

      {/* ROOM PRICING MATRIX */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span>Room Sharing Pricing Matrix (Monthly)</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Transparent rent brackets displayed to prospective tenants filtering by sharing type and amenities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Single Sharing */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Single Room</span>
                <Badge variant="outline" className="text-[10px]">1 Bed</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">With Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.single.withFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, single: { ...pricing.single, withFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Without Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.single.withoutFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, single: { ...pricing.single, withoutFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Double Sharing */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Double Sharing</span>
                <Badge variant="outline" className="text-[10px]">2 Beds</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">With Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.double.withFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, double: { ...pricing.double, withFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Without Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.double.withoutFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, double: { ...pricing.double, withoutFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Triple Sharing */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Triple Sharing</span>
                <Badge variant="outline" className="text-[10px]">3 Beds</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">With Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.triple.withFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, triple: { ...pricing.triple, withFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Without Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.triple.withoutFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, triple: { ...pricing.triple, withoutFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 4 Sharing */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Four Sharing</span>
                <Badge variant="outline" className="text-[10px]">4 Beds</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">With Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.fourSharing.withFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, fourSharing: { ...pricing.fourSharing, withFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Without Food (₹/mo)</Label>
                  <Input
                    type="number"
                    value={pricing.fourSharing.withoutFood}
                    onChange={(e) =>
                      setPricing({ ...pricing, fourSharing: { ...pricing.fourSharing, withoutFood: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHOTOS & VIDEO TOURS */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <span>Listing Photos & Video Tours</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Provide direct image URLs or YouTube walkthrough links for your public gallery.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          {/* Add photo input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Add Photo Image URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://s3.aws.../room-photo.jpg"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Button
                type="button"
                onClick={addPhoto}
                disabled={!photoInput.trim()}
                className="h-9 text-xs font-bold rounded-xl gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {/* Photo tags list */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {photos.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono max-w-xs truncate"
                  >
                    <span className="truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add video input */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <Label className="text-xs font-semibold text-foreground">Add Video Tour URL (YouTube / Drive)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtu.be/..."
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Button
                type="button"
                onClick={addVideo}
                disabled={!videoInput.trim()}
                className="h-9 text-xs font-bold rounded-xl gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {videoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {videoUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono max-w-xs truncate"
                  >
                    <Video className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(i)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AMENITIES & HOUSE RULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AMENITIES */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Public Amenities Highlights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((item) => {
                const active = amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-muted/20 text-muted-foreground border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* HOUSE RULES */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>House Rules & Policies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex flex-wrap gap-2">
              {COMMON_RULES.map((rule) => {
                const active = houseRules.includes(rule);
                return (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => toggleRule(rule)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      active
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-muted/20 text-muted-foreground border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    <span>{rule}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* POLICY TERMS */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-foreground">
            Onboarding Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Standard Notice Period (Days)</Label>
            <Input
              type="number"
              value={noticeDays}
              onChange={(e) => setNoticeDays(Number(e.target.value))}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Security Deposit (Months of Rent)</Label>
            <Input
              type="number"
              value={depositMonths}
              onChange={(e) => setDepositMonths(Number(e.target.value))}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
