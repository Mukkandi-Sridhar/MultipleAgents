import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, BarChart3, MessageSquare, Languages, ArrowRight, Activity } from 'lucide-react';

const HomeworkCoachIllustration = () => (
  <div className="absolute right-6 top-8 bottom-8 w-[38%] hidden md:flex flex-col bg-slate-950/80 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-slate-400 select-none pointer-events-none group-hover:border-brand-500/20 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300">
    <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3 shrink-0">
      <div className="flex space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </div>
      <span className="text-[9px] text-slate-500 font-medium">coach_orchestrator.ts</span>
    </div>
    <div className="flex-1 space-y-2 overflow-hidden leading-relaxed text-slate-500">
      <div><span className="text-violet-400">class</span> <span className="text-white">CognitiveCoach</span> &#123;</div>
      <div className="pl-3 text-slate-600">// Scaffolding active hints</div>
      <div className="pl-3"><span className="text-indigo-400">explain</span>(problem: <span className="text-cyan-400">OCRImage</span>) &#123;</div>
      <div className="pl-6 text-slate-500">const concepts = analyze(problem);</div>
      <div className="pl-6 text-emerald-400/80">return scaffold(concepts);</div>
      <div className="pl-3">&#125;</div>
      <div className="text-violet-400">&#125;</div>
    </div>
    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-600 shrink-0">
      <span>OCR Pipeline</span>
      <span className="text-emerald-400/80 font-semibold">100%</span>
    </div>
  </div>
);

const SalesAgentIllustration = () => (
  <div className="absolute right-4 bottom-4 w-28 h-20 bg-slate-950/85 border border-white/5 rounded-xl p-2.5 font-mono text-[8px] text-slate-500 pointer-events-none select-none group-hover:border-blue-500/20 transition-all duration-300 hidden md:block">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-400">Outreach Email</span>
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
    </div>
    <div className="space-y-1">
      <div className="h-1 bg-white/5 rounded w-full" />
      <div className="h-1 bg-white/5 rounded w-5/6" />
    </div>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-[7px] text-blue-400 font-bold uppercase">Warmth: 92%</span>
    </div>
  </div>
);

const DocumentIllustration = () => (
  <div className="absolute right-4 bottom-4 w-28 h-20 bg-slate-950/85 border border-white/5 rounded-xl p-2.5 pointer-events-none select-none group-hover:border-emerald-500/20 transition-all duration-300 hidden md:block flex flex-col justify-between">
    <div className="flex items-center justify-between text-[8px] text-slate-500">
      <span>Insights</span>
      <span className="text-emerald-400/60 font-bold">CSV</span>
    </div>
    <div className="flex items-end justify-between h-8 px-1">
      <div className="w-2.5 h-3 bg-emerald-500/10 rounded-t border border-emerald-500/20 group-hover:h-5 transition-all duration-500" />
      <div className="w-2.5 h-6 bg-emerald-500/25 rounded-t border border-emerald-500/30 group-hover:h-8 transition-all duration-500" />
      <div className="w-2.5 h-4 bg-emerald-500/15 rounded-t border border-emerald-500/25 group-hover:h-6 transition-all duration-500" />
    </div>
    <div className="h-[1px] bg-white/5 w-full" />
  </div>
);

const SupportIllustration = () => (
  <div className="absolute right-4 bottom-4 w-28 h-20 bg-slate-950/85 border border-white/5 rounded-xl p-2.5 pointer-events-none select-none group-hover:border-amber-500/20 transition-all duration-300 hidden md:block flex flex-col justify-between">
    <div className="flex items-center justify-between text-[8px] text-slate-500">
      <span>Handoff</span>
      <span className="text-amber-400/60">Standard</span>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center space-x-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        <div className="h-1 bg-white/5 rounded flex-1" />
      </div>
    </div>
    <div className="text-[7px] text-slate-500 flex items-center justify-between">
      <span>Support state</span>
      <span className="text-slate-600">Standard</span>
    </div>
  </div>
);

const LanguageIllustration = () => (
  <div className="absolute right-4 bottom-4 w-28 h-20 bg-slate-950/85 border border-white/5 rounded-xl p-2.5 pointer-events-none select-none group-hover:border-rose-500/20 transition-all duration-300 hidden md:block flex flex-col justify-between">
    <div className="flex items-center justify-between text-[8px] text-slate-500">
      <span>Streak</span>
      <span className="text-rose-400/60">XP</span>
    </div>
    <div className="flex items-center justify-center space-x-2 my-1">
      <div className="w-5 h-5 rounded-full border border-rose-500/10 flex items-center justify-center bg-rose-500/5 text-[8px] text-rose-400/80">
        A
      </div>
      <span className="text-slate-700">→</span>
      <div className="w-5 h-5 rounded-full border border-emerald-500/10 flex items-center justify-center bg-emerald-500/5 text-[8px] text-emerald-400/80">
        文
      </div>
    </div>
    <div className="h-0.5 bg-white/5 rounded overflow-hidden">
      <div className="h-full bg-rose-500/40 w-3/4" />
    </div>
  </div>
);

export const HubPage: React.FC = () => {
  const agents = [
    {
      name: 'Homework Coach',
      description: 'OCR Vision-powered visual math and science homework solver with conceptual cognitive scaffolding.',
      path: '/coach',
      icon: GraduationCap,
      color: 'text-slate-400 group-hover:text-brand-400',
      badge: 'active solver',
      featured: true,
      telemetry: "Vision V4 | 220ms latency",
      illustration: HomeworkCoachIllustration
    },
    {
      name: 'Sales Follow-up Agent',
      description: 'Analyze meeting notes to auto-draft outreach emails and timelines.',
      path: '/followup',
      icon: Mail,
      color: 'text-slate-400 group-hover:text-brand-400',
      badge: 'automation',
      featured: false,
      illustration: SalesAgentIllustration
    },
    {
      name: 'Document Analysis Agent',
      description: 'Upload CSV/JSON data to instantly generate executive charts.',
      path: '/documents',
      icon: BarChart3,
      color: 'text-slate-400 group-hover:text-brand-400',
      badge: 'intelligence',
      featured: false,
      illustration: DocumentIllustration
    },
    {
      name: 'FAQ Support Agent',
      description: 'Grounded FAQ knowledge base with automated human handoff.',
      path: '/support',
      icon: MessageSquare,
      color: 'text-slate-400 group-hover:text-brand-400',
      badge: 'rag support',
      featured: false,
      illustration: SupportIllustration
    },
    {
      name: 'Language Practice Agent',
      description: 'Write sentences for grammar checking and gamified streak tutoring.',
      path: '/language',
      icon: Languages,
      color: 'text-slate-400 group-hover:text-brand-400',
      badge: 'gamified',
      featured: false,
      illustration: LanguageIllustration
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-fade-in w-full">
      {/* Hero Section */}
      <div className="text-center mb-20 max-w-3xl mx-auto">
        <span className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 tracking-[0.25em] uppercase mb-6 inline-block select-none">
          AI Multi-Agent Workspace Hub
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Aether Agents
        </h1>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
          Deploy task-optimized cognitive agents from the unified portal workspace below. Modules integrate mock mode or client-configured OpenAI tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const Illustration = agent.illustration;
          
          if (agent.featured) {
            return (
              <Link
                key={index}
                to={agent.path}
                className="group relative md:col-span-2 glass-panel rounded-2xl p-8 transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden min-h-[260px]"
              >
                {/* Background lighting mesh */}
                <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-brand-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 group-hover:from-brand-500/8 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="max-w-[58%]">
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase select-none">
                      [ {agent.badge} ]
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white group-hover:text-brand-300 transition-colors mb-3 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${agent.color} shrink-0`} />
                    {agent.name}
                  </h3>
                  
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                    {agent.description}
                  </p>
                </div>

                {/* Micro UI visual block */}
                <Illustration />

                <div className="flex items-center justify-between pt-6 border-t border-white/5 text-xs max-w-[58%]">
                  <div className="flex items-center text-slate-500 font-medium space-x-2 select-none">
                    <Activity className="w-3.5 h-3.5 text-slate-600" />
                    <span className="font-mono text-[9px] uppercase tracking-wider">{agent.telemetry}</span>
                  </div>
                  <div className="flex items-center font-semibold text-slate-400 group-hover:text-white transition-colors">
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={index}
              to={agent.path}
              className="group relative glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden min-h-[260px]"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase select-none">
                    [ {agent.badge} ]
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors mb-2 flex items-center gap-2">
                  <Icon className={`w-4.5 h-4.5 ${agent.color} shrink-0`} />
                  {agent.name}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {agent.description}
                </p>
              </div>

              {/* Micro UI visual block */}
              <Illustration />

              <div className="flex items-center text-xs font-semibold text-slate-500 group-hover:text-white transition-colors pt-4 border-t border-white/5 justify-between w-full">
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
