import React, { useState } from 'react';
import { Calendar, Copy, Check, ShieldAlert } from 'lucide-react';
import type { FollowupResponse } from '../types';
import { API_BASE_URL } from '../lib/apiConfig';

export const FollowUpAgent: React.FC = () => {
  const [formData, setFormData] = useState({
    lead_name: '',
    lead_email: '',
    lead_phone: '',
    interest_area: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FollowupResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_name || !formData.meeting_notes) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/followup/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('API server error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the local server or call failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.email_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWarmthClass = (c: string) => {
    switch (c.toLowerCase()) {
      case 'hot':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'warm':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in w-full">
      <div className="mb-8">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
          [ lead follow-up automation ]
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">
          Lead Follow-up Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Auto-draft professional email follow-ups and schedule customer communications using meeting notes.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form panel */}
        <div className="glass-panel rounded-3xl p-6 h-fit">
          <h3 className="font-bold text-white mb-4">Lead Information</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name *</label>
              <input
                type="text"
                name="lead_name"
                required
                value={formData.lead_name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full glass-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  name="lead_email"
                  value={formData.lead_email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Phone Number</label>
                <input
                  type="text"
                  name="lead_phone"
                  value={formData.lead_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 0199"
                  className="w-full glass-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Interest Area</label>
                <input
                  type="text"
                  name="interest_area"
                  value={formData.interest_area}
                  onChange={handleChange}
                  placeholder="Enterprise License"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Meeting Date</label>
                <input
                  type="date"
                  name="meeting_date"
                  value={formData.meeting_date}
                  onChange={handleChange}
                  className="w-full glass-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Raw Meeting Notes *</label>
              <textarea
                name="meeting_notes"
                required
                rows={5}
                value={formData.meeting_notes}
                onChange={handleChange}
                placeholder="Jane liked the custom agent platform. Wants to check security docs. Follow up next week..."
                className="w-full glass-input resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !formData.lead_name || !formData.meeting_notes}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 shadow-glow-purple-strong flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Generate Follow-up Plan</span>
              )}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="glass-panel border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] select-none">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-2">[ ready for orchestration ]</span>
              <p className="text-slate-500 text-xs">Fill in lead details to draft communications.</p>
            </div>
          )}

          {loading && (
            <div className="glass-panel border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] animate-pulse">
              <span className="text-[10px] font-mono tracking-widest text-brand-400 uppercase block mb-2">[ generating touchpoints ]</span>
              <p className="text-slate-400 text-xs font-medium">Drafting sales pipeline timelines...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Classification */}
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm font-semibold">Lead Temperature Classification:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getWarmthClass(result.classification)}`}>
                    {result.classification}
                  </span>
                </div>
              </div>

              {/* Email draft */}
              <div className="glass-panel rounded-3xl p-6 relative animate-float">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">Drafted Follow-up Email</h4>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Copy Email Content"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-dark-900 rounded-2xl p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-white/5 select-all">
                  {result.email_draft}
                </div>
              </div>

              {/* Follow-up Timeline */}
              <div className="glass-panel rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  Suggested Touchpoint Timeline
                </h4>
                <div className="relative border-l border-white/10 pl-6 space-y-6 ml-3">
                  {result.schedule.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Circle dot on line */}
                      <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-dark-850 shadow-glow-purple-strong" />
                      <div>
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block mb-1">
                          Day {item.day} Follow-up
                        </span>
                        <p className="text-slate-300 text-sm">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
