import React from 'react';
import Icon from './Icon';

const GRADES = [
  { grade: 1, label: 'Primary 1', chinese: '一年级', gradient: 'from-sky-400 to-blue-500',    bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    progress: 'from-sky-400 to-blue-500' },
  { grade: 2, label: 'Primary 2', chinese: '二年级', gradient: 'from-violet-400 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', progress: 'from-violet-400 to-purple-500' },
  { grade: 3, label: 'Primary 3', chinese: '三年级', gradient: 'from-amber-400 to-orange-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  progress: 'from-amber-400 to-orange-500' },
  { grade: 4, label: 'Primary 4', chinese: '四年级', gradient: 'from-teal-400 to-emerald-500',  bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   progress: 'from-teal-400 to-emerald-500' },
  { grade: 5, label: 'Primary 5', chinese: '五年级', gradient: 'from-rose-400 to-pink-500',     bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   progress: 'from-rose-400 to-pink-500' },
  { grade: 6, label: 'Primary 6', chinese: '六年级', gradient: 'from-indigo-400 to-blue-600',   bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', progress: 'from-indigo-400 to-blue-600' },
];

export default function GradePicker({ summaries, onSelectGrade }) {
  const getSummary = (grade) =>
    summaries.find(s => s.grade === grade) || { chapter_count: 0, total_vocab: 0, mastered_vocab: 0 };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4">
          <Icon name="BookOpen" size={12} /> Choose Your Level
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Which grade are you studying?</h2>
        <p className="text-slate-400 font-bold mt-3 text-base">Select your primary school year to see your chapters and track progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GRADES.map(({ grade, label, chinese, gradient, bg, border, text, progress }) => {
          const s = getSummary(grade);
          const pct = s.total_vocab > 0 ? Math.round((s.mastered_vocab / s.total_vocab) * 100) : 0;
          const hasContent = s.chapter_count > 0;

          return (
            <button
              key={grade}
              onClick={() => onSelectGrade(grade)}
              className={`${bg} border-2 ${border} p-6 rounded-[28px] text-left transition-all duration-200 hover:scale-[1.025] hover:shadow-2xl active:scale-[0.98] group relative overflow-hidden cursor-pointer`}
            >
              {/* Decorative circle */}
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

              {/* Grade badge */}
              <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-black/10`}>
                  {grade}
                </div>
                {hasContent && pct === 100 && (
                  <span className={`${text} bg-white text-[10px] font-black px-2.5 py-1 rounded-full border ${border} flex items-center gap-1`}>
                    <Icon name="CheckCircle2" size={10} /> Done
                  </span>
                )}
                {!hasContent && (
                  <span className="bg-white text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200">
                    Empty
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-slate-800 leading-tight">{label}</h3>
                <p className={`text-sm font-bold ${text} mt-1`}>{chinese}</p>
              </div>

              {/* Stats + progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>{s.chapter_count} {s.chapter_count === 1 ? 'chapter' : 'chapters'} · {s.total_vocab} words</span>
                  <span className={text}>{pct}%</span>
                </div>
                <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                  <div
                    className={`h-full bg-gradient-to-r ${progress} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>

              {/* CTA arrow */}
              <div className={`mt-5 flex items-center gap-2 ${text} font-black text-xs group-hover:gap-3 transition-all`}>
                <span>{hasContent ? 'Start Studying' : 'Add Content'}</span>
                <Icon name="ArrowRight" size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
