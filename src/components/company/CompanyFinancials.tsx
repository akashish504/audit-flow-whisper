import { reconciliationData, calculateVariance, formatCurrency } from '@/data/mockData';

export function CompanyFinancials({ companyId }: { companyId: string }) {
  const data = reconciliationData[companyId] || [];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No financial data available for this entity</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <table className="w-full bg-card border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-secondary/50">
            <th className="data-header text-left px-4 py-3">Field Name</th>
            <th className="data-header text-right px-4 py-3">Source Value (Snowflake)</th>
            <th className="data-header text-right px-4 py-3">Extracted Value (Audit)</th>
            <th className="data-header text-right px-4 py-3">Variance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const v = calculateVariance(row.Source_Value, row.Extracted_Value);
            return (
              <tr key={row.Field_Name} className={`border-t border-border ${v.isFlagged ? 'bg-destructive/5' : 'hover:bg-accent/50'} transition-quart`}>
                <td className="px-4 py-3 text-sm text-foreground">{row.Field_Name}</td>
                <td className="px-4 py-3 text-sm font-mono text-right text-foreground">{formatCurrency(row.Source_Value)}</td>
                <td className="px-4 py-3 text-sm font-mono text-right text-foreground">{formatCurrency(row.Extracted_Value)}</td>
                <td className={`px-4 py-3 text-sm font-mono text-right ${v.isFlagged ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  {v.percent === 0 ? '—' : `${(v.percent * 100).toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
