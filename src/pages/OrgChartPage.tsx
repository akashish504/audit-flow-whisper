import React, { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Company } from '@/data/mockData';
import { Paperclip, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

function OrgNodeCard({ company }: { company: Company }) {
  const { attachReport } = useAppState();

  const handleAttach = (e: React.MouseEvent) => {
    e.stopPropagation();
    attachReport(company.id);
    toast.success(`Audit report attached to ${company.name}`);
  };

  const statusColor = {
    'Pending Review': 'bg-warning/20 text-warning border-warning/30',
    'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
    'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
    'Resolved': 'bg-success/20 text-success border-success/30',
  }[company.status];

  return (
    <div className="relative flex flex-col items-center">
      <div className="bg-card border border-border rounded-lg shadow-sm px-4 py-3 min-w-[200px] max-w-[240px] hover:shadow-md transition-quart group">
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">{company.name}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${statusColor}`}>
            {company.status}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{company.auditPeriod}</div>
        <div className="flex items-center justify-end">
          {company.hasAuditReport ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Attached
            </span>
          ) : (
            <button
              onClick={handleAttach}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary press-effect px-2 py-1 rounded-sm border border-border opacity-0 group-hover:opacity-100 transition-quart"
            >
              <Paperclip className="h-3 w-3" /> Attach
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeBranch({ parentId, companies }: { parentId: string; companies: Company[] }) {
  const children = companies.filter(c => c.parentId === parentId);
  if (children.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      {/* Vertical line down from parent */}
      <div className="w-px h-6 bg-muted-foreground/40" />

      {/* Horizontal connector bar */}
      {children.length > 1 && (
        <div className="relative flex items-start">
          <div
            className="absolute top-0 bg-border"
            style={{
              height: '1px',
              left: `calc(100% / ${children.length * 2})`,
              right: `calc(100% / ${children.length * 2})`,
            }}
          />
        </div>
      )}

      {/* Children row */}
      <div className="flex items-start gap-4">
        {children.map((child, i) => (
          <div key={child.id} className="flex flex-col items-center">
            {/* Vertical line down to child if multiple siblings */}
            {children.length > 1 && <div className="w-px h-4 bg-border" />}
            <OrgNodeCard company={child} />
            <TreeBranch parentId={child.id} companies={companies} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  const { companies } = useAppState();
  const roots = companies.filter(c => c.parentId === null);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Entity Structure</h1>
        <p className="text-xs text-muted-foreground">Portfolio companies and subsidiaries</p>
      </div>

      <div className="overflow-auto pb-12">
        <div className="inline-flex flex-col items-center min-w-full">
          {roots.map(root => (
            <div key={root.id} className="flex flex-col items-center">
              <OrgNodeCard company={root} />
              <TreeBranch parentId={root.id} companies={companies} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
