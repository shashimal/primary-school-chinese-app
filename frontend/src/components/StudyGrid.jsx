import React from 'react';
import Icon from './Icon';

const PASTEL_BGS = ['#E1F5EE', '#E6F1FB', '#FAECE7', '#FBEAF0', '#FAEEDA', '#EAF3DE', '#F1EFE8'];

const StudyGrid = ({ chapter, speak, toggleKnown }) => {
    const vocab = chapter.vocab || [];
    if (vocab.length === 0) return (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
            <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
        </div>
    );
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in pb-20 overflow-y-auto scrollbar-hide">
            {vocab.map((item, idx) => {
                const isKnown = (chapter.knownIndices || []).includes(idx);
                return (
                    <div key={idx} className={`bg-white p-6 rounded-3xl border-2 transition-all relative flex flex-col items-center text-center group ${isKnown ? 'border-teal-500 scale-95 opacity-60 shadow-inner' : 'border-white hover:border-teal-100 shadow-sm hover:shadow-xl'}`}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner" style={{ backgroundColor: PASTEL_BGS[idx % PASTEL_BGS.length] }}>{item.emoji}</div>
                        <h4 className="text-3xl font-black mb-1 text-slate-800">{item.char}</h4>
                        <p className="text-xs text-slate-400 font-black uppercase mt-1 tracking-widest">{item.meaning}</p>
                        <div className="flex gap-2 w-full pt-4 mt-auto">
                            <button onClick={() => speak(item.char)} className="flex-1 p-3 bg-slate-50 hover:bg-teal-50 text-teal-600 rounded-xl transition-all active:scale-95"><Icon name="Volume2" size={16} className="mx-auto" /></button>
                            <button onClick={() => toggleKnown(idx)} className={`flex-1 p-3 rounded-xl transition-all ${isKnown ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 text-slate-200 hover:text-teal-600'}`}><Icon name="CheckCircle2" size={16} className="mx-auto" /></button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StudyGrid;
