import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

const WritingPractice = ({ chapter, speak }) => {
    const [wordIdx, setWordIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [showTrace, setShowTrace] = useState(true);
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const words = chapter.vocab || [];
    const currentWord = words[wordIdx];
    const currentChar = currentWord ? currentWord.char[charIdx] : '';

    // Reset charIdx when we change the word
    useEffect(() => {
        setCharIdx(0);
    }, [wordIdx]);

    useEffect(() => {
        if (canvasRef.current && currentChar) {
            const canvas = canvasRef.current;
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 12;
            ctxRef.current = ctx;
            clearCanvas();
        }
    }, [currentChar]);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctxRef.current.lineTo(offsetX, offsetY);
        ctxRef.current.stroke();
    };

    const stopDrawing = () => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setIsDrawing(false);
    };

    const getCoordinates = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        if (e.touches && e.touches[0]) {
            return {
                offsetX: (e.touches[0].clientX - rect.left) * scaleX,
                offsetY: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            offsetX: (e.nativeEvent.clientX - rect.left) * scaleX,
            offsetY: (e.nativeEvent.clientY - rect.top) * scaleY
        };
    };

    const clearCanvas = () => {
        if (ctxRef.current) {
            ctxRef.current.clearRect(0, 0, 400, 400);
        }
    };

    if (words.length === 0) return (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
            <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in h-full pb-10">
            <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm">
                <div className="flex items-center justify-between w-full">
                    <button 
                        onClick={() => setWordIdx(prev => Math.max(0, prev - 1))} 
                        disabled={wordIdx === 0}
                        className={`p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors ${wordIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <Icon name="ChevronLeft" />
                    </button>
                    <div className="text-center">
                        <h3 className="text-3xl font-black text-slate-800">{currentWord.char}</h3>
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest leading-tight">{currentWord.pinyin}</p>
                    </div>
                    <button 
                        onClick={() => setWordIdx(prev => Math.min(words.length - 1, prev + 1))} 
                        disabled={wordIdx === words.length - 1}
                        className={`p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors ${wordIdx === words.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <Icon name="ChevronRight" />
                    </button>
                </div>
                
                {/* Character index selector for multi-character words */}
                {currentWord.char.length > 1 && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 w-full justify-center">
                        {currentWord.char.split('').map((char, index) => (
                            <button
                                key={index}
                                onClick={() => setCharIdx(index)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                    charIdx === index 
                                        ? 'bg-teal-600 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {char}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <div className="tianzige w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-xl overflow-hidden bg-white shadow-2xl ring-4 ring-white">
                    {showTrace && currentChar && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <span className="text-[260px] md:text-[340px] text-slate-50 font-black" style={{ opacity: 0.8 }}>
                                {currentChar}
                            </span>
                        </div>
                    )}
                    <canvas 
                        ref={canvasRef} 
                        onMouseDown={startDrawing} 
                        onMouseMove={draw} 
                        onMouseUp={stopDrawing} 
                        onMouseLeave={stopDrawing} 
                        onTouchStart={startDrawing} 
                        onTouchMove={draw} 
                        onTouchEnd={stopDrawing} 
                        className="absolute inset-0 cursor-crosshair touch-none" 
                    />
                </div>
            </div>
            
            <div className="flex gap-3 w-full max-w-sm">
                <button 
                    onClick={() => setShowTrace(!showTrace)} 
                    className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                        showTrace ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                >
                    <Icon name="PenTool" size={16} /> Trace
                </button>
                <button 
                    onClick={clearCanvas} 
                    className="flex-1 py-3 bg-white text-rose-500 rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-rose-100 hover:bg-rose-50 transition-all"
                >
                    <Icon name="Eraser" size={16} /> Clear
                </button>
                <button 
                    onClick={() => speak(currentChar)} 
                    className="p-3 bg-slate-900 text-white rounded-xl active:scale-95 hover:bg-slate-800 transition-all"
                >
                    <Icon name="Volume2" size={18} />
                </button>
            </div>
        </div>
    );
};

export default WritingPractice;
