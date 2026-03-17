/**
 * GenericDataTable — CRUD Genérico Reutilizável
 * Story 7.5: Eliminar duplicação em CRUD
 *
 * Uso:
 * <GenericDataTable
 *   data={clientes}
 *   columns={clienteColumns}
 *   onAdd={() => openDialog()}
 *   onEdit={(row) => editItem(row)}
 *   onDelete={(id) => deleteItem(id)}
 * />
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Plus } from 'lucide-react';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: any) => string;
  width?: string;
}

export interface GenericDataTableProps<T extends { id: string }> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => Promise<void>;
  emptyMessage?: string;
  showActions?: boolean;
  addButtonLabel?: string;
}

export function GenericDataTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhum registro',
  showActions = true,
  addButtonLabel = 'Novo',
}: GenericDataTableProps<T>) {
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              {showActions && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.format ? col.format(row[col.key]) : String(row[col.key] || '-')}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(row)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
