import {
  Checkbox,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

export type TableSortDirection = 'asc' | 'desc';

export interface CheckboxColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

interface CheckboxDataTableProps<T> {
  rows: T[];
  columns: CheckboxColumn<T>[];
  getRowId: (row: T) => string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  selectionMode?: 'multiple' | 'single';
  isRowDisabled?: (row: T) => boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortDirection?: TableSortDirection;
  onSortChange?: (columnId: string) => void;
}

export function CheckboxDataTable<T>({
  rows,
  columns,
  getRowId,
  selectedIds,
  onToggle,
  onToggleAll,
  selectionMode = 'multiple',
  isRowDisabled,
  emptyMessage = 'Nenhum item encontrado.',
  sortBy,
  sortDirection = 'asc',
  onSortChange,
}: CheckboxDataTableProps<T>) {
  const isSingle = selectionMode === 'single';
  const enabledIds = rows
    .filter((row) => !isRowDisabled?.(row))
    .map((row) => getRowId(row));
  const allSelected =
    !isSingle &&
    enabledIds.length > 0 &&
    enabledIds.every((id) => selectedIds.has(id));
  const someSelected =
    !isSingle && enabledIds.some((id) => selectedIds.has(id));

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              {!isSingle && (
                <Checkbox
                  indeterminate={someSelected && !allSelected}
                  checked={allSelected}
                  onChange={() => onToggleAll(enabledIds)}
                  disabled={enabledIds.length === 0}
                />
              )}
            </TableCell>
            {columns.map((column) => {
              const canSort = Boolean(column.sortable && onSortChange);
              return (
                <TableCell
                  key={column.id}
                  sortDirection={
                    canSort && sortBy === column.id ? sortDirection : false
                  }
                >
                  {canSort ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={
                        sortBy === column.id ? sortDirection : 'asc'
                      }
                      onClick={() => onSortChange?.(column.id)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const id = getRowId(row);
            const disabled = isRowDisabled?.(row) ?? false;
            const selected = selectedIds.has(id);
            return (
              <TableRow
                key={id}
                hover
                selected={selected}
                onClick={() => {
                  if (!disabled) onToggle(id);
                }}
                sx={{
                  cursor: disabled ? 'default' : 'pointer',
                  ...(disabled ? { opacity: 0.6 } : {}),
                }}
              >
                <TableCell
                  padding="checkbox"
                  onClick={(event) => event.stopPropagation()}
                >
                  {isSingle ? (
                    <Radio
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onToggle(id)}
                    />
                  ) : (
                    <Checkbox
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onToggle(id)}
                    />
                  )}
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.render(row)}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
