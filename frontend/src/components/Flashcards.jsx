import React, { useState, useMemo } from 'react';
import Icon from './Icon';

const CARD_GRADIENTS = [
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-indigo-400 to-blue-600',
  'from-yellow-400 to-amber-500',
];

const Flashcards = ({ chapter, speak, toggleKnown }) => {
  const vocab = chapter.vocab || [];
  const knownIndices = chapter.knownIndices || [];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const items = useMemo(
    () => vocab.filter((_, i) => !knownIndices.includes(i)),
    [vocab, knownIndices]
  );

  if (vocab.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
      <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-20 animate-in zoom-in space-y-4">
      <div className="text-6xl">🎉</div>
      <h3 className="text-3xl font-black text-teal-600">All Mastered!</h3>
      <p className="text-slate-400 font-bold">You know every word in this chapter.</p>
    </div>
  );

  const currentIdx = idx % items.length;
  const current = items[currentIdx];
  const gradient = CARD_GRADIENTS[currentIdx % CARD_GRADIENTS.length];

  const handleFlip = () => {
    if (!flipped) speak(current.char);
    setFlipped(!flipped);
  };

  const handleSkip = () => {
    setFlipped(false);
    setIdx(idx + 1);
  };

  const handleGotIt = () => {
    toggleKnown(vocab.indexOf(current));
    setFlipped(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-20">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {items.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentIdx ? 'w-6 h-2.5 bg-teal-500' : 'w-2.5 h-2.5 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Card counter */}
      <div className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">
        {currentIdx + 1} of {items.length} remaining
      </div>

      {/* Flashcard */}
      <div
        className="relative perspective-1000 h-[420px] w-full cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div className={`w-full h-full transition-all duration-700 transform-style-3d relative ${flipped ? 'rotate-y-180' : ''}`}>

          {/* Front */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[48px] shadow-2xl flex flex-col items-center justify-center backface-hidden p-8`}>
            <div className="text-7xl mb-4">{current.emoji || '📖'}</div>
            <span className="text-[110px] font-black text-white select-none drop-shadow-lg tracking-tighter leading-none">
              {current.char}
            </span>
            <p className="text-white/60 text-sm font-bold mt-6 uppercase tracking-widest animate-pulse">
              Tap to reveal
            </p>
          </div>

          {/* Back */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[48px] shadow-2xl flex flex-col items-center justify-center backface-hidden rotate-y-180 p-8 text-center border-[6px] border-white/30`}>
            <div className="text-6xl mb-3">{current.emoji || '📖'}</div>
            <h4 className="text-5xl font-black text-white mb-2 drop-shadow-lg">{current.char}</h4>
            <p className="text-2xl font-black text-white/90 mb-2">{current.pinyin}</p>
            <p className="text-white/80 text-lg font-bold uppercase tracking-wider bg-white/10 px-4 py-1.5 rounded-full">
              {current.meaning}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          className="flex-1 py-5 bg-white border-4 border-slate-200 rounded-3xl font-black text-slate-500 text-base hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Icon name="ChevronRight" size={18} /> Skip
        </button>
        <button
          onClick={handleGotIt}
          className="flex-2 px-8 py-5 bg-emerald-500 text-white rounded-3xl font-black text-base shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all hover:bg-emerald-400 flex items-center justify-center gap-2"
        >
          Got it! ⭐
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
