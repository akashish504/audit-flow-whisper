import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculateVariance, formatCurrency } from '@/data/mockData';
import type { SourceReference } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FilePageViewer } from './FilePageViewer';

interface EditTarget {
  entityId: string;
  fieldName: string;
  column: 'Source_Value' | 'Extracted_Value';
  currentValue: number;
}

interface ViewerTarget {
  sourceRef: SourceReference;
  fieldName: string;
}

export function CompanyFinancials({ companyId, selectedEntityId }: { companyId: string; selectedEntityId?: string }) {
  const { fieldThresholds, reconciliationDataState, updateReconciliationValue } = useAppState();
  const allData = reconciliationDataState[companyId] || [];

  const data = selectedEntityId
    ? allData.filter(row => row.entityId === selectedEntityId)
    : allData;

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [viewerTarget, setViewerTarget] = useState<ViewerTarget | null>(null);
  const [editValue, setEditValue] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const openEdit = (target: EditTarget) => {
    setEditTarget(target);
    setEditValue(target.currentValue.toString());
    setAcknowledged(false);
  };

  const confirmEdit = () => {
    if (!editTarget) return;
    const parsed = parseFloat(editValue);
    if (isNaN(parsed)) {
      toast.error('Please enter a valid number');
      return;
    }
    updateReconciliationValue(companyId, editTarget.entityId, editTarget.fieldName, editTarget.column, parsed);
    toast.success(`${editTarget.fieldName} ${editTarget.column === 'Source_Value' ? 'Source' : 'Extracted'} value updated`);
    setEditTarget(null);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No financial data available for this entity</p>
      </div>
    );
  }

  const entityGroups = new Map<string, typeof data>();
  for (const row of data) {
    const key = row.entityName || 'Unknown';
    if (!entityGroups.has(key)) entityGroups.set(key, []);
    entityGroups.get(key)!.push(row);
  }

  const columnLabel = editTarget?.column === 'Source_Value' ? 'Source Value (Snowflake)' : 'Extracted Value (Audit)';

  return (
    <div className="p-6 space-y-6">
      {Array.from(entityGroups.entries()).map(([entityName, rows]) => (
        <div key={entityName}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{entityName}</h3>
          <div className="overflow-x-auto bg-background rounded-lg border border-border shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-left px-4 py-3">Field Name</th>
                  <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right px-4 py-3">Source Value (Snowflake)</th>
                  <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right px-4 py-3">Extracted Value (Audit)</th>
                  <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right px-4 py-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => {
                  const v = calculateVariance(row.Source_Value, row.Extracted_Value, fieldThresholds[row.Field_Name] ?? 0.005);
                  return (
                    <tr key={`${row.Field_Name}-${idx}`} className={`${v.isFlagged ? 'bg-destructive/10' : 'hover:bg-muted/30'} transition-all`}>
                      <td className="px-4 py-3 text-sm text-foreground">{row.Field_Name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 group">
                          {formatCurrency(row.Source_Value)}
                          <button
                            onClick={() => openEdit({ entityId: row.entityId || companyId, fieldName: row.Field_Name, column: 'Source_Value', currentValue: row.Source_Value })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                            title="Edit source value"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 group">
                          {row.sourceRef ? (
                            <button
                              onClick={() => setViewerTarget({ sourceRef: row.sourceRef!, fieldName: row.Field_Name })}
                              className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/80 transition-colors inline-flex items-center gap-1"
                              title={`View in ${row.sourceRef.fileName}, page ${row.sourceRef.page}`}
                            >
                              {formatCurrency(row.Extracted_Value)}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            formatCurrency(row.Extracted_Value)
                          )}
                          <button
                            onClick={() => openEdit({ entityId: row.entityId || companyId, fieldName: row.Field_Name, column: 'Extracted_Value', currentValue: row.Extracted_Value })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                            title="Edit extracted value"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-mono text-right ${v.isFlagged ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {v.percent === 0 ? '—' : `${(v.percent * 100).toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Edit confirmation dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Financial Value</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update <span className="font-medium text-foreground">{editTarget?.fieldName}</span> — {columnLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Current value</label>
              <p className="text-sm font-mono text-foreground">{editTarget ? formatCurrency(editTarget.currentValue) : ''}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">New value</label>
              <Input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <Checkbox
                id="ack-edit"
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="ack-edit" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                I acknowledge that this change will update the financial record and may affect variance calculations and discrepancy flags.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={confirmEdit} disabled={!acknowledged || editValue === ''}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
