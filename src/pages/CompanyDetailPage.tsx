import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOrgChart } from '@/components/company/CompanyOrgChart';
import { CompanyFinancials } from '@/components/company/CompanyFinancials';
import { CompanyDiscrepancies } from '@/components/company/CompanyDiscrepancies';
import { CompanyEmailThreads } from '@/components/company/CompanyEmailThreads';
import { CompanyEmailDraft } from '@/components/company/CompanyEmailDraft';
import { CompanyAuditLogs } from '@/components/company/CompanyAuditLogs';
import { CompanyAuditPeriods } from '@/components/company/CompanyAuditPeriods';

const statusBadge: Record<string, string> = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Discrepancy Identified': 'bg-red-100 text-red-800',
  'Clarification Requested': 'bg-blue-100 text-blue-800',
  'Resolved': 'bg-green-100 text-green-800',
};

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { companies } = useAppState();
  const navigate = useNavigate();

  const company = companies.find(c => c.id === companyId);
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Company not found</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-blue-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[company.status] || 'bg-gray-100 text-gray-800'}`}>
                {company.status}
              </span>
              <span className="text-xs text-gray-500 font-mono">{company.auditPeriod}</span>
              {company.contactName && (
                <span className="text-xs text-gray-500">Contact: {company.contactName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

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
              { value: 'review-periods', label: 'Review Periods' },
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
          <TabsContent value="org-chart" className="h-full mt-0"><CompanyOrgChart companyId={company.id} /></TabsContent>
          <TabsContent value="financials" className="h-full mt-0"><CompanyFinancials companyId={company.id} /></TabsContent>
          <TabsContent value="discrepancies" className="h-full mt-0"><CompanyDiscrepancies companyId={company.id} /></TabsContent>
          <TabsContent value="email-draft" className="h-full mt-0"><CompanyEmailDraft companyId={company.id} /></TabsContent>
          <TabsContent value="email-threads" className="h-full mt-0"><CompanyEmailThreads companyId={company.id} /></TabsContent>
          <TabsContent value="audit-logs" className="h-full mt-0"><CompanyAuditLogs companyId={company.id} /></TabsContent>
          <TabsContent value="review-periods" className="h-full mt-0"><CompanyAuditPeriods companyId={company.id} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
