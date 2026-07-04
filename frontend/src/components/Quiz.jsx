import React, { useState, useMemo } from 'react';
import Icon from './Icon';

const OPTION_STYLES = [
  { idle: 'bg-sky-100    border-sky-300    text-sky-900',    correct: 'bg-sky-500    border-sky-500    text-white shadow-sky-500/30' },
  { idle: 'bg-violet-100 border-violet-300 text-violet-900', correct: 'bg-violet-500 border-violet-500 text-white shadow-violet-500/30' },
  { idle: 'bg-amber-100  border-amber-300  text-amber-900',  correct: 'bg-amber-500  border-amber-500  text-white shadow-amber-500/30' },
  { idle: 'bg-emerald-100 border-emerald-300 text-emerald-900', correct: 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/30' },
];

function Stars({ count }) {
  return (
    <div className="flex items-center justify-center gap-2 text-5xl">
      {[1, 2, 3].map(i => (
        <span key={i} className={`transition-all duration-500 ${i <= count ? 'scale-110' : 'opacity-25 grayscale'}`}>
          ⭐
        </span>
      ))}
    </div>
  );
}

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
    return [current, ...vocab.filter(v => v !== current).sort(() => Math.random() - 0.5).slice(0, 3)]
      .sort(() => Math.random() - 0.5);
  }, [current, vocab]);

  if (vocab.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
      <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
    </div>
  );

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="max-w-md mx-auto text-center space-y-8 py-10">
      <div>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-3xl font-black text-slate-800">Reading Quiz</h3>
        <p className="text-slate-400 font-bold mt-2">How many questions do you want?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[5, 10, 15, 20].map((n, i) => {
          const colors = ['bg-sky-100 border-sky-300 text-sky-800 hover:bg-sky-200', 'bg-violet-100 border-violet-300 text-violet-800 hover:bg-violet-200', 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200', 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'];
          const disabled = vocab.length < n && n !== 5;
          return (
            <button
              key={n}
              disabled={disabled}
              onClick={() => { setTotalQuestions(n); setPhase('game'); }}
              className={`py-6 border-4 rounded-[28px] font-black text-3xl transition-all active:scale-95 shadow-sm ${
                disabled ? 'opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : colors[i]
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => { setTotalQuestions(vocab.length); setPhase('game'); }}
        className="w-full py-4 text-slate-500 font-black text-sm border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-50 transition-all"
      >
        All {vocab.length} words
      </button>
    </div>
  );

  // ── Results screen ────────────────────────────────────────────────────────
  if (qIdx >= questions.length) {
    const pct = score / questions.length;
    const starCount = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    const messages = ['Keep practising! 💪', 'Good effort! 😊', 'Excellent! 🎉'];

    return (
      <div className="text-center py-12 bg-white rounded-[48px] shadow-2xl border-4 border-slate-50 max-w-md mx-auto space-y-6 px-8 animate-in zoom-in">
        <div className="text-6xl">{starCount === 3 ? '🎊' : starCount === 2 ? '😊' : '💪'}</div>
        <h3 className="text-2xl font-black text-slate-800">Quiz Complete!</h3>

        <Stars count={starCount} />

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-4xl font-black text-teal-600">{score} / {questions.length}</p>
          <p className="text-sm font-bold text-slate-400 mt-1">{messages[starCount - 1]}</p>
        </div>

        <button
          onClick={() => { setPhase('setup'); setQIdx(0); setScore(0); setAnswered(null); }}
          className="w-full py-5 bg-slate-900 text-white rounded-[32px] font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Icon name="RotateCcw" size={20} /> Play Again
        </button>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  const check = (opt) => {
    if (answered) return;
    setAnswered(opt);
    if (opt === current) {
      setScore(s => s + 1);
      speak(current.char);
    } else {
      onIncorrect(current.char);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-black text-slate-400">
          <span>Question {qIdx + 1} of {questions.length}</span>
          <span>⭐ {score} correct</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${((qIdx) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Character display */}
      <div className="text-center py-10 bg-white rounded-[56px] shadow-sm border-2 border-slate-100">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">What does this mean?</p>
        <div className="text-[130px] font-black leading-none text-slate-800 tracking-tighter drop-shadow-sm">
          {current.char}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const style = OPTION_STYLES[i];
          let cls = `p-5 rounded-[28px] border-4 text-left flex items-center gap-4 transition-all duration-200 ${style.idle}`;

          if (answered) {
            if (opt === current) {
              cls = `p-5 rounded-[28px] border-4 text-left flex items-center gap-4 transition-all duration-200 scale-[1.03] shadow-xl ${style.correct}`;
            } else if (answered === opt) {
              cls = 'p-5 rounded-[28px] border-4 border-rose-400 bg-rose-100 text-rose-800 text-left flex items-center gap-4 transition-all duration-200';
            } else {
              cls = 'p-5 rounded-[28px] border-4 border-slate-200 bg-slate-100 text-slate-400 text-left flex items-center gap-4 opacity-40 transition-all duration-200';
            }
          }

          return (
            <button key={i} disabled={!!answered} onClick={() => check(opt)} className={cls}>
              <span className="text-3xl shrink-0">{opt.emoji || '📖'}</span>
              <div>
                <span className="font-black text-lg leading-tight">{opt.meaning}</span>
                {answered && opt === current && (
                  <p className="text-xs font-bold opacity-80 mt-0.5">{opt.pinyin}</p>
                )}
              </div>
              {answered && opt === current && <span className="ml-auto text-xl">✅</span>}
              {answered && answered === opt && opt !== current && <span className="ml-auto text-xl">❌</span>}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {answered && (
        <button
          onClick={() => { setQIdx(qIdx + 1); setAnswered(null); }}
          className="w-full py-6 bg-teal-600 text-white rounded-[36px] font-black text-xl shadow-2xl shadow-teal-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-4"
        >
          {qIdx + 1 >= questions.length ? 'See Results 🏆' : 'Next Word'} <Icon name="ChevronRight" size={24} />
        </button>
      )}
    </div>
  );
};

export default Quiz;
