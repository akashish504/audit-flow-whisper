import { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X, Upload, Download, Archive, ArchiveRestore } from 'lucide-react';
import { AuditStatus } from '@/data/mockData';
import { toast } from '@/components/ui/sonner';

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
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
        <div key={status} className={`rounded-lg border px-4 py-3 ${statusColor[status]}`}>
          <div className="text-lg font-bold">{count}</div>
          <div className="text-[11px] font-medium">{status}</div>
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

export default function PortfolioCompaniesPage() {
  const { companies, bulkCreateReviewCycles, archiveCompany, unarchiveCompany } = useAppState();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

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
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Portfolio Companies</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} of {displayEntities.length} entities</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border transition-colors ${showArchived ? 'bg-accent text-foreground border-border' : 'text-muted-foreground border-border hover:text-foreground'}`}
          >
            <Archive className="h-3.5 w-3.5" /> {showArchived ? `Archived (${archivedEntities.length})` : 'View Archived'}
          </button>
          <button
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-muted-foreground border border-border rounded-md hover:text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Sample CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Upload CSV
          </button>
        </div>
      </div>

      {!showArchived && <StatusStats entities={activeEntities} />}

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as AuditStatus | '')}
          className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value)}
          className="h-8 px-2.5 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Periods</option>
          {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPeriodFilter(''); }}
            className="flex items-center gap-1 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md transition-quart"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="data-header text-left px-4 py-3">Company</th>
              <th className="data-header text-left px-4 py-3">Parent</th>
              <th className="data-header text-left px-4 py-3">Status</th>
              <th className="data-header text-left px-4 py-3">Active Period</th>
              <th className="data-header text-left px-4 py-3">Contact</th>
              <th className="data-header text-center px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
                    className="border-t border-border hover:bg-accent/50 cursor-pointer transition-quart group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{parent?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${statusColor[company.status]}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{company.auditPeriod}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{company.contactName || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-end gap-1">
                        {showArchived ? (
                          <button
                            onClick={(e) => handleUnarchive(e, company.id, company.name)}
                            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Restore"
                          >
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleArchive(e, company.id, company.name)}
                            className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-quart" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
