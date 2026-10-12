import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Pencil, Trash2, Save, X, Check, AlertCircle, Loader2,
  CheckCircle2, Image as ImageIcon, Upload, ChevronDown, FileText,
  ListChecks, ToggleLeft, Settings,
} from "lucide-react";
import {
  fetchQuestions, insertQuestion, updateQuestion, deleteQuestion,
  uploadQuestionImage, deleteQuestionImage,
  fetchExamSettings, updateExamSettings,
  type QuestionDB,
} from "@/lib/supabase";
import type { QuestionType } from "@/types";

const ALL_LETTERS = ["A", "B", "C", "D", "E"];
const TYPE_LABELS: Record<QuestionType, string> = {
  "single-choice": "Pilihan Ganda",
  "multiple-choice": "Multi Jawaban",
  "true-false": "Benar / Salah",
};

interface QuestionFormState {
  id: number | null;
  question_type: QuestionType;
  subject: string;
  question: string;
  image_url: string | null;
  choices: Record<string, string>;
  answer: string;
  sort_order: number;
}

const emptyForm: QuestionFormState = {
  id: null,
  question_type: "single-choice",
  subject: "",
  question: "",
  image_url: null,
  choices: { A: "", B: "", C: "", D: "", E: "" },
  answer: "",
  sort_order: 0,
};

export function AdminQuestionManager() {
  const [questions, setQuestions] = useState<QuestionDB[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<QuestionFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionDB | null>(null);
  const [toast, setToast] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ duration_minutes: 90, passing_score: 70 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchQuestions();
      const dbData = data.map((d) => ({
        id: d.id,
        question_type: d.question_type,
        subject: d.subject,
        question: d.question,
        image_url: d.image_url || null,
        choices: d.choices,
        answer: d.answer,
        sort_order: 0,
        created_at: "",
      }));
      setQuestions(dbData);
    } catch {
      setError("Gagal memuat soal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchExamSettings().then((s) => setSettingsForm(s)).catch(() => {});
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function startAdd() {
    const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order || 0)) + 1 : 1;
    setEditing({ ...emptyForm, sort_order: nextOrder });
    setError("");
  }

  function startEdit(q: QuestionDB) {
    setEditing({
      id: q.id,
      question_type: q.question_type,
      subject: q.subject,
      question: q.question,
      image_url: q.image_url,
      choices: { A: "", B: "", C: "", D: "", E: "", ...q.choices },
      answer: q.answer,
      sort_order: q.sort_order,
    });
    setError("");
  }

  function cancelEdit() {
    setEditing(null);
    setError("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const url = await uploadQuestionImage(file);
      setEditing({ ...editing, image_url: url });
    } catch {
      setError("Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    if (editing?.image_url) {
      deleteQuestionImage(editing.image_url).catch(() => {});
    }
    setEditing({ ...editing, image_url: null });
  }

  function toggleAnswerKey(key: string) {
    if (!editing) return;
    if (editing.question_type === "multiple-choice") {
      const current = new Set(editing.answer.split(",").filter(Boolean));
      if (current.has(key)) current.delete(key);
      else current.add(key);
      setEditing({ ...editing, answer: Array.from(current).sort().join(",") });
    } else {
      setEditing({ ...editing, answer: key });
    }
  }

  function handleTypeChange(type: QuestionType) {
    if (!editing) return;
    if (type === "true-false") {
      setEditing({
        ...editing,
        question_type: type,
        choices: { A: "Benar", B: "Salah" },
        answer: editing.answer === "B" ? "B" : "A",
      });
    } else if (type === "multiple-choice") {
      const wasTF = editing.question_type === "true-false";
      setEditing({
        ...editing,
        question_type: type,
        choices: wasTF
          ? { A: "", B: "", C: "", D: "", E: "" }
          : { A: "", B: "", C: "", D: "", E: "", ...editing.choices },
        answer: "",
      });
    } else {
      const wasTF = editing.question_type === "true-false";
      setEditing({
        ...editing,
        question_type: type,
        choices: wasTF
          ? { A: "", B: "", C: "", D: "", E: "" }
          : { A: "", B: "", C: "", D: "", E: "", ...editing.choices },
        answer: "",
      });
    }
  }

  function validate(): string | null {
    if (!editing) return null;
    if (!editing.question.trim()) return "Teks soal tidak boleh kosong.";
    if (!editing.subject.trim()) return "Mata pelajaran tidak boleh kosong.";

    if (editing.question_type === "true-false") {
      if (!editing.answer) return "Pilih jawaban yang benar (Benar atau Salah).";
    } else {
      const filledKeys = ALL_LETTERS.filter((k) => (editing.choices[k] || "").trim());
      if (filledKeys.length < 2) return "Minimal 2 pilihan jawaban harus diisi.";

      if (editing.question_type === "multiple-choice") {
        const ansKeys = editing.answer.split(",").filter(Boolean);
        if (ansKeys.length < 1) return "Pilih minimal 1 jawaban yang benar.";
        if (ansKeys.some((k) => !filledKeys.includes(k)))
          return "Jawaban yang dipilih harus memiliki teks pilihan.";
      } else {
        if (!editing.answer || !filledKeys.includes(editing.answer))
          return "Pilih jawaban yang benar dari pilihan yang sudah diisi.";
      }
    }
    return null;
  }

  async function handleSave() {
    if (!editing) return;
    const vErr = validate();
    if (vErr) {
      setError(vErr);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cleanChoices: Record<string, string> = {};
      if (editing.question_type === "true-false") {
        cleanChoices.A = "Benar";
        cleanChoices.B = "Salah";
      } else {
        ALL_LETTERS.forEach((k) => {
          if ((editing.choices[k] || "").trim()) cleanChoices[k] = editing.choices[k].trim();
        });
      }

      const payload = {
        question_type: editing.question_type,
        subject: editing.subject.trim(),
        question: editing.question.trim(),
        image_url: editing.image_url,
        choices: cleanChoices,
        answer: editing.answer,
        sort_order: editing.sort_order,
      };

      if (editing.id) {
        await updateQuestion(editing.id, payload);
        showToast("Soal berhasil diperbarui.");
      } else {
        await insertQuestion(payload);
        showToast("Soal baru berhasil ditambahkan.");
      }
      setEditing(null);
      await load();
    } catch {
      setError("Gagal menyimpan soal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.image_url) {
        await deleteQuestionImage(deleteTarget.image_url);
      }
      await deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      showToast("Soal berhasil dihapus.");
    } catch {
      setError("Gagal menghapus soal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setError("");
    try {
      await updateExamSettings(settingsForm);
      showToast("Pengaturan ujian disimpan.");
      setShowSettings(false);
    } catch {
      setError("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = questions.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.question.toLowerCase().includes(s) ||
      q.subject.toLowerCase().includes(s) ||
      TYPE_LABELS[q.question_type].toLowerCase().includes(s)
    );
  });

  const activeChoiceKeys =
    editing?.question_type === "true-false"
      ? ["A", "B"]
      : ALL_LETTERS.filter((k) => editing?.choices[k] !== undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      {/* Action bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all active:scale-95 hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Pengaturan</span>
        </button>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Soal
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari soal berdasarkan teks atau mata pelajaran..."
          className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit / Add form */}
      {editing && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-blue-400">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              {editing.id ? "Edit Soal" : "Tambah Soal Baru"}
            </h2>
            <button
              onClick={cancelEdit}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Question type selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipe Soal
              </label>
              <div className="grid grid-cols-3 gap-2">
                <TypeButton
                  active={editing.question_type === "single-choice"}
                  onClick={() => handleTypeChange("single-choice")}
                  icon={<FileText className="h-4 w-4" />}
                  label="Pilihan Ganda"
                />
                <TypeButton
                  active={editing.question_type === "multiple-choice"}
                  onClick={() => handleTypeChange("multiple-choice")}
                  icon={<ListChecks className="h-4 w-4" />}
                  label="Multi Jawaban"
                />
                <TypeButton
                  active={editing.question_type === "true-false"}
                  onClick={() => handleTypeChange("true-false")}
                  icon={<ToggleLeft className="h-4 w-4" />}
                  label="Benar / Salah"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mata Pelajaran / Kategori
              </label>
              <input
                type="text"
                value={editing.subject}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                placeholder="Contoh: Matematika"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Question text */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teks Soal
              </label>
              <textarea
                value={editing.question}
                onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                placeholder="Tulis pertanyaan di sini... (HTML diperbolehkan: <b>, <br>, <i>)"
                rows={4}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gambar Soal (Opsional)
              </label>
              {editing.image_url ? (
                <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                  <img src={editing.image_url} alt="Preview" className="max-h-48 w-full object-contain bg-slate-50" />
                  <button
                    onClick={removeImage}
                    className="absolute right-2 top-2 rounded-lg bg-red-500 p-1.5 text-white shadow-md transition-colors hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Klik untuk unggah gambar (maks 5MB)</>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Choices */}
            {editing.question_type !== "true-false" ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pilihan Jawaban
                </label>
                <div className="space-y-2">
                  {activeChoiceKeys.map((letter) => (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAnswerKey(letter)}
                        type="button"
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                          editing.answer.split(",").includes(letter)
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title="Tandai sebagai jawaban benar"
                      >
                        {editing.answer.split(",").includes(letter) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          letter
                        )}
                      </button>
                      <input
                        type="text"
                        value={editing.choices[letter] || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            choices: { ...editing.choices, [letter]: e.target.value },
                          })
                        }
                        placeholder={`Pilihan ${letter}`}
                        className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {editing.question_type === "multiple-choice"
                    ? "Klik huruf untuk menandai semua jawaban yang benar."
                    : "Klik huruf untuk menandai jawaban yang benar."}
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Jawaban Benar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditing({ ...editing, answer: "A" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      editing.answer === "A"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {editing.answer === "A" && <Check className="h-4 w-4" />}
                    Benar
                  </button>
                  <button
                    onClick={() => setEditing({ ...editing, answer: "B" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      editing.answer === "B"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {editing.answer === "B" && <Check className="h-4 w-4" />}
                    Salah
                  </button>
                </div>
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={cancelEdit}
                className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors active:scale-[0.98] hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Save className="h-4 w-4" /> Simpan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500">
          {loading ? "Memuat..." : `${filtered.length} soal`}
        </p>
      </div>

      {/* Question list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-slate-200/60">
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Belum ada soal. Klik "Tambah Soal" untuk membuat.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 transition-all hover:ring-slate-300"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={q.question_type} />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {q.subject}
                    </span>
                    {q.image_url && (
                      <span className="flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <ImageIcon className="h-2.5 w-2.5" /> Gambar
                      </span>
                    )}
                  </div>
                  <p
                    className="line-clamp-2 text-sm text-slate-700 [&_b]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: q.question }}
                  />
                  <p className="mt-1 text-[11px] text-emerald-600">
                    Jawaban: {q.answer}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(q)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="mb-2 text-center text-lg font-bold text-slate-800">Hapus Soal?</h2>
            <p className="mb-4 text-center text-sm leading-relaxed text-slate-500">
              Soal ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors active:scale-[0.98] hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors active:scale-[0.98] hover:bg-red-600 disabled:opacity-60"
              >
                {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Pengaturan Ujian</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Durasi Ujian (menit)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settingsForm.duration_minutes}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, duration_minutes: Number(e.target.value) || 90 })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nilai Lulus (0–100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={settingsForm.passing_score}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, passing_score: Number(e.target.value) || 70 })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

function TypeButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TypeBadge({ type }: { type: QuestionType }) {
  const styles: Record<QuestionType, string> = {
    "single-choice": "bg-blue-100 text-blue-700",
    "multiple-choice": "bg-violet-100 text-violet-700",
    "true-false": "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}
