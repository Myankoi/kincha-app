"use client";

import { BrutalButton } from "@/components/ui/BrutalButton";
import { supabase, type Question, type QuestionType, type MediaType } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Pencil, Trash2, X, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ClickSpark from "@/components/ui/ClickSpark";
import DecryptedText from "@/components/ui/DecryptedText";
import SunflowerSVG from "@/components/ui/SunflowerSVG";
import MediaBrowserModal from "@/components/ui/MediaBrowserModal";

const EMPTY_FORM = {
  question_text: "",
  question_type: "MULTIPLE_CHOICE" as QuestionType,
  options: ["", "", "", ""],
  correct_option: 0,
  explanation: "",
  media_url: "",
  media_type: "NONE" as MediaType,
};

type FormState = typeof EMPTY_FORM;

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide text-black">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full border-2 border-black bg-white",
          "px-3 py-2 text-sm text-black placeholder:text-[#AEAEAE]",
          "shadow-[2px_2px_0_0_#000]",
          "focus:outline-none focus:border-[#FFCC00] focus:shadow-[3px_3px_0_0_#FFCC00]",
          "transition-all duration-100"
        )}
      />
    </div>
  );
}

function QuestionFormModal({
  editTarget,
  onClose,
  onSaved,
}: {
  editTarget: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState<FormState>(() => {
    if (!editTarget) return EMPTY_FORM;
    return {
      question_text: editTarget.question_text ?? "",
      question_type: editTarget.question_type,
      options: editTarget.options?.length
        ? [...editTarget.options, ...Array(4).fill("")].slice(0, Math.max(4, editTarget.options.length))
        : ["", "", "", ""],
      correct_option: editTarget.correct_option ?? 0,
      explanation: editTarget.explanation ?? "",
      media_url: editTarget.media_url ?? "",
      media_type: editTarget.media_type ?? "NONE",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setOption = (idx: number, val: string) =>
    setForm((f) => {
      const opts = [...f.options];
      opts[idx] = val;
      return { ...f, options: opts };
    });

  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, ""] }));

  const removeOption = (idx: number) =>
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== idx),
      correct_option: f.correct_option >= idx && f.correct_option > 0
        ? f.correct_option - 1
        : f.correct_option,
    }));

  const handleSave = async () => {
    if (!form.question_text.trim()) {
      setError("Teks soal wajib diisi.");
      return;
    }
    if (form.question_type === "MULTIPLE_CHOICE") {
      const validOpts = form.options.filter((o) => o.trim());
      if (validOpts.length < 2) {
        setError("Pilihan ganda butuh minimal 2 opsi.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    const validOptions = form.options.filter((o) => o.trim());

    const payload = {
      question_text: form.question_text.trim(),
      question_type: form.question_type,
      options: form.question_type === "MULTIPLE_CHOICE" ? validOptions : null,
      correct_option: form.question_type === "MULTIPLE_CHOICE" ? form.correct_option : null,
      explanation: form.explanation.trim() || null,
      media_url: form.media_url.trim() || null,
      media_type: form.media_type,
    };

    let err;
    if (isEdit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error: err } = await (supabase.from("questions") as any).update(payload).eq("id", editTarget.id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error: err } = await (supabase.from("questions") as any).insert([payload]));
    }

    if (err) {
      setError(`Gagal menyimpan: ${err.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  const validOptions = form.options.filter((o) => o.trim());

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full sm:max-w-lg bg-white border-t-4 sm:border-4 border-black shadow-[0_-6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b-4 border-black bg-[#22d3ee] shrink-0">
          <h2 className="text-base font-black text-black font-[family-name:var(--font-head)]">
            {isEdit ? "✏️ Edit Soal" : "➕ Tambah Soal Baru"}
          </h2>
          <button
            onClick={onClose}
            className="border-2 border-black p-1.5 bg-white hover:bg-[#F5F5F0] transition-colors"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-5 space-y-4">
          {error && (
            <div className="border-2 border-[#E63946] bg-[#FEF2F2] px-3 py-2.5">
              <p className="text-xs font-semibold text-[#E63946]">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="form-type" className="block text-xs font-bold uppercase tracking-wide text-black">
              Tipe Soal
            </label>
            <select
              id="form-type"
              value={form.question_type}
              onChange={(e) => set("question_type", e.target.value as QuestionType)}
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00]"
            >
              <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
              <option value="ESSAY">Essay</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="form-text" className="block text-xs font-bold uppercase tracking-wide text-black">
              Teks Pertanyaan
            </label>
            <textarea
              id="form-text"
              value={form.question_text}
              onChange={(e) => set("question_text", e.target.value)}
              placeholder="Tulis pertanyaannya di sini…"
              rows={3}
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-[#AEAEAE] resize-none shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00] focus:shadow-[3px_3px_0_0_#FFCC00]"
            />
          </div>

          {/* MC Options */}
          {form.question_type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-black">Pilihan Jawaban</span>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-xs font-semibold border-2 border-black px-2 py-1 bg-[#a3e635] hover:bg-[#84cc16] shadow-[2px_2px_0_0_#000] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Plus size={12} /> Tambah
                </button>
              </div>
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-black text-black w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                    className="flex-1 border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-[#AEAEAE] shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00]"
                  />
                  {form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="border-2 border-black p-1.5 bg-[#FEF2F2] hover:bg-[#FECACA] transition-colors"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}

              {/* correct_option — select by index */}
              <div className="space-y-1.5">
                <label htmlFor="form-correct" className="block text-xs font-bold uppercase tracking-wide text-black">
                  Jawaban Benar
                </label>
                <select
                  id="form-correct"
                  value={form.correct_option}
                  onChange={(e) => set("correct_option", Number(e.target.value))}
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00]"
                >
                  {validOptions.map((opt, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}. {opt || `Opsi ${i + 1}`}
                    </option>
                  ))}
                  {validOptions.length === 0 && (
                    <option value={0}>— Isi pilihan dulu —</option>
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="form-explanation" className="block text-xs font-bold uppercase tracking-wide text-black">
              Penjelasan / Pesan Kezia{" "}
              <span className="font-normal normal-case text-[#AEAEAE]">(opsional)</span>
            </label>
            <textarea
              id="form-explanation"
              value={form.explanation}
              onChange={(e) => set("explanation", e.target.value)}
              placeholder="Pesan empati atau penjelasan jawaban…"
              rows={3}
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-[#AEAEAE] resize-none shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <InputField
                  id="form-media-url"
                  label="Media URL (Storage Path)"
                  value={form.media_url}
                  onChange={(v) => set("media_url", v)}
                  placeholder="images/soal-1.webp"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowMediaBrowser(true)}
                className="h-[38px] px-3 border-2 border-black bg-[#FFDB33] font-bold text-xs uppercase tracking-wide shadow-[2px_2px_0_0_#000] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
              >
                Cari / Upload
              </button>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="form-media-type" className="block text-xs font-bold uppercase tracking-wide text-black">
                Tipe Media
              </label>
              <select
                id="form-media-type"
                value={form.media_type}
                onChange={(e) => set("media_type", e.target.value as MediaType)}
                className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFCC00]"
              >
                <option value="NONE">Tidak ada</option>
                <option value="IMAGE">Gambar</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-4 border-t-4 border-black bg-[#F5F5F0] shrink-0">
          <BrutalButton variant="ghost" size="base" onClick={onClose} className="flex-1">Batal</BrutalButton>
          <BrutalButton
            variant={isEdit ? "cyan" : "lime"}
            size="base"
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] font-black"
          >
            {saving ? (
              <><Loader2 className="animate-spin" size={14} /> Menyimpan…</>
            ) : isEdit ? "Simpan Perubahan" : "Tambah Soal"}
          </BrutalButton>
        </div>
      </div>

      <MediaBrowserModal
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(path, type) => {
          set("media_url", path);
          set("media_type", type);
        }}
      />
    </div>
  );
}

function DeleteConfirm({
  question,
  onCancel,
  onDeleted,
}: {
  question: Question;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("questions") as any).delete().eq("id", question.id);
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-sm bg-white border-4 border-black shadow-[8px_8px_0_0_#000]">
        <div className="px-5 py-4 border-b-4 border-black bg-[#f472b6]">
          <h2 className="text-base font-black text-black font-[family-name:var(--font-head)]">⚠️ Hapus Soal?</h2>
        </div>
        <div className="px-5 py-5 space-y-2">
          <p className="text-sm text-[#5A5A5A]">Soal ini akan dihapus permanen:</p>
          <p className="text-sm font-semibold text-black line-clamp-2 border-l-4 border-black pl-3">
            {question.question_text}
          </p>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t-4 border-black">
          <BrutalButton variant="ghost" size="base" onClick={onCancel} className="flex-1">Batal</BrutalButton>
          <BrutalButton variant="danger" size="base" onClick={handleDelete} disabled={deleting} className="flex-[2]">
            {deleting ? <><Loader2 className="animate-spin" size={14} /> Menghapus…</> : "Ya, Hapus"}
          </BrutalButton>
        </div>
      </div>
    </div>
  );
}

export default function QuestionsManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | QuestionType>("ALL");

  const fetchQuestions = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("questions") as any)
      .select("*")
      .order("id", { ascending: true });
    setQuestions(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSaved = () => {
    setShowForm(false);
    setEditTarget(null);
    fetchQuestions();
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    fetchQuestions();
  };

  const filtered = filterType === "ALL"
    ? questions
    : questions.filter((q) => q.question_type === filterType);

  const TYPE_COLOR: Record<string, string> = {
    MULTIPLE_CHOICE: "bg-[#CFFAFE] border-[#0891B2] text-[#0891B2]",
    ESSAY: "bg-[#FEF3C7] border-[#D97706] text-[#92400E]",
  };

  return (
    <ClickSpark sparkColor="#FFDB33" sparkSize={10} sparkRadius={22} sparkCount={8}>
      <div className="flex flex-col min-h-screen bg-[#F5F5F0] relative overflow-hidden">
        
        {/* Floating background decorative sunflowers */}
        <SunflowerSVG size={140} className="absolute -bottom-10 -left-10 rotate-[45deg] opacity-10 pointer-events-none z-0" />
        <SunflowerSVG size={100} className="absolute top-24 -right-10 rotate-[70deg] opacity-10 pointer-events-none z-0" />

        <header className="border-b-4 border-black bg-black px-4 py-4 sticky top-0 z-30 shadow-[0_4px_0_0_#000]">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="border-2 border-[#facc15] p-1.5 text-[#facc15] hover:bg-[#facc15] hover:text-black transition-colors shadow-[2px_2px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none"
              aria-label="Kembali ke dashboard"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </Link>
            <div className="flex-1">
              <h1 className="text-sm sm:text-base font-black text-white font-[family-name:var(--font-head)] leading-tight tracking-wider">
                <DecryptedText
                  text="KELOLA SOAL"
                  animateOn="view"
                  speed={50}
                  maxIterations={15}
                  className="text-white"
                />
              </h1>
              <p className="text-[9px] text-white/50 uppercase tracking-widest font-[family-name:var(--font-sans)] leading-none mt-0.5">
                {questions.length} soal tersimpan
              </p>
            </div>
            <BrutalButton
              variant="lime"
              size="sm"
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="font-black uppercase tracking-wider font-[family-name:var(--font-head)] border-2"
            >
              <Plus size={14} strokeWidth={2.5} /> Tambah Soal
            </BrutalButton>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full space-y-5 z-10">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "MULTIPLE_CHOICE", "ESSAY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-black transition-all shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5",
                  filterType === t
                    ? "bg-black text-[#facc15] -translate-x-px -translate-y-px shadow-[3px_3px_0_0_#000]"
                    : "bg-white text-black hover:bg-[#F5F5F0]"
                )}
              >
                {t === "ALL" ? "Semua" : t === "MULTIPLE_CHOICE" ? "Pilihan Ganda" : "Essay"}
                {" "}
                <span className="opacity-65">
                  ({t === "ALL" ? questions.length : questions.filter((q) => q.question_type === t).length})
                </span>
              </button>
            ))}
            <button
              onClick={fetchQuestions}
              className="ml-auto border-2 border-black p-1.5 bg-white hover:bg-[#F5F5F0] shadow-[2px_2px_0_0_#000] transition-all"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="border-4 border-black bg-white p-12 shadow-[6px_6px_0_0_#000] flex flex-col items-center gap-3">
              <RefreshCw className="animate-spin text-black" size={24} />
              <p className="text-sm font-semibold text-[#5A5A5A]">Memuat soal…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border-4 border-black bg-[#F5F5F0] p-10 text-center shadow-[6px_6px_0_0_#000]">
              <p className="text-sm font-semibold text-[#5A5A5A]">
                Belum ada soal. Klik &quot;Tambah Soal&quot; untuk mulai.
              </p>
            </div>
          ) : (
            <div className="border-4 border-black shadow-[6px_6px_0_0_#000] overflow-x-auto bg-white">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead>
                  <tr className="bg-[#F5F5F0] border-b-4 border-black">
                    {["#", "Tipe", "Pertanyaan", "Opsi", "Media", "Aksi"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-xs font-black text-black uppercase tracking-widest border-r-2 last:border-r-0 border-black font-[family-name:var(--font-head)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q, idx) => (
                    <tr
                      key={q.id}
                      className={cn(
                        "bg-white hover:bg-[#F5F5F0]/50 transition-colors",
                        idx !== filtered.length - 1 && "border-b-2 border-black"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-[#AEAEAE] border-r border-black/10">{q.id}</td>
                      <td className="px-4 py-3 border-r border-black/10">
                        <span className={cn("inline-block border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]", TYPE_COLOR[q.question_type] ?? "bg-white border-black text-black")}>
                          {q.question_type === "MULTIPLE_CHOICE" ? "PG" : "Essay"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black border-r border-black/10 max-w-[300px]">
                        <span className="line-clamp-2 leading-relaxed">{q.question_text ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black border-r border-black/10 font-semibold whitespace-nowrap">
                        {q.options ? `${q.options.length} Opsi` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#AEAEAE] border-r border-black/10 whitespace-nowrap">
                        {q.media_type === "NONE" || !q.media_type ? (
                          "—"
                        ) : (
                          <span className="border border-black bg-black text-[#FFDB33] px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]">
                            {q.media_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditTarget(q); setShowForm(true); }}
                            className="border-2 border-black p-1.5 bg-[#22d3ee] hover:bg-[#06b6d4] shadow-[2px_2px_0_0_#000] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                            aria-label="Edit soal"
                          >
                            <Pencil size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="border-2 border-black p-1.5 bg-[#FEF2F2] hover:bg-[#FECACA] shadow-[2px_2px_0_0_#000] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                            aria-label="Hapus soal"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {showForm && (
          <QuestionFormModal
            editTarget={editTarget}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
            onSaved={handleSaved}
          />
        )}

        {deleteTarget && (
          <DeleteConfirm
            question={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </ClickSpark>
  );
}
