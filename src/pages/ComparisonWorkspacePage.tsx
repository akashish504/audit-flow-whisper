import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { reconciliationData, calculateVariance, formatCurrency, Company } from '@/data/mockData';
import { Flag, FileText, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function PdfViewer({ company }: { company: Company }) {
  return (
    <div className="h-full flex flex-col bg-surface border-r border-border">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground truncate">
          {company.name} — Audit Report {company.auditPeriod}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {company.hasAuditReport ? (
          <div className="text-center space-y-3 px-8">
            <div className="w-full max-w-[280px] mx-auto border border-border rounded-sm bg-background p-6">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded-sm w-3/4 mx-auto" />
                <div className="h-2 bg-muted/60 rounded-sm w-full" />
                <div className="h-2 bg-muted/60 rounded-sm w-5/6" />
                <div className="h-2 bg-muted/60 rounded-sm w-full" />
                <div className="h-6 my-3" />
                <div className="h-2 bg-muted/60 rounded-sm w-full" />
                <div className="h-2 bg-muted/60 rounded-sm w-4/5" />
                <div className="h-2 bg-primary/20 rounded-sm w-full border border-primary/30" />
                <div className="h-2 bg-muted/60 rounded-sm w-3/4" />
                <div className="h-6 my-3" />
                <div className="h-2 bg-muted/60 rounded-sm w-full" />
                <div className="h-2 bg-destructive/20 rounded-sm w-5/6 border border-destructive/30" />
                <div className="h-2 bg-muted/60 rounded-sm w-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">PDF viewer — OCR regions highlighted</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No document attached</p>
        )}
      </div>
    </div>
  );
}

function ReconciliationTable({ companyId, company }: { companyId: string; company: Company }) {
  const { addEmail, updateCompanyStatus } = useAppState();
  const navigate = useNavigate();
  const data = reconciliationData[companyId] || [];

  const handleFlag = (fieldName: string, sourceVal: number, extractedVal: number) => {
    const variance = calculateVariance(sourceVal, extractedVal);
    const email = {
      id: `e-${Date.now()}`,
      companyId,
      subject: `${fieldName} Variance — ${company.name} ${company.auditPeriod}`,
      timestamp: new Date().toISOString(),
      from: 'audit@vantagecap.com',
      to: company.contactEmail,
      body: `${company.contactName},\n\nDuring our ${company.auditPeriod} audit reconciliation for ${company.name}, we identified a variance of ${(Math.abs(variance.percent) * 100).toFixed(2)}% in the ${fieldName} line item.\n\nSnowflake source: ${formatCurrency(sourceVal)}\nExtracted value: ${formatCurrency(extractedVal)}\n\nPlease provide documentation to clarify this discrepancy.\n\nRegards,\nVantage Audit Team`,
      status: 'draft' as const,
    };
    addEmail(email);
    updateCompanyStatus(companyId, 'Clarification Requested');
    toast.success(`Discrepancy flagged. Draft email created.`);
    navigate('/communications');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">Financial Reconciliation</span>
        <span className="text-[10px] text-muted-foreground font-mono">// {company.name}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">No reconciliation data available</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="data-header text-left px-3 py-2">Field Name</th>
                <th className="data-header text-right px-3 py-2">Snowflake Value</th>
                <th className="data-header text-right px-3 py-2">Extracted Value</th>
                <th className="data-header text-right px-3 py-2">Variance</th>
                <th className="data-header text-center px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const v = calculateVariance(row.Source_Value, row.Extracted_Value);
                return (
                  <tr
                    key={row.Field_Name}
                    className={`h-10 border-b border-border group ${v.isFlagged ? 'bg-destructive/5' : 'hover:bg-secondary/40'} transition-quart`}
                  >
                    <td className="px-3 text-sm text-foreground">{row.Field_Name}</td>
                    <td className="px-3 text-sm font-mono text-right text-foreground">{formatCurrency(row.Source_Value)}</td>
                    <td className="px-3 text-sm font-mono text-right text-foreground">{formatCurrency(row.Extracted_Value)}</td>
                    <td className={`px-3 text-sm font-mono text-right ${v.isFlagged ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      {v.percent === 0 ? '—' : `${(v.percent * 100).toFixed(2)}%`}
                    </td>
                    <td className="px-3 text-center">
                      {v.isFlagged && (
                        <button
                          onClick={() => handleFlag(row.Field_Name, row.Source_Value, row.Extracted_Value)}
                          className="opacity-0 group-hover:opacity-100 transition-quart press-effect p-1 rounded-sm hover:bg-destructive/20"
                          title="Flag Discrepancy"
                        >
                          <Flag className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ComparisonWorkspacePage() {
  const { companies, selectedCompanyId, setSelectedCompanyId } = useAppState();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const entitiesWithData = companies.filter(c => c.parentId !== null);
  const selected = companies.find(c => c.id === selectedCompanyId) || entitiesWithData[0];
  const currentId = selected?.id || '';

  return (
    <div className="h-full flex flex-col">
      {/* Entity selector bar */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-3 bg-surface shrink-0">
        <span className="text-xs text-muted-foreground">Entity:</span>
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-quart press-effect"
          >
            {selected?.name || 'Select Entity'}
            <ChevronDown className="h-3 w-3" />
          </button>
          {selectorOpen && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-sm shadow-lg z-50 min-w-[200px]">
              {entitiesWithData.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCompanyId(c.id); setSelectorOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-quart ${c.id === currentId ? 'text-primary bg-accent' : 'text-foreground'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">// {selected?.auditPeriod}</span>
      </div>

      {/* Split workspace */}
      <div className="flex-1 flex min-h-0">
        <div className="w-1/2 border-r border-border">
          {selected && <PdfViewer company={selected} />}
        </div>
        <div className="w-1/2">
          {selected && <ReconciliationTable companyId={currentId} company={selected} />}
        </div>
      </div>
    </div>
  );
}
