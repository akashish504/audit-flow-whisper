import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/s3Upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AuditFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: string;
  s3_key: string;
  entity_name: string;
  review_period: string;
  created_at: string;
  extracted_data: any;
}

export default function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AuditFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    loadFile();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileId]);

  const loadFile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_files')
        .select('*')
        .eq('id', fileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      setFile(data as AuditFile);

      const url = await getSignedUrl(data.s3_key, 'read');
      setPreviewUrl(url);

      const isPdf = data.file_type === 'application/pdf' || data.file_name.endsWith('.pdf');
      const isImage = data.file_type.startsWith('image/');
      if (isPdf || isImage) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        } catch (e) {
          console.error('Failed to fetch file blob:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-audit-data', {
        body: { audit_file_id: file.id, s3_key: file.s3_key },
      });

      // supabase-js wraps non-2xx as FunctionsHttpError with context
      if (error) {
        // Try to parse the error body for structured messages
        const errorBody = typeof error === 'object' && 'context' in error
          ? await (error as any).context?.json?.().catch(() => null)
          : null;
        const msg = errorBody?.error || data?.error || error.message || 'Extraction failed';

        if (msg.toLowerCase().includes('payment required') || msg.toLowerCase().includes('add funds')) {
          toast.error('AI credits exhausted. Please add funds in Settings → Workspace → Usage.');
        } else if (msg.toLowerCase().includes('rate limit')) {
          toast.error('Rate limited. Please wait a moment and try again.');
        } else {
          toast.error(msg);
        }
        return;
      }

      // Also check for error in data (edge function may return 200 with error field)
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.extracted_data) {
        setFile({ ...file, extracted_data: data.extracted_data });
        toast.success('Data extracted successfully');
      } else {
        toast.error('No data could be extracted');
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      toast.error(err.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">File not found.</p>
      </div>
    );
  }

  const isPdf = file.file_type === 'application/pdf' || file.file_name.endsWith('.pdf');
  const isImage = file.file_type.startsWith('image/');
  const isExcel = file.file_name.endsWith('.xlsx') || file.file_name.endsWith('.xls');

  const formatKey = (key: string) => {
    return key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return val.toLocaleString();
    if (Array.isArray(val)) return JSON.stringify(val);
    return String(val);
  };

  // Recursively render nested objects with sub-headings
  const renderNestedSection = (obj: Record<string, any>, depth: number = 0): React.ReactNode => {
    const leafEntries: [string, any][] = [];
    const nestedEntries: [string, Record<string, any>][] = [];

    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        nestedEntries.push([k, v]);
      } else {
        leafEntries.push([k, v]);
      }
    }

    const indent = depth * 16; // px per nesting level

    return (
      <div style={{ marginLeft: indent > 0 ? indent : undefined }}>
        {leafEntries.length > 0 && (
          <Table>
            <TableBody>
              {leafEntries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="text-xs text-foreground">{formatKey(key)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{formatValue(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {nestedEntries.map(([key, value]) => {
          const headingClass = depth === 0
            ? 'text-sm font-semibold text-foreground bg-muted/30 px-4 py-2 border-y border-border'
            : 'text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1.5 border-b border-border/50';

          return (
            <div key={key}>
              <div className={headingClass}>{formatKey(key)}</div>
              {renderNestedSection(value, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderExtractedData = () => {
    if (!file.extracted_data) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No extracted data available yet.</p>
          <Button onClick={handleExtract} disabled={extracting || !previewUrl}>
            {extracting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Extracting...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Extract Data with AI</>
            )}
          </Button>
        </div>
      );
    }

    const data = file.extracted_data;

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return (
        <div className="rounded-lg border border-border p-4">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }

    const topLevelEntries = Object.entries(data as Record<string, any>);

    return (
      <div className="space-y-6">
        {topLevelEntries.map(([sectionKey, sectionValue]) => {
          if (sectionValue === null || sectionValue === undefined) return null;

          if (typeof sectionValue !== 'object') {
            return (
              <div key={sectionKey} className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">{formatKey(sectionKey)}</h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground">{formatValue(sectionValue)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={sectionKey} className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{formatKey(sectionKey)}</h3>
              </div>
              {renderNestedSection(sectionValue as Record<string, any>, 0)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/file-tagging')}
            className="p-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-red-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{file.file_name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{file.file_size}</span>
                <span>•</span>
                <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{file.entity_name}</span>
                {file.review_period && (
                  <>
                    <span>•</span>
                    <span>{file.review_period}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Open in new tab
            </a>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="preview" className="h-full flex flex-col">
          <TabsList className="mb-4 w-fit">
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
            <TabsTrigger value="extracted">
              Extracted Data
              {file.extracted_data && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">✓</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 mt-0">
            {(blobUrl || previewUrl) ? (
              isPdf ? (
                blobUrl ? (
                  <iframe
                    src={blobUrl}
                    className="w-full h-full min-h-[700px] rounded-lg border border-border"
                    title={file.file_name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )
              ) : isImage ? (
                <div className="flex items-center justify-center bg-muted/30 rounded-lg border border-border p-8">
                  <img
                    src={blobUrl || previewUrl}
                    alt={file.file_name}
                    className="max-w-full max-h-[700px] object-contain"
                  />
                </div>
              ) : isExcel ? (
                <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-border p-12 gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Excel files cannot be previewed inline.</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Download File
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-border p-12 gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Download File
                  </a>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-sm text-muted-foreground">Unable to load file preview.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="extracted" className="flex-1 mt-0">
            {renderExtractedData()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
