import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { AuditPeriod, AuditStatus } from '@/data/mockData';
import { Plus, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
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
    if (!label) {
      toast.error('Period label is required');
      return;
    }
    if (company.auditPeriods.some(p => p.label === label)) {
      toast.error('This period already exists');
      return;
    }
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
          <h2 className="text-sm font-semibold text-foreground">Review Periods</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage audit and review cycles for this company. Only one can be active at a time.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Period
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Period Label</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Q1 2025"
                className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Initial Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as AuditStatus)}
                className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="Discrepancy Identified">Discrepancy Identified</option>
                <option value="Clarification Requested">Clarification Requested</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={makeActive}
                  onChange={e => setMakeActive(e.target.checked)}
                  className="rounded border-border"
                />
                Set as active
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Period
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="h-8 px-3 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {company.auditPeriods.map(period => (
          <div
            key={period.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
              period.isActive
                ? 'bg-primary/5 border-primary/30'
                : 'bg-card border-border hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {period.isActive ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{period.label}</span>
                  {period.isActive && (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${statusColor[period.status]}`}>
                    {period.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(period.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            {!period.isActive && (
              <button
                onClick={() => handleSetActive(period.id)}
                className="h-7 px-2.5 text-[11px] font-medium text-muted-foreground border border-border rounded-md hover:bg-accent hover:text-foreground transition-colors"
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
