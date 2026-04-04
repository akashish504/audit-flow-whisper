import { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, FileImage, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToS3, generateS3Key, getSignedUrl } from '@/lib/s3Upload';

interface OrgChartUploadProps {
  companyId: string;
  onFileUploaded: (file: File, url: string) => void;
  onFileLoaded?: (info: { name: string; url: string; type: string }) => void;
  uploadedFile?: { name: string; url: string; type: string } | null;
  onClear: () => void;
  onExtractionStarted?: () => void;
}

export function OrgChartUpload({ companyId, onFileUploaded, uploadedFile, onClear, onExtractionStarted }: OrgChartUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing org chart from Supabase on mount
  useEffect(() => {
    loadOrgChart();
  }, [companyId]);

  const loadOrgChart = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('org_chart_files')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const url = await getSignedUrl(data.s3_key, 'read');
        onFileUploaded({ name: data.file_name } as File, url);
      }
    } catch (err) {
      console.error('Failed to load org chart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload an image (PNG, JPG, SVG, WebP), PDF, or Excel file');
      return;
    }

    setUploading(true);
    try {
      const s3Key = generateS3Key(`org-chart/${companyId}`, file.name);

      // Delete old entities when re-uploading
      await supabase.from('entities').delete().eq('company_id', companyId);

      // Upload to S3
      await uploadFileToS3(file, s3Key);

      // Save metadata to Supabase
      const { error } = await supabase
        .from('org_chart_files')
        .insert({
          company_id: companyId,
          file_name: file.name,
          file_type: file.type,
          s3_key: s3Key,
        });

      if (error) throw error;

      // Get signed URL for preview
      const url = await getSignedUrl(s3Key, 'read');
      onFileUploaded(file, url);
      onExtractionStarted?.();
      toast.success(`Org chart "${file.name}" uploaded — extracting entities...`);

      // Trigger AI extraction in the background
      supabase.functions.invoke('extract-org-chart', {
        body: { company_id: companyId, s3_key: s3Key },
      }).then(({ data: result, error: extractError }) => {
        if (extractError) {
          console.error('Extraction failed:', extractError);
          toast.error(`Entity extraction failed: ${extractError.message}`);
        } else if (result?.error) {
          console.error('Extraction error:', result.error);
          toast.error(`Entity extraction failed: ${result.error}`);
        } else {
          toast.success(`${result?.count || 0} entities extracted successfully`);
        }
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    try {
      // Delete all org chart records and entities for this company
      const [orgRes, entRes] = await Promise.all([
        supabase.from('org_chart_files').delete().eq('company_id', companyId),
        supabase.from('entities').delete().eq('company_id', companyId),
      ]);
      if (orgRes.error) throw orgRes.error;
      if (entRes.error) throw entRes.error;
      onClear();
      toast.success('Org chart and entities removed');
    } catch (err: any) {
      toast.error(`Failed to remove: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="border border-border rounded-lg bg-background p-4 flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Org Chart Document</h3>
        <div className="flex items-center gap-2">
          {uploadedFile && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
            ) : uploadedFile ? (
              <><RefreshCw className="h-3 w-3" /> Re-upload</>
            ) : (
              <><Upload className="h-3 w-3" /> Upload</>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedFile ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileImage className="h-3.5 w-3.5" />
            <span className="truncate">{uploadedFile.name}</span>
          </div>
          {uploadedFile.type === 'application/pdf' ? (
            <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
              <iframe
                src={uploadedFile.url}
                className="w-full h-[500px]"
                title="Org Chart PDF"
              />
            </div>
          ) : uploadedFile.type?.includes('sheet') || uploadedFile.type?.includes('excel') || uploadedFile.name?.endsWith('.xlsx') || uploadedFile.name?.endsWith('.xls') ? (
            <div className="border border-border rounded-lg bg-muted/30 flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">Excel file uploaded — entities will be extracted automatically.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
              <img
                src={uploadedFile.url}
                alt="Org Chart"
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload org chart</p>
          <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, SVG, WebP, PDF, or Excel</p>
        </div>
      )}
    </div>
  );
}
