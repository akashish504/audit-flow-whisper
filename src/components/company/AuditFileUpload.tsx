import { useState, useRef } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedAuditFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface AuditFileUploadProps {
  companyId: string;
  files: UploadedAuditFile[];
  onFilesChange: (files: UploadedAuditFile[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AuditFileUpload({ companyId, files, onFilesChange }: AuditFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const newFiles: UploadedAuditFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      newFiles.push({
        id: `audit-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      });
    }

    onFilesChange([...newFiles, ...files]);
    toast.success(`${newFiles.length} file(s) uploaded`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
    toast.success('File removed');
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Audit Files</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Upload className="h-3 w-3" /> Upload Files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Click to upload audit files</p>
        </div>
      ) : (
        <div className="space-y-1">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group">
              <FileText className="h-4 w-4 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{f.size}</p>
              </div>
              <button
                onClick={() => handleRemove(f.id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedAuditFile };
