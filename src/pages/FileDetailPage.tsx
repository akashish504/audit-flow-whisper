import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/s3Upload';

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

  useEffect(() => {
    if (!fileId) return;
    loadFile();
    return () => {
      // Clean up blob URL on unmount
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

      // Fetch as blob for inline preview (avoids Chrome cross-origin iframe blocking)
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

      {/* Document Preview */}
      <div className="flex-1 p-6">
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
      </div>
    </div>
  );
}
