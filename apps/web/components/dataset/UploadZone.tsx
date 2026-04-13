'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadZone() {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];

    setState('uploading');
    setProgress(0);
    setError('');

    const form = new FormData();
    form.append('file', file);

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 85));
      }, 200);

      const res = await fetch('/api/datasets/upload', { method: 'POST', body: form });
      clearInterval(progressInterval);
      setProgress(100);

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Upload failed');
      }

      setState('success');
      setTimeout(() => {
        router.push(`/dashboard/datasets/${json.data.id}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Upload failed. Please try again.');
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    disabled: state === 'uploading',
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : state === 'success'
            ? 'border-green-400 bg-green-50'
            : state === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
      >
        <input {...getInputProps()} />

        {state === 'idle' && (
          <>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-gray-900 mb-1">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <p className="text-xs text-gray-400">CSV, Excel (.xlsx, .xls), JSON · Max 50 MB</p>
          </>
        )}

        {state === 'uploading' && (
          <>
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-gray-900 mb-3">Uploading...</p>
            <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress}%</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-green-700">Upload successful!</p>
            <p className="text-sm text-gray-500 mt-1">Processing your dataset...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="font-medium text-red-700 mb-1">Upload failed</p>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setState('idle'); setError(''); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
