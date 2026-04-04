import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaggedFile, companies } from '@/data/mockData';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToS3, generateS3Key } from '@/lib/s3Upload';
import { FileText, Upload, Tag, CheckCircle2, Clock, AlertTriangle, RotateCcw, ChevronLeft, CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ElementType; badge: string }> = {
  processed: { icon: CheckCircle2, badge: 'bg-green-100 text-green-800' },
  pending: { icon: Clock, badge: 'bg-yellow-100 text-yellow-800' },
  error: { icon: AlertTriangle, badge: 'bg-red-100 text-red-800' },
};

type TagStep = 'cycle' | 'company' | 'entity' | 'confirm';

export default function FileTaggingPage() {
  const [files, setFiles] = useState<TaggedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const navigate = useNavigate();
  const { rcCycles, rcEntries } = useAppState();

  // Upload flow state — single view
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCycleId, setUploadCycleId] = useState('');
  const [uploadCompanyName, setUploadCompanyName] = useState('');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Tag flow state — auto-advance
  const [taggingFileId, setTaggingFileId] = useState<string | null>(null);
  const [tagStep, setTagStep] = useState<TagStep>('cycle');
  const [tagCycleId, setTagCycleId] = useState('');
  const [tagCompanyName, setTagCompanyName] = useState('');
  const [tagEntityId, setTagEntityId] = useState('');

  const entities = companies.filter(c => c.parentId !== null);

  // Load files from Supabase on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('audit_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const mapped: TaggedFile[] = (data || []).map(row => ({
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        uploadedAt: row.created_at,
        size: row.file_size,
        taggedEntityId: row.company_id,
        taggedEntityName: row.entity_name,
        status: row.extracted_data ? 'processed' as const : 'pending' as const,
      }));
      setFiles(mapped);
    } catch (err) {
      console.error('Failed to load files:', err);
      toast.error('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const companiesForCycle = (cycleId: string) => {
    const names = new Set(rcEntries.filter(e => e.reviewCycleId === cycleId).map(e => e.companyName));
    return Array.from(names);
  };

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
    setUploadCycleId('');
    setUploadCompanyName('');
    setUploadEntityId('');
    setUploadFileName('');
    setUploadFile(null);
    setShowUploadDialog(true);
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      // Determine company_id — look up from Supabase companies table
      let companyId = '';
      let entityName = uploadFileName;

      if (uploadCompanyName) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', uploadCompanyName)
          .limit(1)
          .maybeSingle();
        if (companyData) companyId = companyData.id;
      }

      if (!companyId) {
        // Use first company as fallback
        const { data: firstCompany } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .maybeSingle();
        companyId = firstCompany?.id || '';
      }

      if (!companyId) {
        toast.error('No company found to associate the file with');
        setUploading(false);
        return;
      }

      const entity = uploadEntityId ? companies.find(c => c.id === uploadEntityId) : null;
      entityName = entity?.name || uploadCompanyName || 'Untagged';

      const s3Key = generateS3Key(`audit-files/${companyId}`, uploadFile.name);

      // Upload to S3
      await uploadFileToS3(uploadFile, s3Key);

      // Format file size
      const sizeKB = uploadFile.size / 1024;
      const fileSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;

      // Save metadata to Supabase
      const { error } = await supabase
        .from('audit_files')
        .insert({
          company_id: companyId,
          file_name: uploadFile.name,
          file_type: uploadFile.type,
          file_size: fileSize,
          s3_key: s3Key,
          entity_name: entityName,
          review_period: uploadCycleId ? (rcCycles.find(c => c.id === uploadCycleId)?.label || '') : '',
        });

      if (error) throw error;

      setShowUploadDialog(false);
      toast.success(entity ? `File uploaded and tagged to ${entity.name}` : 'File uploaded successfully');
      await loadFiles();
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Tag flow — auto-advance handlers
  const openTagDialog = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaggingFileId(fileId);
    setTagStep('cycle');
    setTagCycleId('');
    setTagCompanyName('');
    setTagEntityId('');
  };

  const handleTagCycleSelect = (cycleId: string) => {
    setTagCycleId(cycleId);
    setTagCompanyName('');
    setTagEntityId('');
    setTagStep('company');
  };

  const handleTagCompanySelect = (companyName: string) => {
    setTagCompanyName(companyName);
    setTagEntityId('');
    setTagStep('entity');
  };

  const handleTagEntitySelect = (entityId: string) => {
    setTagEntityId(entityId);
    setTagStep('confirm');
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

  const tagStepBack = (step: TagStep) => {
    if (step === 'company') { setTagStep('cycle'); setTagCycleId(''); }
    else if (step === 'entity') { setTagStep('company'); setTagCompanyName(''); }
    else if (step === 'confirm') { setTagStep('entity'); setTagEntityId(''); }
  };

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

      {/* Upload File Dialog — single view with file input + optional tagging */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUploadDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Upload File</h3>

            {/* File input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                {uploadFileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-gray-700">{uploadFileName}</span>
                    <button onClick={() => setUploadFileName('')} className="text-xs text-gray-400 hover:text-red-500 ml-2">Remove</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <CloudUpload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to browse or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, XLSX, DOCX up to 50MB</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFileName(file.name);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Optional tagging section */}
            <div className="border-t border-gray-100 pt-4 mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Tag to Entity <span className="text-gray-400 normal-case font-normal">(optional)</span></p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Review Cycle</label>
                  <select
                    value={uploadCycleId}
                    onChange={e => { setUploadCycleId(e.target.value); setUploadCompanyName(''); setUploadEntityId(''); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a review cycle...</option>
                    {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {uploadCycleId && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Company</label>
                    <select
                      value={uploadCompanyName}
                      onChange={e => { setUploadCompanyName(e.target.value); setUploadEntityId(''); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a company...</option>
                      {uploadCompanies.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    {uploadCompanies.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No companies in this cycle.</p>
                    )}
                  </div>
                )}

                {uploadCompanyName && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entity</label>
                    <select
                      value={uploadEntityId}
                      onChange={e => setUploadEntityId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select an entity...</option>
                      {uploadEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    {uploadEntities.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No entities found.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowUploadDialog(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleUploadConfirm}
                disabled={!uploadFileName}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploadFileName ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag File Dialog — auto-advance on select */}
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
                  onChange={e => handleTagCycleSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a review cycle...</option>
                  {rcCycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setTaggingFileId(null)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}

            {tagStep === 'company' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Company</label>
                <select
                  value={tagCompanyName}
                  onChange={e => handleTagCompanySelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a company...</option>
                  {tagCompanies.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <div className="flex justify-start mt-5">
                  <button onClick={() => tagStepBack('company')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                </div>
              </div>
            )}

            {tagStep === 'entity' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Select Entity</label>
                <select
                  value={tagEntityId}
                  onChange={e => handleTagEntitySelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select an entity...</option>
                  {tagEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="flex justify-start mt-5">
                  <button onClick={() => tagStepBack('entity')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
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
                <div className="flex justify-between">
                  <button onClick={() => tagStepBack('confirm')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
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
