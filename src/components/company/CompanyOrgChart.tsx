import { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { Company, taggedFiles, AuditStatus } from '@/data/mockData';
import { Building2, CheckCircle2, Paperclip, Search, FileText, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Discrepancy Identified': 'bg-red-100 text-red-800',
  'Clarification Requested': 'bg-blue-100 text-blue-800',
  'Resolved': 'bg-green-100 text-green-800',
};

const allStatuses: AuditStatus[] = ['Pending Review', 'Discrepancy Identified', 'Clarification Requested', 'Resolved'];

function FilePickerPopover({ companyId, companyName, onClose }: { companyId: string; companyName: string; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const ref = { current: null as HTMLDivElement | null };

  const filtered = taggedFiles.filter(f =>
    f.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAttach = (fileId: string, fileName: string) => {
    toast.success(`"${fileName}" attached to ${companyName}`);
    onClose();
  };

  return (
    <div ref={el => { ref.current = el; }} className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full text-xs bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="border-t border-gray-100 pt-1 max-h-48 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">No files found</p>
        ) : (
          filtered.map(f => (
            <button
              key={f.id}
              onClick={() => handleAttach(f.id, f.fileName)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-50 transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-900 truncate">{f.fileName}</p>
                <p className="text-[10px] text-gray-400">{f.size} · {f.status}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function OrgNodeCard({ company, isHighlighted }: { company: Company; isHighlighted?: boolean }) {
  const { attachReport, updateEntityStatus } = useAppState();
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AuditStatus | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  const handleAttachReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    attachReport(company.id);
    toast.success(`Audit report attached to ${company.name}`);
  };

  const handleAttachFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilePicker(prev => !prev);
  };

  const confirmEntityStatusChange = () => {
    if (!pendingStatus) return;
    updateEntityStatus(company.id, pendingStatus);
    toast.success(`Entity status updated to "${pendingStatus}"`);
    setPendingStatus(null);
    setShowStatusMenu(false);
  };

  return (
    <div className={`relative bg-white border rounded-lg shadow-sm px-4 py-3 min-w-[200px] max-w-[240px] hover:shadow-md transition-all group ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 truncate">{company.name}</span>
      </div>
      {/* Entity-level status dropdown */}
      <div className="relative mb-2" ref={statusMenuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusBadge[company.entityStatus || company.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {company.entityStatus || company.status}
          <ChevronDown className="h-3 w-3" />
        </button>
        {showStatusMenu && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
            {allStatuses.map(s => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); setPendingStatus(s); setShowStatusMenu(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${s === (company.entityStatus || company.status) ? 'font-semibold' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${s === 'Pending Review' ? 'bg-yellow-400' : s === 'Discrepancy Identified' ? 'bg-red-400' : s === 'Clarification Requested' ? 'bg-blue-400' : 'bg-green-400'}`} />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-2">{company.auditPeriod}</div>
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={handleAttachFile}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
        >
          <FileText className="h-3 w-3" /> Attach File
        </button>
        {company.hasAuditReport ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Report
          </span>
        ) : (
          <button
            onClick={handleAttachReport}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
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

      {/* Confirmation dialog */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Change <span className="font-medium text-gray-700">{company.name}</span> status from <span className="font-medium text-gray-700">{company.entityStatus || company.status}</span> to <span className="font-medium text-gray-700">{pendingStatus}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEntityStatusChange} className="bg-blue-500 text-white hover:bg-blue-600">Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TreeNode({ company, companies, highlightedEntityId }: { company: Company; companies: Company[]; highlightedEntityId?: string }) {
  const children = companies.filter(c => c.parentId === company.id);

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard company={company} isHighlighted={highlightedEntityId === company.id} />
      {children.length > 0 && (
        <>
          {/* Vertical line from parent down */}
          <div className="w-0.5 h-6 bg-border" />
          <div className="flex gap-8">
            {children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical line from horizontal bar to child */}
                <div className="w-0.5 h-6 bg-border" />
                {/* Horizontal connector: spans from center to left/right edge */}
                {children.length > 1 && (
                  <div
                    className="absolute top-0 h-0.5 bg-border"
                    style={{
                      left: idx === 0 ? '50%' : 0,
                      right: idx === children.length - 1 ? '50%' : 0,
                    }}
                  />
                )}
                <TreeNode company={child} companies={companies} highlightedEntityId={highlightedEntityId} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CompanyOrgChart({ companyId, selectedEntityId }: { companyId: string; selectedEntityId?: string }) {
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
      <div className="inline-flex justify-center min-w-full">
        <TreeNode company={root} companies={companies} highlightedEntityId={selectedEntityId} />
      </div>
    </div>
  );
}
