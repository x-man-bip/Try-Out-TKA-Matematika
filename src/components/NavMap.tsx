import type { Answers, Question } from "@/types";

interface NavMapProps {
  questions: Question[];
  currentIndex: number;
  answers: Answers;
  onJump: (index: number) => void;
  onClose: () => void;
}

export function NavMap({
  questions,
  currentIndex,
  answers,
  onJump,
  onClose,
}: NavMapProps) {
  const total = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[Number(k)];
    return v && v.length > 0;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Navigasi Soal</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 active:scale-95"
          >
            Tutup
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-3.5 w-3.5 rounded-md bg-blue-600" /> Aktif
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-3.5 w-3.5 rounded-md bg-emerald-500" /> Terjawab
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-3.5 w-3.5 rounded-md border-2 border-slate-300 bg-white" />
            Belum
          </span>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Terjawab: <span className="font-semibold text-emerald-600">{answeredCount}</span> / {total}
        </p>

        <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8">
          {Array.from({ length: total }, (_, i) => {
            const qid = questions[i].id;
            const answered = !!answers[qid];
            const isCurrent = i === currentIndex;
            return (
              <button
                key={i}
                onClick={() => onJump(i)}
                className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  isCurrent
                    ? "bg-blue-600 text-white ring-2 ring-blue-600/30"
                    : answered
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 bg-white text-slate-500"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
