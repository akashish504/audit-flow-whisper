import { useAppState } from '@/context/AppContext';
import { AuditStatus } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

const statusConfig: Record<AuditStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'Pending Review': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  'Discrepancy Identified': { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  'Clarification Requested': { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  'Resolved': { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
};

const statusOrder: AuditStatus[] = ['Pending Review', 'Discrepancy Identified', 'Clarification Requested', 'Resolved'];

export default function AuditPipelinePage() {
  const { companies, setSelectedCompanyId } = useAppState();
  const navigate = useNavigate();
  const entities = companies.filter(c => c.parentId !== null);

  const handleClick = (companyId: string) => {
    setSelectedCompanyId(companyId);
    navigate('/workspace');
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Audit Pipeline</h1>
        <p className="text-xs text-muted-foreground">Entity reconciliation status tracker</p>
      </div>

      <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
        {statusOrder.map(status => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const items = entities.filter(c => c.status === status);

          return (
            <div key={status} className="bg-surface flex flex-col">
              <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                <span className="data-header">{status}</span>
                <span className={`ml-auto text-xs font-mono font-semibold ${config.color}`}>{items.length}</span>
              </div>

              <div className="flex-1 p-2 space-y-1 min-h-[200px]">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No entities</p>
                ) : (
                  items.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleClick(company.id)}
                      className="w-full text-left px-3 py-2.5 rounded-sm border border-border hover:bg-accent transition-quart press-effect"
                    >
                      <div className="text-sm font-medium text-foreground truncate">{company.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{company.auditPeriod}</div>
                      {company.hasAuditReport && (
                        <div className="text-[10px] text-success mt-1">Report attached</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
