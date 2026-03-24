import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X, ChevronDown, FileText, Eye, Archive, ArchiveRestore } from 'lucide-react';
import { AuditStatus, entityFiles } from '@/data/mockData';
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Discrepancy Identified': 'bg-red-100 text-red-800',
  'Clarification Requested': 'bg-blue-100 text-blue-800',
  'Resolved': 'bg-green-100 text-green-800',
};

const statusDot: Record<string, string> = {
  'Pending Review': 'bg-yellow-400',
  'Discrepancy Identified': 'bg-red-400',
  'Clarification Requested': 'bg-blue-400',
  'Resolved': 'bg-green-400',
};

const allStatuses: AuditStatus[] = ['Pending Review', 'Discrepancy Identified', 'Clarification Requested', 'Resolved'];

function StatusStats({ entities }: { entities: { status: AuditStatus }[] }) {
  const counts = allStatuses.map(s => ({
    status: s,
    count: entities.filter(c => c.status === s).length,
  }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {counts.map(({ status, count }) => (
        <div key={status} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-24">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ring-1 ring-gray-200 ${statusDot[status] || 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500 uppercase leading-tight">{status}</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{count}</div>
        </div>
      ))}
    </div>
  );
}

function StatusDropdown({ company, onStatusChange }: { company: { id: string; name: string; status: AuditStatus }; onStatusChange: (id: string, name: string, currentStatus: AuditStatus, newStatus: AuditStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusBadge[company.status] || 'bg-gray-100 text-gray-800'}`}
      >
        {company.status}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => { onStatusChange(company.id, company.name, company.status, s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${s === company.status ? 'font-semibold' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusDot[s] || 'bg-gray-400'}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FileListPopover({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const files = entityFiles.filter(f => f.companyId === companyId || f.entityId === companyId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full right-0 mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-semibold text-gray-900">Attached Files</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="border-t border-gray-100 pt-1 max-h-48 overflow-auto">
        {files.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">No files attached</p>
        ) : (
          files.map(f => (
            <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-all">
              <FileText className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-900 truncate">{f.fileName}</p>
                <p className="text-[10px] text-gray-400">{f.entityName} · {f.reviewPeriod}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PortfolioCompaniesPage() {
  const { companies, archiveCompany, unarchiveCompany, updateCompanyStatus, rcCycles, rcEntries } = useAppState();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const [showArchived, setShowArchived] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: string; name: string; from: AuditStatus; to: AuditStatus } | null>(null);
  const [fileListOpen, setFileListOpen] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState(rcCycles.length > 0 ? rcCycles[0].id : '');

  const selectedCycleLabel = rcCycles.find(c => c.id === selectedCycleId)?.label || '';

  // Get company names in the selected review cycle
  const companyNamesInCycle = useMemo(() => {
    if (!selectedCycleId) return new Set<string>();
    return new Set(rcEntries.filter(e => e.reviewCycleId === selectedCycleId).map(e => e.companyName.toLowerCase()));
  }, [selectedCycleId, rcEntries]);

  const entities = companies.filter(c => c.parentId !== null);
  const activeEntities = entities.filter(c => !c.isArchived);
  const archivedEntities = entities.filter(c => c.isArchived);

  // Filter entities by selected review cycle (match by parent company name or own name)
  const cycleFilteredEntities = useMemo(() => {
    const displayEntities = showArchived ? archivedEntities : activeEntities;
    if (!selectedCycleId) return displayEntities;
    return displayEntities.filter(entity => {
      // Check if entity name or its parent company name is in the cycle
      if (companyNamesInCycle.has(entity.name.toLowerCase())) return true;
      const parent = companies.find(c => c.id === entity.parentId);
      if (parent && companyNamesInCycle.has(parent.name.toLowerCase())) return true;
      return false;
    });
  }, [showArchived, activeEntities, archivedEntities, selectedCycleId, companyNamesInCycle, companies]);

  const filtered = useMemo(() => {
    return cycleFilteredEntities.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [cycleFilteredEntities, search, statusFilter]);

  const hasFilters = search || statusFilter;

  const handleStatusChange = (id: string, name: string, currentStatus: AuditStatus, newStatus: AuditStatus) => {
    setPendingStatus({ id, name, from: currentStatus, to: newStatus });
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    updateCompanyStatus(pendingStatus.id, pendingStatus.to);
    toast.success(`${pendingStatus.name} status updated to "${pendingStatus.to}"`);
    setPendingStatus(null);
  };

  const handleArchive = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    archiveCompany(companyId);
    toast.success(`${name} archived`);
  };

  const handleUnarchive = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    unarchiveCompany(companyId);
    toast.success(`${name} restored`);
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">In Review Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} of {cycleFilteredEntities.length} entities</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 ${showArchived ? 'bg-gray-100' : ''}`}
          >
            <Archive className="h-4 w-4" /> {showArchived ? `Archived (${archivedEntities.length})` : 'View Archived'}
          </button>
        </div>
      </div>

      {!showArchived && <StatusStats entities={cycleFilteredEntities} />}

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as AuditStatus | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-all"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Company</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Status</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Review Period</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Contact</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Files</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  {showArchived ? 'No archived companies' : 'No companies match the current filters'}
                </td>
              </tr>
            ) : (
              filtered.map(company => {
                const companyFileCount = entityFiles.filter(f => f.companyId === company.id || f.entityId === company.id).length;
                return (
                  <tr
                    key={company.id}
                    onClick={() => navigate(`/company/${company.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDropdown company={company} onStatusChange={handleStatusChange} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{selectedCycleLabel}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{company.contactName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setFileListOpen(fileListOpen === company.id ? null : company.id)}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Files ({companyFileCount})
                        </button>
                        {fileListOpen === company.id && (
                          <FileListPopover companyId={company.id} onClose={() => setFileListOpen(null)} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-end gap-1">
                        {showArchived ? (
                          <button
                            onClick={(e) => handleUnarchive(e, company.id, company.name)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Restore"
                          >
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleArchive(e, company.id, company.name)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status change confirmation */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Change <span className="font-medium text-gray-700">{pendingStatus?.name}</span> status from <span className="font-medium text-gray-700">{pendingStatus?.from}</span> to <span className="font-medium text-gray-700">{pendingStatus?.to}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} className="bg-blue-500 text-white hover:bg-blue-600">Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
