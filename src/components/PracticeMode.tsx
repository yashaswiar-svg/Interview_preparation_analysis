import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Mic, Send, Lightbulb, CheckCircle2, MessageSquare, ChevronRight, Video, VideoOff, Volume2, User } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from '../lib/utils';

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

interface PracticeModeProps {
  onClose: () => void;
  fullSession: string;
}

export default function PracticeMode({ onClose, fullSession }: PracticeModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{rating: string, points: string[]} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const speakQuestion = () => {
    const utterance = new SpeechSynthesisUtterance(questions[currentStep]);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Simple parser to get questions (rough implementation for demo)
  const questions = fullSession
    .split('\n')
    .filter(line => line.match(/^Q\d+\./) || line.includes('Problem Statement'))
    .map(q => q.trim());

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      As a senior interviewer, evaluate the following candidate answer for the question: "${questions[currentStep]}"
      Candidate Answer: "${userAnswer}"
      
      Provide feedback in exactly this JSON format:
      {
        "rating": "Strong / Average / Weak",
        "points": ["list of 3 constructive points for improvement"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleanedText);
      setFeedback(json);
    } catch (e) {
      console.error(e);
      setFeedback({ rating: "Completed", points: ["Your answer has been recorded.", "Ensure you structure your response using the STAR method.", "Keep practicing to improve confidence."] });
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setCurrentStep(prev => Math.min(prev + 1, questions.length - 1));
    setUserAnswer('');
    setFeedback(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 lg:p-10"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#1e1b4b] p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 opacity-5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-indigo-800/80 p-3 rounded-2xl ring-1 ring-white/10 shadow-lg">
              <MessageSquare size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Active Mock Session</h3>
              <p className="text-[10px] text-indigo-300 uppercase tracking-[0.3em] font-black mt-1">
                Chanakya University · Question {currentStep + 1} of {questions.length}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors relative z-10 border border-white/10 active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Interview Area */}
          <div className="flex-1 overflow-y-auto p-12 lg:p-16 space-y-12 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                  Current Interview Task
                </div>
                <button 
                  onClick={speakQuestion}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Volume2 size={16} /> Read Question
                </button>
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold text-slate-800 leading-tight tracking-tight max-w-3xl">
                {questions[currentStep] || "Preparing next question..."}
              </h4>
            </div>

            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center gap-3 text-indigo-600">
                <span className="w-16 h-1 bg-indigo-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Your Response Draft</span>
              </div>
              
              <textarea 
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="e.g. In my last project, I encountered a situation where..."
                className="w-full min-h-[220px] p-10 rounded-[2rem] border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700 leading-relaxed font-serif shadow-sm bg-white text-xl placeholder:text-slate-300"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95 group border border-indigo-100">
                    <Mic size={24} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voice Analytics</p>
                    <p className="text-xs text-slate-500 font-bold">Waiting for input...</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !userAnswer}
                  className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-200 active:scale-95 text-lg"
                >
                  {isEvaluating ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  {isEvaluating ? "Processing..." : "Submit for AI Review"}
                </button>
              </div>
            </div>

            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 lg:p-14 space-y-10 shadow-inner max-w-4xl"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-4 text-indigo-900">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <CheckCircle2 size={24} className="text-indigo-600" />
                    </div>
                    <span className="text-xl font-serif font-bold uppercase tracking-tight">AI Evaluation Report</span>
                  </div>
                  <div className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    feedback.rating === 'Strong' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    Grade: {feedback.rating}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {feedback.points.map((pt, i) => (
                    <div key={i} className="flex gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:translate-x-2">
                      <div className="mt-1">
                        <Lightbulb size={24} className="text-amber-500 shrink-0" />
                      </div>
                      <p className="text-md text-slate-700 font-bold leading-relaxed serif italic">"{pt}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar: Visual Simulation */}
          <div className="w-[340px] bg-slate-900 p-6 flex flex-col gap-6 shrink-0 border-l border-slate-800">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Interviewer Feed</p>
                <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden relative border border-slate-700 group">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" 
                    alt="AI Interviewer" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Dr. Elena (AI Dean)</span>
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Candidate Feed</p>
                  <button 
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isCameraOn ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                    )}
                  >
                    {isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
                  </button>
                </div>
                <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden relative border border-slate-700">
                  {isCameraOn ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-white/50 uppercase tracking-widest">Live Preview</div>
                </div>
             </div>

             <div className="mt-auto space-y-4">
               <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 text-center">Department Notice</p>
                 <p className="text-[11px] text-indigo-200 leading-tight font-medium text-center italic">
                   "Maintain eye contact with the center lens for higher confidence scoring."
                 </p>
               </div>
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white px-10 lg:px-14 shrink-0">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className="px-10 py-4 text-slate-500 font-bold hover:text-indigo-900 hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-30 flex items-center gap-3 uppercase text-xs tracking-widest"
            disabled={currentStep === 0}
          >
            ← Previous Question
          </button>
          
          {currentStep === questions.length - 1 ? (
            <button 
              onClick={onClose}
              className="px-16 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 uppercase text-xs tracking-widest"
            >
              Conclude Session
            </button>
          ) : (
            <button 
              onClick={nextQuestion}
              className="px-16 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-200 active:scale-95 uppercase text-xs tracking-widest"
            >
              Continue <ChevronRight size={20} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
