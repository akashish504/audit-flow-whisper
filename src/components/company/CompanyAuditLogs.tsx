import { auditLogs } from '@/data/mockData';
import { Clock, FileText } from 'lucide-react';

export function CompanyAuditLogs({ companyId }: { companyId: string }) {
  const logs = auditLogs.filter(l => l.companyId === companyId);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <FileText className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">No audit log entries for this entity</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-900">{log.action}</span>
                <span className="text-[10px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">{log.details}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">by {log.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
