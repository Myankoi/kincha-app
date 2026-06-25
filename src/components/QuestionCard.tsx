"use client";

import { BrutalButton } from "@/components/ui/BrutalButton";
import { supabase, type Question, type Answer } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { getPublicMediaUrl } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle, MessageSquare, RotateCcw, ChevronRight, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

interface QuestionCardProps {
  question: Question;
  sessionId: string;
  onDone: () => void;
  onReset: () => void;
}

// ── Media block ─────────────────────────────────────────────────────────────

function MediaBlock({ question }: { question: Question }) {
  const [err, setErr] = useState(false);
  if (question.media_type === "NONE" || !question.media_url) return null;
  const url = getPublicMediaUrl(question.media_url);
  if (!url) return null;

  if (question.media_type === "VIDEO") {
    return (
      <div className="w-full border-2 border-black shadow-[3px_3px_0_0_#000] overflow-hidden bg-black">
        {err ? (
          <p className="text-xs text-[#AEAEAE] p-3 text-center">Video tidak dapat dimuat.</p>
        ) : (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-48 object-contain"
            onError={() => setErr(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full border-2 border-black shadow-[3px_3px_0_0_#000] overflow-hidden relative min-h-[160px] bg-[#F5F5F0]">
      {err ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-[#AEAEAE]">Gambar tidak dapat dimuat.</p>
        </div>
      ) : (
        <Image
          src={url}
          alt={`Media soal #${question.id}`}
          fill
          className="object-contain"
          sizes="(max-width: 480px) 100vw, 480px"
          onError={() => setErr(true)}
          unoptimized
        />
      )}
    </div>
  );
}

// ── Answer result panel ──────────────────────────────────────────────────────

function AnswerResult({
  isCorrect,
  explanation,
  onDone,
}: {
  isCorrect: boolean | null;
  explanation: string | null | undefined;
  onDone: () => void;
}) {
  const resultMap = {
    correct: {
      bg: "bg-[#a3e635]",
      icon: <CheckCircle2 size={18} strokeWidth={2.5} className="text-black shrink-0" />,
      label: "Jawaban Benar!",
    },
    wrong: {
      bg: "bg-[#f472b6]",
      icon: <XCircle size={18} strokeWidth={2.5} className="text-black shrink-0" />,
      label: "Belum Tepat",
    },
    essay: {
      bg: "bg-[#22d3ee]",
      icon: <MessageSquare size={18} strokeWidth={2.5} className="text-black shrink-0" />,
      label: "Jawaban Tercatat",
    },
  };

  const key = isCorrect === true ? "correct" : isCorrect === false ? "wrong" : "essay";
  const result = resultMap[key];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className="space-y-4"
    >
      {/* Result strip */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#000]",
          result.bg
        )}
      >
        {result.icon}
        <p className="text-sm font-black text-black uppercase tracking-wide font-[family-name:var(--font-head)]">
          {result.label}
        </p>
      </div>

      {/* Kezia's message */}
      {explanation && (
        <div className="border-l-4 border-black bg-[#F5F5F0] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2 font-[family-name:var(--font-head)]">
            Kata Kezia
          </p>
          <p className="text-sm leading-relaxed text-[#5A5A5A] font-[family-name:var(--font-sans)]">
            {explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-1">
        <BrutalButton variant="brand" size="lg" fullWidth onClick={onDone}>
          <ChevronRight size={16} strokeWidth={2.5} />
          Lanjutkan
        </BrutalButton>
      </div>
    </motion.div>
  );
}

// ── Multiple choice options ──────────────────────────────────────────────────

function MultipleChoiceOptions({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number | null;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5" role="group" aria-label="Pilihan jawaban">
      {options.map((opt, i) => {
        const isSelected = selected === i;
        return (
          <button
            key={i}
            id={`mc-opt-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={isSelected}
            className={cn(
              "w-full text-left flex items-start gap-3 px-4 py-3.5",
              "border-2 border-black",
              "text-sm font-[family-name:var(--font-sans)]",
              "transition-all duration-100",
              "min-h-[52px]",
              isSelected
                ? [
                    "bg-[#FFDB33] font-semibold text-black",
                    "-translate-x-px -translate-y-px",
                    "shadow-[4px_4px_0_0_#000]",
                  ]
                : [
                    "bg-white text-black font-normal",
                    "shadow-[3px_3px_0_0_#000]",
                    "hover:bg-[#F5F5F0]",
                    "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000]",
                    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]",
                  ]
            )}
          >
            {/* Option letter badge */}
            <span
              className={cn(
                "shrink-0 w-6 h-6 flex items-center justify-center border-2 border-black",
                "text-[11px] font-black font-[family-name:var(--font-head)]",
                "mt-0.5",
                isSelected ? "bg-black text-[#FFDB33]" : "bg-[#F5F5F0] text-black"
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1 leading-snug pt-0.5">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Essay input ──────────────────────────────────────────────────────────────

function EssayInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="essay-answer"
        className="block text-xs font-black uppercase tracking-widest text-black font-[family-name:var(--font-head)]"
      >
        Jawaban kamu
      </label>
      <textarea
        id="essay-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tulis jawabanmu di sini…"
        rows={4}
        className={cn(
          "w-full border-2 border-black bg-white",
          "px-4 py-3 text-sm text-black font-[family-name:var(--font-sans)]",
          "placeholder:text-[#AEAEAE]",
          "resize-none shadow-[3px_3px_0_0_#000]",
          "transition-all duration-100",
          "focus:outline-none focus:border-[#FFDB33] focus:shadow-[4px_4px_0_0_#000]"
        )}
      />
      <p className="text-[10px] text-[#AEAEAE] font-[family-name:var(--font-sans)]">
        {value.trim().length} karakter
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function QuestionCard({
  question,
  sessionId,
  onDone,
  onReset,
}: QuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Guard: incomplete data
  if (!question.question_text?.trim()) {
    return (
      <div className="w-full border-4 border-[#E63946] bg-[#FEF2F2] shadow-[6px_6px_0_0_#E63946] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b-4 border-[#E63946] bg-[#E63946]">
          <AlertTriangle size={16} strokeWidth={2.5} className="text-white shrink-0" />
          <p className="text-xs font-black text-white uppercase tracking-wide font-[family-name:var(--font-head)]">
            Data Soal Tidak Lengkap
          </p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-[#5A5A5A] font-[family-name:var(--font-sans)]">
            Teks pertanyaan kosong.{" "}
            <a href="/admin/questions" className="font-semibold text-black underline hover:no-underline">
              Kelola Soal
            </a>
          </p>
          <BrutalButton variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw size={14} strokeWidth={2.5} />
            Putar Ulang
          </BrutalButton>
        </div>
      </div>
    );
  }

  const isMultipleChoice = question.question_type === "MULTIPLE_CHOICE";
  const correctAnswerText =
    isMultipleChoice && question.correct_option != null
      ? (question.options?.[question.correct_option] ?? null)
      : null;

  const canSubmit =
    !submitting &&
    !submitted &&
    (isMultipleChoice ? selectedIndex !== null : essayText.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const answerText = isMultipleChoice ? (question.options?.[selectedIndex!] ?? "") : essayText.trim();
    setSubmitting(true);

    const correct = isMultipleChoice ? selectedIndex === question.correct_option : null;
    setIsCorrect(correct);

    const payload: Omit<Answer, "id" | "submitted_at"> = {
      session_id: sessionId,
      question_id: question.id,
      answer_text: answerText,
      is_correct: correct,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("answers") as any).insert([payload]);

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="w-full border-4 border-black bg-white shadow-[6px_6px_0_0_#000] overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-stretch border-b-4 border-black">
        {/* Soal # accent block */}
        <div className="w-14 shrink-0 flex items-center justify-center bg-black">
          <span className="text-[10px] font-black text-[#FFDB33] font-[family-name:var(--font-head)] rotate-180 [writing-mode:vertical-lr] tracking-widest uppercase">
            #{question.id}
          </span>
        </div>
        {/* Type strip */}
        <div className="flex-1 flex items-center justify-between pl-4 pr-14 py-3 bg-[#F5F5F0]">
          <p className="text-xs font-black uppercase tracking-widest text-black font-[family-name:var(--font-head)]">
            Pertanyaan
          </p>
          <span
            className={cn(
              "border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
              isMultipleChoice ? "bg-[#FFDB33] text-black" : "bg-[#22d3ee] text-black"
            )}
          >
            {isMultipleChoice ? "Pilihan Ganda" : "Essay"}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-5 space-y-5">
        <MediaBlock question={question} />

        {/* Question text */}
        <p className="text-base font-black text-black leading-snug font-[family-name:var(--font-head)]">
          {question.question_text}
        </p>

        {/* Divider */}
        <div className="border-t-2 border-black border-dashed" />

        {/* Answer or result */}
        {submitted ? (
          <AnswerResult
            isCorrect={isCorrect}
            explanation={question.explanation}
            onDone={onDone}
          />
        ) : (
          <>
            {isMultipleChoice && question.options ? (
              <MultipleChoiceOptions
                options={question.options}
                selected={selectedIndex}
                onSelect={setSelectedIndex}
              />
            ) : (
              <EssayInput value={essayText} onChange={setEssayText} />
            )}

            <BrutalButton
              variant="dark"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} strokeWidth={2.5} />
                  Menyimpan…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  Kirim Jawaban
                </>
              )}
            </BrutalButton>
          </>
        )}
      </div>
    </div>
  );
}
