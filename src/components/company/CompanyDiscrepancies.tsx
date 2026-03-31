import { useState } from 'react';
import { useAppState } from '@/context/AppContext';

import type { DiscrepancyItem, DiscrepancyStatus } from '@/data/mockData';
import { AlertTriangle, Pencil, Plus, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const STATUS_OPTIONS: DiscrepancyStatus[] = ['Open', 'Under Review', 'Resolved', 'Dismissed'];

const statusBadge: Record<DiscrepancyStatus, string> = {
  'Open': 'bg-red-100 text-red-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Resolved': 'bg-green-100 text-green-800',
  'Dismissed': 'bg-gray-100 text-gray-500',
};

const enabledBadge = (enabled: boolean) =>
  enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500';

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

  const handleDownloadExcel = () => {
    const header = ['Query', 'Type', 'Entity', 'Enabled', 'Status', 'Source', 'Extracted'];
    const rows = companyDiscrepancies.map(item => {
      const isManual = item.discrepancyCategory === 'manual';
      return [
        item.discrepancyText || item.fieldName,
        item.discrepancyType,
        item.entityName,
        item.enabled ? 'Yes' : 'No',
        item.discrepancyStatus,
        isManual ? '' : String(item.sourceValue),
        isManual ? '' : String(item.extractedValue),
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `discrepancies-${companyId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">
          {companyDiscrepancies.length} discrepanc{companyDiscrepancies.length === 1 ? 'y' : 'ies'} found
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Download className="h-4 w-4" /> Download Excel
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Investor Query
          </button>
        </div>
      </div>

      {companyDiscrepancies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 bg-white rounded-lg border border-gray-200">
          <AlertTriangle className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No discrepancies found</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Query</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">To Be Sent?</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companyDiscrepancies.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {/* Query */}
                  <td className="px-4 py-4 text-sm text-gray-900 leading-relaxed">
                    {item.discrepancyText || `Variance detected in ${item.fieldName}`}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {item.discrepancyType}
                  </td>

                  {/* Entity */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {item.entityName}
                  </td>

                  {/* To Be Sent (Enable/Disable) */}
                  <td className="px-4 py-4">
                    <select
                      value={item.enabled ? 'Yes' : 'No'}
                      onChange={e => {
                        const newValue = e.target.value === 'Yes';
                        if (newValue !== item.enabled) {
                          setPendingToggle({ id: item.id, newValue });
                        }
                      }}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${enabledBadge(item.enabled)}`}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <select
                      value={item.discrepancyStatus}
                      onChange={e => {
                        const newStatus = e.target.value as DiscrepancyStatus;
                        updateDiscrepancy(item.id, { discrepancyStatus: newStatus });
                        toast.success(`Status updated to "${newStatus}"`);
                      }}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusBadge[item.discrepancyStatus]}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </td>

                  {/* Edit */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              <div className="text-sm text-gray-900 font-medium">{editingItem.fieldName} — {editingItem.entityName}</div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-500">Type</Label>
                <Input
                  value={editForm.discrepancyType}
                  onChange={e => setEditForm(prev => ({ ...prev, discrepancyType: e.target.value }))}
                  placeholder="e.g. COGS, EBITDA"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-500">Query Text</Label>
                <textarea
                  value={editForm.discrepancyText}
                  onChange={e => setEditForm(prev => ({ ...prev, discrepancyText: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the discrepancy..."
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-500">Status</Label>
                <Select value={editForm.discrepancyStatus} onValueChange={(v) => setEditForm(prev => ({ ...prev, discrepancyStatus: v as DiscrepancyStatus }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-500">Remarks</Label>
                <textarea
                  value={editForm.remarks}
                  onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add remarks..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Discrepancy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white rounded-lg p-6 w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add Investor Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-gray-500">Type <span className="text-red-500">*</span></Label>
              <Input
                value={addForm.discrepancyType}
                onChange={e => setAddForm(prev => ({ ...prev, discrepancyType: e.target.value }))}
                placeholder="e.g. COGS, EBITDA, Revenue"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-gray-500">Query Text <span className="text-red-500">*</span></Label>
              <textarea
                value={addForm.discrepancyText}
                onChange={e => setAddForm(prev => ({ ...prev, discrepancyText: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the discrepancy..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
            <button onClick={handleAddManual} className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all">Add Query</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
