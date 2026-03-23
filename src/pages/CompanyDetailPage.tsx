import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { ArrowLeft, Building2, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOrgChart } from '@/components/company/CompanyOrgChart';
import { CompanyFinancials } from '@/components/company/CompanyFinancials';
import { CompanyDiscrepancies } from '@/components/company/CompanyDiscrepancies';
import { CompanyEmailThreads } from '@/components/company/CompanyEmailThreads';
import { CompanyEmailDraft } from '@/components/company/CompanyEmailDraft';
import { CompanyAuditLogs } from '@/components/company/CompanyAuditLogs';
import { FilePreviewOverlay } from '@/components/company/FilePreviewOverlay';
import { CompanyFiles } from '@/components/company/CompanyFiles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { entityFiles } from '@/data/mockData';
import type { AuditStatus } from '@/data/mockData';
import { toast } from 'sonner';

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Discrepancy Identified': 'bg-red-100 text-red-800',
  'Clarification Requested': 'bg-blue-100 text-blue-800',
  'Resolved': 'bg-green-100 text-green-800',
};

const allStatuses: AuditStatus[] = ['Pending Review', 'Discrepancy Identified', 'Clarification Requested', 'Resolved'];

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { companies, updateCompanyStatus, setActiveAuditPeriod } = useAppState();
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>('all');
  const [pendingStatus, setPendingStatus] = useState<AuditStatus | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  const company = companies.find(c => c.id === companyId);
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Company not found</p>
      </div>
    );
  }

  const relatedIds = [company.id, ...companies.filter(c => c.parentId === company.id).map(c => c.id)];

  const companyFiles = entityFiles.filter(f =>
    (f.companyId === companyId || relatedIds.includes(f.entityId)) &&
    f.reviewPeriod === company.auditPeriod
  );

  // Group files by entity
  const filesByEntity = companyFiles.reduce<Record<string, EntityFile[]>>((acc, f) => {
    const key = f.entityId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const handleStatusClick = (status: AuditStatus) => {
    setPendingStatus(status);
    setStatusOpen(false);
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    updateCompanyStatus(company.id, pendingStatus);
    toast.success(`Status updated to "${pendingStatus}"`);
    setPendingStatus(null);
  };

  const handlePeriodChange = (periodId: string) => {
    setActiveAuditPeriod(company.id, periodId);
    setSelectedFileId('all');
    toast.success('Review period changed');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-3 transition-all"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Portfolio
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{company.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative" ref={statusRef}>
                  <button
                    onClick={() => setStatusOpen(!statusOpen)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusBadge[company.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {company.status}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {statusOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                      {allStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusClick(s)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${s === company.status ? 'font-semibold' : ''}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusBadge[s]?.split(' ')[0]?.replace('100', '400') || 'bg-gray-400'}`} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {company.contactName && (
                  <span className="text-xs text-gray-500">Contact: {company.contactName}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Review Period</label>
              <select
                value={company.auditPeriods.find(p => p.isActive)?.id || ''}
                onChange={e => handlePeriodChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {company.auditPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {companyFiles.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">Entity File</label>
                <select
                  value={selectedFileId}
                  onChange={e => setSelectedFileId(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white max-w-[220px]"
                >
                  <option value="all">All Entities</option>
                  {companyFiles.map(f => (
                    <option key={f.id} value={f.id}>{f.entityName} — {f.fileName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Files grouped by entity */}
        {Object.keys(filesByEntity).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(filesByEntity).map(([entityId, files]) => (
              <div key={entityId} className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mr-1">{files[0].entityName}:</span>
                {files.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPreviewFile(f)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-all"
                  >
                    <FileText className="h-3 w-3 text-red-400" />
                    <span className="truncate max-w-[140px]">{f.fileName}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status confirmation dialog */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Change <span className="font-medium text-gray-700">{company.name}</span> status from <span className="font-medium text-gray-700">{company.status}</span> to <span className="font-medium text-gray-700">{pendingStatus}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} className="bg-blue-500 text-white hover:bg-blue-600">Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File preview overlay */}
      <FilePreviewOverlay file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />

      {/* Tabs */}
      <Tabs defaultValue="org-chart" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-3 border-b border-gray-200 bg-white shrink-0">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            {[
              { value: 'org-chart', label: 'Org Chart' },
              { value: 'financials', label: 'Financial Tables' },
              { value: 'discrepancies', label: 'Discrepancy Dashboard' },
              { value: 'email-draft', label: 'Email Draft & Sending' },
              { value: 'email-threads', label: 'Email Threads' },
              { value: 'audit-logs', label: 'Audit Logs' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          <TabsContent value="org-chart" className="h-full mt-0">
            <CompanyOrgChart companyId={company.id} selectedEntityId={selectedFileId !== 'all' ? companyFiles.find(f => f.id === selectedFileId)?.entityId : undefined} />
          </TabsContent>
          <TabsContent value="financials" className="h-full mt-0">
            <CompanyFinancials companyId={company.id} selectedEntityId={selectedFileId !== 'all' ? companyFiles.find(f => f.id === selectedFileId)?.entityId : undefined} />
          </TabsContent>
          <TabsContent value="discrepancies" className="h-full mt-0"><CompanyDiscrepancies companyId={company.id} /></TabsContent>
          <TabsContent value="email-draft" className="h-full mt-0"><CompanyEmailDraft companyId={company.id} /></TabsContent>
          <TabsContent value="email-threads" className="h-full mt-0"><CompanyEmailThreads companyId={company.id} /></TabsContent>
          <TabsContent value="audit-logs" className="h-full mt-0"><CompanyAuditLogs companyId={company.id} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
