import React, { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Company } from '@/data/mockData';
import { ChevronRight, ChevronDown, Paperclip, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function OrgNode({ company, children: childCompanies, level = 0 }: { company: Company; children: Company[]; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const { attachReport } = useAppState();
  const hasChildren = childCompanies.length > 0;

  const handleAttach = (e: React.MouseEvent) => {
    e.stopPropagation();
    attachReport(company.id);
    toast.success(`Audit report attached to ${company.name}`);
  };

  const statusColor = {
    'Pending Review': 'bg-warning/20 text-warning',
    'Discrepancy Identified': 'bg-destructive/20 text-destructive',
    'Clarification Requested': 'bg-primary/20 text-primary',
    'Resolved': 'bg-success/20 text-success',
  }[company.status];

  return (
    <div className={level > 0 ? 'ml-6 border-l border-border' : ''}>
      <div
        className="flex items-center gap-2 px-3 py-2.5 hover:bg-surface transition-quart cursor-pointer group"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="w-4 shrink-0">
          {hasChildren && (expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{company.name}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm ${statusColor}`}>
              {company.status}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{company.auditPeriod}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-quart">
          {company.hasAuditReport ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Attached
            </span>
          ) : (
            <button
              onClick={handleAttach}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary press-effect px-2 py-1 rounded-sm border border-border"
            >
              <Paperclip className="h-3 w-3" /> Attach Report
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <OrgTree parentId={company.id} level={level + 1} />
      )}
    </div>
  );
}

function OrgTree({ parentId, level = 0 }: { parentId: string | null; level?: number }) {
  const { companies } = useAppState();
  const children = companies.filter(c => c.parentId === parentId);

  return (
    <>
      {children.map(company => {
        const grandchildren = companies.filter(c => c.parentId === company.id);
        return <OrgNode key={company.id} company={company} children={grandchildren} level={level} />;
      })}
    </>
  );
}

export default function OrgChartPage() {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Entity Structure</h1>
        <p className="text-xs text-muted-foreground">Portfolio companies and subsidiaries</p>
      </div>
      <div className="border border-border rounded-lg bg-surface overflow-hidden">
        <OrgTree parentId={null} />
      </div>
    </div>
  );
}
