import React, { useState } from 'react';
import { UploadZone } from '../components/UploadZone';
import { CoachSession } from '../components/CoachSession';
import type { ExtractedQuestion } from '../types';
import { AlertCircle, X } from 'lucide-react';

export const HomeworkCoachAgent: React.FC = () => {
  const [question, setQuestion] = useState<ExtractedQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (data: ExtractedQuestion) => {
    setQuestion(data);
    setError(null);
  };

  const handleError = (msg: string) => {
    setError(msg);
  };

  const handleReset = () => {
    setQuestion(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {error && (
        <div className="max-w-3xl mx-auto w-full px-4 mt-6 animate-fade-in">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3.5 rounded-xl flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Configuration Alert</span>
                <span className="text-sm text-slate-300">{error}</span>
              </div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in w-full">
        {!question && (
          <div className="mb-8">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
              [ homework coach solver ]
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              Homework Coach Agent
            </h2>
            <p className="text-slate-400 text-sm">
              OCR homework parser and explainer. Upload a picture of a problem for conceptual coaching, active checkpoints, and worked-out scaffoldings.
            </p>
          </div>
        )}

        {!question ? (
          <UploadZone 
            onUploadSuccess={handleUploadSuccess} 
            onError={handleError} 
          />
        ) : (
          <CoachSession 
            initialQuestion={question} 
            onReset={handleReset} 
          />
        )}
      </div>
    </div>
  );
};
