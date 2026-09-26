import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllFeatures, FEATURE_CATALOGUE, FeatureDefinition } from "@/config/featureCatalogue";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Check, Lock, Search, RefreshCw, ShieldCheck, Cpu } from "lucide-react";

export default function FeatureCataloguePage() {
  const { hasFeature, planName, planDisplayName, isLoading, refetch } = useFeatureAccess();
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  const allFeatures = getAllFeatures();

  const modules = Array.from(new Set(allFeatures.map((f) => f.module)));

  const filteredFeatures = allFeatures.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.module.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchesModule = selectedModule === "ALL" || item.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        title="Central Feature Catalogue"
        description="Canonical PGEASE Feature Key & Plan Permission Registry"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Sync Features
            </Button>
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              Current Plan: {planDisplayName || planName || "Loading..."}
            </Badge>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by feature name, key, or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button
            variant={selectedModule === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedModule("ALL")}
            className="text-xs h-8 rounded-lg"
          >
            All Modules
          </Button>
          {modules.map((mod) => (
            <Button
              key={mod}
              variant={selectedModule === mod ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedModule(mod)}
              className="text-xs h-8 rounded-lg whitespace-nowrap"
            >
              {mod}
            </Button>
          ))}
        </div>
      </div>

      <DataTableContainer>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[240px]">Feature Name</TableHead>
              <TableHead className="w-[220px]">Canonical Feature Key</TableHead>
              <TableHead className="w-[140px]">Module</TableHead>
              <TableHead className="w-[130px] text-center">Plan Access</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.map((item) => {
              const active = hasFeature(item.key);

              return (
                <TableRow key={item.key} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-0.5 rounded text-[12px] font-mono font-medium text-slate-800 dark:text-slate-200 border border-border/60">
                      {item.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {item.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Lock className="h-3 w-3" /> Locked (Pro)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredFeatures.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                  No matching feature keys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableContainer>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300">Single Source of Truth Guarantee</h4>
          <p className="text-xs text-blue-700/80 dark:text-blue-400/80">
            These canonical feature keys are shared across the PG Owner Web App, Admin Panel, and PG Owner Mobile App.
            Feature availability is controlled dynamically by the backend without requiring frontend code changes.
          </p>
        </div>
      </div>
    </div>
  );
}
