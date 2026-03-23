import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taggedFiles as initialFiles, TaggedFile, companies } from '@/data/mockData';
import { FileText, Upload, Tag, CheckCircle2, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ElementType; badge: string }> = {
  processed: { icon: CheckCircle2, badge: 'bg-green-100 text-green-800' },
  pending: { icon: Clock, badge: 'bg-yellow-100 text-yellow-800' },
  error: { icon: AlertTriangle, badge: 'bg-red-100 text-red-800' },
};

export default function FileTaggingPage() {
  const [files, setFiles] = useState<TaggedFile[]>(initialFiles);
  const [taggingFileId, setTaggingFileId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRetrigger = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'pending' as const } : f));
    toast.success('OCR extraction retriggered');
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processed' as const } : f));
      toast.success('Processing complete');
    }, 2000);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">File Tagging</h1>
          <p className="text-xs text-gray-500 mt-1">Manage and tag PDF files to portfolio entities</p>
        </div>
        <button onClick={handleUpload} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Upload className="h-3.5 w-3.5" /> Upload File
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">File Name</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Uploaded</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Size</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Status</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">Tagged Entity</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center px-4 py-3 w-20">Tag</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center px-4 py-3 w-20">Retrigger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map(file => {
              const config = statusConfig[file.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <tr
                  key={file.id}
                  className={`hover:bg-gray-50 transition-all ${file.status === 'processed' ? 'cursor-pointer' : ''}`}
                  onClick={() => file.status === 'processed' && navigate(`/file-tagging/${file.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-800">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{file.size}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="capitalize">{file.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {taggingFileId === file.id ? (
                      <select
                        autoFocus
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <span className="text-sm text-gray-500">
                        {file.taggedEntityName || <span className="italic">Untagged</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setTaggingFileId(file.id); }}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-all mx-auto"
                    >
                      <Tag className="h-3 w-3" /> {file.taggedEntityId ? 'Retag' : 'Tag'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => handleRetrigger(file.id, e)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-all mx-auto"
                      title="Retrigger OCR extraction"
                    >
                      <RotateCcw className="h-3 w-3" />
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
