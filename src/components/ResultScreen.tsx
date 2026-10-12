import { useEffect, useState } from "react";
import { Trophy, CheckCircle2, XCircle, Clock, User, School, Hash, Copy, Check } from "lucide-react";
import type { Question, Answers, Participant } from "@/types";
import { formatScore } from "@/types";
import { formatTime } from "@/utils/formatTime";
import { saveExamSession } from "@/lib/supabase";

interface ResultScreenProps {
  questions: Question[];
  answers: Answers;
  timeUsed: number;
  passingScore: number;
  participant: Participant;
  violationMsg?: string;
}

export function ResultScreen({
  questions,
  answers,
  timeUsed,
  passingScore,
  participant,
  violationMsg,
}: ResultScreenProps) {
  const total = questions.length;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const a = answers[q.id];
    if (!a) {
      unanswered++;
    } else {
      const correctSet = new Set(q.answer.split(",").map((s) => s.trim()).filter(Boolean));
      const answerSet = new Set(a.split(",").map((s) => s.trim()).filter(Boolean));
      const sameSize = correctSet.size === answerSet.size;
      const allMatch = sameSize && Array.from(answerSet).every((v) => correctSet.has(v));
      if (allMatch) correct++;
      else wrong++;
    }
  });

  const score = Math.round((correct / total) * 10000) / 100;
  const passed = score >= passingScore;

  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    saveExamSession({
      participant_code: participant.code,
      name: participant.name,
      school: participant.school,
      class: participant.class,
      score,
      correct,
      wrong,
      unanswered,
      time_used_seconds: timeUsed,
      passed,
      answers: answers as Record<string, string>,
    }).catch(() => {
      // Simpan gagal (offline) — tetap tampilkan hasil
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopyCode() {
    navigator.clipboard.writeText(participant.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-6">

        {/* Kartu identitas peserta */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Identitas Peserta
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 px-5 py-3">
              <User className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama</p>
                <p className="text-sm font-semibold text-slate-800">{participant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <School className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Asal Sekolah</p>
                <p className="text-sm font-semibold text-slate-800">{participant.school}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kode Peserta</p>
                  <p className="font-mono text-base font-bold tracking-widest text-blue-700">
                    {participant.code}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all active:scale-95 hover:bg-blue-100"
              >
                {codeCopied ? (
                  <><Check className="h-3.5 w-3.5" /> Tersalin</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Salin</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Score card */}
        <div className="mb-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div
            className={`flex flex-col items-center px-6 py-8 text-white ${
              passed
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-gradient-to-br from-slate-600 to-slate-800"
            }`}
          >
            <Trophy className={`mb-3 h-12 w-12 ${passed ? "text-amber-300" : "text-slate-300"}`} />
            <p className="text-sm font-medium text-white/80">Skor Akhir</p>
            <p className="my-1 text-6xl font-extrabold tabular-nums">{formatScore(score)}</p>
            <p className="rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
              {passed ? "LULUS" : "BELUM LULUS"}
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <Stat
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              value={correct}
              label="Benar"
              color="text-emerald-600"
            />
            <Stat
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              value={wrong}
              label="Salah"
              color="text-red-600"
            />
            <Stat
              icon={<Clock className="h-5 w-5 text-slate-400" />}
              value={formatTime(timeUsed)}
              label="Waktu"
              color="text-slate-600"
              small
            />
          </div>
        </div>

        {unanswered > 0 && (
          <div className="mb-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <p className="font-semibold">{unanswered} soal tidak dijawab</p>
            <p className="mt-0.5 text-amber-700">Soal yang tidak dijawab dihitung sebagai jawaban salah.</p>
          </div>
        )}

        {/* Violation notice */}
        {violationMsg && (
          <div className="mb-4 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-800 ring-1 ring-red-200">
            <p className="font-semibold">Ujian dihentikan otomatis</p>
            <p className="mt-0.5 text-red-700">{violationMsg}. Dilarang berpindah tab atau membuka aplikasi lain selama ujian berlangsung.</p>
          </div>
        )}

        {/* Info: ujian selesai */}
        <div className="mb-4 rounded-2xl bg-blue-50 px-5 py-4 text-sm text-blue-800 ring-1 ring-blue-200">
          <p className="font-semibold">Ujian telah selesai</p>
          <p className="mt-0.5 text-blue-700">Anda hanya dapat mengerjakan ujian satu kali. Hasil Anda telah tersimpan.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
  small,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {icon}
      <p className={`font-bold tabular-nums ${small ? "text-lg" : "text-2xl"} ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
