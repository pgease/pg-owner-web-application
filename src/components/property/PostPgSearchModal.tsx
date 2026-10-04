import React, { useState, useEffect } from "react";
import {
  Globe,
  Loader2,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Languages,
  Calendar,
  Code2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  postPropertyToSearch,
  type PostPropertyToSearchPayload,
} from "@/api/propertyOwner";
import { authStorage } from "@/api/http";

interface PostPgSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: any;
  listingData?: any;
  onSuccess?: (result: any) => void;
}

const COMMON_LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Telugu",
  "Tamil",
  "Marathi",
  "Bengali",
  "Gujarati",
];

const DEFAULT_PROPERTY_TYPES = [
  { id: "064a5796-04c0-42df-b0f1-1baa487cfd67", name: "Co-ed PG / Coliving" },
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "Boys PG Accommodation" },
  { id: "223e4567-e89b-12d3-a456-426614174000", name: "Girls PG Accommodation" },
  { id: "323e4567-e89b-12d3-a456-426614174000", name: "Student Hostel" },
];

const DEFAULT_CITIES = [
  { id: "e1234567-e89b-12d3-a456-426614174001", name: "Bengaluru" },
  { id: "e1234567-e89b-12d3-a456-426614174002", name: "Delhi NCR" },
  { id: "e1234567-e89b-12d3-a456-426614174003", name: "Noida" },
  { id: "e1234567-e89b-12d3-a456-426614174004", name: "Gurugram" },
  { id: "e1234567-e89b-12d3-a456-426614174005", name: "Pune" },
  { id: "e1234567-e89b-12d3-a456-426614174006", name: "Hyderabad" },
  { id: "e1234567-e89b-12d3-a456-426614174007", name: "Mumbai" },
];

export function PostPgSearchModal({
  open,
  onOpenChange,
  property,
  listingData,
  onSuccess,
}: PostPgSearchModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "address" | "contact" | "preview">("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [propertyTypeId, setPropertyTypeId] = useState<string>("064a5796-04c0-42df-b0f1-1baa487cfd67");
  const [propertyOwnerId, setPropertyOwnerId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("e1234567-e89b-12d3-a456-426614174001");
  const [name, setName] = useState<string>("");
  const [displayNameEn, setDisplayNameEn] = useState<string>("");
  const [displayNameHi, setDisplayNameHi] = useState<string>("");

  // Address
  const [street, setStreet] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [cityName, setCityName] = useState<string>("Bengaluru");
  const [pincode, setPincode] = useState<string>("560102");
  const [geoLocation, setGeoLocation] = useState<string>("12.9121,77.6446");

  // Contact
  const [mobileContactNumber, setMobileContactNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [email, setEmail] = useState<string>("");
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(["English", "Hindi"]);

  // Description & Status
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionHi, setDescriptionHi] = useState<string>("");
  const [yearOfConstruction, setYearOfConstruction] = useState<number>(2022);
  const [active, setActive] = useState<boolean>(true);

  // Parse and autofill from property and listingData
  useEffect(() => {
    if (!open) return;

    const owner = authStorage.getPropertyOwner() as any;
    const resolvedOwnerId =
      property?.propertyOwnerId ||
      owner?.id ||
      "38732886-744c-4e5f-bd16-872b436494a3";
    setPropertyOwnerId(resolvedOwnerId);

    const resolvedTypeId =
      property?.propertyTypeId ||
      "064a5796-04c0-42df-b0f1-1baa487cfd67";
    setPropertyTypeId(resolvedTypeId);

    const resolvedCityId =
      property?.cityId ||
      "e1234567-e89b-12d3-a456-426614174001";
    setCityId(resolvedCityId);

    const resolvedName =
      listingData?.propertyName ||
      property?.name ||
      "Urban Stay Luxury PG";
    setName(resolvedName);
    setDisplayNameEn(resolvedName);
    setDisplayNameHi("");

    // Parse Address
    const rawAddress = (listingData?.address || property?.address || "").trim();
    if (rawAddress) {
      const parts = rawAddress.split(",").map((s: string) => s.trim());
      const pincodeMatch = rawAddress.match(/\b\d{6}\b/);
      if (pincodeMatch) setPincode(pincodeMatch[0]);

      if (parts.length >= 3) {
        setStreet(parts[0] || "12th Main Road");
        setArea(parts[1] || "HSR Layout");
        setCityName(parts[2] || "Bengaluru");
      } else {
        setStreet(parts[0] || "12th Main Road");
        setArea(parts[1] || "HSR Layout");
        setCityName("Bengaluru");
      }
    } else {
      setStreet("12th Main Road");
      setArea("HSR Layout");
      setCityName("Bengaluru");
      setPincode("560102");
    }

    // Geo Location
    const lat = listingData?.latitude ?? property?.latitude ?? 12.9121;
    const lng = listingData?.longitude ?? property?.longitude ?? 77.6446;
    setGeoLocation(`${lat},${lng}`);

    // Contact Number
    const phone =
      listingData?.contactNumber ||
      property?.contactNumber ||
      property?.mobileContactNumber ||
      owner?.mobileContactNumber ||
      "9876543210";
    setMobileContactNumber(phone.replace(/^\+91/, "").trim());
    setCountryCode("+91");

    // Email
    const userEmail =
      owner?.email ||
      property?.email ||
      `contact@${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "urbanstay"}.com`;
    setEmail(userEmail);

    // Description
    const desc =
      listingData?.description ||
      property?.description ||
      "Premium living experience with high-speed WiFi, hygienic dining, and 24x7 biometric security.";
    setDescriptionEn(desc);
    setDescriptionHi("");

    // Year
    const year = property?.yearOfConstruction
      ? Number(property.yearOfConstruction)
      : 2022;
    setYearOfConstruction(year);

    setActive(true);
  }, [open, property, listingData]);

  const toggleLanguage = (lang: string) => {
    setLanguagesSpoken((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const payload: PostPropertyToSearchPayload = {
    propertyTypeId,
    propertyOwnerId,
    name: name.trim(),
    displayNameI18n: {
      en: displayNameEn.trim() || name.trim(),
      ...(displayNameHi.trim() ? { hi: displayNameHi.trim() } : {}),
    },
    address: {
      street: street.trim(),
      area: area.trim(),
      city: cityName.trim(),
      pincode: pincode.trim(),
    },
    geoLocation: geoLocation.trim(),
    mobileContactNumber: mobileContactNumber.trim(),
    countryCode: countryCode.trim() || "+91",
    cityId,
    email: email.trim(),
    descriptionI18n: {
      en: descriptionEn.trim(),
      ...(descriptionHi.trim() ? { hi: descriptionHi.trim() } : {}),
    },
    languagesSpoken,
    status: active ? "active" : "inactive",
    active,
    yearOfConstruction: Number(yearOfConstruction) || 2022,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "PG Name is required", variant: "destructive" });
      return;
    }
    if (!propertyTypeId.trim()) {
      toast({ title: "Property Type UUID is required", variant: "destructive" });
      return;
    }
    if (!propertyOwnerId.trim()) {
      toast({ title: "Property Owner UUID is required", variant: "destructive" });
      return;
    }
    if (!cityId.trim()) {
      toast({ title: "City UUID is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postPropertyToSearch(payload);
      toast({
        title: "PG Published to Search! 🚀",
        description: `${name} has been registered to the public PG Search network.`,
      });
      onSuccess?.(result);
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message.join(", ") : null) ||
        err?.message ||
        "Failed to post PG to search.";
      toast({
        title: "Publishing Failed",
        description: Array.isArray(msg) ? msg.join("; ") : String(msg),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Post PG to Search Network
                <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                  POST /api/properties
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Autofilled with your PG details. Modify any field and publish directly to public discovery.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border/80 pb-2">
          {[
            { id: "general", label: "General & IDs", icon: Building2 },
            { id: "address", label: "Address & Geo", icon: MapPin },
            { id: "contact", label: "Contact & Languages", icon: Phone },
            { id: "preview", label: "JSON & Publish", icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSel
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: GENERAL & IDS */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">PG Name (Canonical) *</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!displayNameEn || displayNameEn === name) setDisplayNameEn(e.target.value);
                    }}
                    placeholder="e.g. Urban Stay Luxury PG"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Display Name (English)</Label>
                  <Input
                    value={displayNameEn}
                    onChange={(e) => setDisplayNameEn(e.target.value)}
                    placeholder="e.g. Urban Stay Luxury PG"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Display Name (Hindi - optional)</Label>
                  <Input
                    value={displayNameHi}
                    onChange={(e) => setDisplayNameHi(e.target.value)}
                    placeholder="e.g. अर्बन स्टे लग्जरी पीजी"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Property Type *</Label>
                  <select
                    value={propertyTypeId}
                    onChange={(e) => setPropertyTypeId(e.target.value)}
                    className="w-full h-9 text-xs rounded-md border border-input bg-background px-3 py-1"
                  >
                    {DEFAULT_PROPERTY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">City Registry *</Label>
                  <select
                    value={cityId}
                    onChange={(e) => {
                      setCityId(e.target.value);
                      const found = DEFAULT_CITIES.find((c) => c.id === e.target.value);
                      if (found) setCityName(found.name);
                    }}
                    className="w-full h-9 text-xs rounded-md border border-input bg-background px-3 py-1"
                  >
                    {DEFAULT_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Property Owner ID (UUID) *</Label>
                  <Input
                    required
                    value={propertyOwnerId}
                    onChange={(e) => setPropertyOwnerId(e.target.value)}
                    placeholder="UUID e.g. 38732886-744c-4e5f-bd16-872b436494a3"
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Autofilled from your PG Ease owner account token.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS & GEO */}
          {activeTab === "address" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Street Address *</Label>
                  <Input
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. 12th Main Road"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Area / Sector / Colony *</Label>
                  <Input
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. HSR Layout"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">City Name *</Label>
                  <Input
                    required
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pincode *</Label>
                  <Input
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560102"
                    className="h-9 text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Geo Location ("lat,lng") *</Label>
                  <Input
                    required
                    value={geoLocation}
                    onChange={(e) => setGeoLocation(e.target.value)}
                    placeholder="e.g. 12.9121,77.6446"
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Required format: Latitude,Longitude (used for proximity search).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & LANGUAGES */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Country Code</Label>
                  <Input
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+91"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile Contact Number *</Label>
                  <Input
                    required
                    value={mobileContactNumber}
                    onChange={(e) => setMobileContactNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Contact Email *</Label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@urbanstaypg.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Description (English)</Label>
                  <Textarea
                    rows={3}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Premium living experience with high-speed WiFi and dining..."
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">Languages Spoken at Property</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_LANGUAGES.map((lang) => {
                      const isSel = languagesSpoken.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            isSel
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {lang} {isSel ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Year of Construction</Label>
                  <Input
                    type="number"
                    value={yearOfConstruction}
                    onChange={(e) => setYearOfConstruction(Number(e.target.value) || 2022)}
                    className="h-9 text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center justify-between border border-border p-2.5 rounded-lg">
                    <div>
                      <Label className="text-xs font-semibold">Active & Live Status</Label>
                      <p className="text-[11px] text-muted-foreground">Visible in public search immediately</p>
                    </div>
                    <Switch checked={active} onCheckedChange={setActive} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JSON & PUBLISH */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-950 p-4 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-slate-400">
                  <span>POST /api/properties Payload Payload Preview</span>
                  <span>{JSON.stringify(payload).length} bytes</span>
                </div>
                <pre>{JSON.stringify(payload, null, 2)}</pre>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Ready to post to PG Search directory</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Clicking "Submit & Publish PG to Search" will execute the HTTP POST request to{" "}
                    <code className="font-mono font-bold">/api/properties</code> with the exact schema above.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              {activeTab !== "preview" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Code2 className="h-3.5 w-3.5" /> Preview JSON payload
                </button>
              ) : (
                <span>All parameters validated</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Submit & Publish PG to Search
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
