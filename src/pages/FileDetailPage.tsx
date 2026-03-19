import { useParams, useNavigate } from 'react-router-dom';
import { taggedFiles, companies, reconciliationData, type TaggedFile } from '@/data/mockData';
import { ArrowLeft, FileText, Building2, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, Link2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  processed: { icon: CheckCircle2, color: 'text-success', label: 'Processed' },
  pending: { icon: Clock, color: 'text-warning', label: 'Pending' },
  error: { icon: AlertTriangle, color: 'text-destructive', label: 'Error' },
};

// Simulated extracted data per file
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
    pageCount: 42,
    language: 'English',
    extractedDate: '2025-03-10T08:05:00Z',
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
    pageCount: 36,
    language: 'English',
    extractedDate: '2025-03-11T10:35:00Z',
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
    pageCount: 28,
    language: 'English',
    extractedDate: '2025-03-12T14:05:00Z',
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
    orgReferences: [
      { name: 'Lisa Tanaka', role: 'Regional Lead' },
    ],
    pageCount: 14,
    language: 'English',
    extractedDate: '2025-03-13T09:25:00Z',
  },
};

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const variant = percent >= 90 ? 'default' : percent >= 75 ? 'secondary' : 'outline';
  return (
    <Badge variant={variant} className="text-[10px] font-mono">
      {percent}%
    </Badge>
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
        <p className="text-muted-foreground">File not found.</p>
      </div>
    );
  }

  const status = statusConfig[file.status];
  const StatusIcon = status?.icon || Clock;

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/file-tagging')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-destructive/70 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{file.fileName}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{file.size}</span>
                <span>•</span>
                <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${status?.color}`} />
                  <span className={`capitalize ${status?.color}`}>{file.status}</span>
                </div>
              </div>
            </div>
          </div>
          {file.taggedEntityName && (
            <Badge variant="outline" className="ml-auto shrink-0">
              <Link2 className="h-3 w-3 mr-1" />
              {file.taggedEntityName}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {file.status !== 'processed' || !data ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-2">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">This file has not been processed yet.</p>
            <p className="text-xs text-muted-foreground">Trigger OCR extraction from the file list to process this file.</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="render" className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="render">Document Preview</TabsTrigger>
            <TabsTrigger value="info">Extracted Information</TabsTrigger>
          </TabsList>

          {/* Render View */}
          <TabsContent value="render">
            <Card>
              <CardContent className="p-0">
                <div className="bg-muted rounded-lg min-h-[500px] flex flex-col items-center justify-center gap-4 p-8">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{data.pageCount} pages • {data.language} • {file.size}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-lg">
                    {Array.from({ length: Math.min(6, data.pageCount) }).map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-md aspect-[3/4] flex items-center justify-center shadow-sm">
                        <span className="text-xs text-muted-foreground">Page {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">PDF render preview (simulated)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Info View */}
          <TabsContent value="info" className="space-y-6">
            {/* Suggested Entity Match */}
            {data.suggestedMatch && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Suggested Entity Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{data.suggestedMatch.entityName}</p>
                        <p className="text-xs text-muted-foreground">System entity match based on extracted content</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <ConfidenceBadge value={data.suggestedMatch.confidence} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Extracted Entities */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Extracted Entities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.entities.map((entity, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">{entity.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{entity.type}</p>
                        </div>
                        <ConfidenceBadge value={entity.confidence} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Org Chart References */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Org Chart References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.orgReferences.map((person, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{person.name}</p>
                            <p className="text-[10px] text-muted-foreground">{person.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Extracted Financial Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.financialMetrics.map((metric, i) => (
                    <div key={i} className="p-3 rounded-md bg-secondary/50 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                      <p className="text-sm font-semibold font-mono text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Extraction Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Extraction Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pages</p>
                    <p className="font-medium text-foreground">{data.pageCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Language</p>
                    <p className="font-medium text-foreground">{data.language}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Processed</p>
                    <p className="font-medium text-foreground">{new Date(data.extractedDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Entities Found</p>
                    <p className="font-medium text-foreground">{data.entities.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
