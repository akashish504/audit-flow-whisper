import { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import { Company, taggedFiles } from '@/data/mockData';
import { Building2, CheckCircle2, Paperclip, Search, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
};

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

  const handleAttach = (fileId: string, fileName: string) => {
    toast.success(`"${fileName}" attached to ${companyName}`);
    onClose();
  };

  return (
    <div ref={ref} className="absolute top-full left-0 z-50 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg p-2">
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
              onClick={() => handleAttach(f.id, f.fileName)}
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

function OrgNodeCard({ company }: { company: Company }) {
  const { attachReport } = useAppState();
  const [showFilePicker, setShowFilePicker] = useState(false);

  const handleAttachReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    attachReport(company.id);
    toast.success(`Audit report attached to ${company.name}`);
  };

  const handleAttachFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilePicker(prev => !prev);
  };

  return (
    <div className="relative bg-card border border-border rounded-lg shadow-sm px-4 py-3 min-w-[200px] max-w-[240px] hover:shadow-md transition-quart group">
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
            onClick={handleAttachReport}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary press-effect px-2 py-1 rounded-sm border border-border opacity-0 group-hover:opacity-100 transition-quart"
          >
            <Paperclip className="h-3 w-3" /> Report
          </button>
        )}
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

function TreeBranch({ parentId, companies }: { parentId: string; companies: Company[] }) {
  const children = companies.filter(c => c.parentId === parentId);
  if (children.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-6 bg-muted-foreground/40" />
      <div className="flex items-start gap-4">
        {children.map((child) => (
          <div key={child.id} className="flex flex-col items-center">
            {children.length > 1 && <div className="w-px h-4 bg-muted-foreground/40" />}
            <OrgNodeCard company={child} />
            <TreeBranch parentId={child.id} companies={companies} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyOrgChart({ companyId }: { companyId: string }) {
  const { companies } = useAppState();
  const company = companies.find(c => c.id === companyId);
  if (!company) return null;

  let root = company;
  while (root.parentId) {
    const parent = companies.find(c => c.id === root.parentId);
    if (!parent) break;
    root = parent;
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="inline-flex flex-col items-center min-w-full">
        <OrgNodeCard company={root} />
        <TreeBranch parentId={root.id} companies={companies} />
      </div>
    </div>
  );
}
