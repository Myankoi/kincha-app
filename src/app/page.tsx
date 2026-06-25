"use client";

import { BrutalButton } from "@/components/ui/BrutalButton";
import QuestionCard from "@/components/QuestionCard";
import SpinnerWheel, { type SpinnerWheelHandle } from "@/components/SpinnerWheel";
import { generateUUID, cn } from "@/lib/utils";
import { supabase, type Question } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2, Target, Lock, HelpCircle } from "lucide-react";
import ClickSpark from "@/components/ui/ClickSpark";
import DecryptedText from "@/components/ui/DecryptedText";
import SplitText from "@/components/ui/SplitText";
import SunflowerSVG from "@/components/ui/SunflowerSVG";
import QuestionModal from "@/components/ui/QuestionModal";

type GamePhase = "idle" | "spinning" | "question" | "answered";
const SESSION_KEY = "kincha_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = generateUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function WheelSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Marquee skeleton */}
      <div className="h-10 border-4 border-black bg-[#EBEBEB] animate-shimmer" />
      {/* Stage skeleton */}
      <div className="w-full border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
        <div className="h-10 border-b-4 border-black bg-[#E0E0E0] animate-shimmer" />
        <div className="flex items-center justify-center py-16">
          <div className="w-56 h-56 border-4 border-black bg-[#D5D5D5] rounded-full animate-shimmer" />
        </div>
      </div>
      {/* Button skeleton */}
      <div className="h-14 border-4 border-black bg-[#EBEBEB] animate-shimmer" />
    </div>
  );
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [shouldFlashProgress, setShouldFlashProgress] = useState(false);
  const wheelRef = useRef<SpinnerWheelHandle>(null);

  useEffect(() => {
    const sId = getOrCreateSessionId();
    setSessionId(sId);
    
    supabase
      .from("questions")
      .select("*")
      .then(({ data, error: err }) => {
        if (err) setError("Gagal memuat pertanyaan. Coba muat ulang halaman.");
        else setQuestions(data ?? []);
        setLoading(false);
      });
  }, []);

  // Restore session progress
  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from("answers")
      .select("question_id")
      .eq("session_id", sessionId)
      .then(({ data }) => {
        if (data) {
          const ids = (data as any[]).map((d) => d.question_id);
          setAnsweredIds(ids);
        }
      });
  }, [sessionId]);

  // Flash progress counter when progress changes
  useEffect(() => {
    if (answeredIds.length > 0) {
      setShouldFlashProgress(true);
      const timer = setTimeout(() => setShouldFlashProgress(false), 500);
      return () => clearTimeout(timer);
    }
  }, [answeredIds.length]);

  const handleSpinEnd = useCallback(
    (selectedId: number) => {
      const q = questions.find((q) => q.id === selectedId) ?? null;
      setActiveQuestion(q);
      setPhase("question");
    },
    [questions]
  );

  const handleSpin = () => {
    if (phase === "spinning" || phase === "question") return;
    setActiveQuestion(null);
    setPhase("spinning");
    wheelRef.current?.spin();
  };

  const handleReset = () => {
    setPhase("idle");
    setActiveQuestion(null);
  };

  const handleResetSession = () => {
    const newId = generateUUID();
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, newId);
    }
    setSessionId(newId);
    setAnsweredIds([]);
    setPhase("idle");
    setActiveQuestion(null);
  };

  const wheelSegments = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => q.id != null && (q.question_text ?? "").trim().length > 0 && !answeredIds.includes(q.id))
    .map(({ q, idx }) => ({
      id: q.id,
      label: String(idx + 1),
    }));

  const isCompleted = questions.length > 0 && wheelSegments.length === 0;

  return (
    <ClickSpark sparkColor="#FFDB33" sparkSize={10} sparkRadius={22} sparkCount={10}>
      <div className="flex flex-col min-h-[100dvh] bg-[#F5F5F0] bg-[linear-gradient(to_right,#e0e0e0_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e0_1px,transparent_1px)] bg-[size:32px_32px] relative overflow-hidden">
        
        {/* Confetti Celebration overlay */}
        {isCompleted && (
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 2.5;
              const duration = 2 + Math.random() * 2;
              const colors = ["#FFDB33", "#22d3ee", "#f472b6", "#a3e635", "#fb923c", "#a78bfa"];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const size = 6 + Math.random() * 8;
              const rotation = Math.random() * 360;
              return (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${left}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    backgroundColor: color,
                    width: `${size}px`,
                    height: `${size * 1.5}px`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Floating background decorative sunflowers */}
        <SunflowerSVG size={180} className="absolute -bottom-16 -left-16 rotate-[25deg] opacity-15 pointer-events-none z-0" />
        <SunflowerSVG size={140} className="absolute -top-10 -right-10 rotate-[75deg] opacity-10 pointer-events-none z-0" />

        {/* ── Top bar ── */}
        <header className="border-b-4 border-black bg-white sticky top-0 z-30 shadow-[0_4px_0_0_#000]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-head)] font-black text-black tracking-[0.05em] leading-none uppercase flex items-center gap-0.5 select-none">
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#FFDB33] rotate-[-3deg]">K</span>
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#22d3ee] rotate-[2deg]">I</span>
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#f472b6] rotate-[-1deg]">N</span>
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#a3e635] rotate-[3deg]">C</span>
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#fb923c] rotate-[-2deg]">H</span>
                <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#a78bfa] rotate-[1deg]">A</span>
              </h1>
              <p className="text-[8px] text-black/55 uppercase tracking-[0.2em] leading-none mt-1 font-[family-name:var(--font-sans)] font-extrabold">
                Kincir Challenge
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRulesModal(true)}
                className="border-2 border-black bg-[#FFDB33] text-black hover:bg-black hover:text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider font-[family-name:var(--font-head)] shadow-[2px_2px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none transition-all duration-100"
              >
                Cara Bermain
              </button>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full z-10 flex flex-col gap-5 justify-center">

          {/* Hero slogan */}
          <div className="text-center">
            <h2 className="text-sm font-black uppercase text-black font-[family-name:var(--font-head)] tracking-wide">
              Pahami dirimu, regulasi emosimu
            </h2>
          </div>

          {loading ? (
            <WheelSkeleton />
          ) : error ? (
            <div className="border-4 border-[#E63946] bg-[#FEF2F2] shadow-[6px_6px_0_0_#E63946] overflow-hidden w-full">
              <div className="flex items-center gap-3 px-4 py-3 border-b-4 border-[#E63946] bg-[#E63946]">
                <AlertTriangle size={16} strokeWidth={2.5} className="text-white shrink-0" />
                <p className="text-xs font-black text-white uppercase tracking-wide">Gagal Memuat</p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <p className="text-sm text-[#5A5A5A] font-[family-name:var(--font-sans)]">{error}</p>
                <BrutalButton variant="danger" size="sm" onClick={() => window.location.reload()}>
                  <RotateCcw size={14} strokeWidth={2.5} />
                  Muat Ulang
                </BrutalButton>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Arcade Spinner Cabinet */}
              <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] relative overflow-hidden flex flex-col items-center p-5">
                
                {/* Arcade Console Top Decoration */}
                <div className="w-[calc(100%+2.5rem)] border-b-4 border-black bg-black -mx-5 -mt-5 px-5 py-2.5 flex items-center justify-end text-white shrink-0 mb-5">
                  <button
                    onClick={() => setShowProgressModal(true)}
                    className={cn(
                      "border border-[#a3e635] bg-[#a3e635] text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider hover:bg-white transition-all",
                      shouldFlashProgress && "animate-flash-scale"
                    )}
                  >
                    Tebak Rasa: {answeredIds.length}/{questions.length}
                  </button>
                </div>

                {/* Spinner Wheel Area */}
                <div className="w-full flex-1 flex flex-col items-center justify-center py-2 relative">
                  {isCompleted ? (
                    <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
                      <div className="w-14 h-14 border-4 border-black bg-[#a3e635] flex items-center justify-center shadow-[4px_4px_0_0_#000] rotate-[-3deg]">
                        <CheckCircle2 size={28} strokeWidth={3} className="text-black animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black text-black font-[family-name:var(--font-head)] uppercase tracking-wider">
                          Hebat! Selesai 🎉
                        </p>
                        <p className="text-[11px] leading-relaxed text-[#5A5A5A] font-[family-name:var(--font-sans)] max-w-[240px]">
                          Kamu telah menyelesaikan semua <strong>Tebak Rasa</strong>. Kamu hebat dalam memahami regulasi emosi!
                        </p>
                      </div>
                      <BrutalButton
                        variant="brand"
                        size="sm"
                        onClick={handleResetSession}
                        className="mt-2 border-2 text-[10px] uppercase font-black tracking-wider py-1.5 shadow-[2px_2px_0_0_#000]"
                      >
                        Main Lagi
                      </BrutalButton>
                    </div>
                  ) : wheelSegments.length > 0 ? (
                    <SpinnerWheel
                      ref={wheelRef}
                      segments={wheelSegments}
                      onSpinEnd={handleSpinEnd}
                      disabled={phase === "question"}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="w-10 h-10 border-2 border-black bg-[#FFDB33] flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                        <AlertTriangle size={18} strokeWidth={2.5} className="text-black" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-black text-black font-[family-name:var(--font-head)]">
                          Belum Ada Soal
                        </p>
                        <p className="text-[10px] text-[#AEAEAE] font-[family-name:var(--font-sans)]">
                          Hubungi admin untuk menambahkan pertanyaan.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="mt-4">
                  <p
                    className={cn(
                      "inline-block border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider font-[family-name:var(--font-head)] shadow-[2px_2px_0_0_#000] rotate-[-1deg]",
                      isCompleted
                        ? "bg-[#a3e635] text-black"
                        : phase === "spinning" 
                        ? "bg-[#22d3ee] text-black" 
                        : phase === "answered" 
                        ? "bg-[#a3e635] text-black" 
                        : "bg-[#FFDB33] text-black"
                    )}
                  >
                    {isCompleted
                      ? "Semua Selesai!"
                      : phase === "spinning" 
                      ? "Kincir berputar..." 
                      : phase === "answered" 
                      ? "Tebak Rasa selesai" 
                      : "Siap untuk diputar"}
                  </p>
                </div>

                {/* Spin Controls */}
                <div className="w-full mt-5 pt-4 border-t-2 border-dashed border-black">
                  {isCompleted ? (
                    <div className="text-center py-1">
                      <p className="text-[10px] text-[#AEAEAE] font-[family-name:var(--font-sans)] font-semibold">
                        Semua Tebak Rasa telah diselesaikan.
                      </p>
                    </div>
                  ) : (
                    <>
                      {(phase === "idle" || phase === "answered") && (
                        <BrutalButton
                          variant="brand"
                          size="lg"
                          fullWidth
                          onClick={handleSpin}
                          disabled={wheelSegments.length === 0}
                          className={cn(
                            "font-black tracking-wider font-[family-name:var(--font-head)] text-xs uppercase shadow-[4px_4px_0_0_#000] border-2",
                            phase === "idle" && "animate-pulse-glow"
                          )}
                        >
                          <Target size={14} strokeWidth={3} />
                          Putar Kincir
                        </BrutalButton>
                      )}

                      {phase === "spinning" && (
                        <div className="w-full border-2 border-black bg-black px-4 py-3 shadow-[4px_4px_0_0_#FFDB33] flex items-center justify-center gap-2 select-none">
                          <Loader2 className="animate-spin text-[#FFDB33] shrink-0" size={14} strokeWidth={3} />
                          <span className="text-xs font-black text-white uppercase tracking-wider font-[family-name:var(--font-head)]">
                            Mencari tebak rasa...
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Progress row button for easy mobile tapping */}
              <div className="flex gap-3">
                <BrutalButton
                  variant="tertiary"
                  size="sm"
                  fullWidth
                  onClick={() => setShowRulesModal(true)}
                  className="border-2 text-xs py-2 shadow-[2px_2px_0_0_#000]"
                >
                  <HelpCircle size={14} strokeWidth={2.5} />
                  Cara Bermain
                </BrutalButton>
                <BrutalButton
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setShowProgressModal(true)}
                  className="border-2 text-xs py-2 shadow-[2px_2px_0_0_#000]"
                >
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  Lihat Tebak Rasa
                </BrutalButton>
              </div>

            </div>
          )}

        </main>

        {/* ── Footer ── */}
        <footer className="border-t-4 border-black bg-black px-5 py-4 z-20">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-[family-name:var(--font-sans)]">
              Kincha &copy; 2025 — Kincir Challenge
            </p>
            <a
              href="/admin/login"
              className="text-[9px] text-[#FFDB33] hover:underline font-bold transition-all uppercase tracking-widest font-[family-name:var(--font-sans)]"
            >
              Admin Dashboard
            </a>
          </div>
        </footer>

        {/* ── Question card Modal Popup ── */}
        <QuestionModal isOpen={phase === "question"} onClose={handleReset}>
          {activeQuestion && (
            <QuestionCard
              question={activeQuestion}
              sessionId={sessionId}
              onDone={() => {
                if (activeQuestion.id != null) {
                  setAnsweredIds((prev) => {
                    if (prev.includes(activeQuestion.id)) return prev;
                    return [...prev, activeQuestion.id];
                  });
                }
                setPhase("answered");
              }}
              onReset={handleReset}
            />
          )}
        </QuestionModal>

        {/* ── Cara Bermain Modal ── */}
        <QuestionModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 pr-14">
              <HelpCircle size={18} className="text-black" strokeWidth={3} />
              <h3 className="text-sm font-black uppercase text-black font-[family-name:var(--font-head)]">
                Cara Bermain
              </h3>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-[#5A5A5A] font-[family-name:var(--font-sans)]">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 flex items-center justify-center border border-black bg-[#FFDB33] text-black font-black text-[10px] shrink-0">1</span>
                <p>Tekan tombol <strong>Putar Kincir</strong> untuk mengacak tebak rasa emosi.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 flex items-center justify-center border border-black bg-[#FFDB33] text-black font-black text-[10px] shrink-0">2</span>
                <p>Jawab pertanyaan pilihan ganda atau tulis tanggapanmu pada kolom essay.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 flex items-center justify-center border border-black bg-[#FFDB33] text-black font-black text-[10px] shrink-0">3</span>
                <p>Setiap respon akan dicatat di server untuk diulas bersama konselor sebaya PIK-R.</p>
              </div>
            </div>
            <div className="pt-2">
              <BrutalButton variant="brand" size="sm" fullWidth onClick={() => setShowRulesModal(false)}>
                Saya Mengerti
              </BrutalButton>
            </div>
          </div>
        </QuestionModal>

        {/* ── Progress Tebak Rasa Modal ── */}
        <QuestionModal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3 pr-14">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-black" strokeWidth={3} />
                <h3 className="text-sm font-black uppercase text-black font-[family-name:var(--font-head)]">
                  Daftar Tebak Rasa
                </h3>
              </div>
              <span className="text-[10px] font-mono font-black border border-black bg-[#22d3ee] px-2 py-0.5">
                {answeredIds.length} / {questions.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = answeredIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "border border-black p-2.5 flex items-center justify-between gap-3 text-xs",
                      isAnswered ? "bg-[#a3e635] text-black" : "bg-[#FFF9E0] text-black/75"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "w-5 h-5 flex items-center justify-center border border-black text-[9px] font-black shrink-0",
                        isAnswered ? "bg-white text-black" : "bg-black text-[#FFDB33]"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="font-bold truncate">
                        {isAnswered ? "Selesai" : `Tebak Rasa #${idx + 1}`}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-black">
                      {isAnswered ? "SELESAI" : "TERKUNCI"}
                    </span>
                  </div>
                );
              })}
              {questions.length === 0 && (
                <p className="text-xs text-[#AEAEAE] text-center py-6 font-semibold">
                  Belum ada tebak rasa tersedia.
                </p>
              )}
            </div>

            <div className="pt-2">
              <BrutalButton variant="secondary" size="sm" fullWidth onClick={() => setShowProgressModal(false)}>
                Tutup
              </BrutalButton>
            </div>
          </div>
        </QuestionModal>

        {/* CSS animations injected at page level */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ClickSpark>
  );
}
