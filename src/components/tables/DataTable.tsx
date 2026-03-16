import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  searchable?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: string[];
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  headerActions?: ReactNode;
  renderActions?: (row: T) => ReactNode;
  searchValue?: string;
}

const DEFAULT_PAGE_SIZE = 10;

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchable = [],
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado.',
  headerActions,
  renderActions,
  searchValue = '',
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  const filtered = searchValue
    ? data.filter((row) =>
        searchable.some((field) => {
          const val = (row as Record<string, unknown>)[field];
          return typeof val === 'string' && val.toLowerCase().includes(searchValue.toLowerCase());
        })
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {headerActions && <div className="flex justify-end">{headerActions}</div>}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 grid" style={{ gridTemplateColumns: `repeat(${columns.length + (renderActions ? 1 : 0)}, 1fr)` }}>
            {columns.map((col) => (
              <span key={col.key} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.header}</span>
            ))}
            {renderActions && <span />}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-t border-border/50 flex gap-4">
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1" />
              ))}
              {renderActions && <Skeleton className="h-4 w-20" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-2">
        {headerActions && <div className="flex justify-end">{headerActions}</div>}
        <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {headerActions && <div className="flex justify-end">{headerActions}</div>}

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
                {renderActions && <th className="px-4 py-3 w-24" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-foreground">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {start + 1}–{Math.min(start + pageSize, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
