import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: string;
}

const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_progress: "secondary",
  resolved: "default",
  closed: "outline",
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || "unknown").toLowerCase();
  const variant = statusMap[normalized] || "outline";
  const label = normalized.replace(/_/g, " ");
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}
