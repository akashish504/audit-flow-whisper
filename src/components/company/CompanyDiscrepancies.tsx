import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculateVariance, formatCurrency } from '@/data/mockData';
import type { DiscrepancyItem } from '@/data/mockData';
import { AlertTriangle, Pencil, Building2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function CompanyDiscrepancies({ companyId }: { companyId: string }) {
  const { companies, discrepancies, updateDiscrepancy } = useAppState();
  const company = companies.find(c => c.id === companyId);

  const relatedIds = [companyId, ...companies.filter(c => c.parentId === companyId).map(c => c.id)];
  const companyDiscrepancies = discrepancies.filter(d => relatedIds.includes(d.entityId));

  const [editingItem, setEditingItem] = useState<DiscrepancyItem | null>(null);
  const [editForm, setEditForm] = useState({ enabled: true, remarks: '' });
  const [pendingToggle, setPendingToggle] = useState<{ id: string; newValue: boolean } | null>(null);

  const openEdit = (item: DiscrepancyItem) => {
    setEditForm({
      enabled: item.enabled,
      remarks: item.remarks,
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

  if (companyDiscrepancies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <AlertTriangle className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">No discrepancies found at current threshold</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <p className="text-xs text-gray-500">{companyDiscrepancies.length} discrepanc{companyDiscrepancies.length === 1 ? 'y' : 'ies'} exceeding 0.5% threshold</p>
      </div>

      <div className="space-y-3">
        {companyDiscrepancies.map(item => {
          const v = calculateVariance(item.sourceValue, item.extractedValue);
          return (
            <div key={item.id} className={`bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all ${item.enabled ? 'border-red-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${item.enabled ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold text-gray-900">{item.fieldName}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.enabled ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {(v.percent * 100).toFixed(2)}%
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <Building2 className="h-3 w-3" />
                    {item.entityName}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-x-4">
                  <span>Source: {formatCurrency(item.sourceValue)}</span>
                  <span>Extracted: {formatCurrency(item.extractedValue)}</span>
                  <span>Diff: {formatCurrency(v.diff)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase">{item.enabled ? 'Enabled' : 'Disabled'}</span>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(checked) => setPendingToggle({ id: item.id, newValue: checked })}
                  />
                </div>
                <button
                  onClick={() => openEdit(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle confirmation */}
      <AlertDialog open={!!pendingToggle} onOpenChange={(open) => { if (!open) setPendingToggle(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Confirm Change</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to {pendingToggle?.newValue ? 'enable' : 'disable'} this discrepancy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} className="bg-blue-500 text-white hover:bg-blue-600">Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="bg-white rounded-lg p-6 w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Edit Discrepancy</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 mt-2">
              <div className="text-sm text-gray-700 font-medium">{editingItem.fieldName} — {editingItem.entityName}</div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Enable for clarification</label>
                <Switch
                  checked={editForm.enabled}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Remarks</label>
                <textarea
                  value={editForm.remarks}
                  onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Add remarks..."
                />
              </div>

            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
