"use client";

import { BrutalButton } from "@/components/ui/BrutalButton";
import { supabase, signOut, type Answer, type Question } from "@/lib/supabase";
import {
  cn,
  convertToCSV,
  downloadCSV,
  formatTimestamp,
  sanitizeText,
  containsProfanity,
} from "@/lib/utils";
import {
  BarChart3,
  Download,
  LogOut,
  RefreshCw,
  Users,
  FileText,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ClickSpark from "@/components/ui/ClickSpark";
import DecryptedText from "@/components/ui/DecryptedText";
import SunflowerSVG from "@/components/ui/SunflowerSVG";

type AnswerRow = Answer & { questions?: { question_text: string; question_type: string } };

interface Stats {
  totalSessions: number;
  totalAnswers: number;
  essayCount: number;
  mcCount: number;
  mcCorrect: number;
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0_0_#000]",
        "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-150",
        accent
      )}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="border-2 border-black bg-black p-1.5 sm:p-2 shadow-[2px_2px_0_0_#000]">{icon}</div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-black font-[family-name:var(--font-head)] leading-none mb-2 break-words">
        {value}
      </p>
      <p className="text-[9px] sm:text-[10px] font-black text-black/80 uppercase tracking-wider font-[family-name:var(--font-head)]">
        {label}
      </p>
    </div>
  );
}

// ── Answer Badge ─────────────────────────────────────────────────────────────

function CorrectnessBadge({ isCorrect }: { isCorrect: boolean | null }) {
  if (isCorrect === null)
    return (
      <span className="inline-flex items-center border-2 border-black bg-[#22d3ee] px-2 py-0.5 text-[10px] font-black text-black uppercase tracking-wide shadow-[1px_1px_0_0_#000]">
        Essay
      </span>
    );
  if (isCorrect)
    return (
      <span className="inline-flex items-center border-2 border-black bg-[#a3e635] px-2 py-0.5 text-[10px] font-black text-black uppercase tracking-wide shadow-[1px_1px_0_0_#000]">
        Benar
      </span>
    );
  return (
    <span className="inline-flex items-center border-2 border-black bg-[#f472b6] px-2 py-0.5 text-[10px] font-black text-black uppercase tracking-wide shadow-[1px_1px_0_0_#000]">
      Salah
    </span>
  );
}

// ── Data Table ───────────────────────────────────────────────────────────────

function AnswersTable({ rows }: { rows: AnswerRow[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="border-4 border-black bg-[#F5F5F0] p-12 text-center shadow-[6px_6px_0_0_#000]">
        <p className="text-sm font-bold text-[#5A5A5A]">
          Belum ada jawaban yang masuk.
        </p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentRows = rows.slice(startIndex, endIndex);

  // Visible page numbers window calculation
  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card-Based Grid (Visible only on mobile) */}
      <div className="block sm:hidden space-y-4">
        {currentRows.map((row) => {
          const hasProfanity = containsProfanity(row.answer_text);
          const displayText = hasProfanity
            ? sanitizeText(row.answer_text)
            : row.answer_text;

          return (
            <div
              key={row.id}
              className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] space-y-3 relative"
            >
              {/* Header inside mobile card: Sesi ID + Status badge */}
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-black">
                  <span>Sesi:</span>
                  <span className="bg-[#EBEBEB] border border-black px-1.5 py-0.5">
                    #{row.session_id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <CorrectnessBadge isCorrect={row.is_correct} />
              </div>

              {/* Body: Question text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#AEAEAE] tracking-wider">
                    Soal #{row.question_id}
                  </span>
                  {row.questions?.question_type && (
                    <span className="border border-black bg-[#FFDB33] px-1 py-0.5 text-[8px] font-black uppercase text-black tracking-wide">
                      {row.questions.question_type === "MULTIPLE_CHOICE" ? "PG" : "Essay"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-black font-semibold leading-relaxed">
                  {row.questions?.question_text ?? `Q#${row.question_id}`}
                </p>
              </div>

              {/* Body: Submitted answer */}
              <div className="space-y-1 bg-[#F5F5F0] border-2 border-black p-2.5 shadow-[2px_2px_0_0_#000]">
                <span className="block text-[8px] font-black uppercase text-black/50 tracking-wider">
                  Jawaban Pemain:
                </span>
                <p
                  className={cn(
                    "text-xs text-black leading-relaxed break-words",
                    hasProfanity && "text-[#E63946] font-bold"
                  )}
                >
                  {displayText}
                </p>
              </div>

              {/* Footer: Time submitted */}
              <div className="flex items-center justify-between text-[10px] text-[#5A5A5A] font-mono pt-1">
                <span>{formatTimestamp(row.submitted_at)}</span>
                <span className="text-[8px] text-[#AEAEAE]">ID: {row.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Tabular Grid (Hidden on mobile) */}
      <div className="hidden sm:block border-4 border-black shadow-[6px_6px_0_0_#000] overflow-x-auto bg-white">
        <table className="w-full text-sm text-left min-w-[720px]">
          <thead>
            <tr className="bg-[#F5F5F0] border-b-4 border-black">
              {["#", "Sesi", "Pertanyaan", "Jawaban", "Status", "Waktu"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-xs font-black text-black uppercase tracking-widest border-r-2 last:border-r-0 border-black font-[family-name:var(--font-head)]"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => {
              const hasProfanity = containsProfanity(row.answer_text);
              const displayText = hasProfanity
                ? sanitizeText(row.answer_text)
                : row.answer_text;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "bg-white hover:bg-[#F5F5F0]/50 transition-colors duration-100",
                    idx !== currentRows.length - 1 && "border-b-2 border-black"
                  )}
                >
                  <td className="px-4 py-3 font-mono text-[10px] text-[#5A5A5A] whitespace-nowrap border-r border-black/10">
                    {row.id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-black font-semibold whitespace-nowrap border-r border-black/10">
                    #{row.session_id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-xs text-black border-r border-black/10 max-w-[220px]">
                    <div className="space-y-1.5">
                      <p className="line-clamp-2 leading-relaxed">
                        {row.questions?.question_text ?? `Q#${row.question_id}`}
                      </p>
                      {row.questions?.question_type && (
                        <span className="inline-block border-2 border-black bg-[#FFDB33] px-1.5 py-0.5 text-[9px] font-black uppercase text-black tracking-wide shadow-[1px_1px_0_0_#000]">
                          {row.questions.question_type === "MULTIPLE_CHOICE" ? "PG" : "Essay"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-black border-r border-black/10 max-w-[240px]">
                    <span
                      className={cn(
                        "line-clamp-3 leading-relaxed",
                        hasProfanity && "text-[#E63946] font-bold bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 inline-block"
                      )}
                    >
                      {displayText}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-black/10">
                    <CorrectnessBadge isCorrect={row.is_correct} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A5A5A] whitespace-nowrap font-mono">
                    {formatTimestamp(row.submitted_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black border-dashed">
          <p className="text-xs font-black text-[#5A5A5A] uppercase tracking-wide">
            Menampilkan <span className="text-black">{startIndex + 1}</span> -{" "}
            <span className="text-black">{endIndex}</span> dari{" "}
            <span className="text-black">{totalItems}</span> entri
          </p>

          <div className="flex items-center gap-1.5 font-[family-name:var(--font-head)] select-none">
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "border-2 border-black bg-white text-black p-1.5 shadow-[2px_2px_0_0_#000] transition-all",
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed shadow-none translate-x-px translate-y-px"
                  : "hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer"
              )}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={16} strokeWidth={2.5} className="text-black" />
            </button>

            {/* Page Numbers */}
            {startPage > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="border-2 border-black w-8 h-8 flex items-center justify-center text-xs font-black shadow-[2px_2px_0_0_#000] transition-all bg-white text-black hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none"
                >
                  1
                </button>
                {startPage > 2 && <span className="text-xs font-black text-black px-1">...</span>}
              </>
            )}

            {pageNumbers.map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "border-2 border-black w-8 h-8 flex items-center justify-center text-xs font-black shadow-[2px_2px_0_0_#000] transition-all",
                    isActive
                      ? "bg-[#FFDB33] text-black shadow-none translate-x-px translate-y-px"
                      : "bg-white text-black hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="text-xs font-black text-black px-1">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="border-2 border-black w-8 h-8 flex items-center justify-center text-xs font-black shadow-[2px_2px_0_0_#000] transition-all bg-white text-black hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "border-2 border-black bg-white text-black p-1.5 shadow-[2px_2px_0_0_#000] transition-all",
                currentPage === totalPages
                  ? "opacity-40 cursor-not-allowed shadow-none translate-x-px translate-y-px"
                  : "hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer"
              )}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={16} strokeWidth={2.5} className="text-black" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Question Analytics Card ──────────────────────────────────────────────────

function QuestionAnalyticsCard({
  question,
  answers,
}: {
  question: Question;
  answers: AnswerRow[];
}) {
  const [essaySearch, setEssaySearch] = useState("");

  const qAnswers = answers.filter((a) => a.question_id === question.id);
  const totalCount = qAnswers.length;
  const isMultipleChoice = question.question_type === "MULTIPLE_CHOICE";

  // Calculate MC metrics
  const correctCount = qAnswers.filter((a) => a.is_correct === true).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Filter essay responses
  const essayAnswers = qAnswers.filter((a) => a.is_correct === null);
  const filteredEssays = essayAnswers.filter((a) =>
    (a.answer_text ?? "").toLowerCase().includes(essaySearch.toLowerCase())
  );

  return (
    <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-[6px_6px_0_0_#000] flex flex-col h-full hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#000] transition-all duration-150">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3 border-b-2 border-black pb-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-block border-2 border-black bg-[#FFDB33] px-2 py-0.5 text-[9px] font-black uppercase text-black tracking-wide shadow-[1px_1px_0_0_#000]">
              Soal #{question.id}
            </span>
            <span className={cn(
              "inline-block border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase text-black tracking-wide shadow-[1px_1px_0_0_#000]",
              isMultipleChoice ? "bg-[#a3e635]" : "bg-[#22d3ee]"
            )}>
              {isMultipleChoice ? "Pilihan Ganda" : "Essay"}
            </span>
          </div>
          <h3 className="text-sm font-black text-black leading-snug font-[family-name:var(--font-head)] mt-1 break-words">
            {question.question_text}
          </h3>
        </div>
        <div className="border-2 border-black bg-black text-[#FFDB33] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_#000] shrink-0 font-mono">
          {totalCount} Respon
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col justify-between">
        {isMultipleChoice ? (
          <div className="space-y-3 flex-1">
            {(question.options ?? []).map((opt, i) => {
              const count = qAnswers.filter((a) => a.answer_text === opt).length;
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const isCorrect = question.correct_option === i;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-start justify-between text-xs font-bold text-black gap-2">
                    <span className="flex items-start gap-1.5 min-w-0">
                      <span className={cn(
                        "w-5 h-5 flex items-center justify-center border-2 border-black text-[9px] font-black shrink-0",
                        isCorrect ? "bg-[#a3e635]" : "bg-[#F5F5F0]"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </span>
                    {isCorrect && (
                      <span className="border-2 border-black bg-[#a3e635] px-1.5 py-0.5 text-[8px] font-black uppercase text-black tracking-wider shrink-0">
                        Kunci Jawaban
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-6 border-2 border-black bg-[#F5F5F0] shadow-[2px_2px_0_0_#000] relative overflow-hidden">
                      <div
                        className={cn(
                          "h-full border-r-2 border-black transition-all duration-500",
                          isCorrect ? "bg-[#a3e635]" : "bg-[#f472b6]"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-mono font-black text-black">
                        {percentage}% ({count} / {totalCount})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalCount > 0 && (
              <div className="border-2 border-black bg-[#FFF9E0] p-2.5 shadow-[2px_2px_0_0_#000] text-xs font-bold text-black mt-4">
                Akurasi Soal: {accuracy}% ({correctCount} dari {totalCount} menjawab benar)
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="relative">
              <input
                type="text"
                value={essaySearch}
                onChange={(e) => setEssaySearch(e.target.value)}
                placeholder="Cari respon essay (cth: marah, cemas, senang)..."
                className="w-full border-2 border-black bg-white px-3 py-1.5 pl-8 text-xs text-black placeholder:text-[#AEAEAE] shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#22d3ee]"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A5A5A]" />
            </div>

            <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto space-y-2 pr-1 border-2 border-black p-2.5 bg-[#F5F5F0] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
              {filteredEssays.length === 0 ? (
                <div className="text-center py-8 text-[#5A5A5A] text-xs font-bold">
                  {essayAnswers.length === 0 ? "Belum ada respon essay." : "Tidak ada respon yang cocok."}
                </div>
              ) : (
                filteredEssays.map((a) => {
                  const hasProfanity = containsProfanity(a.answer_text);
                  const displayText = hasProfanity ? sanitizeText(a.answer_text) : a.answer_text;
                  return (
                    <div key={a.id} className="border-2 border-black bg-white p-2.5 shadow-[2px_2px_0_0_#000] space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-mono text-[#5A5A5A]">
                        <span className="font-semibold text-black">
                          #{a.session_id.slice(0, 8).toUpperCase()}
                        </span>
                        <span>{formatTimestamp(a.submitted_at)}</span>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed text-black font-semibold break-words",
                        hasProfanity && "text-[#E63946] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 inline-block"
                      )}>
                        {displayText}
                      </p>
                      {hasProfanity && (
                        <span className="inline-block bg-[#FEF2F2] border border-[#FECACA] px-1 py-0.5 text-[8px] font-bold text-[#E63946] uppercase tracking-wide">
                          Sensor SARA / Profanity
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Response Analytics View ──────────────────────────────────────────────────

function ResponseAnalyticsView({
  questions,
  answers,
}: {
  questions: Question[];
  answers: AnswerRow[];
}) {
  if (questions.length === 0) {
    return (
      <div className="border-4 border-black bg-[#F5F5F0] p-12 text-center shadow-[6px_6px_0_0_#000]">
        <p className="text-sm font-bold text-[#5A5A5A]">
          Belum ada data pertanyaan untuk dianalisis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {questions.map((q) => (
        <QuestionAnalyticsCard key={q.id} question={q} answers={answers} />
      ))}
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<"TABLE" | "CHARTS">("TABLE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalAnswers: 0,
    essayCount: 0,
    mcCount: 0,
    mcCorrect: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [answersRes, questionsRes] = await Promise.all([
      supabase
        .from("answers")
        .select("*, questions(question_text, question_type)")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true })
    ]);

    if (answersRes.error) {
      if (answersRes.error.code === "PGRST301" || answersRes.error.message?.includes("JWT")) {
        router.push("/admin/login");
        return;
      }
      setError("Gagal memuat data jawaban. Pastikan Anda sudah login sebagai admin.");
      setLoading(false);
      return;
    }

    if (questionsRes.error) {
      setError("Gagal memuat data pertanyaan.");
      setLoading(false);
      return;
    }

    const rows = (answersRes.data ?? []) as AnswerRow[];
    const qRows = (questionsRes.data ?? []) as Question[];

    setAnswers(rows);
    setQuestions(qRows);

    const sessions = new Set(rows.map((r) => r.session_id));
    const essays = rows.filter((r) => r.is_correct === null);
    const mc = rows.filter((r) => r.is_correct !== null);
    const mcCorrect = mc.filter((r) => r.is_correct === true);

    setStats({
      totalSessions: sessions.size,
      totalAnswers: rows.length,
      essayCount: essays.length,
      mcCount: mc.length,
      mcCorrect: mcCorrect.length,
    });

    setLoading(false);
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin/login");
      } else {
        setCheckingAuth(false);
        fetchData();
      }
    });
  }, [fetchData, router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F0]">
        <div className="border-4 border-black bg-white p-8 shadow-[6px_6px_0_0_#000] flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-black" size={28} strokeWidth={3} />
          <p className="text-sm font-black uppercase tracking-wider font-[family-name:var(--font-head)]">Memeriksa Otorisasi…</p>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    const headers = [
      "id",
      "session_id",
      "question_id",
      "pertanyaan",
      "tipe",
      "jawaban",
      "benar",
      "waktu",
    ];

    const exportData = answers.map((r) => ({
      id: r.id,
      session_id: r.session_id,
      question_id: r.question_id,
      pertanyaan: r.questions?.question_text ?? "",
      tipe: r.questions?.question_type ?? "",
      jawaban: containsProfanity(r.answer_text)
        ? sanitizeText(r.answer_text)
        : r.answer_text,
      benar:
        r.is_correct === null ? "essay" : r.is_correct ? "benar" : "salah",
      waktu: formatTimestamp(r.submitted_at),
    }));

    const csv = convertToCSV(exportData, headers);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `kincha-answers-${ts}.csv`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const mcAccuracy =
    stats.mcCount > 0
      ? Math.round((stats.mcCorrect / stats.mcCount) * 100)
      : 0;

  return (
    <ClickSpark sparkColor="#FFDB33" sparkSize={10} sparkRadius={22} sparkCount={8}>
      <div className="flex flex-col min-h-screen bg-[#F5F5F0] relative overflow-hidden">
        
        {/* Floating background decorative sunflowers */}
        <SunflowerSVG size={140} className="absolute -bottom-10 -right-10 rotate-[45deg] opacity-10 pointer-events-none z-0" />
        <SunflowerSVG size={100} className="absolute top-20 -left-10 rotate-[70deg] opacity-10 pointer-events-none z-0" />

        {/* Top bar */}
        <header className="border-b-4 border-black bg-white px-4 py-4 sticky top-0 z-30 shadow-[0_4px_0_0_#000]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-[family-name:var(--font-head)] font-black text-black tracking-[0.05em] leading-none uppercase flex items-center gap-0.5 select-none">
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#FFDB33] rotate-[-3deg]">K</span>
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#22d3ee] rotate-[2deg]">I</span>
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#f472b6] rotate-[-1deg]">N</span>
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#a3e635] rotate-[3deg]">C</span>
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#fb923c] rotate-[-2deg]">H</span>
                  <span className="inline-block hover:scale-110 transition-transform duration-100 [text-shadow:2px_2px_0_#a78bfa] rotate-[1deg]">A</span>
                  <span className="text-xs font-black uppercase text-black ml-2 px-1.5 py-0.5 border border-black bg-[#FFDB33] shadow-[1px_1px_0_0_#000] rotate-[1deg]">DASHBOARD</span>
                </h1>
                <p className="text-[8px] text-black/55 uppercase tracking-[0.2em] leading-none mt-1 font-[family-name:var(--font-sans)] font-extrabold">
                  Pemantau Admin Sesi Game
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/admin/questions"
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5",
                  "border-2 border-black bg-[#facc15] text-black",
                  "px-3 py-2 text-xs font-black uppercase tracking-wider font-[family-name:var(--font-head)]",
                  "shadow-[3px_3px_0_0_#000]",
                  "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000]",
                  "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]",
                  "transition-all duration-100"
                )}
              >
                <Pencil size={13} strokeWidth={3} />
                Kelola Soal
              </Link>
              <BrutalButton
                variant="secondary"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="hidden sm:inline-flex border-2"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={2.5} />
                Refresh
              </BrutalButton>
              <BrutalButton variant="danger" size="sm" onClick={handleSignOut} className="border-2">
                <LogOut size={14} strokeWidth={2.5} />
                Keluar
              </BrutalButton>
            </div>
          </div>
        </header>

        {/* Mobile quick actions bar */}
        <div className="sm:hidden border-b-4 border-black bg-[#FFDB33] px-4 py-2.5 flex items-center justify-between z-20">
          <Link
            href="/admin/questions"
            className="flex items-center gap-1.5 border-2 border-black bg-black text-[#FFDB33] px-3 py-1.5 text-xs font-black uppercase tracking-wider font-[family-name:var(--font-head)]"
          >
            <Pencil size={12} strokeWidth={3} />
            Kelola Soal
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 border-2 border-black bg-white text-black px-3 py-1.5 text-xs font-black uppercase tracking-wider font-[family-name:var(--font-head)]"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} strokeWidth={3} />
            Refresh
          </button>
        </div>

        <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full space-y-8 z-10">
          {/* Error banner */}
          {error && (
            <div className="border-4 border-[#E63946] bg-[#FEF2F2] p-4 shadow-[6px_6px_0_0_#E63946] flex items-center gap-3">
              <AlertTriangle className="text-[#E63946]" />
              <p className="text-sm font-bold text-[#E63946]">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          <section aria-label="Statistik">
            <h2 className="text-lg font-black text-black mb-4 font-[family-name:var(--font-head)] uppercase tracking-widest border-l-4 border-[#FFDB33] pl-3">
              Kinerja Game
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                icon={<Users size={18} className="text-[#facc15]" strokeWidth={2.5} />}
                label="Total Pemain"
                value={loading ? "…" : stats.totalSessions}
                accent="bg-[#facc15]"
              />
              <StatCard
                icon={<FileText size={18} className="text-[#22d3ee]" strokeWidth={2.5} />}
                label="Total Jawaban"
                value={loading ? "…" : stats.totalAnswers}
                accent="bg-[#22d3ee]"
              />
              <StatCard
                icon={<FileText size={18} className="text-[#f472b6]" strokeWidth={2.5} />}
                label="Jawaban Essay"
                value={loading ? "…" : stats.essayCount}
                accent="bg-[#f472b6]"
              />
              <StatCard
                icon={<CheckCircle2 size={18} className="text-[#a3e635]" strokeWidth={2.5} />}
                label={`Akurasi PG (${stats.mcCount} Soal)`}
                value={loading ? "…" : `${mcAccuracy}%`}
                accent="bg-[#a3e635]"
              />
            </div>
          </section>

          {/* Data Table / Charts section */}
          <section aria-label="Tabel jawaban dan Analisis" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-lg font-black text-black font-[family-name:var(--font-head)] uppercase tracking-widest border-l-4 border-[#22d3ee] pl-3">
                  Respon Pemain
                </h2>

                {/* Tab Switcher */}
                {!loading && (
                  <div className="flex border-2 border-black bg-black p-0.5 shadow-[2px_2px_0_0_#000] self-start">
                    <button
                      onClick={() => setActiveTab("TABLE")}
                      className={cn(
                        "px-3 py-1 text-[11px] font-black uppercase tracking-wider font-[family-name:var(--font-head)] transition-all",
                        activeTab === "TABLE" ? "bg-[#FFDB33] text-black" : "bg-transparent text-white hover:text-[#FFDB33]"
                      )}
                    >
                      Tabel
                    </button>
                    <button
                      onClick={() => setActiveTab("CHARTS")}
                      className={cn(
                        "px-3 py-1 text-[11px] font-black uppercase tracking-wider font-[family-name:var(--font-head)] transition-all",
                        activeTab === "CHARTS" ? "bg-[#FFDB33] text-black" : "bg-transparent text-white hover:text-[#FFDB33]"
                      )}
                    >
                      Analisis
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!loading && activeTab === "TABLE" && (
                  <span className="text-xs font-black text-[#5A5A5A] uppercase tracking-wider font-[family-name:var(--font-sans)] bg-white border-2 border-black px-2.5 py-1.5 shadow-[2px_2px_0_0_#000] whitespace-nowrap hidden sm:inline-block">
                    {answers.length} Entri
                  </span>
                )}
                <BrutalButton
                  variant="lime"
                  size="base"
                  onClick={handleExportCSV}
                  disabled={loading || answers.length === 0}
                  className="w-full sm:w-auto font-black uppercase tracking-wider font-[family-name:var(--font-head)] border-2 shadow-[4px_4px_0_0_#000]"
                >
                  <Download size={16} strokeWidth={2.5} />
                  Ekspor Data (CSV)
                </BrutalButton>
              </div>
            </div>

            {loading ? (
              <div className="border-4 border-black bg-white p-16 shadow-[6px_6px_0_0_#000] flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-black" size={28} strokeWidth={3} />
                <p className="text-sm font-black uppercase tracking-wider font-[family-name:var(--font-head)]">Memuat data…</p>
              </div>
            ) : activeTab === "TABLE" ? (
              <AnswersTable rows={answers} />
            ) : (
              <ResponseAnalyticsView questions={questions} answers={answers} />
            )}
          </section>

          {!loading && answers.some((r) => containsProfanity(r.answer_text)) && (
            <section aria-label="Keterangan filter konten">
              <div className="border-4 border-[#E63946] bg-[#FEF2F2] p-4 shadow-[6px_6px_0_0_#E63946] flex items-start gap-3">
                <AlertTriangle className="text-[#E63946] shrink-0" size={20} strokeWidth={2.5} />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-[#C41E30] font-[family-name:var(--font-head)]">
                    Konten Disensor
                  </p>
                  <p className="text-xs leading-relaxed text-[#C41E30] font-[family-name:var(--font-sans)]">
                    Beberapa jawaban mengandung kata tidak pantas dan telah disensor
                    otomatis (ditampilkan sebagai ***). Data CSV juga ikut disensor demi kepatuhan konten.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </ClickSpark>
  );
}
