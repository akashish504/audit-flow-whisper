import React, { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CycleAdjustmentsTab: React.FC = () => {
  const { rcCycles, rcEntries, rcLogs, addReviewCycle } = useAppState();

  const [newCY, setNewCY] = useState('');
  const [newFY, setNewFY] = useState('');
  const [cycleConfirmDialog, setCycleConfirmDialog] = useState(false);
  const [cycleCheckbox, setCycleCheckbox] = useState(false);

  const getCycleLabel = (id: string) => rcCycles.find(c => c.id === id)?.label ?? id;

  const handleAddCycleClick = () => {
    if (!newCY || !newFY) { toast.error('Please fill in both CY and FY values'); return; }
    const label = `CY ${newCY} - FY ${newFY}`;
    if (rcCycles.some(c => c.label === label)) { toast.error('This review cycle already exists'); return; }
    setCycleCheckbox(false);
    setCycleConfirmDialog(true);
  };

  const handleConfirmAddCycle = () => {
    const label = `CY ${newCY} - FY ${newFY}`;
    addReviewCycle(label);
    setNewCY('');
    setNewFY('');
    setCycleConfirmDialog(false);
    setCycleCheckbox(false);
    toast.success(`Review cycle ${label} created`);
  };

  return (
    <div>
      {/* Add new cycle */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add New Review Cycle</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-medium">CY</span>
          <input
            type="text"
            value={newCY}
            onChange={e => setNewCY(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="24"
            maxLength={2}
            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-400">—</span>
          <span className="text-sm text-gray-700 font-medium">FY</span>
          <input
            type="text"
            value={newFY}
            onChange={e => setNewFY(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="25"
            maxLength={2}
            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddCycleClick}
            className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-1.5 ml-2"
          >
            <Plus className="h-4 w-4" /> Add Cycle
          </button>
        </div>
      </div>

      {/* List of cycles */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Existing Review Cycles</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle Label</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rcCycles.map(cycle => (
              <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{cycle.label}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {rcEntries.filter(e => e.reviewCycleId === cycle.id).length}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(cycle.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rcCycles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No review cycles yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Cycle Logs</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Review Cycle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rcLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{log.details}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{log.reviewCycleId ? getCycleLabel(log.reviewCycleId) : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{log.user}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {rcLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No logs yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Cycle Confirmation Dialog */}
      {cycleConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCycleConfirmDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900">Confirm New Review Cycle</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              You are about to create review cycle <span className="font-medium text-gray-900">CY {newCY} - FY {newFY}</span>. This action will add a new review period to the system.
            </p>
            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={cycleCheckbox}
                onChange={e => setCycleCheckbox(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I am fully aware that this action will create a new review period in the system and cannot be undone.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCycleConfirmDialog(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmAddCycle}
                disabled={!cycleCheckbox}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  cycleCheckbox
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleAdjustmentsTab;
