import React, { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { ReviewStage } from '@/data/mockData';
import { Upload, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

const STAGES: ReviewStage[] = ['Scoped In', 'Scoped Out', 'Overdue', 'In Review', 'Completed'];

const stageBadge = (stage: ReviewStage) => {
  const map: Record<ReviewStage, string> = {
    'Scoped In': 'bg-blue-100 text-blue-800',
    'Scoped Out': 'bg-gray-100 text-gray-800',
    'Overdue': 'bg-red-100 text-red-800',
    'In Review': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
  };
  return map[stage];
};

type CompanyFilter = 'all' | 'overdue' | 'in-review' | 'completed';

const ReviewCycleAdjustmentsPage: React.FC = () => {
  const { rcCycles, rcEntries, rcLogs, addOrUpdateRCEntries, updateRCEntryStage } = useAppState();
  const latestCycleId = rcCycles.length > 0 ? rcCycles[0].id : '';
  const [selectedCycleId, setSelectedCycleId] = useState(latestCycleId);
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ entryId: string; newStage: ReviewStage } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV cycle selection dialog
  const [csvData, setCsvData] = useState<{ companyName: string; stage: ReviewStage; contactName: string; contactEmail: string }[] | null>(null);
  const [csvCycleId, setCsvCycleId] = useState(latestCycleId);

  const filteredEntries = useMemo(() => {
    let entries = rcEntries;

    if (companyFilter === 'all') {
      entries = entries.filter(e => e.reviewCycleId === selectedCycleId);
    } else if (companyFilter === 'overdue') {
      entries = entries.filter(e => e.stage === 'Overdue');
      if (selectedCycleId) entries = entries.filter(e => e.reviewCycleId === selectedCycleId);
    } else if (companyFilter === 'in-review') {
      entries = entries.filter(e => e.stage === 'In Review');
      if (selectedCycleId) entries = entries.filter(e => e.reviewCycleId === selectedCycleId);
    } else if (companyFilter === 'completed') {
      entries = entries.filter(e => e.stage === 'Completed' && e.reviewCycleId === selectedCycleId);
    }

    if (searchTerm) {
      entries = entries.filter(e => e.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return entries;
  }, [rcEntries, selectedCycleId, companyFilter, searchTerm]);

  const handleAddCycleClick = () => {
    if (!newCY || !newFY) { toast.error('Please fill in both CY and FY values'); return; }
    const label = `CY ${newCY} - FY ${newFY}`;
    if (rcCycles.some(c => c.label === label)) { toast.error('This review cycle already exists'); return; }
    setCycleCheckbox(false);
    setCycleConfirmDialog(true);
  };

  const handleConfirmAddCycle = () => {
    const label = `CY ${newCY} - FY ${newFY}`;
    addReviewCycle(label);
    setNewCY('');
    setNewFY('');
    setCycleConfirmDialog(false);
    setCycleCheckbox(false);
    toast.success(`Review cycle ${label} created`);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV must have a header row and at least one data row'); return; }
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = header.indexOf('company_name');
      const stageIdx = header.indexOf('stage');
      const contactIdx = header.indexOf('contact_name');
      const emailIdx = header.indexOf('contact_email');
      if (nameIdx === -1) { toast.error('CSV must have a "company_name" column'); return; }

      const entries = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          companyName: cols[nameIdx] || '',
          stage: (STAGES.includes(cols[stageIdx] as ReviewStage) ? cols[stageIdx] : 'Scoped In') as ReviewStage,
          contactName: cols[contactIdx] || '',
          contactEmail: cols[emailIdx] || '',
        };
      }).filter(e => e.companyName);

      setCsvData(entries);
      setCsvCycleId(selectedCycleId || latestCycleId);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmCSVUpload = () => {
    if (!csvData || !csvCycleId) return;
    addOrUpdateRCEntries(csvCycleId, csvData);
    toast.success(`${csvData.length} companies uploaded/updated`);
    setCsvData(null);
  };

  const handleSampleCSV = () => {
    const csv = 'company_name,stage,contact_name,contact_email\nSample Corp,Scoped In,John Doe,john@sample.com\nAnother Inc,In Review,Jane Smith,jane@another.com';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'review_companies_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getCycleLabel = (id: string) => rcCycles.find(c => c.id === id)?.label ?? id;

  const tabs = [
    { key: 'companies' as const, label: 'Companies' },
    { key: 'cycles' as const, label: 'Cycle Adjustments' },
    { key: 'logs' as const, label: 'Logs' },
  ];

  const showAllCyclesDefault = companyFilter === 'overdue' || companyFilter === 'in-review';

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Cycle Adjustments</h1>

      {/* Inner tabs */}
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

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div>
          {/* Sub-filters */}
          <div className="flex gap-2 mb-4">
            {([
              { key: 'all', label: 'All Companies' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'in-review', label: 'In Review' },
              { key: 'completed', label: 'Completed' },
            ] as { key: CompanyFilter; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => {
                  setCompanyFilter(f.key);
                  if (f.key === 'overdue' || f.key === 'in-review') {
                    setSelectedCycleId('');
                  } else if (!selectedCycleId) {
                    setSelectedCycleId(latestCycleId);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  companyFilter === f.key
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCycleId}
              onChange={e => setSelectedCycleId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {showAllCyclesDefault && <option value="">All Cycles</option>}
              {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={handleSampleCSV} className="px-4 py-2 rounded-lg font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Sample CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-1.5">
              <Upload className="h-4 w-4" /> Upload CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  {showAllCyclesDefault && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Review Cycle</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No companies found. Upload a CSV to add companies to this review cycle.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.companyName}</td>
                      <td className="px-4 py-3">
                        <select
                          value={entry.stage}
                          onChange={e => {
                            const newStage = e.target.value as ReviewStage;
                            if (newStage !== entry.stage) {
                              setConfirmDialog({ entryId: entry.id, newStage });
                            }
                          }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${stageBadge(entry.stage)}`}
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.contactName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.contactEmail}</td>
                      {showAllCyclesDefault && (
                        <td className="px-4 py-3 text-sm text-gray-500">{getCycleLabel(entry.reviewCycleId)}</td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(entry.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cycle Adjustments Tab */}
      {activeTab === 'cycles' && (
        <div>
          {/* Add new cycle */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Add New Review Cycle</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">CY</span>
              <input
                type="text"
                value={newCY}
                onChange={e => setNewCY(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="24"
                maxLength={2}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-400">—</span>
              <span className="text-sm text-gray-700 font-medium">FY</span>
              <input
                type="text"
                value={newFY}
                onChange={e => setNewFY(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="25"
                maxLength={2}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddCycleClick}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-1.5 ml-2"
              >
                <Plus className="h-4 w-4" /> Add Cycle
              </button>
            </div>
          </div>

          {/* List of cycles */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Existing Review Cycles</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle Label</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rcCycles.map(cycle => (
                  <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cycle.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rcEntries.filter(e => e.reviewCycleId === cycle.id).length}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(cycle.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {rcCycles.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No review cycles yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Review Cycle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rcLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.details}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.reviewCycleId ? getCycleLabel(log.reviewCycleId) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.user}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {rcLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stage Change Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setConfirmDialog(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Confirm Stage Change</h3>
            <p className="text-sm text-gray-500 mb-4">
              Change stage to <span className="font-medium text-gray-900">{confirmDialog.newStage}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                No
              </button>
              <button
                onClick={() => {
                  updateRCEntryStage(confirmDialog.entryId, confirmDialog.newStage);
                  toast.success('Stage updated');
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Cycle Confirmation Dialog */}
      {cycleConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCycleConfirmDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900">Confirm New Review Cycle</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              You are about to create review cycle <span className="font-medium text-gray-900">CY {newCY} - FY {newFY}</span>. This action will add a new review period to the system.
            </p>
            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={cycleCheckbox}
                onChange={e => setCycleCheckbox(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I am fully aware that this action will create a new review period in the system and cannot be undone.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCycleConfirmDialog(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmAddCycle}
                disabled={!cycleCheckbox}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  cycleCheckbox
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Cycle Selection Dialog */}
      {csvData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCsvData(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Attach CSV to Review Cycle</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-900">{csvData.length} companies</span> parsed from the CSV. Select which review cycle to attach them to:
            </p>
            <select
              value={csvCycleId}
              onChange={e => setCsvCycleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-5"
            >
              {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCsvData(null)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmCSVUpload}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCycleAdjustmentsPage;
