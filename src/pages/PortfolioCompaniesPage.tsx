import { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X, Upload, Download, Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import { AuditStatus } from '@/data/mockData';
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
const allPeriods = ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024', 'Q1 2025'];

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

function downloadSampleCsv() {
  const csv = 'company_id,period\nacme,Q1 2025\nmeridian,Q1 2025\nnexus,Q1 2025';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'review_cycle_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function StatusDropdown({ company, onStatusChange }: { company: { id: string; name: string; status: AuditStatus }; onStatusChange: (id: string, name: string, currentStatus: AuditStatus, newStatus: AuditStatus) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
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

export default function PortfolioCompaniesPage() {
  const { companies, bulkCreateReviewCycles, archiveCompany, unarchiveCompany, updateCompanyStatus } = useAppState();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: string; name: string; from: AuditStatus; to: AuditStatus } | null>(null);

  const entities = companies.filter(c => c.parentId !== null);
  const activeEntities = entities.filter(c => !c.isArchived);
  const archivedEntities = entities.filter(c => c.isArchived);

  const displayEntities = showArchived ? archivedEntities : activeEntities;

  const filtered = useMemo(() => {
    return displayEntities.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (periodFilter && c.auditPeriod !== periodFilter) return false;
      return true;
    });
  }, [displayEntities, search, statusFilter, periodFilter]);

  const hasFilters = search || statusFilter || periodFilter;

  const handleStatusChange = (id: string, name: string, currentStatus: AuditStatus, newStatus: AuditStatus) => {
    setPendingStatus({ id, name, from: currentStatus, to: newStatus });
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    updateCompanyStatus(pendingStatus.id, pendingStatus.to);
    toast.success(`${pendingStatus.name} status updated to "${pendingStatus.to}"`);
    setPendingStatus(null);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least one data row');
        return;
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const companyIdIdx = header.findIndex(h => h === 'company_id' || h === 'companyid');
      const periodIdx = header.findIndex(h => h === 'period' || h === 'audit_period' || h === 'review_period');

      if (companyIdIdx === -1 || periodIdx === -1) {
        toast.error('CSV must have "company_id" and "period" columns');
        return;
      }

      const rows: { companyId: string; periodLabel: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const companyId = cols[companyIdIdx];
        const periodLabel = cols[periodIdx];
        if (companyId && periodLabel) {
          rows.push({ companyId, periodLabel });
        }
      }

      if (rows.length === 0) {
        toast.error('No valid rows found in CSV');
        return;
      }

      const knownIds = new Set(companies.map(c => c.id));
      const validRows = rows.filter(r => knownIds.has(r.companyId));
      const skipped = rows.length - validRows.length;

      bulkCreateReviewCycles(validRows);
      toast.success(`Created ${validRows.length} review cycle(s)${skipped > 0 ? `, ${skipped} skipped (unknown company)` : ''}`);
    };
    reader.readAsText(file);
    e.target.value = '';
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
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Companies</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} of {displayEntities.length} entities</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 ${showArchived ? 'bg-gray-100' : ''}`}
          >
            <Archive className="h-4 w-4" /> {showArchived ? `Archived (${archivedEntities.length})` : 'View Archived'}
          </button>
          <button
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
          >
            <Download className="h-4 w-4" /> Sample CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4" /> Upload CSV
          </button>
        </div>
      </div>

      {!showArchived && <StatusStats entities={activeEntities} />}

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

        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Periods</option>
          {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPeriodFilter(''); }}
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
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Parent</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Status</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Active Period</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Contact</th>
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
                const parent = companies.find(c => c.id === company.parentId);
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
                    <td className="px-4 py-3 text-sm text-gray-500">{parent?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusDropdown company={company} onStatusChange={handleStatusChange} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{company.auditPeriod}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{company.contactName || '—'}</td>
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
