import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  answeredCount: number;
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  answeredCount,
  total,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const unanswered = total - answeredCount;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[popIn_0.2s_ease-out]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>

        <h2 className="mb-2 text-center text-lg font-bold text-slate-800">
          Selesai Ujian?
        </h2>
        <p className="mb-4 text-center text-sm leading-relaxed text-slate-500">
          Anda telah menjawab <span className="font-semibold text-emerald-600">{answeredCount}</span> dari {total} soal.
          {unanswered > 0 && (
            <span className="font-semibold text-amber-600">
              {" "}Masih ada {unanswered} soal yang belum dijawab.
            </span>
          )}
          <br />
          Setelah selesai, Anda tidak dapat kembali mengubah jawaban.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors active:scale-[0.98] hover:bg-slate-50"
          >
            Lanjut Ujian
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors active:scale-[0.98] hover:bg-red-600"
          >
            Ya, Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
