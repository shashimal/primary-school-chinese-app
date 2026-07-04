import React, { useState, useMemo } from 'react';
import Icon from './Icon';

const Flashcards = ({ chapter, speak, toggleKnown }) => {
    const vocab = chapter.vocab || [];
    const knownIndices = chapter.knownIndices || [];
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const items = useMemo(() => vocab.filter((_, i) => !knownIndices.includes(i)), [vocab, knownIndices]);

    if (vocab.length === 0) return (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
            <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
        </div>
    );

    if (items.length === 0) return (
        <div className="text-center py-20 animate-in zoom-in">
            <h3 className="text-3xl font-black text-teal-600">All Mastered! 🌟</h3>
        </div>
    );
    
    const current = items[idx % items.length];
    
    const handleFlip = () => {
        if (!flipped) {
            speak(current.char);
        }
        setFlipped(!flipped);
    };

    return (
        <div className="max-w-md mx-auto space-y-12 pb-20">
            <div className="relative perspective-1000 h-[450px] w-full cursor-pointer" onClick={handleFlip}>
                <div className={`w-full h-full transition-all duration-700 transform-style-3d relative ${flipped ? 'rotate-y-180' : ''}`}>
                    <div className="absolute inset-0 bg-white border-2 border-slate-100 rounded-[60px] shadow-2xl flex flex-col items-center justify-center backface-hidden">
                        <span className="text-[150px] font-black text-slate-800 select-none tracking-tighter">{current.char}</span>
                    </div>
                    <div className="absolute inset-0 bg-white border-[6px] border-teal-500 rounded-[80px] shadow-2xl flex flex-col items-center justify-center backface-hidden rotate-y-180 p-8 text-center">
                        <div className="text-6xl mb-6">{current.emoji}</div>
                        <h4 className="text-6xl font-black mb-2 text-slate-800">{current.char}</h4>
                        <p className="text-3xl font-black text-teal-600 mb-4">{current.pinyin}</p>
                        <p className="text-slate-400 text-lg font-bold uppercase">{current.meaning}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={() => { setFlipped(false); setIdx((idx + 1) % items.length); }} className="flex-1 py-5 bg-white border-4 border-slate-100 rounded-3xl font-black text-slate-300">SKIP</button>
                <button onClick={() => { toggleKnown(vocab.indexOf(current)); setFlipped(false); }} className="flex-1 py-5 bg-teal-600 text-white rounded-3xl font-black shadow-2xl active:scale-95 transition-all">GOT IT!</button>
            </div>
        </div>
    );
};

export default Flashcards;
