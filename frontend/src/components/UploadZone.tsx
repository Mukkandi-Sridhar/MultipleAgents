import React, { useState, useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { API_BASE_URL } from '../lib/apiConfig';

interface UploadZoneProps {
  onUploadSuccess: (data: any) => void;
  onError: (msg: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess, onError }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeout1Ref = useRef<any>(null);
  const timeout2Ref = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timeout1Ref.current) clearTimeout(timeout1Ref.current);
      if (timeout2Ref.current) clearTimeout(timeout2Ref.current);
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (!(isImage || isPdf || isText)) {
      onError('Unsupported format. Please upload an image, PDF, or text file.');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      onError('File exceeds the 10MB maximum limit.');
      return;
    }

    setLoading(true);
    setLoadingStep('Uploading question image...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Clear any previous timeouts
      if (timeout1Ref.current) clearTimeout(timeout1Ref.current);
      if (timeout2Ref.current) clearTimeout(timeout2Ref.current);

      // Small artificial delays to show stages (helps readability and matches a premium feel)
      timeout1Ref.current = setTimeout(() => setLoadingStep('Extracting homework question text via Vision OCR...'), 800);
      timeout2Ref.current = setTimeout(() => setLoadingStep('Analyzing concept & setting scaffolding method...'), 1800);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'API server returned an error');
      }

      const data = await response.json();
      if (data.success) {
        onUploadSuccess(data);
      } else {
        throw new Error('Failed to analyze image');
      }
    } catch (err: any) {
      console.error(err);
      onError(err.message || `Could not connect to the local FastAPI server or LLM service failed. Ensure the backend is running at ${API_BASE_URL} and valid OpenAI API key is provided.`);
    } finally {
      if (timeout1Ref.current) clearTimeout(timeout1Ref.current);
      if (timeout2Ref.current) clearTimeout(timeout2Ref.current);
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const loadDemo = async () => {
    setLoading(true);
    setLoadingStep('Initializing mock math sandbox demo (12 x 15)...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/demo`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to load demo');
      }
      const data = await response.json();
      if (data.success) {
        onUploadSuccess(data);
      } else {
        throw new Error('Failed to load demo payload');
      }
    } catch (e) {
      onError('Demo load failed.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full mt-10 p-4 animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Master Concepts, <span className="gradient-text">Don't Just Copy Answers</span>
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Snap a photo or drag a screenshot of any homework question. Our AI coach guides you step-by-step through the underlying logic.
        </p>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center min-h-[300px] transition-all duration-300 ${
          isDragActive 
            ? 'border-brand-500 bg-brand-500/5 shadow-glow-purple-strong scale-[1.01]' 
            : 'border-white/10 hover:border-brand-500/40 bg-dark-900/40 backdrop-blur-md shadow-lg hover:shadow-glow-purple'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept="image/*,application/pdf,text/plain,text/markdown"
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-4 animate-fade-in text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-t-2 border-brand-500 border-r-2 border-r-transparent animate-spin"></div>
              <Loader className="w-6 h-6 text-brand-400 absolute animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium text-white">Analyzing Homework File</p>
              <p className="text-sm text-slate-400 animate-pulse">{loadingStep}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6">
            <div>
              <p className="text-lg font-medium text-white mb-1">
                Drag and drop your file here, or{' '}
                <span onClick={triggerInput} className="text-brand-400 hover:text-brand-300 cursor-pointer font-semibold underline decoration-2 underline-offset-4">
                  browse files
                </span>
              </p>
              <p className="text-sm text-slate-500">Supports images, PDFs, and text files up to 10MB</p>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-white/5 w-full justify-center">
              <button 
                onClick={triggerInput} 
                className="border border-white/10 hover:border-white/20 bg-white/5 text-slate-200 text-xs font-semibold tracking-wider uppercase px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Select File
              </button>
              <button 
                onClick={loadDemo}
                className="border border-brand-500/20 hover:border-brand-500/40 bg-brand-500/5 text-brand-300 text-xs font-semibold tracking-wider uppercase px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Try Sandbox Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
