import { useAppState } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
};

export default function PortfolioCompaniesPage() {
  const { companies } = useAppState();
  const navigate = useNavigate();
  const entities = companies.filter(c => c.parentId !== null);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Portfolio Companies</h1>
        <p className="text-xs text-muted-foreground">{entities.length} entities across the portfolio</p>
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
            {entities.map(company => {
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
