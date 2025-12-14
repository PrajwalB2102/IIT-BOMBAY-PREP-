
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, PlayCircle, Loader2, Trophy, AlertTriangle, 
  BrainCircuit, ArrowRight, Volume2, CheckCircle, Flame, BarChart3, RotateCcw, Save
} from 'lucide-react';
import { generateInterviewQuestions, evaluateInterviewAnswer, generateInterviewAnalysis } from '../services/geminiService';
import { DailyStreak, InterviewQuestion, InterviewResult, InterviewSessionAnalysis } from '../types';
import { STREAK_BREAK_MESSAGES } from '../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface IITInterviewProps {
  streak: DailyStreak;
  setStreak: (streak: DailyStreak) => void;
}

const IITInterview: React.FC<IITInterviewProps> = ({ streak, setStreak }) => {
  // --- States ---
  const [view, setView] = useState<'dashboard' | 'interview' | 'evaluation' | 'analysis'>('dashboard');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Physics'); // Default
  const [breakMessage, setBreakMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Interview Loop State
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Evaluation State
  const [currentResult, setCurrentResult] = useState<InterviewResult | null>(null);
  const [sessionResults, setSessionResults] = useState<InterviewResult[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<InterviewSessionAnalysis | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // --- Streak Logic on Mount ---
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = streak.lastInterviewDate ? streak.lastInterviewDate.split('T')[0] : null;

    if (lastDate && lastDate !== today) {
        const last = new Date(lastDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 1) {
            // Streak Broken (more than 1 day gap)
            const randomMsg = STREAK_BREAK_MESSAGES[Math.floor(Math.random() * STREAK_BREAK_MESSAGES.length)];
            setBreakMessage(randomMsg);
            setStreak({ ...streak, currentStreak: 0 }); 
        }
    }
  }, []);

  const speakText = (text: string) => {
     window.speechSynthesis.cancel();
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.lang = 'hi-IN'; // Attempt Hinglish/Indian accent
     utterance.rate = 1;
     window.speechSynthesis.speak(utterance);
  };

  // --- Handlers ---

  const startInterview = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
        const qs = await generateInterviewQuestions(topic, subject);
        if (!qs || qs.length === 0) {
            setErrorMsg("Could not generate questions. Please check your API key or try a different topic.");
            setLoading(false);
            return;
        }
        setQuestions(qs);
        setCurrentIndex(0);
        setSessionResults([]);
        setLoading(false);
        setView('interview');
    } catch (e) {
        setErrorMsg("An error occurred. Please try again.");
        setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setEvaluating(true);
    const currentQ = questions[currentIndex];
    
    const result = await evaluateInterviewAnswer(currentQ.question, currentQ.correctAnswer, userAnswer);
    setCurrentResult(result);
    setSessionResults([...sessionResults, result]);
    
    setEvaluating(false);
    setView('evaluation');
    
    // Auto speak feedback if applause
    if (result.score >= 7) {
        speakText(result.applauseOrTaunt);
    }
  };

  const nextQuestion = async () => {
    setUserAnswer('');
    setCurrentResult(null);
    if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setView('interview');
    } else {
        // Finish Session
        setLoading(true);
        const analysis = await generateInterviewAnalysis(sessionResults);
        setFinalAnalysis(analysis);
        
        // Update Streak Logic
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const lastDate = streak.lastInterviewDate ? streak.lastInterviewDate.split('T')[0] : null;
        
        let newStreak = streak.currentStreak;
        
        if (lastDate !== todayDate) {
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             const yesterdayStr = yesterday.toISOString().split('T')[0];
             
             if (lastDate === yesterdayStr) {
                 newStreak += 1;
             } else if (!lastDate) {
                 newStreak = 1;
             } else {
                 const last = new Date(lastDate);
                 const diffTime = Math.abs(now.getTime() - last.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                 if (diffDays > 1) newStreak = 1;
                 else newStreak += 1;
             }
        }

        const newHistory = streak.history ? [...streak.history] : [];
        if (!newHistory.includes(todayDate)) {
            newHistory.push(todayDate);
        }

        setStreak({
            currentStreak: newStreak,
            lastInterviewDate: now.toISOString(),
            maxStreak: Math.max(streak.maxStreak, newStreak),
            history: newHistory
        });
        
        setLoading(false);
        setView('analysis');
    }
  };

  // --- Render Views ---

  if (loading) {
      return (
          <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
              <div className="relative">
                  <BrainCircuit size={80} className="text-blue-500 animate-bounce" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold mt-8 text-white">IIT Bombay Intelligence is thinking...</h2>
              <p className="text-slate-400 mt-2">Preparing specific JEE Advanced content for you.</p>
          </div>
      );
  }

  if (view === 'dashboard') {
    return (
      <div className="animate-fade-in-up space-y-8">
         {/* Header Streak Section */}
         <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             
             {breakMessage ? (
                 <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl mb-6 flex items-start gap-4 animate-bounce">
                     <AlertTriangle size={40} className="text-red-500 flex-shrink-0" />
                     <div>
                         <h3 className="text-xl font-bold text-red-400 mb-1">Streak Broken!</h3>
                         <p className="text-red-200 text-lg italic">"{breakMessage}"</p>
                     </div>
                 </div>
             ) : (
                 <div className="flex items-center gap-4 mb-8">
                     <div className="p-4 bg-orange-500/20 rounded-full border border-orange-500/30">
                         <Flame size={40} className="text-orange-500" />
                     </div>
                     <div>
                         <h2 className="text-3xl font-bold text-white">Daily Learning Streak</h2>
                         <p className="text-slate-400">{streak.currentStreak} Days Consistent • Best: {streak.maxStreak}</p>
                     </div>
                 </div>
             )}

             <div className="space-y-6 relative z-10">
                 <h1 className="text-4xl font-bold text-white leading-tight">
                     आज कोणता topic शिकला <span className="text-blue-400">Sai Raje</span>?
                 </h1>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <label className="text-sm text-slate-400">Subject</label>
                         <select 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-lg text-white focus:border-blue-500 outline-none transition-colors"
                         >
                             <option value="Physics">Physics</option>
                             <option value="Chemistry">Chemistry</option>
                             <option value="Mathematics">Mathematics</option>
                         </select>
                     </div>
                     <div className="space-y-2">
                         <label className="text-sm text-slate-400">Topic / Chapter</label>
                         <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Rotational Motion, Calculus..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-lg text-white focus:border-blue-500 outline-none transition-colors placeholder-slate-600"
                         />
                     </div>
                 </div>
                 
                 {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
                        <AlertTriangle size={18} /> {errorMsg}
                    </div>
                 )}

                 <button 
                    onClick={startInterview}
                    disabled={!topic.trim()}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                 >
                    <BrainCircuit /> Start IIT Interview
                 </button>
             </div>
         </div>
         
         <div className="text-center text-slate-500 text-sm">
             <p>Warning: This session contains JEE Advanced level questions. Prepare to be humbled.</p>
         </div>
      </div>
    );
  }

  if (view === 'interview') {
      const currentQ = questions[currentIndex];
      if (!currentQ) {
          return (
              <div className="text-center py-20">
                  <h3 className="text-xl text-red-400 mb-4">Error loading question.</h3>
                  <button onClick={() => setView('dashboard')} className="text-blue-400 underline">Return to Dashboard</button>
              </div>
          );
      }

      return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-center text-slate-400 text-sm">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span className={`px-2 py-0.5 rounded border ${currentQ.difficulty === 'Advanced' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'}`}>
                      {currentQ.difficulty} Level
                  </span>
              </div>

              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-relaxed">
                      {currentQ.question}
                  </h2>
                  
                  <div className="flex flex-col items-center justify-center space-y-8">
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full bg-slate-900/50 rounded-xl border border-slate-700 p-6 min-h-[120px] text-lg text-slate-200 text-center leading-relaxed focus:border-blue-500 outline-none transition-colors placeholder-slate-600"
                      ></textarea>

                      {userAnswer && !evaluating && (
                          <button 
                            onClick={submitAnswer}
                            className="flex items-center justify-center w-auto px-6 py-3 rounded-full bg-green-600/20 border-2 border-green-500 text-green-400 hover:bg-green-600 hover:text-white transition-all duration-300 animate-fade-in-up hover:scale-105 active:scale-95"
                            title="Save & Analyze"
                          >
                              <Save size={20} className="mr-2" />
                              <span className="text-lg font-bold">Save & Analyze</span>
                          </button>
                      )}
                  </div>
              </div>

              {evaluating && (
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="animate-spin" size={16} /> Analysis in progress...
                  </div>
              )}
          </div>
      );
  }

  if (view === 'evaluation' && currentResult) {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
              <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 ${
                  currentResult.score >= 7 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}>
                  <div className={`p-4 rounded-full border-4 ${currentResult.score >= 7 ? 'border-green-500 text-green-500' : 'border-orange-500 text-orange-500'}`}>
                      <span className="text-3xl font-bold">{currentResult.score}/10</span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                      <h3 className={`text-2xl font-bold mb-2 ${currentResult.score >= 7 ? 'text-green-400' : 'text-orange-400'}`}>
                          "{currentResult.applauseOrTaunt}"
                      </h3>
                      <p className="text-slate-300 italic">{currentResult.feedback}</p>
                  </div>
              </div>

              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <BrainCircuit className="text-purple-500" /> Concept Deep Dive
                      </h3>
                      <button 
                        onClick={() => speakText(currentResult.conceptExplanation)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        title="Listen to Explanation"
                      >
                          <Volume2 size={20} />
                      </button>
                  </div>
                  <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                          {currentResult.conceptExplanation}
                      </p>
                  </div>
              </div>

              {currentResult.followUpProblem && (
                  <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/20">
                      <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle size={18} /> Instant Challenge
                      </h4>
                      <p className="text-slate-300">{currentResult.followUpProblem}</p>
                  </div>
              )}

              <div className="flex justify-end pt-4">
                  <button 
                    onClick={nextQuestion}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center gap-2"
                  >
                     {currentIndex + 1 === questions.length ? 'Finish Session' : 'Next Question'} <ArrowRight />
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'analysis' && finalAnalysis) {
      const data = [
          { name: 'Conceptual', value: finalAnalysis.conceptualUnderstanding, fill: '#8884d8' },
          { name: 'Application', value: finalAnalysis.applicationSkills, fill: '#82ca9d' },
          { name: 'Formula', value: finalAnalysis.formulaRetention, fill: '#ffc658' },
      ];

      return (
          <div className="space-y-8 animate-fade-in-up">
              <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-white">Interview Analysis Report</h1>
                  <p className="text-slate-400">Streak Updated! You are one step closer to IIT Bombay.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[400px]">
                      <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><BarChart3/> Skills Breakdown</h3>
                      <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={data} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                  {data.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
                      <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Trophy className="text-yellow-500"/> Strategic Roadmap</h3>
                      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-600 flex-1 overflow-y-auto custom-scrollbar">
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {finalAnalysis.strategicAdvice}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                  <h3 className="font-bold text-red-400 mb-4">Focus Areas (Weak Topics)</h3>
                  <div className="flex flex-wrap gap-3">
                      {finalAnalysis.weakTopics.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full border border-red-500/30 text-sm">
                              {t}
                          </span>
                      ))}
                      {finalAnalysis.weakTopics.length === 0 && <span className="text-green-400">None! You smashed it.</span>}
                  </div>
              </div>
              
              <div className="flex justify-center pt-8">
                  <button 
                     onClick={() => setView('dashboard')}
                     className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold"
                  >
                      Return to Dashboard
                  </button>
              </div>
          </div>
      );
  }

  return <div>Error loading view.</div>;
};

export default IITInterview;
