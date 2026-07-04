import React, { useState } from 'react';
import Icon from './Icon';

const SENTENCE_COLORS = [
  { ring: 'ring-sky-300',    bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    active: 'bg-sky-100' },
  { ring: 'ring-violet-300', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', active: 'bg-violet-100' },
  { ring: 'ring-amber-300',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  active: 'bg-amber-100' },
  { ring: 'ring-emerald-300',bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',active: 'bg-emerald-100' },
];

const ReadingPractice = ({ chapter, speak }) => {
  const readingText = chapter.readingText || [];
  const [activeLine, setActiveLine] = useState(null);
  const [playingLine, setPlayingLine] = useState(null);

  if (readingText.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
      <Icon name="BookOpen" size={56} className="mx-auto text-slate-300 mb-4" />
      <p className="text-slate-400 font-bold">No reading content for this chapter yet.</p>
    </div>
  );

  const handleSpeak = (text, idx) => {
    setPlayingLine(idx);
    setActiveLine(idx);
    speak(text);
    setTimeout(() => setPlayingLine(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6">

      {/* Story header */}
      <div className="bg-white rounded-[36px] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-teal-600">
          <Icon name="BookOpen" size={100} />
        </div>
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-4">
          <Icon name="BookOpen" size={11} /> Reading Practice
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {chapter.readingTitle || chapter.title}
        </h3>
        <p className="text-slate-400 font-bold text-sm mt-2">
          Tap any sentence to hear it spoken aloud
        </p>
      </div>

      {/* Sentences */}
      <div className="space-y-4">
        {readingText.map((item, i) => {
          const color = SENTENCE_COLORS[i % SENTENCE_COLORS.length];
          const isActive = activeLine === i;
          const isPlaying = playingLine === i;

          return (
            <button
              key={i}
              onClick={() => handleSpeak(item.text, i)}
              className={`w-full text-left p-6 rounded-[28px] border-2 transition-all duration-200 active:scale-[0.98] group ${
                isActive
                  ? `${color.active} ${color.border} shadow-lg ring-4 ${color.ring}`
                  : `bg-white ${color.border} hover:${color.bg} hover:shadow-md shadow-sm`
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Line number badge */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-1 ${
                  isActive ? `bg-white ${color.text}` : `${color.bg} ${color.text}`
                }`}>
                  {i + 1}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className={`text-2xl lg:text-3xl font-black leading-relaxed ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.text}
                  </p>
                </div>

                {/* Speaker icon */}
                <div className={`shrink-0 mt-2 transition-all ${isPlaying ? `${color.text} scale-125 animate-pulse` : 'text-slate-300 group-hover:text-slate-400'}`}>
                  <Icon name="Volume2" size={22} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Read all button */}
      {readingText.length > 1 && (
        <button
          onClick={() => {
            let i = 0;
            const readNext = () => {
              if (i >= readingText.length) { setActiveLine(null); return; }
              handleSpeak(readingText[i].text, i);
              i++;
              setTimeout(readNext, 2500);
            };
            readNext();
          }}
          className="w-full py-4 bg-white border-2 border-teal-200 text-teal-700 rounded-2xl font-black text-sm hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="Volume2" size={16} /> Read All Sentences
        </button>
      )}
    </div>
  );
};

export default ReadingPractice;
