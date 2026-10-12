import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  X,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  School,
  Hash,
  Loader2,
  Award,
  Minus,
  Printer,
  ChevronDown,
} from "lucide-react";
import {
  fetchExamSessions,
  type ExamSessionRecord,
} from "@/lib/supabase";
import { questions, PASSING_SCORE } from "@/data/questions";
import { formatTime } from "@/utils/formatTime";
import { formatScore } from "@/types";
import type { Question } from "@/types";

interface AdminResultsProps {
  onBack: () => void;
}

export function AdminResults({ onBack }: AdminResultsProps) {
  const [sessions, setSessions] = useState<ExamSessionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<ExamSessionRecord | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchExamSessions(search);
      setSessions(data);
    } catch {
      setError("Gagal memuat data hasil ujian.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalParticipants = sessions.length;
  const passedCount = sessions.filter((s) => s.passed).length;
  const avgScore =
    totalParticipants > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / totalParticipants * 100) / 100
      : 0;

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
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <h1 className="flex-1 text-base font-bold text-white">Hasil Ujian</h1>
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition-all active:scale-95 hover:bg-blue-50"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {/* Stats summary */}
        {!loading && sessions.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatCard
              icon={<User className="h-5 w-5 text-blue-600" />}
              value={totalParticipants}
              label="Peserta"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Trophy className="h-5 w-5 text-amber-600" />}
              value={formatScore(avgScore)}
              label="Rata-rata"
              bg="bg-amber-50"
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-emerald-600" />}
              value={`${passedCount}/${totalParticipants}`}
              label="Lulus"
              bg="bg-emerald-50"
            />
          </div>
        )}

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

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-slate-200/60">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Belum ada hasil ujian</p>
            <p className="mt-1 text-xs text-slate-400">Hasil akan muncul setelah peserta menyelesaikan ujian.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const scoreColor =
                s.score >= PASSING_SCORE
                  ? "text-emerald-600"
                  : s.score >= 50
                  ? "text-amber-600"
                  : "text-red-600";

              return (
                <button
                  key={s.id}
                  onClick={() => setDetail(s)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/60 transition-all hover:ring-blue-300 hover:shadow-md active:scale-[0.99]"
                >
                  {/* Score circle */}
                  <div
                    className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl ${
                      s.passed ? "bg-emerald-50" : "bg-slate-100"
                    }`}
                  >
                    <span className={`text-lg font-extrabold tabular-nums ${scoreColor}`}>
                      {formatScore(s.score)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase text-slate-400">Skor</span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                      {s.class && (
                        <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {s.class}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-600">{s.participant_code}</span>
                      <span className="text-slate-300">|</span>
                      <span className="truncate">{s.school}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {s.correct} Benar
                      </span>
                      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                        <XCircle className="h-3 w-3" /> {s.wrong} Salah
                      </span>
                      {s.unanswered > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium text-slate-400">
                          <Minus className="h-3 w-3" /> {s.unanswered} Kosong
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pass/fail badge */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        s.passed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {s.passed ? "Lulus" : "Belum"}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(s.time_used_seconds)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <ResultDetail session={detail} onClose={() => setDetail(null)} />
      )}

      {/* Print modal */}
      {showPrint && (
        <PrintModal sessions={sessions} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}

function PrintModal({
  sessions,
  onClose,
}: {
  sessions: ExamSessionRecord[];
  onClose: () => void;
}) {
  const uniqueSchools = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(s.school));
    return Array.from(set).sort();
  }, [sessions]);

  const [selectedSchool, setSelectedSchool] = useState("ALL");

  const filteredSessions = useMemo(() => {
    if (selectedSchool === "ALL") return sessions;
    return sessions.filter((s) => s.school === selectedSchool);
  }, [sessions, selectedSchool]);

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const rows = filteredSessions
      .sort((a, b) => b.score - a.score)
      .map((s, i) => {
        const status = s.passed ? "LULUS" : "BELUM LULUS";
        const statusColor = s.passed ? "#059669" : "#dc2626";
        return `<tr>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;">${i + 1}</td>
          <td style="padding:8px 6px;border:1px solid #ddd;font-weight:600;">${s.name}</td>
          <td style="padding:8px 6px;border:1px solid #ddd;">${s.school}</td>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;">${s.class || "-"}</td>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;font-weight:700;">${s.score.toFixed(2).replace(".", ",")}</td>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;">${s.correct}</td>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;">${s.wrong}</td>
          <td style="text-align:center;padding:8px 6px;border:1px solid #ddd;color:${statusColor};font-weight:700;">${status}</td>
        </tr>`;
      })
      .join("");

    const title = selectedSchool === "ALL" ? "Semua Sekolah" : selectedSchool;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Hasil Ujian - ${title}</title>
<style>
  * { font-family: Arial, Helvetica, sans-serif; }
  body { padding: 24px; color: #1e293b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 0 0 20px; color: #64748b; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1e40af; color: white; padding: 10px 6px; border: 1px solid #1e40af; text-align: center; font-weight: 600; }
  td { font-size: 13px; }
  tr:nth-child(even) { background: #f8fafc; }
  .summary { margin-bottom: 16px; display: flex; gap: 24px; font-size: 13px; }
  .summary span { font-weight: 600; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <h1>Hasil Try Out TKA 1</h1>
  <h2>${title} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
  <div class="summary">
    <div>Total Peserta: <span>${filteredSessions.length}</span></div>
    <div>Lulus: <span>${filteredSessions.filter((s) => s.passed).length}</span></div>
    <div>Rata-rata: <span>${filteredSessions.length > 0 ? (filteredSessions.reduce((sum, s) => sum + s.score, 0) / filteredSessions.length).toFixed(2).replace(".", ",") : "0,00"}</span></div>
    <div>KKM: <span>${PASSING_SCORE}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama</th>
        <th>Asal Sekolah</th>
        <th>Kelas</th>
        <th>Skor</th>
        <th>Benar</th>
        <th>Salah</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Print Hasil Ujian</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filter Berdasarkan Sekolah
          </label>
          <div className="relative">
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm text-slate-800 transition-colors outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Sekolah</option>
              {uniqueSchools.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{selectedSchool === "ALL" ? sessions.length : filteredSessions.length}</span> peserta akan dicetak
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors active:scale-[0.98] hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultDetail({
  session,
  onClose,
}: {
  session: ExamSessionRecord;
  onClose: () => void;
}) {
  const participantAnswers = session.answers || {};
  const passed = session.passed;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-0 sm:p-4">
      <div className="min-h-screen w-full max-w-2xl bg-slate-50 sm:min-h-0 sm:rounded-3xl sm:my-4">
        {/* Detail header */}
        <div
          className={`sticky top-0 z-10 flex items-center gap-3 px-5 py-4 text-white ${
            passed
              ? "bg-gradient-to-r from-emerald-600 to-teal-700"
              : "bg-gradient-to-r from-slate-700 to-slate-900"
          } sm:rounded-t-3xl`}
        >
          <button
            onClick={onClose}
            className="rounded-xl bg-white/15 p-2 transition-colors active:scale-95 hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="flex-1 text-base font-bold">Detail Hasil Peserta</h2>
        </div>

        <div className="px-5 py-5">
          {/* Identity card */}
          <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            <div className="divide-y divide-slate-100">
              <DetailRow icon={<User className="h-4 w-4 text-blue-500" />} label="Nama" value={session.name} />
              <DetailRow icon={<School className="h-4 w-4 text-blue-500" />} label="Asal Sekolah" value={session.school} />
              <DetailRow icon={<Hash className="h-4 w-4 text-blue-500" />} label="Kode Peserta" value={session.participant_code} mono />
              <DetailRow icon={<Clock className="h-4 w-4 text-blue-500" />} label="Waktu Pengerjaan" value={formatTime(session.time_used_seconds)} />
            </div>
          </div>

          {/* Score summary */}
          <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            <div
              className={`flex flex-col items-center px-6 py-6 text-white ${
                passed
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-slate-600 to-slate-800"
              }`}
            >
              <Trophy className={`mb-2 h-8 w-8 ${passed ? "text-amber-300" : "text-slate-300"}`} />
              <p className="text-xs font-medium text-white/80">Skor Akhir</p>
              <p className="my-0.5 text-4xl font-extrabold tabular-nums">{formatScore(session.score)}</p>
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                {passed ? "LULUS" : "BELUM LULUS"} (KKM: {PASSING_SCORE})
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <DetailStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} value={session.correct} label="Benar" color="text-emerald-600" />
              <DetailStat icon={<XCircle className="h-4 w-4 text-red-500" />} value={session.wrong} label="Salah" color="text-red-600" />
              <DetailStat icon={<Minus className="h-4 w-4 text-slate-400" />} value={session.unanswered} label="Kosong" color="text-slate-600" />
            </div>
          </div>

          {/* Per-question breakdown */}
          <h3 className="mb-3 text-sm font-bold text-slate-700">Rincian Jawaban per Soal</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const participantChoice = participantAnswers[String(q.id)] as string | undefined;
              const isCorrect = participantChoice === q.answer;
              const isUnanswered = !participantChoice;

              return (
                <QuestionReview
                  key={q.id}
                  question={q}
                  index={idx}
                  participantChoice={participantChoice}
                  isCorrect={isCorrect}
                  isUnanswered={isUnanswered}
                />
              );
            })}
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

function QuestionReview({
  question,
  index,
  participantChoice,
  isCorrect,
  isUnanswered,
}: {
  question: Question;
  index: number;
  participantChoice: string | undefined;
  isCorrect: boolean;
  isUnanswered: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const choices = ["A", "B", "C", "D", "E"] as const;

  const borderColor = isUnanswered
    ? "border-slate-200"
    : isCorrect
    ? "border-emerald-300"
    : "border-red-300";

  const bgColor = isUnanswered
    ? "bg-white"
    : isCorrect
    ? "bg-emerald-50/50"
    : "bg-red-50/40";

  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} shadow-sm transition-all`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isUnanswered
              ? "bg-slate-100 text-slate-400"
              : isCorrect
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isUnanswered ? (
            <Minus className="h-4 w-4" />
          ) : isCorrect ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500">Soal {index + 1}</p>
          <p className="truncate text-sm text-slate-700">{question.question}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
          {isUnanswered ? (
            <span className="font-medium text-slate-400">Tidak dijawab</span>
          ) : (
            <span className="font-mono font-semibold text-slate-600">
              Jawaban: <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>{participantChoice}</span>
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-3 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pilihan Jawaban</p>
          <div className="space-y-1.5">
            {choices.map((c) => {
              const isRightAnswer = c === question.answer;
              const isParticipantChoice = c === participantChoice;

              return (
                <div
                  key={c}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isRightAnswer
                      ? "bg-emerald-100/70"
                      : isParticipantChoice && !isRightAnswer
                      ? "bg-red-100/70"
                      : "bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                      isRightAnswer
                        ? "bg-emerald-500 text-white"
                        : isParticipantChoice && !isRightAnswer
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {c}
                  </span>
                  <span className="flex-1 text-slate-700">{question.choices[c]}</span>
                  {isRightAnswer && (
                    <span className="flex flex-shrink-0 items-center gap-0.5 text-[10px] font-bold uppercase text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Kunci
                    </span>
                  )}
                  {isParticipantChoice && !isRightAnswer && (
                    <span className="flex flex-shrink-0 items-center gap-0.5 text-[10px] font-bold uppercase text-red-500">
                      <XCircle className="h-3 w-3" /> Jawaban peserta
                    </span>
                  )}
                  {isParticipantChoice && isRightAnswer && (
                    <span className="flex flex-shrink-0 items-center gap-0.5 text-[10px] font-bold uppercase text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Jawaban peserta
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  bg,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl ${bg} p-4 text-center`}>
      <div className="mb-1.5 flex justify-center">{icon}</div>
      <p className="text-xl font-extrabold tabular-nums text-slate-800">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono tracking-wider" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {icon}
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
