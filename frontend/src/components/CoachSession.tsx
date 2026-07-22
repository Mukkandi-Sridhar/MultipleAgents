import React, { useState } from 'react';
import type { ExtractedQuestion, AttemptLog, CoachSessionState } from '../types';
import { Sparkles, Send, RefreshCw, CheckCircle, AlertCircle, Eye, GraduationCap, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../lib/apiConfig';

interface CoachSessionProps {
  initialQuestion: ExtractedQuestion;
  onReset: () => void;
}

export const CoachSession: React.FC<CoachSessionProps> = ({ initialQuestion, onReset }) => {
  const [session, setSession] = useState<CoachSessionState>({
    question: initialQuestion,
    attempts: [],
    currentAttemptNumber: 1,
    completed: false,
    masteryConfirmed: false,
    masteryQuestionAnswered: false,
  });

  const [studentInput, setStudentInput] = useState('');
  const [masteryInput, setMasteryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAttemptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_text: session.question.extracted_text,
          student_answer: studentInput,
          attempt_number: session.currentAttemptNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const result = await response.json();

      const newAttempt: AttemptLog = {
        student_answer: studentInput,
        correct: result.correct,
        mistake_type: result.mistake_type,
        explanation: result.explanation,
        hint: result.hint,
        reveal_solution: result.reveal_solution,
        worked_solution: result.worked_solution,
      };

      const updatedAttempts = [...session.attempts, newAttempt];
      const isCorrect = result.correct;
      const reachedMaxAttempts = session.currentAttemptNumber >= 3;

      setSession((prev) => ({
        ...prev,
        attempts: updatedAttempts,
        completed: isCorrect || reachedMaxAttempts,
        currentAttemptNumber: isCorrect ? prev.currentAttemptNumber : prev.currentAttemptNumber + 1,
        // If correct, capture reinforcement and mastery question from checker response
        question: isCorrect 
          ? { 
              ...prev.question, 
              explanation: result.reinforcement || "Excellent job!", 
              prompt: result.mastery_question || "Here is a follow-up to test your mastery.",
              mastery_answer: result.mastery_answer
            } 
          : prev.question
      }));

      setStudentInput('');
    } catch (err: any) {
      console.error(err);
      setError('Connection to checking service failed. Please check backend log.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masteryInput.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/mastery-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mastery_question: session.question.prompt,
          mastery_answer: session.question.mastery_answer || '',
          student_answer: masteryInput,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to check mastery answer');
      }

      const result = await response.json();

      setSession((prev) => ({
        ...prev,
        masteryQuestionAnswered: true,
        masteryConfirmed: Boolean(result.correct),
        masteryFeedback: result.feedback || (result.correct ? "Superb! You've verified your complete mastery." : "Good effort!")
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection to mastery checking service failed. Please check backend log.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-slide-up">
      {/* Stepper Progress Bar */}
      <div className="glass-panel rounded-2xl p-4 flex justify-between items-center mb-8 text-[11px] text-slate-400 font-semibold uppercase tracking-wider relative overflow-hidden">
        <div className="flex items-center space-x-2 text-brand-400">
          <span className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/40 text-[10px]">1</span>
          <span>Workspace Loaded</span>
        </div>
        <div className="h-[1px] bg-white/5 flex-1 mx-3" />
        <div className={`flex items-center space-x-2 ${session.attempts.length > 0 ? 'text-brand-400' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${session.attempts.length > 0 ? 'bg-brand-500/20 border border-brand-500/40' : 'bg-white/5 border border-white/5'}`}>2</span>
          <span>Coaching Session</span>
        </div>
        <div className="h-[1px] bg-white/5 flex-1 mx-3" />
        <div className={`flex items-center space-x-2 ${session.completed ? 'text-brand-400' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${session.completed ? 'bg-brand-500/20 border border-brand-500/40' : 'bg-white/5 border border-white/5'}`}>3</span>
          <span>Concept Mastery</span>
        </div>
      </div>

      {/* Session Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">Extracted Question</span>
            </div>
            <p className="text-lg font-medium text-slate-100 italic leading-relaxed">
              "{session.question.extracted_text}"
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
              {session.question.subject}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {session.question.concept}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyBadge(session.question.difficulty)}`}>
              {session.question.difficulty} Difficulty
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Session Status</span>
              <span className={`w-2.5 h-2.5 rounded-full ${session.completed ? 'bg-emerald-500 animate-pulse' : 'bg-brand-500 animate-pulse'}`} />
            </div>
            <h4 className="text-2xl font-bold text-white mb-1">
              {session.completed 
                ? (session.attempts[session.attempts.length - 1]?.correct ? 'Mastered!' : 'Completed') 
                : `Attempt ${session.currentAttemptNumber} of 3`}
            </h4>
            <p className="text-sm text-slate-400">
              {session.completed 
                ? 'Coaching session has finished.' 
                : 'Follow the steps to find the solution.'}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <button 
              onClick={onReset}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset & Upload New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dialogue Flow */}
      <div className="space-y-6">
        {/* Step 1: Explanation Card */}
        <div className="glass-panel rounded-2xl border-brand-500/10 shadow-lg p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-1">Coach Explanation</h3>
                <p className="text-slate-200 leading-relaxed font-normal">
                  {session.question.explanation}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-1">Direct Prompt</span>
                <p className="text-slate-100 font-medium">{session.question.prompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attempts Log History */}
        {session.attempts.map((attempt, index) => (
          <div 
            key={index} 
            className={`glass-panel rounded-2xl p-6 border-l-4 animate-fade-in ${
              attempt.correct 
                ? 'border-l-emerald-500 shadow-glow-indigo/10' 
                : 'border-l-rose-500'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                attempt.correct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {index + 1}
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student's Attempt</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    attempt.correct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {attempt.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-slate-200 font-semibold italic">"{attempt.student_answer}"</p>
                
                {!attempt.correct && (
                  <div className="mt-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                    <div className="flex items-center space-x-2 text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Diagnosis: {attempt.mistake_type} mistake
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{attempt.explanation}</p>
                    
                    {attempt.hint && (
                      <div className="pt-2 border-t border-rose-500/10">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Clue / Scaffold Hint:</span>
                        <p className="text-sm text-slate-200">{attempt.hint}</p>
                      </div>
                    )}

                    {attempt.reveal_solution && attempt.worked_solution && (
                      <div className="pt-3 border-t border-rose-500/15">
                        <div className="flex items-center space-x-1.5 text-brand-400 mb-2">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Worked Solution</span>
                        </div>
                        <pre className="text-xs font-mono p-3 bg-dark-950/60 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {attempt.worked_solution}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Input Interface */}
        {!session.completed && (
          <form onSubmit={handleAttemptSubmit} className="glass-panel-glow rounded-2xl p-6 space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="student-answer" className="text-sm font-semibold text-slate-300">
                Your Attempt / Workings
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="student-answer"
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Type your workings or final answer..."
                  disabled={loading}
                  className="flex-1 glass-input focus:border-brand-500 focus:ring-brand-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !studentInput.trim()}
                  className="btn-primary p-3 rounded-xl flex items-center justify-center shrink-0 w-12 h-12"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </form>
        )}

        {/* Mastery Evaluation Section */}
        {session.completed && session.attempts[session.attempts.length - 1]?.correct && (
          <div className="glass-panel-glow border-emerald-500/20 rounded-2xl p-8 space-y-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
              <h4 className="text-xl font-bold">Mastery Evaluation Check</h4>
            </div>

            <div className="space-y-2">
              <p className="text-slate-300 leading-relaxed">
                Awesome work! Since you got the original question right, let's verify if you've fully mastered this concept.
              </p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Mastery Question:</span>
                <p className="text-slate-100 font-semibold">{session.question.prompt}</p>
              </div>
            </div>

            {!session.masteryQuestionAnswered ? (
              <form onSubmit={handleMasterySubmit} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={masteryInput}
                    onChange={(e) => setMasteryInput(e.target.value)}
                    placeholder="Enter your answer for the mastery check..."
                    disabled={loading}
                    className="flex-1 glass-input"
                    required
                  />
                  <button type="submit" disabled={loading || !masteryInput.trim()} className="btn-primary flex items-center space-x-2">
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <span>Submit Check</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-rose-400 flex items-center space-x-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </p>
                )}
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-fade-in space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className={`w-5 h-5 ${session.masteryConfirmed ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Mastery Feedback</span>
                </div>
                <p className="text-slate-200">{session.masteryFeedback}</p>
                <div className="pt-2">
                  <button onClick={onReset} className="btn-secondary text-sm py-2 px-4">
                    Complete Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failed Completion worked solution display if incorrect all attempts */}
        {session.completed && !session.attempts[session.attempts.length - 1]?.correct && (
          <div className="glass-panel border-rose-500/20 rounded-2xl p-8 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold">Session Ended</h4>
            </div>
            <p className="text-slate-300 text-sm">
              You finished 3 attempts. Take a look at the worked solution above to learn how to solve it next time, or reset the sandbox to try a different problem!
            </p>
            <button onClick={onReset} className="btn-primary text-sm py-2 px-5">
              Try Another Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
