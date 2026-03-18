import { reconciliationData, calculateVariance, formatCurrency } from '@/data/mockData';
import { useAppState } from '@/context/AppContext';
import { AlertTriangle, Flag } from 'lucide-react';
import { toast } from 'sonner';

export function CompanyDiscrepancies({ companyId }: { companyId: string }) {
  const { companies, addEmail, updateCompanyStatus } = useAppState();
  const company = companies.find(c => c.id === companyId);
  const data = reconciliationData[companyId] || [];
  const flagged = data.filter(row => {
    const v = calculateVariance(row.Source_Value, row.Extracted_Value);
    return v.isFlagged;
  });

  const handleFlag = (fieldName: string, sourceVal: number, extractedVal: number) => {
    if (!company) return;
    const variance = calculateVariance(sourceVal, extractedVal);
    const email = {
      id: `e-${Date.now()}`,
      companyId,
      subject: `${fieldName} Variance — ${company.name} ${company.auditPeriod}`,
      timestamp: new Date().toISOString(),
      from: 'audit@vantagecap.com',
      to: company.contactEmail,
      body: `${company.contactName},\n\nVariance of ${(Math.abs(variance.percent) * 100).toFixed(2)}% in ${fieldName}.\n\nSource: ${formatCurrency(sourceVal)}\nExtracted: ${formatCurrency(extractedVal)}\n\nPlease clarify.\n\nRegards,\nVantage Audit Team`,
      status: 'draft' as const,
    };
    addEmail(email);
    updateCompanyStatus(companyId, 'Clarification Requested');
    toast.success('Discrepancy flagged — draft email created');
  };

  if (flagged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No discrepancies found (threshold: 0.5%)</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">{flagged.length} discrepanc{flagged.length === 1 ? 'y' : 'ies'} exceeding 0.5% threshold</p>
      </div>

      <div className="space-y-3">
        {flagged.map(row => {
          const v = calculateVariance(row.Source_Value, row.Extracted_Value);
          return (
            <div key={row.Field_Name} className="bg-card border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-foreground">{row.Field_Name}</span>
                  <span className="text-xs font-mono text-destructive font-semibold">{(v.percent * 100).toFixed(2)}%</span>
                </div>
                <div className="text-xs text-muted-foreground space-x-4">
                  <span>Source: {formatCurrency(row.Source_Value)}</span>
                  <span>Extracted: {formatCurrency(row.Extracted_Value)}</span>
                  <span>Diff: {formatCurrency(v.diff)}</span>
                </div>
              </div>
              <button
                onClick={() => handleFlag(row.Field_Name, row.Source_Value, row.Extracted_Value)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30 rounded-sm press-effect hover:bg-destructive/20 transition-quart"
              >
                <Flag className="h-3 w-3" /> Flag & Draft Email
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
