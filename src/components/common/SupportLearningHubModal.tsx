import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, MessageCircle, Mail, PlayCircle, ExternalLink, Bot, Clock, Search, Video, BookOpen } from "lucide-react";
import { getTutorials, type TutorialItem } from "@/api/propertyOwner";
import { useTutorial } from "@/context/TutorialContext";
import { EmptyState } from "@/components/common/EmptyState";
import {
  HELP_CENTER_URL,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  supportMailtoUrl,
  supportWhatsAppUrl,
} from "@/config/links";
import { cn } from "@/lib/utils";

interface SupportLearningHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "support" | "tutorials";
}

function youtubeThumb(url?: string | null, explicit?: string | null): string | null {
  if (explicit && explicit.trim()) return explicit;
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
}

export const SupportLearningHubModal: React.FC<SupportLearningHubModalProps> = ({ open, onOpenChange, defaultTab = "support" }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { openTutorial } = useTutorial();

  const fetchTutorials = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await getTutorials();
      const items: TutorialItem[] = Array.isArray(data) ? data : ((data as unknown as { data?: TutorialItem[] })?.data ?? []);
      setTutorials(items.filter((t) => t.isActive !== false));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      void fetchTutorials();
    }
  }, [open, defaultTab, fetchTutorials]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tutorials.forEach((t) => t.category && set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [tutorials]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tutorials.filter((t) => {
      const matchesCat = selectedCategory === "All" || (t.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const matchesQuery =
        !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [tutorials, selectedCategory, searchQuery]);

  const handleOpenEaseBuddy = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("open-ease-buddy"));
  };

  const handlePlay = (t: TutorialItem) => {
    const key = t.tutorial_key || t.tutorialKey || t.id;
    onOpenChange(false);
    void openTutorial(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-lg">Help & Support</DialogTitle>
          <DialogDescription>Talk to the PG Ease team, or learn how a feature works in a few minutes.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6">
            <TabsList className="h-11 gap-4 bg-transparent p-0">
              <TabsTrigger
                value="support"
                className="h-11 rounded-none border-b-2 border-transparent px-1 text-sm text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Contact support
              </TabsTrigger>
              <TabsTrigger
                value="tutorials"
                className="h-11 rounded-none border-b-2 border-transparent px-1 text-sm text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Video tutorials{tutorials.length ? ` (${tutorials.length})` : ""}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CONTACT SUPPORT */}
          <TabsContent value="support" className="m-0 space-y-5 p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ContactCard
                icon={<MessageCircle className="h-5 w-5" />}
                title="WhatsApp"
                detail={SUPPORT_PHONE_DISPLAY}
                hint="Fastest — send screenshots"
                href={supportWhatsAppUrl("Hi PG Ease Support, I need help with my PG.")}
                external
                primary
              />
              <ContactCard icon={<Phone className="h-5 w-5" />} title="Call" detail={SUPPORT_PHONE_DISPLAY} hint={SUPPORT_HOURS} href={SUPPORT_PHONE_TEL} />
              <ContactCard
                icon={<Mail className="h-5 w-5" />}
                title="Email"
                detail={SUPPORT_EMAIL}
                hint="Billing & account queries"
                href={supportMailtoUrl("PG Ease Owner Support Request")}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Quick answers with EaseBuddy</p>
                  <p className="text-xs text-muted-foreground">Ask about plans, rent collection, KYC or adding tenants — available any time.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleOpenEaseBuddy} className="shrink-0">
                Ask EaseBuddy
              </Button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden /> Support hours: {SUPPORT_HOURS}
              </span>
              <a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                <BookOpen className="h-3.5 w-3.5" aria-hidden /> Browse the Help Center <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
              </a>
            </div>
          </TabsContent>

          {/* TUTORIALS */}
          <TabsContent value="tutorials" className="m-0 space-y-4 p-6">
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tutorials, e.g. rent, KYC, add tenant"
                  className="h-9 pl-9"
                  aria-label="Search tutorials"
                />
              </div>
              {categories.length > 1 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={selectedCategory === cat}
                      className={cn(
                        "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        selectedCategory === cat
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-3">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : failed ? (
              <EmptyState
                compact
                icon={<Video />}
                title="Couldn't load tutorials"
                description="Check your connection and try again, or open the Help Center."
                action={
                  <Button size="sm" variant="outline" onClick={() => void fetchTutorials()}>
                    Try again
                  </Button>
                }
                secondaryAction={<HelpCenterLink />}
              />
            ) : tutorials.length === 0 ? (
              <EmptyState
                compact
                icon={<Video />}
                title="Tutorials are on their way"
                description="Video guides are being added. Meanwhile, the Help Center has step-by-step articles."
                action={<HelpCenterLink asButton />}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                compact
                icon={<Search />}
                title="No tutorials match"
                description={`Nothing found for "${searchQuery}". Try a different word or clear the filters.`}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((video) => {
                  const thumb = youtubeThumb(video.videoUrl || video.youtube_url || video.youtubeUrl, video.thumbnailUrl || video.thumbnail_url);
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handlePlay(video)}
                      className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Video className="h-6 w-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-primary shadow-sm">
                            <PlayCircle className="h-5 w-5" />
                          </span>
                        </div>
                        {video.duration ? (
                          <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">{video.duration}</span>
                        ) : null}
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">{video.title}</p>
                        {video.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{video.description}</p> : null}
                        {video.category ? <p className="pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{video.category}</p> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && tutorials.length > 0 ? (
              <div className="flex justify-end pt-1">
                <HelpCenterLink />
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

function HelpCenterLink({ asButton }: { asButton?: boolean }) {
  if (asButton) {
    return (
      <Button asChild size="sm">
        <a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
          Open Help Center <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    );
  }
  return (
    <a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
      <BookOpen className="h-3.5 w-3.5" aria-hidden /> Open Help Center <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
    </a>
  );
}

function ContactCard({
  icon,
  title,
  detail,
  hint,
  href,
  external,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  hint?: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        primary && "border-primary/40 bg-primary/5",
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-sm text-foreground/90">{detail}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </a>
  );
}

export default SupportLearningHubModal;
