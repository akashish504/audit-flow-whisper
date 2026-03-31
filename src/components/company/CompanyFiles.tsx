import { useState } from 'react';
import { entityFiles, type EntityFile } from '@/data/mockData';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { FilePreviewOverlay } from './FilePreviewOverlay';
import { AuditFileUpload, type UploadedAuditFile } from './AuditFileUpload';

export function CompanyFiles({ companyId }: { companyId: string }) {
  const [previewFile, setPreviewFile] = useState<EntityFile | null>(null);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [uploadedAuditFiles, setUploadedAuditFiles] = useState<UploadedAuditFile[]>([]);

  const files = entityFiles.filter(f => f.companyId === companyId || f.entityId === companyId);

  const filesByEntity = files.reduce<Record<string, EntityFile[]>>((acc, f) => {
    if (!acc[f.entityId]) acc[f.entityId] = [];
    acc[f.entityId].push(f);
    return acc;
  }, {});

  const toggleEntity = (entityId: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      next.has(entityId) ? next.delete(entityId) : next.add(entityId);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <AuditFileUpload
        companyId={companyId}
        files={uploadedAuditFiles}
        onFilesChange={setUploadedAuditFiles}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Entity Files</h2>
          <span className="text-xs text-gray-500">{files.length} file(s)</span>
        </div>

        {Object.keys(filesByEntity).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No files attached</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(filesByEntity).map(([entityId, entityFiles]) => {
              const isExpanded = expandedEntities.has(entityId);
              return (
                <div key={entityId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleEntity(entityId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <span className="text-sm font-medium text-gray-900">{entityFiles[0].entityName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{entityFiles.length} file(s)</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {entityFiles.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setPreviewFile(f)}
                          className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <FileText className="h-4 w-4 text-red-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 truncate">{f.fileName}</p>
                            <p className="text-xs text-gray-400">{f.reviewPeriod}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FilePreviewOverlay file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
