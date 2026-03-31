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
import { CompanyFiles } from '@/components/company/CompanyFiles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const { companies, updateCompanyStatus, setActiveAuditPeriod, rcCycles } = useAppState();
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AuditStatus | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  useEffect(() => {
    if (!currencyDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyDropdownOpen]);

  const company = companies.find(c => c.id === companyId);
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Company not found</p>
      </div>
    );
  }

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
    toast.success('Review period changed');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Sync blocking overlay */}
      {isSyncing && (
        <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Syncing data, please wait...</p>
          </div>
        </div>
      )}
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
            {/* Currency Settings */}
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">{currencySymbol}</span>
                <span>{currency}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {currencyDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px]">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Currency Settings</p>
                  <p className="text-sm text-gray-800 font-medium mb-0.5">{currencySymbol}&nbsp; Current: {currency}</p>
                  <p className="text-xs text-gray-500 mb-3">Rate: {exchangeDisplay}</p>
                  <button
                    onClick={() => {
                      setCurrency(currency === 'USD' ? 'INR' : 'USD');
                      setCurrencyDropdownOpen(false);
                      toast.success(`Currency switched to ${currency === 'USD' ? 'INR' : 'USD'}`);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit Currency Settings
                  </button>
                </div>
              )}
            </div>

            {/* Sync Data */}
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </button>

            {/* Review Period */}
            <div className="flex flex-col items-end gap-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Cycle:</label>
              <select
                value={company.auditPeriods.find(p => p.isActive)?.id || ''}
                onChange={e => handlePeriodChange(e.target.value)}
                disabled={isSyncing}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50"
              >
                {rcCycles.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
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
              { value: 'files', label: 'Files' },
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
            <CompanyOrgChart companyId={company.id} />
          </TabsContent>
          <TabsContent value="financials" className="h-full mt-0">
            <CompanyFinancials companyId={company.id} />
          </TabsContent>
          <TabsContent value="discrepancies" className="h-full mt-0"><CompanyDiscrepancies companyId={company.id} /></TabsContent>
          <TabsContent value="email-draft" className="h-full mt-0"><CompanyEmailDraft companyId={company.id} /></TabsContent>
          <TabsContent value="email-threads" className="h-full mt-0"><CompanyEmailThreads companyId={company.id} /></TabsContent>
          <TabsContent value="audit-logs" className="h-full mt-0"><CompanyAuditLogs companyId={company.id} /></TabsContent>
          <TabsContent value="files" className="h-full mt-0"><CompanyFiles companyId={company.id} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
