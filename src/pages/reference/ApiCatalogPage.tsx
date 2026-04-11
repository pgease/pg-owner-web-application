import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DOCUMENTED_API_BASE,
  IMPLEMENTED_API_CATALOG,
  catalogGroupedByFlow,
  type ImplementedApiRow,
} from "@/reference/pgease-api-inventory/implementedApiCatalog";
import { cn } from "@/lib/utils";

function methodBadgeClass(method: ImplementedApiRow["method"]): string {
  switch (method) {
    case "GET":
      return "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200";
    case "POST":
      return "border-sky-600/40 bg-sky-600/10 text-sky-900 dark:text-sky-100";
    case "PUT":
      return "border-amber-600/40 bg-amber-600/10 text-amber-900 dark:text-amber-100";
    case "PATCH":
      return "border-violet-600/40 bg-violet-600/10 text-violet-900 dark:text-violet-100";
    case "DELETE":
      return "border-rose-600/40 bg-rose-600/10 text-rose-900 dark:text-rose-100";
    default:
      return "";
  }
}

function AppRouteLine({ row }: { row: ImplementedApiRow }) {
  if (!row.appRoute) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Where in the app:</span> No dedicated page — runs in the background
        or is only wired in code until a UI action is added.
      </p>
    );
  }
  return (
    <p className="mt-3 text-xs">
      <span className="font-medium text-foreground">Where in the app:</span>{" "}
      <Link to={row.appRoute} className="font-mono text-primary underline-offset-4 hover:underline">
        {row.appRoute}
      </Link>
    </p>
  );
}

function ApiRowCard({ row }: { row: ImplementedApiRow }) {
  return (
    <div className="rounded-lg border bg-card/40 p-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        <Badge variant="outline" className={cn("font-mono text-[11px] font-semibold", methodBadgeClass(row.method))}>
          {row.method}
        </Badge>
        <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
          {row.path}
        </code>
      </div>
      <p className="mt-2 font-medium text-foreground">{row.clientExport}</p>
      <p className="mt-1 text-muted-foreground leading-relaxed">{row.useCase}</p>
      <AppRouteLine row={row} />
      <div className="mt-3">
        <p className="text-xs font-medium text-foreground">How to trigger this API</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-muted-foreground leading-relaxed">
          {row.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Auth: {row.auth ? "Bearer access token" : "No bearer token (public body or refresh-token payload)"}
      </p>
    </div>
  );
}

export default function ApiCatalogPage() {
  const groups = catalogGroupedByFlow();

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="API catalog"
        description="Backend routes this app calls, in product-flow order. Each card shows the in-app path (when there is one) and step-by-step usage."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How to open this page</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            After you sign in: use the sidebar item <span className="font-medium text-foreground">API catalog</span>, or go
            directly to{" "}
            <Link to="/reference/apis" className="font-mono text-primary underline-offset-4 hover:underline">
              /reference/apis
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Base URL</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{DOCUMENTED_API_BASE}</code>
          </p>
          <p>
            Total distinct HTTP integrations listed:{" "}
            <span className="font-semibold text-foreground">{IMPLEMENTED_API_CATALOG.length}</span>. Third-party map
            lookups (e.g. Nominatim during onboarding) are not included.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-12 pb-10">
        {groups.map(({ phase, items }) => (
          <section key={phase} id={phase.replace(/\s+/g, "-").toLowerCase()} className="scroll-mt-20 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{phase}</h2>
              <Separator className="hidden max-w-[160px] flex-1 sm:block" />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((row) => (
                <ApiRowCard key={`${phase}-${row.clientExport}-${row.path}-${row.method}`} row={row} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
