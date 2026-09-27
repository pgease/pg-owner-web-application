import { BookOpen, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/context/TutorialContext";
import { helpCenterTutorialUrl } from "@/config/links";
import { cn } from "@/lib/utils";

interface HelpLinkProps {
  /** tutorial_key configured in Admin (e.g. "tenant_add", "rent_collection"). */
  tutorialKey: string;
  /** Visible label. Keep it a plain question or task, e.g. "How do I verify a payment?" */
  label?: string;
  /**
   * "video"  → opens the in-app tutorial video modal (default)
   * "article" → opens the Help Center page in a new tab
   */
  mode?: "video" | "article";
  /** "button" renders an outline button; "inline" renders a small text link. */
  variant?: "button" | "inline";
  className?: string;
}

/**
 * Contextual help entry point. Use sparingly — one per page, where it actually reduces confusion.
 */
export function HelpLink({ tutorialKey, label = "Watch tutorial", mode = "video", variant = "button", className }: HelpLinkProps) {
  const { openTutorial } = useTutorial();
  const Icon = mode === "video" ? PlayCircle : BookOpen;

  if (mode === "article") {
    const href = helpCenterTutorialUrl(tutorialKey);
    if (variant === "inline") {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline", className)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      );
    }
    return (
      <Button asChild variant="outline" size="sm" className={cn("gap-1.5", className)}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Icon className="h-4 w-4 text-primary" />
          {label}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => void openTutorial(tutorialKey)}
        className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline", className)}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className={cn("gap-1.5", className)} onClick={() => void openTutorial(tutorialKey)}>
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </Button>
  );
}
