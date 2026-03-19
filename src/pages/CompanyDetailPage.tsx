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

const statusColor: Record<string, string> = {
  'Pending Review': 'bg-warning/20 text-warning border-warning/30',
  'Discrepancy Identified': 'bg-destructive/20 text-destructive border-destructive/30',
  'Clarification Requested': 'bg-primary/20 text-primary border-primary/30',
  'Resolved': 'bg-success/20 text-success border-success/30',
};

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { companies } = useAppState();
  const navigate = useNavigate();

  const company = companies.find(c => c.id === companyId);
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3 transition-quart"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Portfolio
        </button>
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border ${statusColor[company.status]}`}>
                {company.status}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{company.auditPeriod}</span>
              {company.contactName && (
                <span className="text-xs text-muted-foreground">Contact: {company.contactName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="org-chart" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-3 border-b border-border bg-card shrink-0">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="org-chart" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Org Chart
            </TabsTrigger>
            <TabsTrigger value="financials" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Financial Tables
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Discrepancy Dashboard
            </TabsTrigger>
            <TabsTrigger value="email-draft" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Email Draft & Sending
            </TabsTrigger>
            <TabsTrigger value="email-threads" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Email Threads
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="review-periods" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs">
              Review Periods
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="org-chart" className="h-full mt-0">
            <CompanyOrgChart companyId={company.id} />
          </TabsContent>
          <TabsContent value="financials" className="h-full mt-0">
            <CompanyFinancials companyId={company.id} />
          </TabsContent>
          <TabsContent value="discrepancies" className="h-full mt-0">
            <CompanyDiscrepancies companyId={company.id} />
          </TabsContent>
          <TabsContent value="email-draft" className="h-full mt-0">
            <CompanyEmailDraft companyId={company.id} />
          </TabsContent>
          <TabsContent value="email-threads" className="h-full mt-0">
            <CompanyEmailThreads companyId={company.id} />
          </TabsContent>
          <TabsContent value="audit-logs" className="h-full mt-0">
            <CompanyAuditLogs companyId={company.id} />
          </TabsContent>
          <TabsContent value="review-periods" className="h-full mt-0">
            <CompanyAuditPeriods companyId={company.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
