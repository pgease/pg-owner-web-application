import { publicListingUrl } from "@/config/links";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Upload,
  Check,
  Building,
  DollarSign,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  MapPin,
  Phone,
  Navigation,
  Eye,
  CheckCircle2,
  Utensils,
  Ban,
  RefreshCw,
  Info,
  ChevronRight,
  Layers,
  Share2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getPublicListing,
  updatePublicListing,
  updateProperty,
  uploadPhoto,
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
  "3-Time Homestyle Meals",
  "Daily Housekeeping",
  "Power Backup",
  "RO Drinking Water",
  "Washing Machine",
  "Geyser / Hot Water",
  "Biometric Security",
  "24x7 CCTV Surveillance",
  "Refrigerator",
  "Attached Washroom",
  "Lift / Elevator",
  "Study Desk & Chair",
  "Wardrobe with Lock",
  "Gym / Fitness Zone",
  "Gaming / TV Lounge",
];

const COMMON_RULES = [
  "Gate closes at 11:00 PM",
  "No smoking inside rooms or corridors",
  "No alcohol or illegal substances on premises",
  "Quiet hours from 10:30 PM to 6:00 AM",
  "Visitors allowed in common reception/lobby only",
  "Male guests not permitted in female wings",
  "Keep kitchen and dining areas tidy",
  "Turn off AC and lights when leaving room",
];

const SUGGESTED_NEARBY = [
  "Metro Station (500m)",
  "Bus Terminal (300m)",
  "IT Tech Park (1.2 km)",
  "College / University (800m)",
  "Supermarket & Market (200m)",
  "Hospital & Pharmacy (600m)",
  "Gym & Sports Complex (400m)",
];

export default function PublicListingPage() {
  const { selectedPgId, properties, refreshProperties } = useApp();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProperty = useMemo(() => {
    return Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;
  }, [properties, selectedPgId]);

  // Tab: "editor" or "preview"
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // Meal Plan Preview Toggle: "withFood" vs "withoutFood"
  const [previewMealPlan, setPreviewMealPlan] = useState<"withFood" | "withoutFood">("withFood");

  // 1. Publication status & Property Details
  const [isPublished, setIsPublished] = useState(true);
  const [propertyName, setPropertyName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [locationPin, setLocationPin] = useState("");
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.209);

  // 2. Photos & Media
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");

  // 3. Room details & Pricing (With Food vs Without Food)
  const [pricing, setPricing] = useState({
    single: { withFood: 14000, withoutFood: 11500, withAc: 16000, withoutAc: 14000 },
    double: { withFood: 9000, withoutFood: 7200, withAc: 10500, withoutAc: 9000 },
    triple: { withFood: 7500, withoutFood: 6000, withAc: 8500, withoutAc: 7500 },
    fourSharing: { withFood: 6000, withoutFood: 4800, withAc: 7000, withoutAc: 6000 },
  });

  // 4. Amenities & Restrictions
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [customRule, setCustomRule] = useState("");

  // 5. Nearby locations
  const [nearbyLandmarks, setNearbyLandmarks] = useState<string[]>([]);
  const [customNearby, setCustomNearby] = useState("");

  // 6. Terms
  const [noticeDays, setNoticeDays] = useState(30);
  const [depositMonths, setDepositMonths] = useState(2);

  // Query listing
  const listingQuery = useQuery({
    queryKey: ["public-listing", selectedPgId],
    queryFn: async () => {
      if (!selectedPgId) return null;
      return await getPublicListing(selectedPgId);
    },
    enabled: !!selectedPgId,
  });

  // Hydrate states from query or currentProperty
  useEffect(() => {
    if (listingQuery.data) {
      const d = listingQuery.data;
      setIsPublished(d.isPublished !== undefined ? Boolean(d.isPublished) : true);
      setPropertyName(d.propertyName || currentProperty?.name || "");
      setContactNumber(d.contactNumber || (currentProperty as any)?.adminPhone || "");
      setWebsite(
        d.website ||
          `https://${(currentProperty?.name || "stay").toLowerCase().replace(/[^a-z0-9]/g, "")}.pgease.com`
      );
      setDescription(
        d.description ||
          `Welcome to ${currentProperty?.name || "our PG"}. Located at ${
            d.address || currentProperty?.address || "a prime city spot"
          }, we offer hygienic food, high-speed WiFi, modern room amenities, and 24/7 security for students and working professionals.`
      );
      setAddress(d.address || currentProperty?.address || "");
      setLocationPin(d.locationPin || currentProperty?.locationPin || "");
      if (d.latitude) setLatitude(Number(d.latitude));
      else if (currentProperty?.latitude) setLatitude(Number(currentProperty.latitude));
      if (d.longitude) setLongitude(Number(d.longitude));
      else if (currentProperty?.longitude) setLongitude(Number(currentProperty.longitude));

      if (Array.isArray(d.photos) && d.photos.length > 0) {
        setPhotos(d.photos);
      } else if (currentProperty?.photos && Array.isArray(currentProperty.photos)) {
        setPhotos(
          currentProperty.photos
            .map((item: any) => (typeof item === "string" ? item : item?.url))
            .filter(Boolean)
        );
      }

      if (Array.isArray(d.videoUrls)) setVideoUrls(d.videoUrls);
      if (d.noticePeriodDays !== undefined) setNoticeDays(d.noticePeriodDays);
      if (d.securityDepositMonths !== undefined) setDepositMonths(d.securityDepositMonths);

      if (Array.isArray(d.amenities) && d.amenities.length > 0) {
        setAmenities(d.amenities);
      } else if (currentProperty?.facilities && Array.isArray(currentProperty.facilities)) {
        setAmenities(currentProperty.facilities);
      } else {
        setAmenities(COMMON_AMENITIES.slice(0, 8));
      }

      if (Array.isArray(d.houseRules) && d.houseRules.length > 0) {
        setHouseRules(d.houseRules);
      } else if (Array.isArray(d.restrictions) && d.restrictions.length > 0) {
        setHouseRules(d.restrictions);
      } else {
        setHouseRules(COMMON_RULES.slice(0, 5));
      }

      if (Array.isArray(d.nearbyLandmarks) && d.nearbyLandmarks.length > 0) {
        setNearbyLandmarks(d.nearbyLandmarks);
      } else if (currentProperty?.nearbyPlaces && Array.isArray(currentProperty.nearbyPlaces)) {
        setNearbyLandmarks(currentProperty.nearbyPlaces);
      } else {
        setNearbyLandmarks(SUGGESTED_NEARBY.slice(0, 4));
      }

      if (d.pricing) {
        setPricing({
          single: {
            withFood: d.pricing.single?.withFood ?? 14000,
            withoutFood: d.pricing.single?.withoutFood ?? 11500,
            withAc: d.pricing.single?.withAc ?? 16000,
            withoutAc: d.pricing.single?.withoutAc ?? 14000,
          },
          double: {
            withFood: d.pricing.double?.withFood ?? 9000,
            withoutFood: d.pricing.double?.withoutFood ?? 7200,
            withAc: d.pricing.double?.withAc ?? 10500,
            withoutAc: d.pricing.double?.withoutAc ?? 9000,
          },
          triple: {
            withFood: d.pricing.triple?.withFood ?? 7500,
            withoutFood: d.pricing.triple?.withoutFood ?? 6000,
            withAc: d.pricing.triple?.withAc ?? 8500,
            withoutAc: d.pricing.triple?.withoutAc ?? 7500,
          },
          fourSharing: {
            withFood: d.pricing.fourSharing?.withFood ?? 6000,
            withoutFood: d.pricing.fourSharing?.withoutFood ?? 4800,
            withAc: d.pricing.fourSharing?.withAc ?? 7000,
            withoutAc: d.pricing.fourSharing?.withoutAc ?? 6000,
          },
        });
      }
    } else if (currentProperty) {
      setPropertyName(currentProperty.name || "");
      setAddress(currentProperty.address || "");
      setLocationPin(currentProperty.locationPin || "");
      if (currentProperty.latitude) setLatitude(Number(currentProperty.latitude));
      if (currentProperty.longitude) setLongitude(Number(currentProperty.longitude));
      setDescription(
        `Welcome to ${currentProperty.name}. Premium PG stay in ${
          currentProperty.address || "central location"
        } with clean hygienic food, fast WiFi, and 24/7 power backup.`
      );
      setWebsite(`https://${currentProperty.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.pgease.com`);
      if (currentProperty.photos && Array.isArray(currentProperty.photos)) {
        setPhotos(
          currentProperty.photos
            .map((item: any) => (typeof item === "string" ? item : item?.url))
            .filter(Boolean)
        );
      }
      if (currentProperty.facilities && Array.isArray(currentProperty.facilities)) {
        setAmenities(currentProperty.facilities);
      }
      if (currentProperty.nearbyPlaces && Array.isArray(currentProperty.nearbyPlaces)) {
        setNearbyLandmarks(currentProperty.nearbyPlaces);
      }
    }
  }, [listingQuery.data, currentProperty]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId) throw new Error("Please select a PG property first.");

      const payload: PublicListingDetails = {
        isPublished,
        propertyName: propertyName.trim() || currentProperty?.name,
        contactNumber: contactNumber.trim(),
        website: website.trim(),
        description: description.trim(),
        address: address.trim(),
        locationPin: locationPin.trim(),
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.209,
        googleMapUrl: `https://maps.google.com/maps?q=${latitude},${longitude}`,
        photos: photos.filter(Boolean),
        videoUrls: videoUrls.filter(Boolean),
        pricing,
        amenities: amenities.filter(Boolean),
        houseRules: houseRules.filter(Boolean),
        restrictions: houseRules.filter(Boolean),
        nearbyLandmarks: nearbyLandmarks.filter(Boolean),
        noticePeriodDays: Number(noticeDays),
        securityDepositMonths: Number(depositMonths),
      };

      // 1. Update public listing details (JSONB in backend)
      await updatePublicListing(selectedPgId, payload);

      // 2. Also synchronize primary property record in properties table
      try {
        await updateProperty(selectedPgId, {
          name: propertyName.trim() || undefined,
          address: address.trim() || undefined,
          locationPin: locationPin.trim() || undefined,
          latitude: Number(latitude) || undefined,
          longitude: Number(longitude) || undefined,
          singleSharingPrice: pricing.single.withFood || undefined,
          doubleSharingPrice: pricing.double.withFood || undefined,
          tripleSharingPrice: pricing.triple.withFood || undefined,
          fourSharingPrice: pricing.fourSharing.withFood || undefined,
          facilities: amenities,
          nearbyPlaces: nearbyLandmarks,
          photos: photos,
          isPublishedListing: isPublished,
        });
      } catch (syncErr) {
        console.warn("Sync to base property record skipped:", syncErr);
      }

      return payload;
    },
    onSuccess: () => {
      toast({
        title: isPublished ? "PG Published Successfully!" : "Draft Saved",
        description: isPublished
          ? "Your PG is now discoverable on the PG Ease search portal with verified room pricing and location."
          : "Listing saved as unpublished draft.",
      });
      void queryClient.invalidateQueries({ queryKey: ["public-listing", selectedPgId] });
      void refreshProperties();
    },
    onError: (err: unknown) => {
      toast({
        title: "Failed to save listing",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Photo handlers
  const handleAddPhotoUrl = () => {
    if (!photoInput.trim()) return;
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadPhoto(file);
      if (res?.url) {
        setPhotos((prev) => [...prev, res.url]);
        toast({ title: "Photo uploaded successfully" });
      }
    } catch {
      // Local fallback reader if backend upload service is in mock/dev mode
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => [...prev, reader.result as string]);
          toast({ title: "Photo attached to gallery" });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Amenities toggle & add
  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!amenities.includes(customAmenity.trim())) {
      setAmenities((prev) => [...prev, customAmenity.trim()]);
    }
    setCustomAmenity("");
  };

  // House rules / restrictions toggle & add
  const toggleRule = (rule: string) => {
    setHouseRules((prev) =>
      prev.includes(rule) ? prev.filter((x) => x !== rule) : [...prev, rule]
    );
  };

  const handleAddCustomRule = () => {
    if (!customRule.trim()) return;
    if (!houseRules.includes(customRule.trim())) {
      setHouseRules((prev) => [...prev, customRule.trim()]);
    }
    setCustomRule("");
  };

  // Nearby landmarks add & remove
  const handleAddNearby = (text?: string) => {
    const val = (text || customNearby).trim();
    if (!val) return;
    if (!nearbyLandmarks.includes(val)) {
      setNearbyLandmarks((prev) => [...prev, val]);
    }
    if (!text) setCustomNearby("");
  };

  const handleRemoveNearby = (index: number) => {
    setNearbyLandmarks((prev) => prev.filter((_, i) => i !== index));
  };

  // Minimum starting price calculation
  const minStartingPrice = useMemo(() => {
    const prices = [
      pricing.single.withFood,
      pricing.double.withFood,
      pricing.triple.withFood,
      pricing.fourSharing.withFood,
      pricing.single.withoutFood,
      pricing.double.withoutFood,
      pricing.triple.withoutFood,
      pricing.fourSharing.withoutFood,
    ].filter((p) => p && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 6000;
  }, [pricing]);

  // Mock nearby properties for the "More properties near you" preview
  const nearbyStaysPreview = useMemo(() => {
    return [
      {
        id: "mock-1",
        name: `${propertyName || "City"} Comfort Coliving`,
        address: `${address.split(",")[0] || "Near Metro Station"}, Sector 14`,
        startingWithFood: 8500,
        startingWithoutFood: 6800,
        distance: "400m away",
        image:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
        type: "Co-Ed PG",
      },
      {
        id: "mock-2",
        name: "Prime Stay Residency",
        address: `${address.split(",")[0] || "Main Road"}, Tech Park Gate`,
        startingWithFood: 9200,
        startingWithoutFood: 7500,
        distance: "900m away",
        image:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
        type: "Boys PG",
      },
    ];
  }, [propertyName, address]);

  const publicWebsiteUrl = publicListingUrl(selectedPgId);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto animate-fade-in">
      {/* TOP HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-xs">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-page-title flex items-center gap-2">
                Public Listing
                <Badge
                  className={
                    isPublished
                      ? "bg-emerald-600 text-white text-[10px] uppercase font-bold"
                      : "bg-muted text-muted-foreground text-[10px] uppercase font-bold"
                  }
                >
                  {isPublished ? "Live on Search" : "Draft / Unpublished"}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your PG's search presence: photos, with/without food pricing, Google Maps, rules & contact info.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab switcher */}
          <div className="inline-flex p-1 bg-muted rounded-xl text-xs font-bold border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "editor"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Listing Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "preview"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Search Page Preview
            </button>
          </div>

          <Button
            type="button"
            disabled={saveMutation.isPending || !selectedPgId}
            onClick={() => saveMutation.mutate()}
            className="rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-xs px-4"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save & Publish PG
          </Button>
        </div>
      </div>

      {/* QUICK STATUS BAR & VISIBILITY TOGGLE */}
      <Card
        className={`rounded-2xl border transition-all ${
          isPublished
            ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-border/80 bg-card"
        }`}
      >
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                isPublished ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {isPublished ? "PG Listing is Live on PG Search" : "PG Listing is Private / Hidden"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublished
                  ? "Tenants searching near your location can view photos, meal rents, contact details, and inquire."
                  : "Toggle switch on the right to publish this PG on the PG Ease search portal."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={publicWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              Open Live Portal <ExternalLink className="h-3 w-3" />
            </a>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LISTING EDITOR                                                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* 1. PG PHOTOS & GALLERY */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span>1. PG Images & Gallery</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    High quality photos increase enquiries by over 3x. Add room photos, dining, washrooms & building exterior.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {photos.length} Photos Added
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Photo Input Controls */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Paste direct Image URL (https://...jpg, png)"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPhotoUrl()}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    disabled={!photoInput.trim()}
                    className="h-9 text-xs font-bold rounded-xl gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add URL
                  </Button>
                </div>

                <div className="shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 text-xs font-bold rounded-xl gap-1.5 w-full sm:w-auto"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Photo Grid Preview */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="group relative rounded-xl overflow-hidden border border-border/80 bg-muted/20 aspect-video"
                    >
                      <img
                        src={url}
                        alt={`PG Photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Cover Photo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border/80 rounded-xl p-8 text-center bg-muted/10 space-y-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    No property photos added yet. Upload images or paste URLs above to showcase your PG.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. ABOUT THE PROPERTY (NUMBER, WEBSITE, DESCRIPTION) */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span>2. About the Property (Contact Number, Website & Description)</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Official contact telephone and website links shown to tenants visiting your PG profile.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-blue-600" /> Property Name
                  </Label>
                  <Input
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="e.g. PG Ease Luxury Coliving"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-600" /> Official Contact Number
                  </Label>
                  <Input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-600" /> Official Website Link
                  </Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://mypg.pgease.com"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" /> About Property / Overview Text
                </Label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your PG location, proximity to tech parks/colleges, housekeeping routine, meal timings, and resident community..."
                  className="w-full text-xs rounded-xl border border-input bg-background p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground leading-relaxed resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. ROOM DETAILS & PRICING: WITH FOOD VS WITHOUT FOOD RENT */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>3. Room Details & Pricing (With Food vs Without Food Rent)</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Specify exact monthly rents for residents opting for 3-Time Daily Meals vs Self-catering/Room-only.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-xs font-bold">
                  Starts from ₹{minStartingPrice.toLocaleString("en-IN")}/mo
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Single Sharing */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Single Room</h4>
                      <p className="text-[10px] text-muted-foreground">Private Room (1 Bed)</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      1 Bed
                    </Badge>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <Label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        With Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.single.withFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            single: { ...pricing.single, withFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Without Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.single.withoutFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            single: { ...pricing.single, withoutFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
                      <span>Meal Difference:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Math.max(0, pricing.single.withFood - pricing.single.withoutFood)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Double Sharing */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Double Sharing</h4>
                      <p className="text-[10px] text-muted-foreground">2 Beds in Room</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      2 Beds
                    </Badge>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <Label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        With Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.double.withFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            double: { ...pricing.double, withFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Without Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.double.withoutFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            double: { ...pricing.double, withoutFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
                      <span>Meal Difference:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Math.max(0, pricing.double.withFood - pricing.double.withoutFood)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Triple Sharing */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Triple Sharing</h4>
                      <p className="text-[10px] text-muted-foreground">3 Beds in Room</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      3 Beds
                    </Badge>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <Label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        With Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.triple.withFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            triple: { ...pricing.triple, withFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Without Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.triple.withoutFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            triple: { ...pricing.triple, withoutFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
                      <span>Meal Difference:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Math.max(0, pricing.triple.withFood - pricing.triple.withoutFood)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Four Sharing */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Four Sharing</h4>
                      <p className="text-[10px] text-muted-foreground">4 Beds / Economy</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      4 Beds
                    </Badge>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <Label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        With Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.fourSharing.withFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            fourSharing: { ...pricing.fourSharing, withFood: Number(e.target.value) },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Without Food Rent (₹/mo)
                      </Label>
                      <Input
                        type="number"
                        value={pricing.fourSharing.withoutFood}
                        onChange={(e) =>
                          setPricing({
                            ...pricing,
                            fourSharing: {
                              ...pricing.fourSharing,
                              withoutFood: Number(e.target.value),
                            },
                          })
                        }
                        className="h-8 text-xs font-bold rounded-lg mt-0.5"
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
                      <span>Meal Difference:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Math.max(0, pricing.fourSharing.withFood - pricing.fourSharing.withoutFood)}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4 & 5: AMENITIES & RESTRICTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AMENITIES */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>4. Amenities</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Click to toggle amenities or type custom perks below.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {COMMON_AMENITIES.map((item) => {
                    const active = amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
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

                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Input
                    placeholder="Add custom amenity..."
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomAmenity()}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    disabled={!customAmenity.trim()}
                    className="h-8 text-xs font-bold rounded-xl gap-1 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* RESTRICTIONS / HOUSE RULES */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
              <CardHeader className="p-5 pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>5. Restrictions & House Rules</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Set safety expectations, gate closing timings and guest policies.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {COMMON_RULES.map((rule) => {
                    const active = houseRules.includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => toggleRule(rule)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          active
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-muted/20 text-muted-foreground border-border/60 hover:bg-muted/40"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        <span>{rule}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Input
                    placeholder="Add custom house rule..."
                    value={customRule}
                    onChange={(e) => setCustomRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomRule()}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomRule}
                    disabled={!customRule.trim()}
                    className="h-8 text-xs font-bold rounded-xl gap-1 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 6. GOOGLE MAP & ADDRESS COORDINATES */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>6. Google Map & Precise Location Pin</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Exact coordinates power tenant distance calculations ("500m away") and Google Maps navigation.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Street Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot / House number, Street, Landmark, Area"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Pincode / Pin</Label>
                  <Input
                    value={locationPin}
                    onChange={(e) => setLocationPin(e.target.value)}
                    placeholder="e.g. 560095 or 122001"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Embedded Interactive Google Map Preview */}
              <div className="rounded-xl overflow-hidden border border-border/80 bg-muted/20 relative">
                <div className="p-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-blue-600" /> Interactive Map Preview ({latitude}, {longitude})
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <iframe
                  title="Google Maps Preview"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                  className="w-full h-56 border-0"
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. NEARBY LOCATIONS & TRANSIT */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span>7. Nearby Locations & Landmarks</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Highlight walking distances to Metro stations, Tech Parks, Colleges, and Markets.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {nearbyLandmarks.length} Landmarks
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Quick Add Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_NEARBY.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddNearby(sug)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted/40 hover:bg-muted text-foreground border border-border/60 transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Landmark */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Cyber City Metro Station (400m) or Amity University (1 km)"
                  value={customNearby}
                  onChange={(e) => setCustomNearby(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNearby()}
                  className="h-9 text-xs rounded-xl"
                />
                <Button
                  type="button"
                  onClick={() => handleAddNearby()}
                  disabled={!customNearby.trim()}
                  className="h-9 text-xs font-bold rounded-xl gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Landmark
                </Button>
              </div>

              {/* Active Landmarks list */}
              {nearbyLandmarks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {nearbyLandmarks.map((place, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{place}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNearby(idx)}
                        className="text-rose-500 hover:text-rose-700 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: LIVE SEARCH PAGE PREVIEW ("INSIDE ANY PG SEARCH")                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Eye className="h-4 w-4 shrink-0 text-blue-600" />
              <span>
                <strong>Live Search Page Preview:</strong> This shows exactly how prospective tenants will see your PG on the public portal.
              </span>
            </div>
            <a
              href={publicWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 shrink-0"
            >
              Open in New Tab <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* SIMULATED PUBLIC SEARCH DETAILS CONTAINER */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-8 rounded-3xl border border-border/80 shadow-md space-y-8">
            {/* 1. HERO & IMAGES GALLERY */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {propertyName || "Your PG Name"}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    {address || "Full street address, city, landmark"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Starting Monthly Rent
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    ₹{minStartingPrice.toLocaleString("en-IN")}<span className="text-xs font-medium text-slate-500">/mo</span>
                  </div>
                </div>
              </div>

              {/* Photo Collage */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 rounded-2xl overflow-hidden">
                <div className="md:col-span-2 h-64 md:h-80 relative group overflow-hidden">
                  <img
                    src={
                      photos[0] ||
                      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80"
                    }
                    alt="Cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    Primary View
                  </span>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-2.5 h-64 md:h-80">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="relative overflow-hidden group">
                      <img
                        src={
                          photos[idx] ||
                          `https://images.unsplash.com/photo-${
                            idx === 1
                              ? "1522708323590-d24dbb6b0267"
                              : idx === 2
                              ? "1502672260266-1c1ef2d93688"
                              : idx === 3
                              ? "1560448204-e02f11c3d0e2"
                              : "1555854877-bab0e564b8d5"
                          }?auto=format&fit=crop&w=600&q=80`
                        }
                        alt={`PG View ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. ABOUT THE PROPERTY & CONTACT BAR */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                About the Property
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description ||
                  "A peaceful, fully furnished accommodation with home-cooked meals, daily housekeeping, and high-speed fiber internet."}
              </p>

              {/* Number and Website Action Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Contact Number
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {contactNumber || "+91 99905 55580"}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" className="h-8 text-xs font-bold rounded-lg bg-blue-600 text-white">
                    Call Host
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Official Website
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {website || "pgease.com"}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-lg gap-1 shrink-0">
                    Visit <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 3. ROOM DETAILS & PRICING: WITH FOOD VS WITHOUT FOOD TOGGLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-emerald-600" />
                    <span>Room Details & Pricing</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare rents for With Food (3 Daily Meals) vs Without Food accommodations.
                  </p>
                </div>

                {/* Meal plan toggle */}
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewMealPlan("withFood")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      previewMealPlan === "withFood"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    With Food (3 Meals)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMealPlan("withoutFood")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      previewMealPlan === "withoutFood"
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Without Food (Room Only)
                  </button>
                </div>
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Single Room",
                    type: "1 Bed",
                    withFood: pricing.single.withFood,
                    withoutFood: pricing.single.withoutFood,
                    perks: ["Private Attached Bath", "Air Conditioner", "Study Table", "Full Wardrobe"],
                  },
                  {
                    title: "Double Sharing",
                    type: "2 Beds",
                    withFood: pricing.double.withFood,
                    withoutFood: pricing.double.withoutFood,
                    perks: ["Attached Washroom", "AC / Fan", "Personal Locker", "High-speed WiFi"],
                  },
                  {
                    title: "Triple Sharing",
                    type: "3 Beds",
                    withFood: pricing.triple.withFood,
                    withoutFood: pricing.triple.withoutFood,
                    perks: ["Spacious Room", "Individual Cupboards", "Power Backup", "Geyser Hot Water"],
                  },
                  {
                    title: "Four Sharing",
                    type: "4 Beds",
                    withFood: pricing.fourSharing.withFood,
                    withoutFood: pricing.fourSharing.withoutFood,
                    perks: ["Budget Friendly", "Daily Housekeeping", "Bunk / Cot Bed", "Lockers"],
                  },
                ].map((room, idx) => {
                  const activeRent =
                    previewMealPlan === "withFood" ? room.withFood : room.withoutFood;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {room.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {room.type}
                          </Badge>
                        </div>

                        <div className="mt-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            {previewMealPlan === "withFood" ? "Rent (With Food)" : "Rent (Without Food)"}
                          </span>
                          <span className="text-xl font-extrabold text-emerald-600">
                            ₹{activeRent.toLocaleString("en-IN")}<span className="text-[10px] font-medium text-slate-500">/mo</span>
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                          {room.perks.map((p, i) => (
                            <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-600 shrink-0" /> {p}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] text-muted-foreground">
                        {depositMonths} Months Security Deposit • {noticeDays} Days Notice
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 & 5. AMENITIES & RESTRICTIONS PREVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amenities */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" /> Amenities Provided
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Ban className="h-4 w-4 text-rose-600" /> House Rules & Restrictions
                </h4>
                <div className="space-y-1.5">
                  {houseRules.map((rule, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. GOOGLE MAP & NEARBY LOCATIONS PREVIEW */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" /> Location & Google Maps
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{address}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  View on Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Interactive map iframe */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-56">
                <iframe
                  title="Google Maps Location Preview"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

              {/* Nearby locations */}
              {nearbyLandmarks.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Near By Locations & Transit
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {nearbyLandmarks.map((place, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <Navigation className="h-3 w-3 text-blue-600 shrink-0" />
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 7. MORE PROPERTIES NEAR YOU / NEARBY PROPERTY SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    More properties near you
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Other verified stays nearby in this neighborhood
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  Nearby PGs
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyStaysPreview.map((stay) => (
                  <div
                    key={stay.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-blue-400 transition-all flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={stay.image}
                        alt={stay.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {stay.type}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {stay.distance}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          {stay.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" /> {stay.address}
                        </p>
                      </div>

                      {/* With and Without Food Comparison */}
                      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                            With Food
                          </span>
                          <span className="font-extrabold text-emerald-600">
                            ₹{stay.startingWithFood.toLocaleString("en-IN")}<span className="text-[9px] text-slate-500">/mo</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                            Without Food
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            ₹{stay.startingWithoutFood.toLocaleString("en-IN")}<span className="text-[9px] text-slate-500">/mo</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
