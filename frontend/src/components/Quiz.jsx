import React, { useState, useMemo } from 'react';
import Icon from './Icon';

const Quiz = ({ chapter, speak, onIncorrect }) => {
    const vocab = chapter.vocab || [];
    const [phase, setPhase] = useState('setup'); 
    const [qIdx, setQIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(10);
    
    const questions = useMemo(() => {
        if (phase !== 'game') return [];
        return [...vocab].sort(() => Math.random() - 0.5).slice(0, Math.min(totalQuestions, vocab.length));
    }, [vocab, totalQuestions, phase]);

    const current = questions[qIdx];
    const options = useMemo(() => {
        if (!current) return [];
        return [current, ...vocab.filter(v => v !== current).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    }, [current, vocab]);

    if (vocab.length === 0) return (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
            <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
        </div>
    );

    if (phase === 'setup') return (
        <div className="max-w-md mx-auto text-center space-y-10 py-12 animate-in zoom-in-95">
            <h3 className="text-4xl font-black text-slate-800 tracking-tight">Reading Quiz</h3>
            <div className="grid grid-cols-2 gap-4">
                {[5, 10, 15, 20].map(n => (
                    <button 
                        key={n} 
                        disabled={vocab.length < n && n !== 5} 
                        onClick={() => { setTotalQuestions(n); setPhase('game'); }} 
                        className={`py-6 bg-white border-4 border-slate-100 rounded-[32px] font-black text-2xl hover:border-teal-400 transition-all shadow-sm ${vocab.length < n && n !== 5 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <button onClick={() => { setTotalQuestions(vocab.length); setPhase('game'); }} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest border border-dashed border-slate-200 rounded-2xl hover:bg-white transition-all">All {vocab.length} Words</button>
        </div>
    );

    if (qIdx >= questions.length) return (
        <div className="text-center py-20 bg-white rounded-[64px] shadow-2xl border-4 border-slate-50 animate-in zoom-in">
            <Icon name="Trophy" size={80} className="mx-auto text-teal-500 mb-8" />
            <p className="text-3xl font-black text-teal-600 mb-12">{score} / {questions.length} Correct</p>
            <button onClick={() => { setPhase('setup'); setQIdx(0); setScore(0); setAnswered(null); }} className="bg-slate-900 text-white px-16 py-6 rounded-[40px] font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"><Icon name="RotateCcw" className="inline mr-3 mb-1" size={24} /> RESTART</button>
        </div>
    );

    const check = (opt) => { 
        if (answered) return; 
        setAnswered(opt); 
        if (opt === current) { 
            setScore(score + 1); 
            speak(current.char); 
        } else { 
            onIncorrect(current.char); 
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 animate-in fade-in">
            <div className="flex justify-between items-center px-6">
                <div className="flex-1 h-5 bg-slate-200 rounded-full mr-10 border-4 border-white shadow-inner overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-700 ease-out" style={{ width: `${((qIdx+1)/questions.length)*100}%` }} />
                </div>
                <span className="font-black text-slate-300 text-2xl tracking-tighter">{qIdx+1}/{questions.length}</span>
            </div>
            <div className="text-center py-12 bg-white rounded-[80px] shadow-sm border-2 border-slate-50 relative">
                <div className="text-[150px] font-black leading-none text-slate-800 tracking-tighter drop-shadow-lg">{current.char}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {options.map((opt, i) => (
                    <button key={i} disabled={!!answered} onClick={() => check(opt)} className={`p-6 rounded-[32px] border-4 text-left flex items-center gap-4 transition-all ${answered ? (opt === current ? 'border-teal-500 bg-teal-50 text-teal-700 scale-105 z-10 shadow-2xl' : (answered === opt ? 'border-rose-400 bg-rose-50 opacity-60' : 'border-transparent opacity-30')) : 'border-white bg-white hover:border-teal-100 shadow-xl shadow-slate-200/50'}`}>
                        <div className="text-2xl shrink-0 drop-shadow-sm">{opt.emoji}</div>
                        <div className="flex flex-col">
                            <span className="font-black text-lg leading-none tracking-tight text-slate-800">{opt.meaning}</span>
                        </div>
                    </button>
                ))}
            </div>
            {answered && (
                <button onClick={() => { setQIdx(qIdx + 1); setAnswered(null); }} className="w-full py-8 bg-teal-600 text-white rounded-[40px] font-black text-3xl shadow-2xl shadow-teal-600/40 animate-in slide-in-from-bottom-6 transition-all flex items-center justify-center gap-2">
                    NEXT WORD <Icon name="ChevronRight" size={30} />
                </button>
            )}
        </div>
    );
};

export default Quiz;
