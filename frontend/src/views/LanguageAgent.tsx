import React, { useState, useEffect } from 'react';
import { Flame, Award, CheckCircle, ShieldAlert } from 'lucide-react';
import type { LanguageResponse } from '../types';
import { API_BASE_URL } from '../lib/apiConfig';

export const LanguageAgent: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LanguageResponse | null>(null);
  const [streak, setStreak] = useState(2);
  const [xp, setXp] = useState(120);
  const [error, setError] = useState<string | null>(null);

  const [sessionId] = useState(() => {
    let sid = sessionStorage.getItem('aether_language_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('aether_language_session_id', sid);
    }
    return sid;
  });

  // Sync initial stats from localStorage if they exist
  useEffect(() => {
    const s = localStorage.getItem('aether_streak_' + sessionId);
    const x = localStorage.getItem('aether_xp_' + sessionId);
    if (s) setStreak(parseInt(s));
    if (x) setXp(parseInt(x));
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/language/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          student_text: inputText,
          session_id: sessionId 
        })
      });
      if (!response.ok) throw new Error('API server returned error');
      const data = await response.json();
      
      setResult(data);
      setStreak(data.streak);
      setXp(data.xp);
      localStorage.setItem('aether_streak_' + sessionId, String(data.streak));
      localStorage.setItem('aether_xp_' + sessionId, String(data.xp));
      // Dispatch a custom event to notify Header.tsx to reload
      window.dispatchEvent(new Event('aether_stats_update'));
    } catch (err) {
      console.error(err);
      setError('Could not connect to the local server or request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in w-full">
      {/* Header section with badge */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
            [ grammar checking & streaks ]
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">
            Language Learning Agent
          </h2>
          <p className="text-slate-400 text-sm">
            Check your foreign language sentences for grammar errors, translations corrections, and collect XP points.
          </p>
        </div>
        
        {/* Streak & XP Header Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/25 px-4 py-2 rounded-2xl text-orange-400">
            <Flame className="w-5 h-5 fill-orange-500/20" />
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase leading-none mb-0.5">Streak</span>
              <span className="text-sm font-bold leading-none">{streak} Days</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/25 px-4 py-2 rounded-2xl text-purple-400">
            <Award className="w-5 h-5" />
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase leading-none mb-0.5">Total XP</span>
              <span className="text-sm font-bold leading-none">{xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input box */}
        <div className="glass-panel rounded-3xl p-6 h-fit">
          <h3 className="font-bold text-white mb-3">Compose Sentence</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Type sentence in target language</label>
              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write target sentence (e.g. 'Je veux apprends le français' or 'Me gusta mucho estudiar inglés')..."
                className="w-full glass-input resize-none"
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
                <span>Analyze Grammar & Correct</span>
              )}
            </button>
          </form>
        </div>

        {/* Results / Feedback */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="glass-panel border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[250px] select-none">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-2">[ ready for evaluation ]</span>
              <p className="text-slate-500 text-xs">Submit your sentence for instant feedback corrections.</p>
            </div>
          )}

          {loading && (
            <div className="glass-panel border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[250px] animate-pulse">
              <span className="text-[10px] font-mono tracking-widest text-brand-400 uppercase block mb-2">[ correcting vocabulary ]</span>
              <p className="text-slate-400 text-xs font-medium">Deconstructing vocabulary blocks...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Corrected sentence */}
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Suggested Correction</h4>
                </div>
                <p className="bg-dark-900 border border-white/5 rounded-2xl p-4 text-sm text-slate-200 font-mono leading-relaxed">
                  {result.corrected_text}
                </p>
              </div>

              {/* Explanation */}
              <div className="glass-panel rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-2">Grammar & Syntax Explanation</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{result.explanation}</p>
              </div>

              {/* Vocabulary tips */}
              <div className="glass-panel rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-2">Vocabulary Building Tip</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{result.vocabulary_suggestion}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
