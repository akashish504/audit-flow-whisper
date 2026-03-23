import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { AuditPeriod, AuditStatus } from '@/data/mockData';
import { Plus, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Discrepancy Identified': 'bg-red-100 text-red-800',
  'Clarification Requested': 'bg-blue-100 text-blue-800',
  'Resolved': 'bg-green-100 text-green-800',
};

export function CompanyAuditPeriods({ companyId }: { companyId: string }) {
  const { companies, addAuditPeriod, setActiveAuditPeriod } = useAppState();
  const company = companies.find(c => c.id === companyId);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStatus, setNewStatus] = useState<AuditStatus>('Pending Review');
  const [makeActive, setMakeActive] = useState(true);

  if (!company) return null;

  const handleCreate = () => {
    const label = newLabel.trim();
    if (!label) { toast.error('Period label is required'); return; }
    if (company.auditPeriods.some(p => p.label === label)) { toast.error('This period already exists'); return; }
    const period: AuditPeriod = {
      id: `ap-${companyId}-${Date.now()}`,
      label,
      status: newStatus,
      isActive: makeActive,
      createdAt: new Date().toISOString(),
    };
    addAuditPeriod(companyId, period);
    setNewLabel('');
    setShowForm(false);
    toast.success(`Audit period "${label}" created${makeActive ? ' and set as active' : ''}`);
  };

  const handleSetActive = (periodId: string) => {
    setActiveAuditPeriod(companyId, periodId);
    const period = company.auditPeriods.find(p => p.id === periodId);
    toast.success(`"${period?.label}" is now the active audit period`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Review Periods</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage audit and review cycles for this company.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-3.5 w-3.5" /> New Period
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Period Label</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Q1 2025"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Initial Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as AuditStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="Discrepancy Identified">Discrepancy Identified</option>
                <option value="Clarification Requested">Clarification Requested</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={makeActive} onChange={e => setMakeActive(e.target.checked)} className="rounded border-gray-300" />
                Set as active
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg font-medium text-xs bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Create Period
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg font-medium text-xs border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {company.auditPeriods.map(period => (
          <div
            key={period.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              period.isActive
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {period.isActive ? (
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{period.label}</span>
                  {period.isActive && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[period.status] || 'bg-gray-100 text-gray-800'}`}>
                    {period.status}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(period.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            {!period.isActive && (
              <button
                onClick={() => handleSetActive(period.id)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Set Active
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
