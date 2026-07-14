import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  const loadStats = () => {
    const s = localStorage.getItem('aether_streak');
    const x = localStorage.getItem('aether_xp');
    if (s) setStreak(parseInt(s));
    if (x) setXp(parseInt(x));
  };

  useEffect(() => {
    loadStats();
    // Listen to custom stats update event
    window.addEventListener('aether_stats_update', loadStats);
    return () => {
      window.removeEventListener('aether_stats_update', loadStats);
    };
  }, []);

  const isHub = location.pathname === '/';

  return (
    <header className="border-b border-white/5 bg-dark-900/40 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/"
          className="flex items-center space-x-2 group"
        >
          <div className="flex items-center">
            <span className="font-bold text-sm tracking-[0.3em] text-white uppercase transition-colors group-hover:text-brand-400">AETHER</span>
            <span className="text-slate-700 mx-2 font-light select-none">/</span>
            <span className="font-medium text-sm tracking-[0.25em] text-slate-400 uppercase">PORTFOLIO</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Header Stats Badge */}
          {streak !== null && xp !== null && (
            <div className="hidden sm:flex items-center space-x-3 text-slate-500 text-[10px] font-mono select-none">
              <span>[ streak: {streak}d ]</span>
              <span>[ xp: {xp} ]</span>
            </div>
          )}

          {!isHub ? (
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Hub
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5 animate-pulse"></span>
              Aether Orchestrator
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

