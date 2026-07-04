import React from 'react';
import Icon from './Icon';

const ReadingPractice = ({ chapter, speak }) => {
    const readingText = chapter.readingText || [];
    
    if (readingText.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40 italic">
            <Icon name="BookOpen" size={60} className="mb-4" />
            Story content coming soon...
        </div>
    );
    
    return (
        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 p-10 lg:p-16 relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-teal-600">
                    <Icon name="BookOpen" size={120} />
                </div>
                <h3 className="text-4xl font-black mb-12 text-slate-800 border-b-4 border-teal-100 inline-block pb-2 tracking-tight">
                    {chapter.readingTitle || chapter.title}
                </h3>
                <div className="space-y-8">
                    {readingText.map((item, i) => (
                        <p 
                            key={i} 
                            onClick={() => speak(item.text)} 
                            className="text-3xl lg:text-4xl leading-relaxed text-slate-700 cursor-pointer hover:text-teal-600 transition-colors group relative select-none"
                        >
                            {item.text}
                            <span className="opacity-0 group-hover:opacity-100 ml-3 transition-opacity inline-block">
                                <Icon name="Volume2" size={18} className="inline mb-1" />
                            </span>
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReadingPractice;
