import { reconciliationData, calculateVariance, formatCurrency } from '@/data/mockData';

export function CompanyFinancials({ companyId, selectedEntityId }: { companyId: string; selectedEntityId?: string }) {
  const allData = reconciliationData[companyId] || [];

  // Filter by selected entity if specified
  const data = selectedEntityId
    ? allData.filter(row => row.entityId === selectedEntityId)
    : allData;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">No financial data available for this entity</p>
      </div>
    );
  }

  // Group by entity
  const entityGroups = new Map<string, typeof data>();
  for (const row of data) {
    const key = row.entityName || 'Unknown';
    if (!entityGroups.has(key)) entityGroups.set(key, []);
    entityGroups.get(key)!.push(row);
  }

  return (
    <div className="p-6 space-y-6">
      {Array.from(entityGroups.entries()).map(([entityName, rows]) => (
        <div key={entityName}>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{entityName}</h3>
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
                {rows.map((row, idx) => {
                  const v = calculateVariance(row.Source_Value, row.Extracted_Value);
                  return (
                    <tr key={`${row.Field_Name}-${idx}`} className={`${v.isFlagged ? 'bg-red-50' : 'hover:bg-gray-50'} transition-all`}>
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
      ))}
    </div>
  );
}