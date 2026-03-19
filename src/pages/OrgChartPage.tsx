import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import { Company, taggedFiles } from '@/data/mockData';
import { Paperclip, CheckCircle2, Building2, Search, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

function FilePickerPopover({ companyId, companyName, onClose }: { companyId: string; companyName: string; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = taggedFiles.filter(f =>
    f.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAttach = (fileName: string) => {
    toast.success(`"${fileName}" attached to ${companyName}`);
    onClose();
  };

  return (
    <div ref={ref} className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg p-2">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="border-t border-border pt-1 max-h-48 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No files found</p>
        ) : (
          filtered.map(f => (
            <button
              key={f.id}
              onClick={() => handleAttach(f.fileName)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left hover:bg-accent transition-quart"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{f.fileName}</p>
                <p className="text-[10px] text-muted-foreground">{f.size} · {f.status}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
};

function OrgNodeCard({ company }: { company: Company }) {
  const { attachReport } = useAppState();
  const [showFilePicker, setShowFilePicker] = useState(false);

  const handleAttach = (e: React.MouseEvent) => {
    e.stopPropagation();
    attachReport(company.id);
    toast.success(`Audit report attached to ${company.name}`);
  };

  const handleAttachFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilePicker(prev => !prev);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="bg-card border border-border rounded-lg shadow-sm px-4 py-3 min-w-[200px] max-w-[240px] hover:shadow-md transition-quart group">
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">{company.name}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${statusColor[company.status]}`}>
            {company.status}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{company.auditPeriod}</div>
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handleAttachFile}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary press-effect px-2 py-1 rounded-sm border border-border opacity-0 group-hover:opacity-100 transition-quart"
          >
            <FileText className="h-3 w-3" /> Attach File
          </button>
          {company.hasAuditReport ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Report
            </span>
          ) : (
            <button
              onClick={handleAttach}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary press-effect px-2 py-1 rounded-sm border border-border opacity-0 group-hover:opacity-100 transition-quart"
            >
              <Paperclip className="h-3 w-3" /> Report
            </button>
          )}
        </div>
      </div>
      {showFilePicker && (
        <FilePickerPopover
          companyId={company.id}
          companyName={company.name}
          onClose={() => setShowFilePicker(false)}
        />
      )}
    </div>
  );
}

function TreeNode({ company, companies }: { company: Company; companies: Company[] }) {
  const children = companies.filter(c => c.parentId === company.id);

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard company={company} />
      {children.length > 0 && (
        <>
          <div className="w-0.5 h-6 bg-foreground/40" />
          {children.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div
                className="h-0.5 bg-foreground/40"
                style={{
                  width: `calc(100% - ${100 / children.length}%)`,
                }}
              />
            </div>
          )}
          <div className="flex gap-8">
            {children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-foreground/40" />
                <TreeNode company={child} companies={companies} />
              </div>
            ))}
          </div>
        </>
      )}
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
        <div className="inline-flex flex-col gap-10 items-center min-w-full">
          {roots.map(root => (
            <TreeNode key={root.id} company={root} companies={companies} />
          ))}
        </div>
      </div>
    </div>
  );
}
