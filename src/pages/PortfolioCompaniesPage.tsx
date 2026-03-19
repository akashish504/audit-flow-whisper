import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X } from 'lucide-react';
import { AuditStatus } from '@/data/mockData';

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
};

const allStatuses: AuditStatus[] = ['Pending Review', 'Discrepancy Identified', 'Clarification Requested', 'Resolved'];
const allPeriods = ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024'];

export default function PortfolioCompaniesPage() {
  const { companies } = useAppState();
  const navigate = useNavigate();
  const entities = companies.filter(c => c.parentId !== null);

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

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Portfolio Companies</h1>
        <p className="text-xs text-muted-foreground">{filtered.length} of {entities.length} entities</p>
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

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="data-header text-left px-4 py-3">Company</th>
              <th className="data-header text-left px-4 py-3">Parent</th>
              <th className="data-header text-left px-4 py-3">Status</th>
              <th className="data-header text-left px-4 py-3">Audit Period</th>
              <th className="data-header text-left px-4 py-3">Contact</th>
              <th className="data-header text-center px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No companies match the current filters</td>
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
