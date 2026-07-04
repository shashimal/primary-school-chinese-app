import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

const INK_COLORS = [
  { hex: '#1e293b', label: '✏️', name: 'Pencil' },
  { hex: '#3b82f6', label: '🖊️', name: 'Blue' },
  { hex: '#ef4444', label: '🖍️', name: 'Red' },
  { hex: '#10b981', label: '🟢', name: 'Green' },
  { hex: '#8b5cf6', label: '💜', name: 'Purple' },
];

const WritingPractice = ({ chapter, speak }) => {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showTrace, setShowTrace] = useState(true);
  const [inkColor, setInkColor] = useState(INK_COLORS[0].hex);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const words = chapter.vocab || [];
  const currentWord = words[wordIdx];
  const currentChar = currentWord ? currentWord.char[charIdx] : '';

  useEffect(() => { setCharIdx(0); }, [wordIdx]);

  useEffect(() => {
    if (canvasRef.current && currentChar) {
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 12;
      ctxRef.current = ctx;
      clearCanvas();
    }
  }, [currentChar]);

  const changeInkColor = (hex) => {
    setInkColor(hex);
    if (ctxRef.current) ctxRef.current.strokeStyle = hex;
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = canvasRef.current.width / rect.width;
    const sy = canvasRef.current.height / rect.height;
    if (e.touches && e.touches[0]) {
      return {
        offsetX: (e.touches[0].clientX - rect.left) * sx,
        offsetY: (e.touches[0].clientY - rect.top) * sy,
      };
    }
    return {
      offsetX: (e.nativeEvent.clientX - rect.left) * sx,
      offsetY: (e.nativeEvent.clientY - rect.top) * sy,
    };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoords(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoords(e);
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (ctxRef.current) ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (ctxRef.current) ctxRef.current.clearRect(0, 0, 400, 400);
  };

  if (words.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500 mb-4" />
      <p className="text-slate-400 font-bold">This chapter is empty. Please upload vocabulary first!</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 pb-10">

      {/* Word navigator */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 w-full max-w-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWordIdx(p => Math.max(0, p - 1))}
            disabled={wordIdx === 0}
            className={`p-2.5 rounded-xl transition-colors ${wordIdx === 0 ? 'opacity-30 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Icon name="ChevronLeft" size={20} />
          </button>

          <div className="text-center">
            <div className="text-4xl font-black text-slate-800">{currentWord.char}</div>
            <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-0.5">{currentWord.pinyin}</div>
            <div className="text-xs text-slate-400 font-bold mt-0.5">{currentWord.meaning}</div>
          </div>

          <button
            onClick={() => setWordIdx(p => Math.min(words.length - 1, p + 1))}
            disabled={wordIdx === words.length - 1}
            className={`p-2.5 rounded-xl transition-colors ${wordIdx === words.length - 1 ? 'opacity-30 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Icon name="ChevronRight" size={20} />
          </button>
        </div>

        {/* Character selector for multi-char words */}
        {currentWord.char.length > 1 && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 justify-center">
            {currentWord.char.split('').map((ch, i) => (
              <button
                key={i}
                onClick={() => setCharIdx(i)}
                className={`w-9 h-9 rounded-full font-bold text-sm transition-all ${
                  charIdx === i ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Writing canvas */}
      <div className="relative">
        <div
          className="tianzige w-[300px] h-[300px] md:w-[380px] md:h-[380px] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-amber-100"
          style={{ backgroundColor: '#FFFBF0' }}
        >
          {showTrace && currentChar && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="font-black" style={{ fontSize: '280px', color: 'rgba(0,0,0,0.06)', lineHeight: 1 }}>
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

      {/* Ink color picker */}
      <div className="flex items-center gap-2 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Ink</span>
        {INK_COLORS.map(({ hex, label, name }) => (
          <button
            key={hex}
            onClick={() => changeInkColor(hex)}
            title={name}
            className={`w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all ${
              inkColor === hex ? 'ring-4 ring-offset-2 scale-110 shadow-md' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: inkColor === hex ? hex + '22' : 'transparent', ringColor: hex }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={() => setShowTrace(!showTrace)}
          className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all border-2 ${
            showTrace ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Icon name="PenTool" size={15} /> Trace Guide
        </button>
        <button
          onClick={clearCanvas}
          className="flex-1 py-3 bg-white text-rose-500 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-2 border-rose-100 hover:bg-rose-50 transition-all"
        >
          <Icon name="Eraser" size={15} /> Clear
        </button>
        <button
          onClick={() => speak(currentChar)}
          className="px-4 py-3 bg-teal-600 text-white rounded-xl active:scale-95 hover:bg-teal-500 transition-all shadow-md"
          title="Pronounce"
        >
          <Icon name="Volume2" size={18} />
        </button>
      </div>
    </div>
  );
};

export default WritingPractice;
