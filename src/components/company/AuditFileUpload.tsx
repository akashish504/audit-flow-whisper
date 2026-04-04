import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToS3, generateS3Key, getSignedUrl } from '@/lib/s3Upload';

export interface UploadedAuditFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
  reviewPeriod: string;
  entityName: string;
  s3Key?: string;
}

interface AuditFileUploadProps {
  companyId: string;
  files: UploadedAuditFile[];
  onFilesChange: (files: UploadedAuditFile[]) => void;
  availableEntities: { id: string; name: string }[];
  availablePeriods: string[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AuditFileUpload({ companyId, files, onFilesChange, availableEntities, availablePeriods }: AuditFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Load files from Supabase on mount
  useEffect(() => {
    loadFiles();
  }, [companyId]);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('audit_files')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loaded: UploadedAuditFile[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.file_name,
        size: row.file_size,
        type: row.file_type,
        url: '', // Will be fetched on demand via signed URL
        uploadedAt: row.created_at,
        reviewPeriod: row.review_period,
        entityName: row.entity_name,
        s3Key: row.s3_key,
      }));
      onFilesChange(loaded);
    } catch (err) {
      console.error('Failed to load audit files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleUploadClick = () => {
    setSelectedPeriod(availablePeriods[0] || '');
    setSelectedEntity(availableEntities[0]?.name || '');
    setPendingFiles([]);
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setPendingFiles(Array.from(selected));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!selectedPeriod || !selectedEntity || pendingFiles.length === 0) {
      toast.error('Please select review period, entity, and at least one file');
      return;
    }

    setUploading(true);
    try {
      const newFiles: UploadedAuditFile[] = [];

      for (const file of pendingFiles) {
        const s3Key = generateS3Key(`audit/${companyId}`, file.name);

        // Upload to S3
        await uploadFileToS3(file, s3Key);

        // Save metadata to Supabase
        const { data, error } = await supabase
          .from('audit_files')
          .insert({
            company_id: companyId,
            entity_name: selectedEntity,
            review_period: selectedPeriod,
            file_name: file.name,
            file_size: formatSize(file.size),
            file_type: file.type,
            s3_key: s3Key,
          })
          .select()
          .single();

        if (error) throw error;

        newFiles.push({
          id: data.id,
          name: file.name,
          size: formatSize(file.size),
          type: file.type,
          url: '',
          uploadedAt: data.created_at,
          reviewPeriod: selectedPeriod,
          entityName: selectedEntity,
          s3Key: s3Key,
        });

        // Trigger AI extraction in the background
        supabase.functions.invoke('extract-audit-data', {
          body: { audit_file_id: data.id, s3_key: s3Key },
        }).then(({ data: extractResult, error: extractError }) => {
          if (extractError) {
            console.error('Extraction failed:', extractError);
            toast.error(`AI extraction failed for ${file.name}`);
          } else {
            toast.success(`Financial data extracted from ${file.name}`);
          }
        });
      }

      onFilesChange([...newFiles, ...files]);
      toast.success(`${newFiles.length} file(s) uploaded to S3 for ${selectedEntity} — ${selectedPeriod}`);
      setDialogOpen(false);
      setPendingFiles([]);
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('audit_files').delete().eq('id', id);
      if (error) throw error;
      onFilesChange(files.filter(f => f.id !== id));
      toast.success('File removed');
    } catch (err: any) {
      toast.error(`Failed to remove: ${err.message}`);
    }
  };

  const handleFileClick = async (file: UploadedAuditFile) => {
    if (!file.s3Key) return;
    try {
      const url = await getSignedUrl(file.s3Key, 'read');
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(`Failed to get download URL: ${err.message}`);
    }
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-border rounded-lg bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Audit Files</h3>
        <Button size="sm" onClick={handleUploadClick} className="h-7 text-xs gap-1.5">
          <Upload className="h-3 w-3" /> Upload Files
        </Button>
      </div>

      {loadingFiles ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div
          onClick={handleUploadClick}
          className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload audit files</p>
        </div>
      ) : (
        <div className="space-y-1">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 group">
              <FileText className="h-4 w-4 text-destructive/60 shrink-0" />
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleFileClick(f)}
              >
                <p className="text-sm text-foreground truncate hover:underline">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.size} · {f.entityName} · {f.reviewPeriod}</p>
              </div>
              <button
                onClick={() => handleRemove(f.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Upload Audit Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Review Period *</label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availablePeriods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Entity *</label>
              <select
                value={selectedEntity}
                onChange={e => setSelectedEntity(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableEntities.map(ent => (
                  <option key={ent.id} value={ent.name}>{ent.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Files *</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground/50 mb-1" />
                <p className="text-xs text-muted-foreground">Click to select files</p>
              </button>
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-foreground bg-muted/50 rounded px-2 py-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-muted-foreground">{formatSize(f.size)}</span>
                      <button onClick={() => removePendingFile(idx)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancel</Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!selectedPeriod || !selectedEntity || pendingFiles.length === 0 || uploading}
            >
              {uploading ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...</>
              ) : (
                <>Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
