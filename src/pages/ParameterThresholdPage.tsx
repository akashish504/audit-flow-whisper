import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SlidersHorizontal } from 'lucide-react';

export default function ParameterThresholdPage() {
  const { fieldThresholds, setFieldThresholds } = useAppState();
  const [local, setLocal] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(fieldThresholds).map(([k, v]) => [k, v * 100]))
  );

  const handleChange = (field: string, value: string) => {
    const v = parseFloat(value);
    if (!isNaN(v) && v >= 0 && v <= 100) {
      setLocal(prev => ({ ...prev, [field]: v }));
    }
  };

  const isDirty = Object.keys(local).some(
    k => Math.abs(local[k] - fieldThresholds[k] * 100) > 0.001
  );

  const handleApply = () => {
    const converted = Object.fromEntries(
      Object.entries(local).map(([k, v]) => [k, v / 100])
    );
    setFieldThresholds(converted);
    toast.success('Thresholds updated — discrepancies recalculated');
  };

  const handleReset = () => {
    const resetLocal = Object.fromEntries(Object.keys(local).map(k => [k, 0.5]));
    setLocal(resetLocal);
  };

  const fields = Object.keys(fieldThresholds).sort();

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-500" />
            Parameter Thresholds
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set the variance threshold for each financial parameter. Items exceeding their threshold will be flagged in the Discrepancy Dashboard.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parameter</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Threshold (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map(field => (
                <tr key={field} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{field}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={local[field]?.toFixed(2) ?? '0.50'}
                      onChange={e => handleChange(field, e.target.value)}
                      min={0}
                      max={100}
                      step={0.01}
                      className="text-sm text-right w-28 ml-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset to 0.50%
          </button>
          <button
            onClick={handleApply}
            disabled={!isDirty}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply Thresholds
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
          <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
            <li>Each parameter has its own threshold percentage</li>
            <li>Variance is calculated as <code className="bg-gray-100 px-1 rounded">(Extracted − Source) / Source</code></li>
            <li>If the absolute variance exceeds the field's threshold, the item is flagged</li>
            <li>Clicking "Apply Thresholds" immediately recalculates all discrepancies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
