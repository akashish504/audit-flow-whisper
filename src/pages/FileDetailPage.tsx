import { useParams, useNavigate } from 'react-router-dom';
import { taggedFiles, companies, type TaggedFile } from '@/data/mockData';
import { ArrowLeft, FileText, Building2, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, Link2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
  processed: { icon: CheckCircle2, badge: 'bg-green-100 text-green-800', label: 'Processed' },
  pending: { icon: Clock, badge: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  error: { icon: AlertTriangle, badge: 'bg-red-100 text-red-800', label: 'Error' },
};

const extractedData: Record<string, {
  entities: { name: string; type: string; confidence: number }[];
  suggestedMatch: { entityId: string; entityName: string; confidence: number } | null;
  financialMetrics: { label: string; value: string }[];
  orgReferences: { name: string; role: string }[];
  pageCount: number;
  language: string;
  extractedDate: string;
}> = {
  f1: {
    entities: [
      { name: 'Acme Corp', type: 'Organization', confidence: 0.97 },
      { name: 'James Chen', type: 'Person', confidence: 0.92 },
      { name: 'Acme Europe GmbH', type: 'Organization', confidence: 0.85 },
      { name: 'Acme Asia Pacific', type: 'Organization', confidence: 0.78 },
    ],
    suggestedMatch: { entityId: 'acme', entityName: 'Acme Corp', confidence: 0.97 },
    financialMetrics: [
      { label: 'Revenue', value: '$142,500,000' },
      { label: 'COGS', value: '$85,950,000' },
      { label: 'Gross Profit', value: '$56,550,000' },
      { label: 'EBITDA', value: '$28,400,000' },
      { label: 'Net Income', value: '$18,350,000' },
      { label: 'Total Assets', value: '$312,000,000' },
    ],
    orgReferences: [
      { name: 'James Chen', role: 'CFO' },
      { name: 'Klaus Mueller', role: 'EU Director' },
      { name: 'Lisa Tanaka', role: 'APAC Lead' },
    ],
    pageCount: 42, language: 'English', extractedDate: '2025-03-10T08:05:00Z',
  },
  f2: {
    entities: [
      { name: 'Meridian Health', type: 'Organization', confidence: 0.95 },
      { name: 'Sarah Johnson', type: 'Person', confidence: 0.91 },
      { name: 'Meridian Pharma', type: 'Organization', confidence: 0.82 },
    ],
    suggestedMatch: { entityId: 'meridian', entityName: 'Meridian Health', confidence: 0.95 },
    financialMetrics: [
      { label: 'Revenue', value: '$89,300,000' },
      { label: 'COGS', value: '$41,800,000' },
      { label: 'Gross Profit', value: '$47,500,000' },
      { label: 'EBITDA', value: '$21,850,000' },
      { label: 'Net Income', value: '$14,500,000' },
    ],
    orgReferences: [
      { name: 'Sarah Johnson', role: 'CEO' },
      { name: 'David Kim', role: 'Pharma Division Head' },
    ],
    pageCount: 36, language: 'English', extractedDate: '2025-03-11T10:35:00Z',
  },
  f3: {
    entities: [
      { name: 'Nexus Technologies', type: 'Organization', confidence: 0.96 },
      { name: 'Maria Rodriguez', type: 'Person', confidence: 0.89 },
      { name: 'Nexus AI Labs', type: 'Organization', confidence: 0.80 },
    ],
    suggestedMatch: { entityId: 'nexus', entityName: 'Nexus Technologies', confidence: 0.96 },
    financialMetrics: [
      { label: 'Revenue', value: '$67,800,000' },
      { label: 'COGS', value: '$28,900,000' },
      { label: 'Gross Profit', value: '$38,900,000' },
      { label: 'EBITDA', value: '$15,200,000' },
      { label: 'Net Income', value: '$9,800,000' },
    ],
    orgReferences: [
      { name: 'Maria Rodriguez', role: 'CTO' },
      { name: 'Raj Patel', role: 'AI Labs Director' },
    ],
    pageCount: 28, language: 'English', extractedDate: '2025-03-12T14:05:00Z',
  },
  f4: {
    entities: [
      { name: 'Acme Asia Pacific', type: 'Organization', confidence: 0.94 },
      { name: 'Lisa Tanaka', type: 'Person', confidence: 0.88 },
    ],
    suggestedMatch: { entityId: 'acme-asia', entityName: 'Acme Asia Pacific', confidence: 0.94 },
    financialMetrics: [
      { label: 'Revenue (Supplementary)', value: '$12,400,000' },
      { label: 'Operating Expenses', value: '$8,200,000' },
      { label: 'Net Margin', value: '33.9%' },
    ],
    orgReferences: [{ name: 'Lisa Tanaka', role: 'Regional Lead' }],
    pageCount: 14, language: 'English', extractedDate: '2025-03-13T09:25:00Z',
  },
};

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const badge = percent >= 90 ? 'bg-green-100 text-green-800' : percent >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${badge}`}>
      {percent}%
    </span>
  );
}

export default function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();

  const file = taggedFiles.find(f => f.id === fileId);
  const data = fileId ? extractedData[fileId] : null;

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">File not found.</p>
      </div>
    );
  }

  const status = statusConfig[file.status];
  const StatusIcon = status?.icon || Clock;

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/file-tagging')} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-red-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{file.fileName}</h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{file.size}</span>
                <span>•</span>
                <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.badge}`}>
                  <StatusIcon className="h-3 w-3" />
                  {file.status}
                </span>
              </div>
            </div>
          </div>
          {file.taggedEntityName && (
            <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <Link2 className="h-3 w-3" />
              {file.taggedEntityName}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {file.status !== 'processed' || !data ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-2">
            <Clock className="h-10 w-10 mx-auto text-gray-300" />
            <p className="text-sm text-gray-500">This file has not been processed yet.</p>
            <p className="text-xs text-gray-400">Trigger OCR extraction from the file list to process this file.</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="render" className="p-6">
          <TabsList className="mb-6 bg-gray-100 rounded-lg p-1">
            <TabsTrigger value="render" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Document Preview</TabsTrigger>
            <TabsTrigger value="info" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Extracted Information</TabsTrigger>
          </TabsList>

          <TabsContent value="render">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-gray-50 rounded-lg min-h-[500px] flex flex-col items-center justify-center gap-4 p-8">
                <FileText className="h-16 w-16 text-gray-300" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                  <p className="text-xs text-gray-500">{data.pageCount} pages • {data.language} • {file.size}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-lg">
                  {Array.from({ length: Math.min(6, data.pageCount) }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-md aspect-[3/4] flex items-center justify-center shadow-sm">
                      <span className="text-xs text-gray-400">Page {i + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">PDF render preview (simulated)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            {data.suggestedMatch && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Suggested Entity Match
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{data.suggestedMatch.entityName}</p>
                      <p className="text-xs text-gray-500">System entity match based on extracted content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence</span>
                    <ConfidenceBadge value={data.suggestedMatch.confidence} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  Extracted Entities
                </h3>
                <div className="space-y-2">
                  {data.entities.map((entity, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entity.name}</p>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{entity.type}</p>
                      </div>
                      <ConfidenceBadge value={entity.confidence} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  Org Chart References
                </h3>
                <div className="space-y-2">
                  {data.orgReferences.map((person, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {person.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-[10px] text-gray-500">{person.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                Extracted Financial Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.financialMetrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-md bg-gray-50 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{metric.label}</p>
                    <p className="text-sm font-semibold font-mono text-gray-900">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Extraction Metadata</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Pages', value: data.pageCount },
                  { label: 'Language', value: data.language },
                  { label: 'Processed', value: new Date(data.extractedDate).toLocaleString() },
                  { label: 'Entities Found', value: data.entities.length },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
