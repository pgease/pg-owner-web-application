import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  compact?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries to display for the current view.",
  emptyAction,
  onRowClick,
  selectedIds,
  onSelectRow,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  compact = false,
  className,
}: DataTableProps<T>) {
  const hasCheckbox = Boolean(onSelectRow);
  const allSelected =
    hasCheckbox && data.length > 0 && selectedIds && data.every((row, i) => selectedIds.has(keyExtractor(row, i)));
  const someSelected =
    hasCheckbox && data.length > 0 && selectedIds && data.some((row, i) => selectedIds.has(keyExtractor(row, i)));

  if (isError) {
    return (
      <div className="register-card flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-medium text-[#B42318]">Could not load data</p>
        <p className="mt-1 text-xs text-[#6B7785]">Please check your connection and try again.</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-[6px] border border-[#E2E6EA] bg-white", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {hasCheckbox ? (
              <TableHead className="w-10 px-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = !allSelected && Boolean(someSelected);
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="h-4 w-4 rounded-[3px] border-[#C8CFD6] text-[#008080] focus:ring-[#008080]"
                  aria-label="Select all rows"
                />
              </TableHead>
            ) : null}
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <TableHead
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.sortable && "cursor-pointer hover:text-[#18212B]",
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "justify-end w-full",
                      col.align === "center" && "justify-center w-full",
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable ? (
                      isSorted ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5 text-[#008080]" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-[#008080]" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-[#98A2AE]" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <TableRow key={`skeleton-row-${rIdx}`} className="hover:bg-transparent">
                {hasCheckbox ? (
                  <TableCell compact={compact} className="w-10">
                    <div className="h-4 w-4 rounded-[3px] bg-[#EEF1F3] animate-pulse" />
                  </TableCell>
                ) : null}
                {columns.map((col) => (
                  <TableCell key={`skeleton-cell-${col.key}`} compact={compact}>
                    <div className="h-4 w-3/4 rounded-[4px] bg-[#EEF1F3] animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length + (hasCheckbox ? 1 : 0)}
                className="py-12 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-[#18212B]">{emptyTitle}</p>
                  <p className="mt-1 text-xs text-[#6B7785]">{emptyDescription}</p>
                  {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const id = keyExtractor(row, index);
              const isSelected = selectedIds?.has(id);
              return (
                <TableRow
                  key={id}
                  data-state={isSelected ? "selected" : undefined}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-[#E8F4F4]",
                  )}
                >
                  {hasCheckbox ? (
                    <TableCell
                      compact={compact}
                      className="w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isSelected)}
                        onChange={(e) => onSelectRow?.(id, e.target.checked)}
                        className="h-4 w-4 rounded-[3px] border-[#C8CFD6] text-[#008080] focus:ring-[#008080]"
                        aria-label={`Select row ${index + 1}`}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((col) => {
                    const content = col.render ? col.render(row, index) : (row as any)[col.key];
                    return (
                      <TableCell
                        key={col.key}
                        compact={compact}
                        className={cn(
                          col.align === "right" && "text-right tabular-nums",
                          col.align === "center" && "text-center",
                        )}
                      >
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
