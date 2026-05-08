import React, { useState } from 'react';
import { 
  GraduationCap, 
  User, 
  Briefcase, 
  Code, 
  Settings, 
  Clock, 
  Target, 
  ChevronRight, 
  Download, 
  RefreshCcw,
  Sparkles,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle,
  FileSearch,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { generateInterviewSession, parseResumeText, analysisATS } from './services/geminiService';
import type { InterviewInputs, InterviewStatus } from './types';
import PracticeMode from './components/PracticeMode';

export default function App() {
  const [inputs, setInputs] = useState<InterviewInputs>({
    candidateName: '',
    jobRole: 'Software Developer',
    skills: 'Java, Spring Boot, React, SQL',
    experienceLevel: 'Fresher',
    interviewType: 'Mixed',
    difficulty: 'Medium',
    numQuestions: 5,
    preferredLanguage: 'Java',
    duration: '45 Minutes',
    specialFocus: ''
  });

  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [result, setResult] = useState<string>('');
  const [atsResult, setAtsResult] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'questions' | 'ats'>('questions');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPractice, setShowPractice] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    try {
      const text = await file.text();
      const parsed = await parseResumeText(text);
      setInputs(prev => ({
        ...prev,
        skills: parsed.skills || prev.skills,
        specialFocus: `Based on projects: ${parsed.projects}`
      }));
      confetti({ particleCount: 50, spread: 30, origin: { x: 0.1, y: 0.5 } });
    } catch (err) {
      console.error("Parse fail:", err);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleATSAnalysis = async () => {
    setStatus('generating');
    try {
      const res = await analysisATS(inputs);
      setAtsResult(res);
      setActiveTab('ats');
      setStatus('completed');
    } catch (err) {
      setStatus('idle');
    }
  };

  const handleGenerate = async () => {
    setStatus('generating');
    setError(null);
    try {
      const output = await generateInterviewSession(inputs);
      setResult(output);
      setStatus('completed');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#003366', '#FFD700', '#FFFFFF']
      });
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleDownload = (format: 'txt' | 'pdf') => {
    const textToSave = result;
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Session_${inputs.candidateName || 'Candidate'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      <AnimatePresence>
        {showPractice && (
          <PracticeMode 
            onClose={() => setShowPractice(false)} 
            fullSession={result} 
          />
        )}
      </AnimatePresence>

      {/* Header: University Branding */}
      <header className="bg-[#1e1b4b] text-white px-6 py-3 flex justify-between items-center shadow-lg shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-[#1e1b4b] font-bold text-xl shadow-inner shadow-black/20">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase leading-tight">Chanakya University</h1>
            <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">School of Engineering • MCA Programme</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-[10px] font-bold bg-indigo-950/50 px-4 py-1.5 rounded-full border border-indigo-800/50 tracking-wider uppercase">
            AI Interview Assistant v2.4
          </div>
          <div className="h-4 w-px bg-indigo-800" />
          <button className="text-[10px] font-bold hover:text-amber-400 transition-colors uppercase tracking-widest">
            Portal Stats
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Configuration */}
        <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-sm z-10 shrink-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Session Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-1.5 leading-none">
                  <FileSearch size={10} /> Smart Resume Sync
                </label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".txt,.md"
                    className="hidden" 
                    id="resume-upload" 
                    onChange={handleResumeUpload}
                  />
                  <label 
                    htmlFor="resume-upload"
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 rounded-xl py-4 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all cursor-pointer"
                  >
                    {isParsingResume ? (
                      <RefreshCcw size={14} className="animate-spin text-indigo-500" />
                    ) : (
                      <Upload size={14} className="text-slate-400 group-hover:text-indigo-500" />
                    )}
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 uppercase tracking-widest">
                      {isParsingResume ? 'Parsing Deeply...' : 'Scan Resume (.txt)'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1.5">
                  <User size={10} /> Candidate Name
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Arjun K. Vardhan"
                  value={inputs.candidateName}
                  onChange={(e) => setInputs({...inputs, candidateName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">Job Role</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    value={inputs.jobRole}
                    onChange={(e) => setInputs({...inputs, jobRole: e.target.value})}
                  >
                    <option>Software Developer</option>
                    <option>Full Stack Developer</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>Data Analyst</option>
                    <option>AI/ML Engineer</option>
                    <option>Cybersecurity Analyst</option>
                    <option>Cloud Engineer</option>
                    <option>QA Engineer</option>
                    <option>System Architect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">Exp. Level</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    value={inputs.experienceLevel}
                    onChange={(e) => setInputs({...inputs, experienceLevel: e.target.value as any})}
                  >
                    <option>Fresher</option>
                    <option>Intermediate</option>
                    <option>Experienced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1.5">
                  <Target size={10} /> Skills / Tech Stack
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  value={inputs.skills}
                  onChange={(e) => setInputs({...inputs, skills: e.target.value})}
                >
                  <option value="Java, Spring Boot, SQL, Hibernate">Java Full Stack (Corporate Standard)</option>
                  <option value="React, Node.js, Express, MongoDB, Tailwind">MERN Stack (Web Dev)</option>
                  <option value="Python, TensorFlow, Scikit-learn, SQL, Pandas">AI / Machine Learning</option>
                  <option value="AWS, Docker, Kubernetes, Jenkins, Terraform">Cloud & DevOps</option>
                  <option value="Python, Django, PostgreSQL, Redis">Python Backend</option>
                  <option value="C++, DSA, System Design, OS, DBMS">Core CS Fundamentals (Tech Heavy)</option>
                  <option value="Flutter, Firebase, Dart, Mobile Design">Mobile App Development</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    value={inputs.interviewType}
                    onChange={(e) => setInputs({...inputs, interviewType: e.target.value as any})}
                  >
                    <option>Mixed</option>
                    <option>Technical</option>
                    <option>HR</option>
                    <option>Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">Difficulty</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    value={inputs.difficulty}
                    onChange={(e) => setInputs({...inputs, difficulty: e.target.value as any})}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">Special Focus</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  value={inputs.specialFocus}
                  onChange={(e) => setInputs({...inputs, specialFocus: e.target.value})}
                >
                  <option value="">None (Standard Mix)</option>
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="System Design & Scalability">System Design & Scalability</option>
                  <option value="Database Optimization & SQL">Database Optimization & SQL</option>
                  <option value="Object Oriented Programming (OOPs)">Object Oriented Programming (OOPs)</option>
                  <option value="Microservices Architecture">Microservices Architecture</option>
                  <option value="Behavioral & Situational (STAR)">Behavioral & Situational (STAR)</option>
                  <option value="Final Project Deep Dive">Final Project Deep Dive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-amber-800 leading-tight">System design is crucial for experienced roles. Mid-level focus should be on optimization.</p>
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={status === 'generating'}
              className={cn(
                "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50",
                status === 'generating' && "bg-indigo-400"
              )}
            >
              {status === 'generating' ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span className="text-sm">Generate Session</span>
            </button>

            <button 
              onClick={handleATSAnalysis}
              disabled={status === 'generating' || !inputs.skills}
              className="w-full bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest">ATS Match Analysis</span>
            </button>
          </div>
        </aside>

        {/* Content Area: Session Output Preview */}
        <section className="flex-1 p-8 lg:p-12 bg-slate-100 flex flex-col items-center overflow-y-auto">
          <AnimatePresence mode="wait">
            {status === 'idle' ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-3xl aspect-[3/4] bg-white shadow-2xl rounded-sm border-t-8 border-[#1e1b4b] flex flex-col items-center justify-center text-center p-12 space-y-8"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 rotate-12">
                  <BookOpen size={48} />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">Document Preview</p>
                  <h3 className="text-2xl font-serif font-bold text-slate-800">Transcript Not Generated</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Configure your parameters on the left to produce an industry-standard interview assessment document from the MCA placement cell.</p>
                </div>
              </motion.div>
            ) : status === 'generating' ? (
              <motion.div 
                key="loading"
                className="w-full max-w-3xl aspect-[3/4] bg-white shadow-2xl rounded-sm border-t-8 border-indigo-600 flex flex-col items-center justify-center p-12 space-y-10"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-[3px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-200">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">Processing Request</p>
                  <h3 className="text-xl font-serif font-bold text-slate-800">Curating Session Questions...</h3>
                  <p className="text-xs text-indigo-400 font-bold animate-pulse uppercase tracking-widest">Consulting Knowledge Base</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-sm border-t-[6px] border-indigo-600 flex flex-col min-h-max animate-in fade-in zoom-in duration-500 mb-12"
              >
                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                  <button 
                    onClick={() => setActiveTab('questions')}
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                      activeTab === 'questions' ? "text-indigo-600" : "text-slate-400"
                    )}
                  >
                    Interview Questions
                    {activeTab === 'questions' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('ats')}
                    disabled={!atsResult}
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative disabled:opacity-30",
                      activeTab === 'ats' ? "text-emerald-600" : "text-slate-400"
                    )}
                  >
                    ATS Assessment
                    {activeTab === 'ats' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600" />}
                  </button>
                </div>

                {/* Document Paper Design */}
                <div className="p-10 border-b border-slate-100 text-center relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl" />
                  <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Official Interview Transcript</p>
                  <h3 className="text-2xl font-serif font-bold text-indigo-900 mt-2 tracking-tight">CHANAKYA UNIVERSITY</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">School of Engineering • MCA Placement Cell</p>
                </div>

                {/* Simulated Metadata Box */}
                <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 gap-y-3 font-serif text-[12px] text-slate-700">
                  <p><span className="font-bold text-indigo-900 opacity-60 uppercase text-[9px] mr-2 tracking-tighter shrink-0">Candidate</span> {inputs.candidateName || 'N/A'}</p>
                  <p><span className="font-bold text-indigo-900 opacity-60 uppercase text-[9px] mr-2 tracking-tighter shrink-0">Role</span> {inputs.jobRole}</p>
                  <p><span className="font-bold text-indigo-900 opacity-60 uppercase text-[9px] mr-2 tracking-tighter shrink-0">Experience</span> {inputs.experienceLevel}</p>
                  <p><span className="font-bold text-indigo-900 opacity-60 uppercase text-[9px] mr-2 tracking-tighter shrink-0">Duration</span> {inputs.duration || '45 Minutes'}</p>
                  <p className="col-span-2 flex items-start"><span className="font-bold text-indigo-900 opacity-60 uppercase text-[9px] mr-2 tracking-tighter mt-1 shrink-0">Stack</span> {inputs.skills}</p>
                </div>

                {/* Markdown View */}
                <div className="p-10 md:p-14 lg:p-16 prose prose-slate max-w-none prose-headings:text-indigo-900 prose-headings:font-bold prose-strong:text-indigo-900 prose-hr:border-slate-100 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
                  <div className="markdown-body">
                    <ReactMarkdown>{activeTab === 'questions' ? result : atsResult}</ReactMarkdown>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="bg-slate-50 px-10 py-5 border-t border-slate-200 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  <span>Ref: CU-MCA-2026-{Math.floor(Math.random() * 9000) + 1000}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                    <span>End of Interview Session</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer Bar: Global Actions */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center shrink-0 z-50">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 items-center">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> 
            AI Engine Ready
          </span>
          <span className="opacity-20 text-slate-300">|</span>
          <span className="text-slate-500">Format: MCA Placement Standard 2.0</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleDownload('txt')}
            className="px-4 py-1.5 border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 text-slate-600"
          >
            Export TXT
          </button>
          <button 
            onClick={() => handleDownload('pdf')}
            className="px-4 py-1.5 border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 text-slate-600"
          >
            Export DOCX
          </button>
          {status === 'completed' && (
            <button 
              onClick={() => setShowPractice(true)}
              className="px-6 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm active:scale-95"
            >
              Start Live Practice
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
