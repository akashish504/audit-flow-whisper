import { auditLogs } from '@/data/mockData';
import { Clock, FileText } from 'lucide-react';

export function CompanyAuditLogs({ companyId }: { companyId: string }) {
  const logs = auditLogs.filter(l => l.companyId === companyId);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No audit log entries for this entity</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-card">
        {logs.map((log, i) => (
          <div key={log.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground">{log.action}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{log.details}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">by {log.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
