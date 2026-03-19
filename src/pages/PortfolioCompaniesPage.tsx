import { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X, Upload } from 'lucide-react';
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

export default function PortfolioCompaniesPage() {
  const { companies, bulkCreateReviewCycles } = useAppState();
  const navigate = useNavigate();
  const entities = companies.filter(c => c.parentId !== null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');

  const filtered = useMemo(() => {
    return entities.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (periodFilter && c.auditPeriod !== periodFilter) return false;
      return true;
    });
  }, [entities, search, statusFilter, periodFilter]);

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
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Portfolio Companies</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} of {entities.length} entities</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Upload CSV Review Cycle
          </button>
        </div>
      </div>

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

      {/* CSV format hint */}
      <div className="mb-4 px-3 py-2 rounded-md bg-muted/50 border border-border text-[11px] text-muted-foreground">
        <strong>CSV format:</strong> <code className="text-foreground">company_id,period</code> — e.g. <code className="text-foreground">acme,Q1 2025</code>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="data-header text-left px-4 py-3">Company</th>
              <th className="data-header text-left px-4 py-3">Parent</th>
              <th className="data-header text-left px-4 py-3">Status</th>
              <th className="data-header text-left px-4 py-3">Active Period</th>
              <th className="data-header text-left px-4 py-3">Periods</th>
              <th className="data-header text-left px-4 py-3">Contact</th>
              <th className="data-header text-center px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No companies match the current filters</td>
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{company.auditPeriods.length}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{company.contactName || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-quart" />
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
