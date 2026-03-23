import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SlidersHorizontal } from 'lucide-react';

export default function ParameterThresholdPage() {
  const { varianceThreshold, setVarianceThreshold } = useAppState();
  const [localValue, setLocalValue] = useState(varianceThreshold * 100);

  const handleSliderChange = (value: number[]) => {
    setLocalValue(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v >= 0 && v <= 100) {
      setLocalValue(v);
    }
  };

  const handleApply = () => {
    setVarianceThreshold(localValue / 100);
    toast.success(`Variance threshold updated to ${localValue.toFixed(2)}%`);
  };

  const isDirty = Math.abs(localValue - varianceThreshold * 100) > 0.001;

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-500" />
            Parameter Thresholds
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the variance threshold that determines when a line item is flagged as a discrepancy.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
          <div>
            <Label className="text-sm font-medium text-gray-700">Variance Threshold (%)</Label>
            <p className="text-xs text-gray-400 mt-0.5">
              Items with a variance exceeding this percentage will appear in the Discrepancy Dashboard.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <Slider
                value={[localValue]}
                onValueChange={handleSliderChange}
                min={0}
                max={10}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>
            <div className="w-24">
              <Input
                type="number"
                value={localValue.toFixed(2)}
                onChange={handleInputChange}
                min={0}
                max={100}
                step={0.01}
                className="text-sm text-right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Current active threshold: <span className="font-medium text-gray-700">{(varianceThreshold * 100).toFixed(2)}%</span>
            </span>
            <button
              onClick={handleApply}
              disabled={!isDirty}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply Threshold
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
          <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
            <li>The variance is calculated as <code className="bg-gray-100 px-1 rounded">(Extracted − Source) / Source</code></li>
            <li>If the absolute variance exceeds the threshold, the item is flagged</li>
            <li>Flagged items appear in the Discrepancy Dashboard for each company</li>
            <li>Changing the threshold immediately recalculates all discrepancies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
