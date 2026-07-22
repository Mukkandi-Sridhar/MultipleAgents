import React, { useState, useRef } from 'react';
import { FileText, Sparkles, Copy, Check, ShieldAlert } from 'lucide-react';
import { SVGChart } from '../components/svg/SVGChart';
import type { DocumentResponse } from '../types';
import { API_BASE_URL } from '../lib/apiConfig';

export const DocumentAgent: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const isJson = inputText.trim().startsWith('{') || inputText.trim().startsWith('[');
      const response = await fetch(`${API_BASE_URL}/api/documents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_raw: inputText,
          file_type: isJson ? 'json' : 'csv'
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'API server returned an error');
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not connect to the local server or call failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    
    // Format report as markdown
    const md = `# Executive Narrative Report\n\n${result.summary}\n\n## Key Insights\n${result.insights.map(ins => `- ${ins}`).join('\n')}\n\n## Aggregates Data Points\n${result.data_points.map(pt => `- **${pt.label}**: ${pt.value}`).join('\n')}`;
    
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in w-full">
      <div className="mb-8">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
          [ analytics & document parsing ]
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">
          Document & Report Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Upload or paste sales metrics datasets to compile aggregate statistics, visual line-charts, and executive narrative summaries.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="bg-dark-850 border border-white/5 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4">Input Dataset</h3>
            
            {/* Custom file drag zone */}
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-white/10 hover:border-brand-500/40 rounded-2xl p-6 text-center cursor-pointer hover:bg-white/5 transition-all duration-200 mb-4 group"
            >
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">[ upload dataset ]</p>
              <p className="text-slate-500 text-[10px]">Supports .csv or .json formatted text files</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden" 
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Or Paste Raw Data Content</label>
                  {inputText && (
                    <button 
                      type="button" 
                      onClick={() => setInputText('')} 
                      className="text-[10px] text-rose-400 hover:text-rose-300 uppercase font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Product,Sales&#10;Product A,150&#10;Product B,320&#10;Product C,240..."
                  className="w-full bg-dark-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 shadow-glow-purple-strong flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Compile Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="bg-dark-850/50 border border-white/5 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-500 text-sm">Provide dataset input to generate report visualization.</p>
            </div>
          )}

          {loading && (
            <div className="bg-dark-850/50 border border-white/5 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] animate-pulse">
              <Sparkles className="w-8 h-8 text-brand-400 mb-3 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Aggregating dataset tables...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Copy Markdown */}
              <div className="flex justify-end">
                <button
                  onClick={handleCopyMarkdown}
                  className="bg-dark-850 hover:bg-dark-800 border border-white/5 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy as Markdown
                    </>
                  )}
                </button>
              </div>

              {/* Chart */}
              <SVGChart data={result.data_points} />

              {/* Summary */}
              <div className="bg-dark-850 border border-white/5 rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-2">Executive Summary</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {/* Insights */}
              <div className="bg-dark-850 border border-white/5 rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-3">Key Insights</h4>
                <ul className="space-y-2">
                  {result.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
