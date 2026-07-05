import React, { useState, useRef } from 'react';
import Icon from './Icon';

// ── Text utilities ────────────────────────────────────────────────────────────
function stripPunctuation(text) {
  return text.replace(/[。，！？、,.!?\s]/g, '');
}

// LCS-based character diff — returns { char, status: 'correct' | 'missing' }[]
function compareTexts(original, spoken) {
  const origChars = stripPunctuation(original).split('');
  const spokChars = stripPunctuation(spoken).split('');

  if (origChars.length === 0) return [];
  if (spokChars.length === 0) return origChars.map(c => ({ char: c, status: 'missing' }));

  const m = origChars.length, n = spokChars.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = origChars[i-1] === spokChars[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  const result = [];
  let i = m, j = n;
  while (i > 0) {
    if (j > 0 && origChars[i-1] === spokChars[j-1]) {
      result.unshift({ char: origChars[i-1], status: 'correct' }); i--; j--;
    } else if (j > 0 && dp[i][j-1] >= dp[i-1][j]) {
      j--;
    } else {
      result.unshift({ char: origChars[i-1], status: 'missing' }); i--;
    }
  }
  return result;
}

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
  { border: 'border-sky-200',     active: 'border-sky-400',     num: 'bg-sky-100    text-sky-700',     divider: 'border-sky-100' },
  { border: 'border-violet-200',  active: 'border-violet-400',  num: 'bg-violet-100 text-violet-700',  divider: 'border-violet-100' },
  { border: 'border-amber-200',   active: 'border-amber-400',   num: 'bg-amber-100  text-amber-700',   divider: 'border-amber-100' },
  { border: 'border-emerald-200', active: 'border-emerald-400', num: 'bg-emerald-100 text-emerald-700', divider: 'border-emerald-100' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const ReadingPractice = ({ chapter, speak }) => {
  const readingText = chapter.readingText || [];

  const [listeningIdx, setListeningIdx] = useState(null);
  const [results, setResults]           = useState({});
  const [errors,  setErrors]            = useState({});

  const recognitionRef  = useRef(null);
  const accumulatedRef  = useRef('');   // final segments joined together
  const interimRef      = useRef('');   // latest interim segment

  const SpeechAPI    = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const micSupported = !!SpeechAPI;

  // ── Start recording ─────────────────────────────────────────────────────────
  const startListening = (idx, originalText) => {
    if (!SpeechAPI) return;
    if (recognitionRef.current) recognitionRef.current.abort();

    accumulatedRef.current = '';
    interimRef.current     = '';

    setListeningIdx(idx);
    setResults(prev => ({ ...prev, [idx]: null }));
    setErrors(prev =>  ({ ...prev, [idx]: null }));

    const rec = new SpeechAPI();
    rec.lang            = 'zh-CN';
    rec.continuous      = true;   // keep listening until user taps Stop
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedRef.current += t;
          interimRef.current = '';
        } else {
          interim += t;
        }
      }
      interimRef.current = interim;

      // Show everything seen so far (finals + current interim)
      setResults(prev => ({
        ...prev,
        [idx]: { transcript: accumulatedRef.current + interim, comparison: null, isFinal: false },
      }));
    };

    // Called when recognition session ends (after stop() or natural timeout)
    rec.onend = () => {
      const transcript = (accumulatedRef.current + interimRef.current).trim();
      if (transcript) {
        const comparison = compareTexts(originalText, transcript);
        setResults(prev => ({ ...prev, [idx]: { transcript, comparison, isFinal: true } }));
      }
      setListeningIdx(null);
    };

    rec.onerror = (e) => {
      const msg =
        e.error === 'not-allowed' ? 'Microphone permission denied. Allow access in your browser settings.' :
        e.error === 'no-speech'   ? 'No speech detected — try speaking closer to the microphone.' :
        e.error === 'network'     ? 'Network error. Make sure you are on HTTPS.' :
        `Error: ${e.error}`;
      setErrors(prev => ({ ...prev, [idx]: msg }));
      setListeningIdx(null);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // ── Stop recording ──────────────────────────────────────────────────────────
  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    // onend will fire and process accumulated transcript
  };

  const reset = (idx) => {
    setResults(prev => ({ ...prev, [idx]: null }));
    setErrors(prev =>  ({ ...prev, [idx]: null }));
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (readingText.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
      <Icon name="BookOpen" size={56} className="mx-auto text-slate-300 mb-4" />
      <p className="text-slate-400 font-bold">No reading content for this chapter yet.</p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5">

      {/* Header */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-teal-600">
          <Icon name="BookOpen" size={90} />
        </div>
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-3">
          <Icon name="BookOpen" size={11} /> Reading Practice
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {chapter.readingTitle || chapter.title}
        </h3>
        <p className="text-slate-400 font-bold text-sm mt-2">
          {micSupported
            ? 'Tap 🔊 to listen · Tap 🎤 to start speaking, then tap ⏹ when done'
            : '⚠️ Voice recognition needs Chrome or Safari on HTTPS.'}
        </p>
      </div>

      {/* Sentence cards */}
      {readingText.map((item, i) => {
        const color       = COLORS[i % COLORS.length];
        const isListening = listeningIdx === i;
        const result      = results[i];
        const hasResult   = !!(result?.isFinal && result?.comparison);
        const errorMsg    = errors[i];

        const correctCount = hasResult ? result.comparison.filter(c => c.status === 'correct').length : 0;
        const totalCount   = hasResult ? result.comparison.length : 0;
        const score        = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

        return (
          <div key={i}
            className={`bg-white rounded-[28px] border-2 transition-all duration-200 overflow-hidden shadow-sm ${
              isListening ? `${color.active} shadow-xl` : color.border
            }`}>

            {/* Sentence row */}
            <div className="p-5 flex items-start gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-1 ${color.num}`}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Char-by-char highlighted result OR plain tappable sentence */}
                {hasResult ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.comparison.map((c, ci) => (
                      <span key={ci} className={`text-2xl lg:text-3xl font-black rounded-xl px-1.5 py-0.5 ${
                        c.status === 'correct'
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-rose-500 bg-rose-100 line-through decoration-rose-400 decoration-2'
                      }`}>
                        {c.char}
                      </span>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => speak(item.text)}
                    className="text-2xl lg:text-3xl font-black text-slate-800 leading-snug text-left hover:text-teal-700 transition-colors">
                    {item.text}
                  </button>
                )}

                {/* Live interim transcript */}
                {isListening && result?.transcript && !result?.isFinal && (
                  <p className="text-sm text-slate-400 font-bold mt-3 italic">🎤 "{result.transcript}…"</p>
                )}

                {/* Bouncing bars while waiting for first word */}
                {isListening && !result?.transcript && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {[0, 1, 2, 3].map(d => (
                      <div key={d} className="w-1.5 h-5 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                    <span className="text-xs font-bold text-slate-400 ml-2">Listening… tap ⏹ when done</span>
                  </div>
                )}
              </div>

              {/* Listen button */}
              <button onClick={() => speak(item.text)} title="Listen"
                className="p-2 text-slate-300 hover:text-teal-600 transition-colors shrink-0 mt-1">
                <Icon name="Volume2" size={20} />
              </button>
            </div>

            {/* Score section */}
            {hasResult && (
              <div className={`px-5 pb-4 border-t ${color.divider} pt-4 space-y-3`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 text-sm font-black">
                      <span className="text-emerald-600">✅ {correctCount} correct</span>
                      {totalCount - correctCount > 0 && (
                        <span className="text-rose-500">❌ {totalCount - correctCount} missed</span>
                      )}
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${
                      score === 100 ? 'bg-emerald-100 text-emerald-700' :
                      score >= 70  ? 'bg-amber-100  text-amber-700'   :
                                     'bg-rose-100   text-rose-600'
                    }`}>{score}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      score === 100 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-400' : 'bg-rose-400'
                    }`} style={{ width: `${score}%` }} />
                  </div>
                </div>

                {score === 100 && (
                  <p className="text-center text-sm font-black text-emerald-600">🎉 Perfect! Well done!</p>
                )}

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">You said:</p>
                  <p className="text-base font-bold text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    {result.transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="mx-5 mb-4 bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-100">
                {errorMsg}
              </div>
            )}

            {/* Controls */}
            {micSupported && (
              <div className="px-5 pb-5">
                {!isListening && !hasResult && !errorMsg && (
                  <button onClick={() => startListening(i, item.text)}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                    🎤 Tap to Speak
                  </button>
                )}

                {isListening && (
                  <button onClick={stopListening}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                    <span className="inline-block w-3 h-3 bg-white rounded-sm" /> Stop &amp; Check
                  </button>
                )}

                {(hasResult || errorMsg) && (
                  <div className="flex gap-2">
                    <button onClick={() => reset(i)}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                      ✕ Clear
                    </button>
                    <button onClick={() => { reset(i); startListening(i, item.text); }}
                      className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                      🎤 Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Listen to all */}
      {readingText.length > 1 && (
        <button onClick={() => {
          let i = 0;
          const next = () => { if (i >= readingText.length) return; speak(readingText[i++].text); setTimeout(next, 2500); };
          next();
        }} className="w-full py-4 bg-white border-2 border-teal-200 text-teal-700 rounded-2xl font-black text-sm hover:bg-teal-50 transition-all flex items-center justify-center gap-2">
          <Icon name="Volume2" size={16} /> Listen to All Sentences
        </button>
      )}
    </div>
  );
};

export default ReadingPractice;
