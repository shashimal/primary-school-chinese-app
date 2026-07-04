import React from 'react';
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

const StudyGrid = ({ chapter, speak, toggleKnown }) => {
  const vocab = chapter.vocab || [];

  if (vocab.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
      <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
    </div>
  );

  const masteredCount = (chapter.knownIndices || []).length;
  const pct = vocab.length > 0 ? Math.round((masteredCount / vocab.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Progress banner */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-black text-slate-400 mb-1.5">
            <span>⭐ {masteredCount} mastered</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {pct === 100 && (
          <span className="text-2xl animate-bounce">🎉</span>
        )}
      </div>

      {/* Vocab grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {vocab.map((item, idx) => {
          const isKnown = (chapter.knownIndices || []).includes(idx);
          const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${gradient} rounded-3xl p-5 relative flex flex-col items-center text-center transition-all duration-200 ${
                isKnown
                  ? 'opacity-60 shadow-md scale-95'
                  : 'shadow-lg hover:scale-[1.05] hover:shadow-2xl cursor-pointer'
              }`}
            >
              {/* Star badge for mastered */}
              {isKnown && (
                <div className="absolute top-2.5 right-2.5 text-xl leading-none">⭐</div>
              )}

              {/* Emoji */}
              <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-inner">
                {item.emoji || '📖'}
              </div>

              {/* Character */}
              <h4 className="text-4xl font-black text-white drop-shadow-md mb-0.5 leading-none">
                {item.char}
              </h4>

              {/* Pinyin */}
              <p className="text-[11px] text-white/80 font-bold tracking-widest mt-1">
                {item.pinyin}
              </p>

              {/* Meaning */}
              <p className="text-xs text-white/95 font-black uppercase tracking-wide mt-0.5">
                {item.meaning}
              </p>

              {/* Actions */}
              <div className="flex gap-2 w-full mt-4">
                <button
                  onClick={() => speak(item.char)}
                  className="flex-1 p-2.5 bg-white/20 hover:bg-white/35 text-white rounded-xl transition-all active:scale-95"
                  title="Pronounce"
                >
                  <Icon name="Volume2" size={15} className="mx-auto" />
                </button>
                <button
                  onClick={() => toggleKnown(idx)}
                  className={`flex-1 p-2.5 rounded-xl transition-all active:scale-95 text-sm font-black ${
                    isKnown
                      ? 'bg-white/30 text-yellow-200'
                      : 'bg-white/20 hover:bg-white/35 text-white/60 hover:text-white'
                  }`}
                  title={isKnown ? 'Unmark' : 'Mark as learned'}
                >
                  {isKnown ? '⭐' : <Icon name="CheckCircle2" size={15} className="mx-auto" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyGrid;
