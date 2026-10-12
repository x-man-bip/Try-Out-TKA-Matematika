import { Check } from "lucide-react";
import type { Question, Answers } from "@/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  answers: Answers;
  onAnswer: (questionId: number, choice: string) => void;
}

export function QuestionCard({
  question,
  index,
  total,
  answers,
  onAnswer,
}: QuestionCardProps) {
  const selected = answers[question.id] || "";
  const selectedSet = new Set(selected.split(",").filter(Boolean));

  const isMultiple = question.question_type === "multiple-choice";
  const isTrueFalse = question.question_type === "true-false";

  const choiceKeys = isTrueFalse ? ["A", "B"] : Object.keys(question.choices).sort();

  function handleClick(key: string) {
    if (isMultiple) {
      const next = new Set(selectedSet);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onAnswer(question.id, Array.from(next).sort().join(","));
    } else {
      onAnswer(question.id, key);
    }
  }

  const typeLabel = isMultiple
    ? "Pilih semua jawaban yang benar"
    : isTrueFalse
    ? "Pilih Benar atau Salah"
    : "Pilih satu jawaban";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {question.subject}
        </span>
        <span className="text-sm font-medium text-slate-400">
          {index + 1} / {total}
        </span>
      </div>

      <p className="mb-2 text-xs font-medium text-blue-600">{typeLabel}</p>

      <div
        className="mb-5 text-[15px] leading-relaxed text-slate-800 sm:text-base [&_b]:font-semibold"
        dangerouslySetInnerHTML={{ __html: question.question }}
      />

      {question.image_url && (
        <div className="mb-5 overflow-hidden rounded-xl ring-1 ring-slate-200">
          <img
            src={question.image_url}
            alt="Gambar soal"
            className="max-h-80 w-full object-contain bg-slate-50"
          />
        </div>
      )}

      <div className="space-y-2.5">
        {choiceKeys.map((letter) => {
          const isSelected = selectedSet.has(letter);
          const label = question.choices[letter] || (isTrueFalse && letter === "A" ? "Benar" : isTrueFalse && letter === "B" ? "Salah" : letter);
          return (
            <button
              key={letter}
              onClick={() => handleClick(letter)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isSelected ? <Check className="h-4 w-4" /> : letter}
              </span>
              <span
                className={`text-[15px] leading-snug sm:text-base ${
                  isSelected ? "font-medium text-blue-900" : "text-slate-700"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
