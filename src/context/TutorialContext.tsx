import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ExternalLink, BookOpen, Loader2, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTutorialByKey, type TutorialItem } from "@/api/propertyOwner";
import { helpCenterTutorialUrl } from "@/config/links";

interface TutorialContextValue {
  openTutorial: (tutorialKey: string) => Promise<void>;
  /** Opens the page tutorial on YouTube. Falls back to a YouTube search for this topic. */
  openYouTubeTutorial: (tutorialKey: string) => Promise<void>;
  currentRouteTutorialKey: string;
  isTutorialOpen: boolean;
  activeTutorial: TutorialItem | null;
  isLoading: boolean;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

/**
 * Route → tutorial_key (configured in Admin). Longest prefix wins, so more specific
 * routes should be listed regardless of order.
 */
const ROUTE_TUTORIAL_MAP: Record<string, string> = {
  "/tenants/add": "tenant_add",
  "/tenants/kyc": "kyc_verification",
  "/tenants/notice-period": "tenant_add",
  "/tenants/guests": "tenant_add",
  "/tenants": "tenant_add",
  "/rent-payments": "rent_collection",
  "/my-pgs/structure": "room_management",
  "/my-pgs": "room_management",
  "/post-pg": "post_your_pg_in_live",
  "/public-listing": "post_your_pg_in_live",
  "/team": "staff_management",
  "/complaints": "complaints_resolution",
  "/expenses": "expense_tracker",
  "/reports": "expense_tracker",
  "/onboarding": "room_management",
};

const DEFAULT_TUTORIAL_KEY = "onboarding_guide";

function resolveRouteTutorialKey(pathname: string): string {
  const path = pathname.toLowerCase();
  let best: { route: string; key: string } | null = null;
  for (const [route, key] of Object.entries(ROUTE_TUTORIAL_MAP)) {
    if (path === route || path.startsWith(`${route}/`)) {
      if (!best || route.length > best.route.length) best = { route, key };
    }
  }
  return best?.key ?? DEFAULT_TUTORIAL_KEY;
}

function toWatchUrl(url?: string | null): string {
  if (!url) return "";
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  if (match && match[2].length === 11) return `https://www.youtube.com/watch?v=${match[2]}`;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return url;
  return "";
}

function toEmbedUrl(url?: string | null): string {
  if (!url) return "";
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0` : url;
}

function formatKeyToTitle(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type LoadState = "idle" | "loading" | "ready" | "missing" | "error";

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [activeTutorial, setActiveTutorial] = useState<TutorialItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [requestedKey, setRequestedKey] = useState<string>("");

  const currentRouteTutorialKey = useMemo(() => resolveRouteTutorialKey(location.pathname), [location.pathname]);

  const openYouTubeTutorial = useCallback(async (tutorialKey: string) => {
    const topic = formatKeyToTitle(tutorialKey || "PG Ease");
    const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(`PG Ease ${topic} tutorial`)}`;
    try {
      let data = await getTutorialByKey(tutorialKey);
      if (!data && tutorialKey === "post_your_pg_in_live") {
        data = await getTutorialByKey("public_listing");
      } else if (!data && tutorialKey === "public_listing") {
        data = await getTutorialByKey("post_your_pg_in_live");
      }
      const watch = toWatchUrl(data?.videoUrl || data?.youtube_url || data?.youtubeUrl);
      window.open(watch || search, "_blank", "noopener,noreferrer");
    } catch {
      window.open(search, "_blank", "noopener,noreferrer");
    }
  }, []);

  const openTutorial = useCallback(async (tutorialKey: string) => {
    if (!tutorialKey) return;
    setRequestedKey(tutorialKey);
    setActiveTutorial(null);
    setState("loading");
    setIsOpen(true);

    try {
      let data = await getTutorialByKey(tutorialKey);
      if (!data && tutorialKey === "post_your_pg_in_live") {
        data = await getTutorialByKey("public_listing");
      } else if (!data && tutorialKey === "public_listing") {
        data = await getTutorialByKey("post_your_pg_in_live");
      }
      const video = data?.videoUrl || data?.youtube_url || data?.youtubeUrl;
      if (data && video) {
        setActiveTutorial(data);
        setState("ready");
      } else {
        setState("missing");
      }
    } catch {
      setState("error");
    }
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setActiveTutorial(null);
    setState("idle");
  }, []);

  const videoSrc = toEmbedUrl(activeTutorial?.youtube_url || activeTutorial?.youtubeUrl || activeTutorial?.videoUrl);
  const helpUrl = helpCenterTutorialUrl(requestedKey || activeTutorial?.tutorial_key);
  const fallbackTitle = formatKeyToTitle(requestedKey || "tutorial");

  return (
    <TutorialContext.Provider
      value={{
        openTutorial,
        openYouTubeTutorial,
        currentRouteTutorialKey,
        isTutorialOpen: isOpen,
        activeTutorial,
        isLoading: state === "loading",
        closeTutorial,
      }}
    >
      {children}

      <Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(true) : closeTutorial())}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          {state === "loading" ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
              <DialogTitle className="text-sm font-medium text-muted-foreground">Loading tutorial…</DialogTitle>
              <DialogDescription className="sr-only">Please wait while the video loads.</DialogDescription>
            </div>
          ) : state === "ready" && activeTutorial ? (
            <div>
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  title={activeTutorial.title}
                  src={videoSrc}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold leading-snug">{activeTutorial.title}</DialogTitle>
                  <DialogDescription className="mt-1 text-sm">
                    {activeTutorial.description || "A short step-by-step guide to this feature."}
                  </DialogDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Read in Help Center
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Video className="h-5 w-5" aria-hidden />
              </span>
              <DialogTitle className="text-base font-semibold">
                {state === "error" ? "Couldn't load this tutorial" : `No video yet for “${fallbackTitle}”`}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-sm">
                {state === "error"
                  ? "Please check your connection and try again. You can also read the written guide in the Help Center."
                  : "A video for this feature is being prepared. The Help Center has written guides you can follow in the meantime."}
              </DialogDescription>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                {state === "error" ? (
                  <Button variant="outline" size="sm" onClick={() => void openTutorial(requestedKey)}>
                    Try again
                  </Button>
                ) : null}
                <Button asChild size="sm" className="gap-1.5">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4" />
                    Open Help Center
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TutorialContext.Provider>
  );
};

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}

export const useTutorials = useTutorial;

