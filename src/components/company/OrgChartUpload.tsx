import { useState, useRef } from 'react';
import { Upload, RefreshCw, FileImage, X } from 'lucide-react';
import { toast } from 'sonner';

interface OrgChartUploadProps {
  companyId: string;
  onFileUploaded: (file: File, url: string) => void;
  uploadedFile?: { name: string; url: string; type: string } | null;
  onClear: () => void;
}

export function OrgChartUpload({ companyId, onFileUploaded, uploadedFile, onClear }: OrgChartUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload an image (PNG, JPG, SVG, WebP) or PDF file');
      return;
    }

    const url = URL.createObjectURL(file);
    onFileUploaded(file, url);
    toast.success(`Org chart "${file.name}" uploaded`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Org Chart Document</h3>
        <div className="flex items-center gap-2">
          {uploadedFile && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            {uploadedFile ? <RefreshCw className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
            {uploadedFile ? 'Re-upload' : 'Upload'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedFile ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileImage className="h-3.5 w-3.5" />
            <span className="truncate">{uploadedFile.name}</span>
          </div>
          {uploadedFile.type === 'application/pdf' ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={uploadedFile.url}
                className="w-full h-[500px]"
                title="Org Chart PDF"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
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
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Click to upload org chart</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, WebP, or PDF</p>
        </div>
      )}
    </div>
  );
}
