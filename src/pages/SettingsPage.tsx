import { useState } from 'react';
import { Settings } from 'lucide-react';
import ParameterThresholdPage from './ParameterThresholdPage';
import CycleAdjustmentsTab from '@/components/settings/CycleAdjustmentsTab';

const tabs = [
  { key: 'thresholds' as const, label: 'Parameter Thresholds' },
  { key: 'cycles' as const, label: 'Cycle Adjustments' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'thresholds' | 'cycles'>('thresholds');

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'thresholds' && <ParameterThresholdPage />}
      {activeTab === 'cycles' && <CycleAdjustmentsTab />}
    </div>
  );
}
