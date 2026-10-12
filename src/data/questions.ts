import type { Choice, Question } from "@/types";
import examData from "@/data/exam-questions.json";

/**
 * ============================================================
 *  CARA MENGUPLOAD / MENGGANTI SOAL UJIAN
 * ============================================================
 *
 *  1. Buka file:  src/data/exam-questions.json
 *
 *  2. Edit atau ganti isinya. Format setiap soal:
 *
 *     {
 *       "id": 1,                          ← nomor urut soal (wajib unik)
 *       "subject": "Matematika",          ← mata pelajaran / kategori
 *       "question": "Teks pertanyaan ...",← isi soal
 *       "choices": {                      ← 5 pilihan jawaban (A-E), wajib semua
 *         "A": "Pilihan A",
 *         "B": "Pilihan B",
 *         "C": "Pilihan C",
 *         "D": "Pilihan D",
 *         "E": "Pilihan E"
 *       },
 *       "answer": "B"                     ← kunci jawaban: "A" | "B" | "C" | "D" | "E"
 *     }
 *
 *  3. Pengaturan ujian (di bagian atas file JSON):
 *
 *     "durationMinutes": 90   ← durasi ujian dalam menit
 *     "passingScore": 70      ← batas minimal skor lulus (0-100)
 *
 *  4. Simpan file. Soal langsung tersedia saat aplikasi dibuka.
 *
 *  ATURAN:
 *  - Setiap soal WAJIB punya: id, subject, question, choices (A-E), answer.
 *  - "answer" harus salah satu dari: "A", "B", "C", "D", "E".
 *  - "id" harus unik (tidak boleh ada nomor ganda).
 *  - Tidak boleh ada koma di belakang entri terakhir (sintaks JSON standar).
 *
 *  Template soal kosong tersedia di: src/data/exam-template.json
 * ============================================================
 */

export const EXAM_DURATION_MINUTES: number = examData.durationMinutes;
export const PASSING_SCORE: number = examData.passingScore;

function isChoice(value: string): value is Choice {
  return ["A", "B", "C", "D", "E"].includes(value);
}

export const questions: Question[] = examData.questions.map((q) => {
  if (!isChoice(q.answer)) {
    throw new Error(
      `Soal #${q.id}: kunci jawaban "${q.answer}" tidak valid. Harus salah satu dari A, B, C, D, E.`
    );
  }
  return {
    id: q.id,
    subject: q.subject,
    question: q.question,
    choices: q.choices as Record<Choice, string>,
    answer: q.answer,
  };
});
