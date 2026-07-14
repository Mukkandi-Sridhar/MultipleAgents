import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HubPage } from './views/HubPage';
import { HomeworkCoachAgent } from './views/HomeworkCoachAgent';
import { FollowUpAgent } from './views/FollowUpAgent';
import { DocumentAgent } from './views/DocumentAgent';
import { SupportAgent } from './views/SupportAgent';
import { LanguageAgent } from './views/LanguageAgent';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-950 flex flex-col selection:bg-brand-500/30 selection:text-white relative overflow-hidden">
        {/* Background radial overlay for depth */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none -z-10" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.02),transparent_50%)] pointer-events-none -z-10" />
        <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
        <div className="fixed inset-0 noise-bg pointer-events-none -z-10" />
        
        <Header />

        <main className="flex-1 flex flex-col justify-start">
          <Routes>
            <Route path="/" element={<HubPage />} />
            <Route path="/coach" element={<HomeworkCoachAgent />} />
            <Route path="/followup" element={<FollowUpAgent />} />
            <Route path="/documents" element={<DocumentAgent />} />
            <Route path="/support" element={<SupportAgent />} />
            <Route path="/language" element={<LanguageAgent />} />
          </Routes>
        </main>

        <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-600 mt-auto shrink-0">
          <p>© 2026 Aether Agents. Empowering productivity and learning through cognitive orchestration.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
