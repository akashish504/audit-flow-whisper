import { reconciliationData, calculateVariance, formatCurrency } from '@/data/mockData';

export function CompanyFinancials({ companyId }: { companyId: string }) {
  const data = reconciliationData[companyId] || [];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">No financial data available for this entity</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Field Name</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right px-4 py-3">Source Value (Snowflake)</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right px-4 py-3">Extracted Value (Audit)</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right px-4 py-3">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => {
              const v = calculateVariance(row.Source_Value, row.Extracted_Value);
              return (
                <tr key={row.Field_Name} className={`${v.isFlagged ? 'bg-red-50' : 'hover:bg-gray-50'} transition-all`}>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.Field_Name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-right text-gray-500">{formatCurrency(row.Source_Value)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-right text-gray-500">{formatCurrency(row.Extracted_Value)}</td>
                  <td className={`px-4 py-3 text-sm font-mono text-right ${v.isFlagged ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {v.percent === 0 ? '—' : `${(v.percent * 100).toFixed(2)}%`}
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
