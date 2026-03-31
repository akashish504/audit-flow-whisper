import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';

export default function ParameterThresholdPage() {
  const { fieldThresholds, absoluteThresholds, setFieldThresholds, setAbsoluteThresholds } = useAppState();
  const [localPercent, setLocalPercent] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(fieldThresholds).map(([k, v]) => [k, v * 100]))
  );
  const [localAbsolute, setLocalAbsolute] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(absoluteThresholds).map(([k, v]) => [k, v]))
  );

  const handlePercentChange = (field: string, value: string) => {
    const v = parseFloat(value);
    if (!isNaN(v) && v >= 0 && v <= 100) {
      setLocalPercent(prev => ({ ...prev, [field]: v }));
    }
  };

  const handleAbsoluteChange = (field: string, value: string) => {
    const v = parseFloat(value);
    if (!isNaN(v) && v >= 0) {
      setLocalAbsolute(prev => ({ ...prev, [field]: v }));
    }
  };

  const isDirty = Object.keys(localPercent).some(
    k => Math.abs(localPercent[k] - fieldThresholds[k] * 100) > 0.001
  ) || Object.keys(localAbsolute).some(
    k => Math.abs(localAbsolute[k] - absoluteThresholds[k]) > 0.01
  );

  const handleApply = () => {
    const convertedPercent = Object.fromEntries(
      Object.entries(localPercent).map(([k, v]) => [k, v / 100])
    );
    setFieldThresholds(convertedPercent);
    setAbsoluteThresholds(localAbsolute);
    toast.success('Thresholds updated — discrepancies recalculated');
  };

  const handleReset = () => {
    setLocalPercent(Object.fromEntries(Object.keys(localPercent).map(k => [k, 0.5])));
    setLocalAbsolute(Object.fromEntries(Object.keys(localAbsolute).map(k => [k, 0])));
  };

  const fields = Object.keys(fieldThresholds).sort();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">Parameter Thresholds</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set variance thresholds for each parameter. A discrepancy is flagged if <strong>either</strong> the percentage or absolute threshold is breached.
          </p>
        </div>

        <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parameter</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">% Threshold</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-44">Absolute Threshold ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map(field => (
                <tr key={field} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{field}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={localPercent[field]?.toFixed(2) ?? '0.50'}
                      onChange={e => handlePercentChange(field, e.target.value)}
                      min={0}
                      max={100}
                      step={0.01}
                      className="text-sm text-right w-28 ml-auto"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={localAbsolute[field] ?? 0}
                      onChange={e => handleAbsoluteChange(field, e.target.value)}
                      min={0}
                      step={1000}
                      placeholder="0 (disabled)"
                      className="text-sm text-right w-32 ml-auto font-mono"
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
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleApply}
            disabled={!isDirty}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply Thresholds
          </button>
        </div>

        <div className="bg-background border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-medium text-foreground mb-2">How it works</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Each parameter has both a <strong>percentage</strong> and an <strong>absolute value</strong> threshold</li>
            <li>Percentage variance: <code className="bg-muted px-1 rounded">(Extracted − Source) / Source</code></li>
            <li>Absolute variance: <code className="bg-muted px-1 rounded">|Extracted − Source|</code></li>
            <li>An item is flagged if <strong>either</strong> threshold is breached</li>
            <li>Set absolute threshold to <strong>0</strong> to disable it (percentage-only mode)</li>
          </ul>
      </div>
    </div>
  );
}
