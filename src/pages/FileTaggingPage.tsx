import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { taggedFiles as initialFiles, TaggedFile, companies } from '@/data/mockData';
import { useAppState } from '@/context/AppContext';
import { FileText, Upload, Tag, CheckCircle2, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ElementType; badge: string }> = {
  processed: { icon: CheckCircle2, badge: 'bg-green-100 text-green-800' },
  pending: { icon: Clock, badge: 'bg-yellow-100 text-yellow-800' },
  error: { icon: AlertTriangle, badge: 'bg-red-100 text-red-800' },
};

type UploadStep = 'cycle' | 'company' | 'entity';
type TagStep = 'cycle' | 'company' | 'entity' | 'confirm';

export default function FileTaggingPage() {
  const [files, setFiles] = useState<TaggedFile[]>(initialFiles);
  const navigate = useNavigate();
  const { rcCycles, rcEntries } = useAppState();

  // Upload flow state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('cycle');
  const [uploadCycleId, setUploadCycleId] = useState('');
  const [uploadCompanyName, setUploadCompanyName] = useState('');
  const [uploadEntityId, setUploadEntityId] = useState('');

  // Tag flow state
  const [taggingFileId, setTaggingFileId] = useState<string | null>(null);
  const [tagStep, setTagStep] = useState<TagStep>('cycle');
  const [tagCycleId, setTagCycleId] = useState('');
  const [tagCompanyName, setTagCompanyName] = useState('');
  const [tagEntityId, setTagEntityId] = useState('');

  const entities = companies.filter(c => c.parentId !== null);

  // Companies for a selected review cycle
  const companiesForCycle = (cycleId: string) => {
    const names = new Set(rcEntries.filter(e => e.reviewCycleId === cycleId).map(e => e.companyName));
    return Array.from(names);
  };

  // Entities for a selected company name
  const entitiesForCompany = (companyName: string) => {
    const company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase() && c.parentId === null);
    if (!company) return entities;
    return companies.filter(c => c.parentId === company.id);
  };

  const handleRetrigger = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'pending' as const } : f));
    toast.success('OCR extraction retriggered');
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processed' as const } : f));
      toast.success('Processing complete');
    }, 2000);
  };

  // Upload flow
  const openUploadDialog = () => {
    setUploadStep('cycle');
    setUploadCycleId('');
    setUploadCompanyName('');
    setUploadEntityId('');
    setShowUploadDialog(true);
  };

  const handleUploadConfirm = () => {
    const entity = companies.find(c => c.id === uploadEntityId);
    const newFile: TaggedFile = {
      id: `f-${Date.now()}`,
      fileName: `Uploaded_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      fileType: 'pdf',
      uploadedAt: new Date().toISOString(),
      size: '1.5 MB',
      taggedEntityId: uploadEntityId || null,
      taggedEntityName: entity?.name || null,
      status: 'pending',
    };
    setFiles(prev => [newFile, ...prev]);
    setShowUploadDialog(false);
    toast.success(`File uploaded and attached to ${entity?.name || 'entity'}`);
  };

  // Tag flow
  const openTagDialog = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaggingFileId(fileId);
    setTagStep('cycle');
    setTagCycleId('');
    setTagCompanyName('');
    setTagEntityId('');
  };

  const handleTagConfirm = () => {
    if (!taggingFileId) return;
    const entity = companies.find(c => c.id === tagEntityId);
    setFiles(prev => prev.map(f =>
      f.id === taggingFileId ? { ...f, taggedEntityId: tagEntityId, taggedEntityName: entity?.name || null } : f
    ));
    setTaggingFileId(null);
    toast.success(`File tagged to ${entity?.name}`);
  };

  const uploadCompanies = useMemo(() => companiesForCycle(uploadCycleId), [uploadCycleId, rcEntries]);
  const uploadEntities = useMemo(() => entitiesForCompany(uploadCompanyName), [uploadCompanyName]);
  const tagCompanies = useMemo(() => companiesForCycle(tagCycleId), [tagCycleId, rcEntries]);
  const tagEntities = useMemo(() => entitiesForCompany(tagCompanyName), [tagCompanyName]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Tagging</h1>
          <p className="text-xs text-gray-500 mt-1">Manage and tag PDF files to portfolio entities</p>
        </div>
        <button onClick={openUploadDialog} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
                    <span className="text-sm text-gray-500">
                      {file.taggedEntityName || <span className="italic">Untagged</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => openTagDialog(file.id, e)}
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

      {/* Upload File Dialog - stepped flow */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUploadDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Upload File</h3>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-5">
              {['Review Cycle', 'Company', 'Entity'].map((label, i) => {
                const stepKeys: UploadStep[] = ['cycle', 'company', 'entity'];
                const currentIdx = stepKeys.indexOf(uploadStep);
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <div className={`w-6 h-px ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-800' : isDone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>{label}</span>
                  </div>
                );
              })}
            </div>

            {uploadStep === 'cycle' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Review Cycle</label>
                <select
                  value={uploadCycleId}
                  onChange={e => setUploadCycleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a review cycle...</option>
                  {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setShowUploadDialog(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={() => setUploadStep('company')}
                    disabled={!uploadCycleId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploadCycleId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Next</button>
                </div>
              </div>
            )}

            {uploadStep === 'company' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Company</label>
                <select
                  value={uploadCompanyName}
                  onChange={e => setUploadCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a company...</option>
                  {uploadCompanies.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                {uploadCompanies.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">No companies in this review cycle.</p>
                )}
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setUploadStep('cycle')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={() => setUploadStep('entity')}
                    disabled={!uploadCompanyName}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploadCompanyName ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Next</button>
                </div>
              </div>
            )}

            {uploadStep === 'entity' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Entity</label>
                <select
                  value={uploadEntityId}
                  onChange={e => setUploadEntityId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select an entity...</option>
                  {uploadEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {uploadEntities.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">No entities found for this company.</p>
                )}
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setUploadStep('company')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={handleUploadConfirm}
                    disabled={!uploadEntityId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploadEntityId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Upload & Attach</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tag File Dialog - stepped flow */}
      {taggingFileId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setTaggingFileId(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {files.find(f => f.id === taggingFileId)?.taggedEntityId ? 'Retag' : 'Tag'} File
            </h3>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-5">
              {['Review Cycle', 'Company', 'Entity', 'Confirm'].map((label, i) => {
                const stepKeys: TagStep[] = ['cycle', 'company', 'entity', 'confirm'];
                const currentIdx = stepKeys.indexOf(tagStep);
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <div className={`w-6 h-px ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-800' : isDone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>{label}</span>
                  </div>
                );
              })}
            </div>

            {tagStep === 'cycle' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Review Cycle</label>
                <select
                  value={tagCycleId}
                  onChange={e => setTagCycleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a review cycle...</option>
                  {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setTaggingFileId(null)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={() => setTagStep('company')}
                    disabled={!tagCycleId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tagCycleId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Next</button>
                </div>
              </div>
            )}

            {tagStep === 'company' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Company</label>
                <select
                  value={tagCompanyName}
                  onChange={e => setTagCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a company...</option>
                  {tagCompanies.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setTagStep('cycle')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={() => setTagStep('entity')}
                    disabled={!tagCompanyName}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tagCompanyName ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Next</button>
                </div>
              </div>
            )}

            {tagStep === 'entity' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Entity</label>
                <select
                  value={tagEntityId}
                  onChange={e => setTagEntityId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select an entity...</option>
                  {tagEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setTagStep('company')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={() => setTagStep('confirm')}
                    disabled={!tagEntityId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tagEntityId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >Next</button>
                </div>
              </div>
            )}

            {tagStep === 'confirm' && (
              <div>
                <p className="text-sm text-gray-500 mb-1">You are about to tag this file:</p>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-4 space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-medium">File:</span> {files.find(f => f.id === taggingFileId)?.fileName}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Review Cycle:</span> {rcCycles.find(c => c.id === tagCycleId)?.label}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Company:</span> {tagCompanyName}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Entity:</span> {companies.find(c => c.id === tagEntityId)?.name}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setTagStep('entity')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={handleTagConfirm}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  >Confirm & Tag</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
