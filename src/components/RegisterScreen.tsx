import { useState } from "react";
import { User, School, Hash, ArrowRight, FileText, Clock, ListChecks, Award, AlertCircle, Loader2, KeyRound, ChevronDown } from "lucide-react";
import { verifyParticipant, CLASS_OPTIONS, type ParticipantRecord } from "@/lib/supabase";

interface RegisterScreenProps {
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  onStart: (name: string, school: string, code: string, cls: string) => void;
}

export function RegisterScreen({
  totalQuestions,
  durationMinutes,
  passingScore,
  onStart,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [cls, setCls] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama wajib diisi");
      return;
    }
    if (!school.trim()) {
      setError("Asal sekolah wajib diisi");
      return;
    }
    if (!cls) {
      setError("Kelas wajib dipilih");
      return;
    }
    if (!code.trim()) {
      setError("Kode peserta wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const participant: ParticipantRecord | null = await verifyParticipant(code, name, school, cls);
      if (!participant) {
        setError("Nama, asal sekolah, kelas, dan kode peserta tidak cocok. Periksa kembali data Anda.");
        setLoading(false);
        return;
      }
      if (participant.exam_started_at) {
        setError("Anda sudah pernah memulai ujian dengan kode ini. Setiap peserta hanya dapat mengerjakan ujian satu kali.");
        setLoading(false);
        return;
      }
      onStart(participant.name, participant.school, participant.code, participant.class);
    } catch {
      setError("Gagal memverifikasi data. Periksa koneksi internet dan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-600 to-blue-800">
      {/* Header branding */}
      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-extrabold sm:text-2xl">Try Out TKA 1</h1>
        <p className="mt-1 text-xs text-blue-200">Masuk dengan data peserta yang telah didaftarkan</p>
      </div>

      {/* Info bar */}
      <div className="mx-auto flex w-full max-w-sm flex-wrap justify-center gap-3 px-6 pb-5">
        <InfoChip icon={<ListChecks className="h-3.5 w-3.5" />} text={`${totalQuestions} Soal`} />
        <InfoChip icon={<Clock className="h-3.5 w-3.5" />} text={`${durationMinutes} Menit`} />
        <InfoChip icon={<Award className="h-3.5 w-3.5" />} text={`Lulus ≥ ${passingScore}`} />
      </div>

      {/* Form card */}
      <div className="mx-auto w-full max-w-sm flex-1 px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-2xl"
          noValidate
        >
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Verifikasi Peserta</h2>
          </div>

          {/* Nama Lengkap */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Sesuai data pendaftaran"
                className={`w-full rounded-xl border-2 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-500 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Asal Sekolah */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Asal Sekolah <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Sesuai data pendaftaran"
                className={`w-full rounded-xl border-2 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-500 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Kelas */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kelas <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={cls}
                onChange={(e) => {
                  setCls(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full appearance-none rounded-xl border-2 bg-slate-50 py-3 pl-4 pr-10 text-sm text-slate-800 transition-colors outline-none focus:border-blue-500 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                } ${cls ? "" : "text-slate-400"}`}
              >
                <option value="" disabled>Pilih kelas</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kode Peserta */}
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kode Peserta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                placeholder="Contoh: PES001"
                autoCapitalize="characters"
                className={`w-full rounded-xl border-2 bg-slate-50 py-3 pl-10 pr-4 text-sm font-mono font-semibold tracking-wider text-slate-800 placeholder-slate-400 placeholder-normal transition-colors outline-none focus:border-blue-500 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Memverifikasi...</>
            ) : (
              <>Mulai Ujian <ArrowRight className="h-5 w-5" /></>
            )}
          </button>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Kode peserta telah diberikan panitia.
              <br />
              <span className="font-semibold text-slate-600">Nama, sekolah, kelas, dan kode harus cocok</span> untuk masuk ujian.
            </p>
          </div>
        </form>
      </div>

      <div className="h-10" />
    </div>
  );
}

function InfoChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}
