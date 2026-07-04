import React, { useState, useEffect } from 'react';
import GradePicker from './components/GradePicker';
import StudyGrid from './components/StudyGrid';
import Flashcards from './components/Flashcards';
import WritingPractice from './components/WritingPractice';
import ReadingPractice from './components/ReadingPractice';
import Quiz from './components/Quiz';
import Icon from './components/Icon';

const API_BASE = '/api';

const GRADE_LABELS = { 1: 'Primary 1', 2: 'Primary 2', 3: 'Primary 3', 4: 'Primary 4', 5: 'Primary 5', 6: 'Primary 6' };
const GRADE_COLORS = {
  1: 'bg-sky-100 text-sky-700 border-sky-200',
  2: 'bg-violet-100 text-violet-700 border-violet-200',
  3: 'bg-amber-100 text-amber-700 border-amber-200',
  4: 'bg-teal-100 text-teal-700 border-teal-200',
  5: 'bg-rose-100 text-rose-700 border-rose-200',
  6: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function GradeToggle({ value, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
      {[1, 2, 3, 4, 5, 6].map(g => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
            value === g ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          P{g}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  // Grade-level navigation
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [gradeSummaries, setGradeSummaries] = useState([]);

  // Study state
  const [chapters, setChapters] = useState([]);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentTab, setCurrentTab] = useState('grid');
  const [mistakes, setMistakes] = useState({});
  const [activeView, setActiveView] = useState('study');
  const [showMistakesModal, setShowMistakesModal] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Upload state
  const [uploadText, setUploadText] = useState('');
  const [uploadGrade, setUploadGrade] = useState(4);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // AI generation state
  const [generationTopic, setGenerationTopic] = useState('');
  const [generationApiKey, setGenerationApiKey] = useState('');
  const [generateGrade, setGenerateGrade] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // ── Fetch grade summaries for the landing page ──────────────────────────
  const fetchGradeSummaries = async () => {
    try {
      const res = await fetch(`${API_BASE}/grades`);
      if (res.ok) setGradeSummaries(await res.json());
    } catch {
      // non-fatal
    }
  };

  // ── Fetch chapters + mistakes for the active grade ───────────────────────
  const fetchData = async (gradeOverride, resetSelection = false) => {
    const grade = gradeOverride ?? selectedGrade;
    if (!grade) return;
    try {
      setApiError(null);
      const [chapRes, mistakesRes] = await Promise.all([
        fetch(`${API_BASE}/chapters?grade=${grade}`),
        fetch(`${API_BASE}/mistakes`),
      ]);
      if (!chapRes.ok) throw new Error('Failed to fetch chapters');
      const data = await chapRes.json();
      setChapters(data);
      if (resetSelection || currentChapterId === null) {
        setCurrentChapterId(data.length > 0 ? data[0].id : null);
      }
      if (mistakesRes.ok) setMistakes(await mistakesRes.json());
    } catch (err) {
      setApiError('Could not connect to the backend API. Please verify the server is running.');
    }
  };

  useEffect(() => { fetchGradeSummaries(); }, []);

  useEffect(() => {
    if (selectedGrade) {
      setUploadGrade(selectedGrade);
      setGenerateGrade(selectedGrade);
      fetchData(selectedGrade, true);
    }
  }, [selectedGrade]);

  const handleSelectGrade = (grade) => {
    setSelectedGrade(grade);
    setActiveView('study');
    setCurrentTab('grid');
  };

  const handleBackToGrades = () => {
    setSelectedGrade(null);
    setChapters([]);
    setCurrentChapterId(null);
    setActiveView('study');
    fetchGradeSummaries();
  };

  const currentChapter = chapters.find(c => c.id === currentChapterId) || null;

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-CN';
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find(v => v.lang.includes('zh') || v.lang.includes('ZH'));
    if (zh) utt.voice = zh;
    window.speechSynthesis.speak(utt);
  };

  // ── Mastery ──────────────────────────────────────────────────────────────
  const toggleKnown = async (vocabIndex) => {
    if (!currentChapter) return;
    const char = currentChapter.vocab[vocabIndex].char;
    const isKnown = currentChapter.knownIndices.includes(vocabIndex);
    try {
      const res = await fetch(`${API_BASE}/mastery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ char, is_known: !isKnown }),
      });
      if (res.ok) fetchData();
    } catch { /* ignore */ }
  };

  const onIncorrect = async (char) => {
    try {
      const res = await fetch(`${API_BASE}/mistakes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ char }),
      });
      if (res.ok) fetchData();
    } catch { /* ignore */ }
  };

  // ── Reset / clear ────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!window.confirm('Reset all learning progress and mistake history?')) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) { fetchData(); fetchGradeSummaries(); }
    } catch { /* ignore */ }
  };

  const handleClearChapters = async () => {
    const gradeLabel = GRADE_LABELS[selectedGrade] || `Grade ${selectedGrade}`;
    if (!window.confirm(`Permanently delete all ${gradeLabel} chapters and vocabulary? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/chapters/clear?grade=${selectedGrade}`, { method: 'POST' });
      if (res.ok) {
        fetchData(selectedGrade, true);
        fetchGradeSummaries();
      }
    } catch { /* ignore */ }
  };

  // ── JSON upload ──────────────────────────────────────────────────────────
  const handleJsonUpload = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const parsed = JSON.parse(uploadText);
      if (!parsed.title || !Array.isArray(parsed.vocab)) {
        throw new Error('Invalid JSON: must contain "title" (string) and "vocab" (array).');
      }
      parsed.grade = uploadGrade;

      const res = await fetch(`${API_BASE}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        setUploadSuccess(true);
        setUploadText('');
        fetchGradeSummaries();
        // If we uploaded to the current grade, refresh chapters
        if (uploadGrade === selectedGrade) {
          fetchData(selectedGrade);
        }
        setTimeout(() => {
          setUploadSuccess(false);
          if (uploadGrade !== selectedGrade) {
            handleSelectGrade(uploadGrade);
          } else {
            setActiveView('study');
          }
        }, 1500);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to import chapter.');
      }
    } catch (err) {
      setUploadError(err.message);
    }
  };

  // ── AI generate ──────────────────────────────────────────────────────────
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/chapters/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: generationTopic, api_key: generationApiKey || null, grade: generateGrade }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to generate chapter.');
      }
      const newChapter = await res.json();
      setGenerationSuccess(true);
      setGenerationTopic('');
      fetchGradeSummaries();
      if (generateGrade === selectedGrade) {
        fetchData(selectedGrade);
        setCurrentChapterId(newChapter.id);
      }
      setTimeout(() => {
        setGenerationSuccess(false);
        if (generateGrade !== selectedGrade) {
          handleSelectGrade(generateGrade);
        } else {
          setActiveView('study');
        }
      }, 1500);
    } catch (err) {
      setGenerationError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setUploadText(evt.target.result);
    reader.readAsText(file);
  };

  const copyTemplate = () => {
    const template = {
      title: "Colors (颜色)",
      readingTitle: "Rainbow Colors",
      vocab: [
        { char: "红", pinyin: "hóng", meaning: "red", emoji: "🔴" },
        { char: "黄", pinyin: "huáng", meaning: "yellow", emoji: "🟡" },
        { char: "蓝", pinyin: "lán", meaning: "blue", emoji: "🔵" },
      ],
      readingText: [
        { text: "天空是蓝的。", audio: "" },
        { text: "苹果是红的。", audio: "" },
      ],
    };
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    alert('Copied JSON template to clipboard!');
  };

  const totalVocab = chapters.reduce((s, ch) => s + (ch.vocab || []).length, 0);
  const totalMastered = chapters.reduce((s, ch) => s + (ch.knownIndices || []).length, 0);
  const totalMistakesCount = Object.keys(mistakes).length;

  // ── Grade picker landing ─────────────────────────────────────────────────
  if (!selectedGrade) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/10 min-h-screen text-slate-800 antialiased font-sans">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-teal-500/20">
                学
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">Savean 学中文</h1>
                <p className="text-[10px] font-bold text-teal-600 tracking-wider uppercase mt-1">Interactive Chinese Study</p>
              </div>
            </div>
          </div>
        </header>
        <GradePicker summaries={gradeSummaries} onSelectGrade={handleSelectGrade} />
      </div>
    );
  }

  // ── Study room ───────────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/10 min-h-screen text-slate-800 antialiased font-sans pb-10">

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo + back + grade badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToGrades}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
              title="Back to grade picker"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-teal-500/20 group-hover:shadow-lg transition-shadow">
                学
              </div>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button onClick={handleBackToGrades} className="flex items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors text-xs font-bold">
                  <Icon name="ChevronLeft" size={14} /> All Grades
                </button>
                <span className="text-slate-200">/</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${GRADE_COLORS[selectedGrade]}`}>
                  {GRADE_LABELS[selectedGrade]}
                </span>
              </div>
              <h1 className="text-base font-black tracking-tight text-slate-800 leading-none mt-0.5">Savean 学中文</h1>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            <button
              onClick={() => setActiveView('study')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${activeView === 'study' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon name="BookOpen" size={14} /> Study Room
            </button>
            <button
              onClick={() => setActiveView('curriculum')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${activeView === 'curriculum' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon name="PenTool" size={14} /> Curriculum Panel
            </button>
          </div>

          {/* Stats + actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-teal-50/60 border border-teal-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Icon name="Trophy" size={16} className="text-teal-600" />
                <span className="text-xs font-bold text-slate-600">Learned:</span>
                <span className="text-sm font-black text-teal-700">{totalMastered} / {totalVocab}</span>
              </div>
              <button
                onClick={() => setShowMistakesModal(true)}
                className="bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition-colors px-4 py-2 rounded-2xl flex items-center gap-2"
              >
                <Icon name="Lightbulb" size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-600">Mistakes:</span>
                <span className="text-sm font-black text-amber-700">{totalMistakesCount}</span>
              </button>
            </div>
            <button
              onClick={handleReset}
              className="p-2.5 hover:bg-rose-50 border border-rose-100 hover:text-rose-600 rounded-xl transition-all active:scale-95 text-slate-400"
              title="Reset progress"
            >
              <Icon name="RotateCcw" size={18} />
            </button>
          </div>
        </div>
      </header>

      {apiError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800">
            <Icon name="AlertCircle" size={24} className="shrink-0 text-rose-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Connection Warning</h4>
              <p className="text-xs text-rose-600 mt-1">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ── STUDY ROOM ── */}
        {activeView === 'study' && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <section className="w-full lg:w-80 shrink-0 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-black text-lg text-slate-800">Chapters</h2>
                <span className="bg-slate-200/60 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">
                  {chapters.length} Total
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] lg:max-h-[calc(100vh-170px)] overflow-y-auto pr-2">
                {chapters.map((ch, idx) => {
                  const isActive = ch.id === currentChapterId;
                  const vocabLen = (ch.vocab || []).length;
                  const masteredCount = (ch.knownIndices || []).length;
                  const pct = vocabLen > 0 ? Math.round((masteredCount / vocabLen) * 100) : 0;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => { setCurrentChapterId(ch.id); setCurrentTab('grid'); }}
                      className={`w-full text-left p-4 rounded-3xl border-2 transition-all relative flex flex-col gap-3 group ${
                        isActive
                          ? 'bg-white border-teal-500 shadow-xl shadow-teal-500/5'
                          : 'bg-white/60 hover:bg-white border-transparent hover:border-slate-100 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Chapter {idx + 1}
                        </span>
                        {pct === 100 && (
                          <span className="text-teal-600 bg-teal-50 p-1 rounded-full">
                            <Icon name="CheckCircle2" size={14} />
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">
                          {ch.title}
                        </h3>
                        {ch.readingTitle && (
                          <p className="text-xs text-slate-400 font-bold truncate mt-1">{ch.readingTitle}</p>
                        )}
                      </div>
                      <div className="space-y-1 mt-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>{masteredCount} / {vocabLen} words</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}

                {chapters.length === 0 && !apiError && (
                  <div className="text-center py-10 bg-white/40 border border-dashed border-slate-200 rounded-3xl p-6">
                    <Icon name="AlertCircle" size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-400">No chapters yet for {GRADE_LABELS[selectedGrade]}.</p>
                    <button
                      onClick={() => setActiveView('curriculum')}
                      className="mt-3 text-xs font-black text-teal-600 hover:underline"
                    >
                      Go to Curriculum Panel →
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Active chapter workspace */}
            <section className="flex-1 min-w-0">
              {currentChapter ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Active Study Room</span>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{currentChapter.title}</h2>
                      {currentChapter.readingTitle && (
                        <p className="text-sm text-slate-400 font-bold mt-1">Story: {currentChapter.readingTitle}</p>
                      )}
                    </div>
                    <div className="bg-slate-50 px-4 py-3 rounded-2xl flex items-center gap-4 border border-slate-100">
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vocab</div>
                        <div className="text-lg font-black text-slate-800">{(currentChapter.vocab || []).length}</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mastered</div>
                        <div className="text-lg font-black text-teal-600">{(currentChapter.knownIndices || []).length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 bg-white/60 p-1.5 rounded-[20px] border border-slate-100 overflow-x-auto">
                    {[
                      { id: 'grid', label: 'Grid', icon: 'Menu' },
                      { id: 'flashcards', label: 'Cards', icon: 'BookOpen' },
                      { id: 'writing', label: 'Write', icon: 'PenTool' },
                      { id: 'reading', label: 'Read', icon: 'Activity' },
                      { id: 'quiz', label: 'Quiz', icon: 'Trophy' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`flex-1 py-3 px-4 rounded-[14px] font-black text-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-95 ${
                          currentTab === tab.id
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                            : 'text-slate-500 hover:text-teal-600 hover:bg-white/50'
                        }`}
                      >
                        <Icon name={tab.icon} size={14} /> {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[500px]">
                    {currentTab === 'grid'       && <StudyGrid chapter={currentChapter} speak={speak} toggleKnown={toggleKnown} />}
                    {currentTab === 'flashcards' && <Flashcards chapter={currentChapter} speak={speak} toggleKnown={toggleKnown} />}
                    {currentTab === 'writing'    && <WritingPractice chapter={currentChapter} speak={speak} />}
                    {currentTab === 'reading'    && <ReadingPractice chapter={currentChapter} speak={speak} />}
                    {currentTab === 'quiz'       && <Quiz chapter={currentChapter} speak={speak} onIncorrect={onIncorrect} />}
                  </div>
                </div>
              ) : (
                <div className="bg-white/50 border border-dashed border-slate-200 rounded-[48px] py-32 text-center max-w-md mx-auto mt-10 p-8 shadow-sm">
                  <Icon name="BookOpen" size={64} className="mx-auto text-slate-300 mb-6" />
                  <h3 className="text-xl font-black text-slate-700">Ready to start?</h3>
                  <p className="text-slate-400 text-sm font-bold mt-2">
                    No chapters yet for {GRADE_LABELS[selectedGrade]}. Add one in the Curriculum Panel.
                  </p>
                  <button
                    onClick={() => setActiveView('curriculum')}
                    className="mt-6 bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Go to Curriculum Panel
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── CURRICULUM PANEL ── */}
        {activeView === 'curriculum' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Curriculum Control</span>
                <h2 className="text-xl font-black text-slate-800 mt-1">Manage Study Materials</h2>
              </div>
              <button
                onClick={handleClearChapters}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-5 py-3 rounded-2xl font-black text-xs transition-colors flex items-center gap-2 active:scale-95"
              >
                <Icon name="RotateCcw" size={14} /> Clear {GRADE_LABELS[selectedGrade]} Chapters
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* AI Generator */}
              <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Icon name="Lightbulb" size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">Dynamic AI Generator</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Let Gemini build your study chapter</p>
                  </div>
                </div>

                <form onSubmit={handleAiGenerate} className="flex flex-col gap-5 flex-1 justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Grade Level</label>
                      <GradeToggle value={generateGrade} onChange={setGenerateGrade} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Study Topic</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., At the Restaurant, Fruits, Colors"
                        value={generationTopic}
                        onChange={e => setGenerationTopic(e.target.value)}
                        className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none transition-colors font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Gemini API Key</span>
                        <span className="text-[10px] text-slate-300 font-bold lowercase">optional if set in environment</span>
                      </label>
                      <input
                        type="password"
                        placeholder="AI_API_KEY"
                        value={generationApiKey}
                        onChange={e => setGenerationApiKey(e.target.value)}
                        className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none transition-colors text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-2">
                    {generationError && (
                      <div className="bg-rose-50 text-rose-700 text-xs font-bold p-4 rounded-2xl border border-rose-100 leading-relaxed">
                        {generationError}
                      </div>
                    )}
                    {generationSuccess && (
                      <div className="bg-teal-50 text-teal-700 text-xs font-bold p-4 rounded-2xl border border-teal-100 text-center">
                        ✨ Chapter generated successfully! Redirecting…
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isGenerating || !generationTopic.trim()}
                      className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        isGenerating || !generationTopic.trim()
                          ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                          : 'bg-purple-600 text-white shadow-purple-600/20 hover:bg-purple-500'
                      }`}
                    >
                      {isGenerating ? (
                        <><div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> Generating…</>
                      ) : (
                        <><Icon name="Lightbulb" size={16} /> Generate with AI for {GRADE_LABELS[generateGrade]}</>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* JSON Upload */}
              <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Icon name="BookOpen" size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-800">Upload JSON Chapter</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Import custom JSON curricula</p>
                    </div>
                  </div>
                  <button
                    onClick={copyTemplate}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-[10px] text-slate-500 transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <Icon name="Menu" size={10} /> Copy Template
                  </button>
                </div>

                <form onSubmit={handleJsonUpload} className="flex flex-col gap-5 flex-1 justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Grade Level</label>
                      <GradeToggle value={uploadGrade} onChange={setUploadGrade} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Select JSON File (Optional)</label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Data (JSON)</label>
                      <textarea
                        required
                        value={uploadText}
                        onChange={e => setUploadText(e.target.value)}
                        placeholder={`{\n  "title": "Fruits (水果)",\n  "readingTitle": "Healthy Fruits",\n  "vocab": [\n    { "char": "苹果", "pinyin": "píngguǒ", "meaning": "apple", "emoji": "🍎" }\n  ],\n  "readingText": [\n    { "text": "我吃苹果。", "audio": "" }\n  ]\n}`}
                        rows={7}
                        className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xs font-mono focus:border-teal-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-2">
                    {uploadError && (
                      <div className="bg-rose-50 text-rose-700 text-xs font-bold p-4 rounded-2xl border border-rose-100 leading-relaxed">
                        {uploadError}
                      </div>
                    )}
                    {uploadSuccess && (
                      <div className="bg-teal-50 text-teal-700 text-xs font-bold p-4 rounded-2xl border border-teal-100 text-center">
                        Import completed! Redirecting…
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={!uploadText.trim()}
                      className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        uploadText.trim()
                          ? 'bg-slate-900 text-white shadow-slate-950/20 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                      }`}
                    >
                      <Icon name="CheckCircle2" size={16} /> Import to {GRADE_LABELS[uploadGrade]}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ── Mistakes modal ── */}
      {showMistakesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[36px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-lg text-slate-800">Mistakes Review Center</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Characters you've missed in quizzes</p>
              </div>
              <button onClick={() => setShowMistakesModal(false)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-all text-slate-400">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {totalMistakesCount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(mistakes).map(([char, count]) => {
                    let pinyin = '', meaning = '', emoji = '';
                    for (const ch of chapters) {
                      const item = ch.vocab.find(v => v.char === char);
                      if (item) { pinyin = item.pinyin; meaning = item.meaning; emoji = item.emoji; break; }
                    }
                    return (
                      <div key={char} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
                          {emoji || '💬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base text-slate-800 leading-none">{char}</h4>
                          {pinyin  && <p className="text-[10px] font-bold text-teal-600 mt-1 uppercase">{pinyin}</p>}
                          {meaning && <p className="text-xs text-slate-400 font-bold truncate mt-1">{meaning}</p>}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1.5">
                          <span className="text-[10px] bg-rose-50 text-rose-600 font-black px-2 py-0.5 rounded-full border border-rose-100">
                            ×{count}
                          </span>
                          <button onClick={() => speak(char)} className="p-1.5 hover:bg-white text-slate-400 hover:text-teal-600 rounded-lg transition-all">
                            <Icon name="Volume2" size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Icon name="Trophy" size={48} className="mx-auto text-emerald-500 mb-4 animate-bounce" />
                  <h4 className="font-black text-slate-800 text-lg">No Mistakes!</h4>
                  <p className="text-slate-400 font-bold text-xs mt-1">Keep it up in the quizzes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
