import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  /** @deprecated use searchable prop on DataTable instead */
  searchable?: boolean;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Fields to search when searchValue is provided */
  searchable?: string[];
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  /** Content rendered above the table (e.g. search + action buttons) */
  headerActions?: ReactNode;
  renderActions?: (row: T) => ReactNode;
  searchValue?: string;
  /** Optional className applied to each <tr> based on row data */
  rowClassName?: (row: T) => string | undefined;
  /** Called when a data row is clicked */
  onRowClick?: (row: T) => void;
  /** Slot rendered inside the table footer bar (e.g. count summary) */
  footerContent?: ReactNode;
}

type SortableRow = Record<string, unknown>;

function sortRows<T>(rows: T[], sort: SortState): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as SortableRow)[sort.key];
    const bv = (b as SortableRow)[sort.key];
    const dir = sort.direction === 'asc' ? 1 : -1;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv), 'pt-BR') * dir;
  });
}

const ALIGN_TH: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const ALIGN_TD: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const DEFAULT_PAGE_SIZE = 10;

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchable = [],
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado.',
  emptyIcon,
  headerActions,
  renderActions,
  searchValue = '',
  rowClassName,
  onRowClick,
  footerContent,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);

  const filtered = searchValue
    ? data.filter((row) =>
        searchable.some((field) => {
          const val = (row as SortableRow)[field];
          return typeof val === 'string' && val.toLowerCase().includes(searchValue.toLowerCase());
        })
      )
    : data;

  const sorted = sort ? sortRows(filtered, sort) : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
    setPage(1);
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (!sort || sort.key !== colKey) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sort.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 ml-1 text-primary" />
      : <ChevronDown className="h-3 w-3 ml-1 text-primary" />;
  }

  const hasFooter = footerContent !== undefined || totalPages > 1;
  const colCount = columns.length + (renderActions ? 1 : 0);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {headerActions && <div className="flex justify-end">{headerActions}</div>}
        <div className="rounded-xl border border-border overflow-hidden">
          <div
            className="bg-muted/40 px-2 xs:px-3 sm:px-4 py-2 sm:py-3 grid"
            style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
          >
            {columns.map((col) => (
              <span key={col.key} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                {col.header}
              </span>
            ))}
            {renderActions && <span />}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-2 xs:px-3 sm:px-4 py-2 sm:py-3 border-t border-border/50 flex gap-2 xs:gap-3 sm:gap-4">
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1" />
              ))}
              {renderActions && <Skeleton className="h-4 w-16 sm:w-20" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="space-y-2">
        {headerActions && <div className="flex justify-end">{headerActions}</div>}
        <div className="text-center py-8 xs:py-10 sm:py-12 text-muted-foreground text-xs sm:text-sm">
          {emptyIcon && <div className="flex justify-center mb-2 xs:mb-3">{emptyIcon}</div>}
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {headerActions && <div className="flex justify-end">{headerActions}</div>}

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap',
                      ALIGN_TH[col.align ?? 'left'],
                      col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    )}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                ))}
                {renderActions && <th className="px-2 xs:px-3 sm:px-4 py-2 sm:py-3 w-20 sm:w-24" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-muted/40' : 'hover:bg-muted/30',
                    rowClassName?.(row),
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-foreground truncate', ALIGN_TD[col.align ?? 'left'])}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as SortableRow)[col.key] ?? '')}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-2 xs:px-3 sm:px-4 py-2 sm:py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasFooter && (
          <div className="border-t border-border bg-muted/30 px-2 xs:px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
            <div className="text-xs text-muted-foreground">
              {footerContent ?? (
                <span>
                  {start + 1}–{Math.min(start + pageSize, sorted.length)} de {sorted.length}
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 min-touch-target"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 min-touch-target"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
