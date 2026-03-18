import { useState } from 'react';
import { taggedFiles as initialFiles, TaggedFile, companies } from '@/data/mockData';
import { FileText, Upload, Tag, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  processed: { icon: CheckCircle2, color: 'text-success' },
  pending: { icon: Clock, color: 'text-warning' },
  error: { icon: AlertTriangle, color: 'text-destructive' },
};

export default function FileTaggingPage() {
  const [files, setFiles] = useState<TaggedFile[]>(initialFiles);
  const [taggingFileId, setTaggingFileId] = useState<string | null>(null);

  const entities = companies.filter(c => c.parentId !== null);

  const handleTag = (fileId: string, entityId: string) => {
    const entity = companies.find(c => c.id === entityId);
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, taggedEntityId: entityId, taggedEntityName: entity?.name || null } : f
    ));
    setTaggingFileId(null);
    toast.success(`File tagged to ${entity?.name}`);
  };

  const handleUpload = () => {
    const newFile: TaggedFile = {
      id: `f-${Date.now()}`,
      fileName: `Uploaded_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      fileType: 'pdf',
      uploadedAt: new Date().toISOString(),
      size: '1.5 MB',
      taggedEntityId: null,
      taggedEntityName: null,
      status: 'pending',
    };
    setFiles(prev => [newFile, ...prev]);
    toast.success('File uploaded (simulated)');
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">File Tagging</h1>
          <p className="text-xs text-muted-foreground">Manage and tag PDF files to portfolio entities</p>
        </div>
        <button onClick={handleUpload} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md press-effect hover:opacity-90 transition-quart">
          <Upload className="h-3.5 w-3.5" /> Upload File
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="data-header text-left px-4 py-3">File Name</th>
              <th className="data-header text-left px-4 py-3">Uploaded</th>
              <th className="data-header text-left px-4 py-3">Size</th>
              <th className="data-header text-left px-4 py-3">Status</th>
              <th className="data-header text-left px-4 py-3">Tagged Entity</th>
              <th className="data-header text-center px-4 py-3 w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => {
              const StatusIcon = statusConfig[file.status]?.icon || Clock;
              const statusColorClass = statusConfig[file.status]?.color || 'text-muted-foreground';

              return (
                <tr key={file.id} className="border-t border-border hover:bg-accent/50 transition-quart">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-destructive/70 shrink-0" />
                      <span className="text-sm text-foreground">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{file.size}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`h-3.5 w-3.5 ${statusColorClass}`} />
                      <span className={`text-xs font-medium capitalize ${statusColorClass}`}>{file.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {taggingFileId === file.id ? (
                      <select
                        autoFocus
                        className="px-2 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={e => handleTag(file.id, e.target.value)}
                        onBlur={() => setTaggingFileId(null)}
                        defaultValue=""
                      >
                        <option value="" disabled>Select entity...</option>
                        {entities.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {file.taggedEntityName || <span className="italic">Untagged</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setTaggingFileId(file.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-quart press-effect mx-auto"
                    >
                      <Tag className="h-3 w-3" /> {file.taggedEntityId ? 'Retag' : 'Tag'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
