import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculateVariance, formatCurrency } from '@/data/mockData';
import type { DiscrepancyItem, DiscrepancyStatus } from '@/data/mockData';
import { AlertTriangle, Pencil, Building2, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STATUS_OPTIONS: DiscrepancyStatus[] = ['Open', 'Under Review', 'Resolved', 'Dismissed'];

const statusColor: Record<DiscrepancyStatus, string> = {
  'Open': 'bg-red-100 text-red-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Resolved': 'bg-green-100 text-green-800',
  'Dismissed': 'bg-muted text-muted-foreground',
};

export function CompanyDiscrepancies({ companyId }: { companyId: string }) {
  const { companies, discrepancies, updateDiscrepancy, addManualDiscrepancy } = useAppState();
  const company = companies.find(c => c.id === companyId);

  const relatedIds = [companyId, ...companies.filter(c => c.parentId === companyId).map(c => c.id)];
  const companyDiscrepancies = discrepancies.filter(d => relatedIds.includes(d.entityId));

  const [editingItem, setEditingItem] = useState<DiscrepancyItem | null>(null);
  const [editForm, setEditForm] = useState({ enabled: true, remarks: '', discrepancyType: '', discrepancyText: '', discrepancyStatus: 'Open' as DiscrepancyStatus });
  const [pendingToggle, setPendingToggle] = useState<{ id: string; newValue: boolean } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ discrepancyType: '', discrepancyText: '' });

  const openEdit = (item: DiscrepancyItem) => {
    setEditForm({
      enabled: item.enabled,
      remarks: item.remarks,
      discrepancyType: item.discrepancyType,
      discrepancyText: item.discrepancyText,
      discrepancyStatus: item.discrepancyStatus,
    });
    setEditingItem(item);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    updateDiscrepancy(editingItem.id, editForm);
    setEditingItem(null);
    toast.success('Discrepancy updated');
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    updateDiscrepancy(pendingToggle.id, { enabled: pendingToggle.newValue });
    toast.success(`Discrepancy ${pendingToggle.newValue ? 'enabled' : 'disabled'}`);
    setPendingToggle(null);
  };

  const handleAddManual = () => {
    if (!addForm.discrepancyType.trim() || !addForm.discrepancyText.trim()) {
      toast.error('Discrepancy type and text are required');
      return;
    }
    addManualDiscrepancy(
      companyId,
      companyId,
      company?.name ?? companyId,
      addForm.discrepancyType.trim(),
      addForm.discrepancyText.trim(),
    );
    toast.success('Manual discrepancy added');
    setAddForm({ discrepancyType: '', discrepancyText: '' });
    setShowAddDialog(false);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {companyDiscrepancies.length} discrepanc{companyDiscrepancies.length === 1 ? 'y' : 'ies'} found
        </p>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Add Manual
        </button>
      </div>

      {companyDiscrepancies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No discrepancies found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companyDiscrepancies.map(item => {
            const isManual = item.discrepancyCategory === 'manual';
            const v = isManual ? null : calculateVariance(item.sourceValue, item.extractedValue);
            return (
              <div key={item.id} className={`bg-card border rounded-lg p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all ${item.enabled ? 'border-destructive/30' : 'border-border opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${item.enabled ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold text-foreground">{item.fieldName}</span>
                    {v && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.enabled ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {(v.percent * 100).toFixed(2)}%
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <Building2 className="h-3 w-3" />
                      {item.entityName}
                    </span>
                    <Badge variant="outline" className={statusColor[item.discrepancyStatus]}>
                      {item.discrepancyStatus}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.discrepancyCategory}
                    </Badge>
                  </div>
                  {item.discrepancyText && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">{item.discrepancyText}</p>
                  )}
                  {!isManual && (
                    <div className="text-xs text-muted-foreground space-x-4">
                      <span>Source: {formatCurrency(item.sourceValue)}</span>
                      <span>Extracted: {formatCurrency(item.extractedValue)}</span>
                      {v && <span>Diff: {formatCurrency(v.diff)}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase">{item.enabled ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) => setPendingToggle({ id: item.id, newValue: checked })}
                    />
                  </div>
                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle confirmation */}
      <AlertDialog open={!!pendingToggle} onOpenChange={(open) => { if (!open) setPendingToggle(null); }}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirm Change</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to {pendingToggle?.newValue ? 'enable' : 'disable'} this discrepancy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted">No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} className="bg-primary text-primary-foreground hover:bg-primary/90">Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="bg-card rounded-lg p-6 w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Edit Discrepancy</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 mt-2">
              <div className="text-sm text-foreground font-medium">{editingItem.fieldName} — {editingItem.entityName}</div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
                <Input
                  value={editForm.discrepancyType}
                  onChange={e => setEditForm(prev => ({ ...prev, discrepancyType: e.target.value }))}
                  placeholder="e.g. COGS, EBITDA"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Discrepancy Text</Label>
                <textarea
                  value={editForm.discrepancyText}
                  onChange={e => setEditForm(prev => ({ ...prev, discrepancyText: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe the discrepancy..."
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={editForm.discrepancyStatus} onValueChange={(v) => setEditForm(prev => ({ ...prev, discrepancyStatus: v as DiscrepancyStatus }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Enable for clarification</Label>
                <Switch
                  checked={editForm.enabled}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Remarks</Label>
                <textarea
                  value={editForm.remarks}
                  onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add remarks..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-lg font-medium text-sm border border-border bg-card text-foreground hover:bg-muted transition-all">Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Discrepancy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card rounded-lg p-6 w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Add Manual Discrepancy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Discrepancy Type <span className="text-destructive">*</span></Label>
              <Input
                value={addForm.discrepancyType}
                onChange={e => setAddForm(prev => ({ ...prev, discrepancyType: e.target.value }))}
                placeholder="e.g. COGS, EBITDA, Revenue"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Discrepancy Text <span className="text-destructive">*</span></Label>
              <textarea
                value={addForm.discrepancyText}
                onChange={e => setAddForm(prev => ({ ...prev, discrepancyText: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe the discrepancy..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 rounded-lg font-medium text-sm border border-border bg-card text-foreground hover:bg-muted transition-all">Cancel</button>
            <button onClick={handleAddManual} className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">Add Discrepancy</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
