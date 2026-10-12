import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  User,
  School,
  Hash,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import {
  fetchParticipants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
  generateNextParticipantCode,
  CLASS_OPTIONS,
  type AdminParticipant,
} from "@/lib/supabase";
import { AdminResults } from "@/components/AdminResults";
import { AdminQuestionManager } from "@/components/AdminQuestionManager";

interface AdminScreenProps {
  onBack: () => void;
}

type AdminTab = "participants" | "results" | "questions";

type EditState = {
  id: number;
  code: string;
  name: string;
  school: string;
  class: string;
} | null;

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("participants");
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EditState>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newClass, setNewClass] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminParticipant | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchParticipants(search);
      setParticipants(data);
    } catch {
      setError("Gagal memuat data peserta.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function startEdit(p: AdminParticipant) {
    setEditing({ id: p.id, code: p.code, name: p.name, school: p.school, class: p.class || "" });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (!editing.school.trim()) {
      setError("Asal sekolah tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const original = participants.find((p) => p.id === editing.id);
      const updates: { name?: string; school?: string; code?: string; class?: string } = {};
      if (original && original.name !== editing.name) updates.name = editing.name;
      if (original && original.school !== editing.school) updates.school = editing.school;
      if (original && original.code !== editing.code.toUpperCase()) updates.code = editing.code.toUpperCase();
      if (original && (original.class || "") !== editing.class) updates.class = editing.class;

      if (Object.keys(updates).length > 0) {
        await updateParticipant(editing.id, updates);
      }
      setEditing(null);
      await load();
      showToast("Data peserta berhasil diperbarui.");
    } catch {
      setError("Gagal menyimpan perubahan. Kode peserta mungkin sudah digunakan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (!newCode.trim()) {
      setError("Kode peserta wajib diisi.");
      return;
    }
    if (!newName.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!newSchool.trim()) {
      setError("Asal sekolah wajib diisi.");
      return;
    }
    if (!newClass) {
      setError("Kelas wajib dipilih.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addParticipant(newCode, newName, newSchool, newClass);
      setShowAdd(false);
      setNewCode("");
      setNewName("");
      setNewSchool("");
      setNewClass("");
      await load();
      showToast("Peserta baru berhasil ditambahkan.");
    } catch {
      setError("Gagal menambah peserta. Kode peserta mungkin sudah ada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteParticipant(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      showToast("Peserta berhasil dihapus.");
    } catch {
      setError("Gagal menghapus peserta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoCode() {
    try {
      const code = await generateNextParticipantCode();
      setNewCode(code);
    } catch {
      // abaikan
    }
  }

  function openAddForm() {
    setShowAdd(true);
    setError("");
    handleAutoCode();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 to-blue-800 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors active:scale-95 hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
          <h1 className="flex-1 text-base font-bold text-white">Panel Admin</h1>
        </div>
        {/* Tab navigation */}
        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          <TabButton
            active={activeTab === "participants"}
            onClick={() => setActiveTab("participants")}
            label="Kelola Peserta"
          />
          <TabButton
            active={activeTab === "questions"
            onClick={() => setActiveTab("questions")}
            label="Kelola Soal"
          />
          <TabButton
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            label="Hasil Ujian"
          />
        </div>
      </header>

      {activeTab === "questions" ? (
        <AdminQuestionManager />
      ) : activeTab === "results" ? (
        <AdminResults onBack={() => setActiveTab("participants")} />
      ) : (
        <>
          <div className="mx-auto max-w-3xl px-4 py-5">
            {/* Action bar */}
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Tambah Peserta
              </button>
            </div>

            {/* Search bar */}
            <div className="mb-4 relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan kode, nama, atau sekolah..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-500"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Add form */}
            {showAdd && (
              <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">Tambah Peserta Baru</h2>
                  <button
                    onClick={() => { setShowAdd(false); setError(""); }}
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <FormInput
                    icon={<Hash className="h-4 w-4" />}
                    label="Kode Peserta"
                    value={newCode}
                    onChange={(v) => setNewCode(v.toUpperCase())}
                    placeholder="Contoh: PES101"
                    mono
                  />
                  <FormInput
                    icon={<User className="h-4 w-4" />}
                    label="Nama Lengkap"
                    value={newName}
                    onChange={setNewName}
                    placeholder="Nama peserta"
                  />
                  <FormInput
                    icon={<School className="h-4 w-4" />}
                    label="Asal Sekolah"
                    value={newSchool}
                    onChange={setNewSchool}
                    placeholder="Nama sekolah"
                  />
                  <FormSelect
                    label="Kelas"
                    value={newClass}
                    onChange={setNewClass}
                    options={CLASS_OPTIONS}
                  />
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { setShowAdd(false); setError(""); }}
                      className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors active:scale-[0.98] hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAdd}
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

            {/* Stats bar */}
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-slate-500">
                {loading ? "Memuat..." : `${participants.length} peserta`}
              </p>
            </div>

            {/* Participant list */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : participants.length === 0 ? (
              <div className="rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-slate-200/60">
                <p className="text-sm text-slate-400">Tidak ada peserta ditemukan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => {
                  const isEditing = editing?.id === p.id;
                  const hasStarted = !!p.exam_started_at;

                  if (isEditing) {
                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl bg-white p-4 shadow-sm ring-2 ring-blue-400"
                      >
                        <div className="space-y-3">
                          <FormInput
                            icon={<Hash className="h-4 w-4" />}
                            label="Kode"
                            value={editing.code}
                            onChange={(v) => setEditing({ ...editing, code: v.toUpperCase() })}
                            mono
                            compact
                          />
                          <FormInput
                            icon={<User className="h-4 w-4" />}
                            label="Nama"
                            value={editing.name}
                            onChange={(v) => setEditing({ ...editing, name: v })}
                            compact
                          />
                          <FormInput
                            icon={<School className="h-4 w-4" />}
                            label="Sekolah"
                            value={editing.school}
                            onChange={(v) => setEditing({ ...editing, school: v })}
                            compact
                          />
                          <FormSelect
                            label="Kelas"
                            value={editing.class}
                            onChange={(v) => setEditing({ ...editing, class: v })}
                            options={CLASS_OPTIONS}
                            compact
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 rounded-lg border-2 border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            >
                              <X className="h-3.5 w-3.5" /> Batal
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                            >
                              {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <><Check className="h-3.5 w-3.5" /> Simpan</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 transition-all hover:ring-slate-300"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-xs font-bold text-blue-700">
                        {p.code.slice(-3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                          {p.class && (
                            <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {p.class}
                            </span>
                          )}
                          {hasStarted && (
                            <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              <Clock className="h-2.5 w-2.5" /> Sudah ujian
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-600">{p.code}</span>
                          <span className="text-slate-300">|</span>
                          <span className="truncate">{p.school}</span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 gap-1.5">
                        <button
                          onClick={() => startEdit(p)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delete confirmation */}
          {deleteTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
                <h2 className="mb-2 text-center text-lg font-bold text-slate-800">Hapus Peserta?</h2>
                <p className="mb-4 text-center text-sm leading-relaxed text-slate-500">
                  Yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteTarget.name}</span> ({deleteTarget.code})? Tindakan ini tidak dapat dibatalkan.
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

          {/* Toast notification */}
          {toast && (
            <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {toast}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FormInput({
  icon,
  label,
  value,
  onChange,
  placeholder,
  mono,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`block ${compact ? "mb-1" : "mb-1.5"} text-xs font-semibold uppercase tracking-wide text-slate-500`}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoCapitalize={mono ? "characters" : undefined}
          className={`w-full rounded-xl border-2 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-500 focus:bg-white ${
            mono ? "font-mono font-semibold tracking-wider" : ""
          } border-slate-200`}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`block ${compact ? "mb-1" : "mb-1.5"} text-xs font-semibold uppercase tracking-wide text-slate-500`}>
        {label}
      </label>
      <div className="relative">
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 ${compact ? "py-2" : "py-2.5"} pl-3.5 pr-10 text-sm text-slate-800 transition-colors outline-none focus:border-blue-500 focus:bg-white ${
            value ? "" : "text-slate-400"
          }`}
        >
          <option value="" disabled>Pilih kelas</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
        active
          ? "bg-white text-blue-700 shadow-sm"
          : "bg-white/10 text-blue-100 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}
