import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Grid3x3, Flag, User } from "lucide-react";
import type { Answers, ExamState, Participant, Question } from "@/types";
import {
  fetchQuestions,
  fetchExamSettings,
  markExamStarted,
  type ExamSettings,
} from "@/lib/supabase";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { shuffleQuestions } from "@/utils/shuffle";
import { RegisterScreen } from "@/components/RegisterScreen";
import { Timer } from "@/components/Timer";
import { QuestionCard } from "@/components/QuestionCard";
import { NavMap } from "@/components/NavMap";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ResultScreen } from "@/components/ResultScreen";
import { AdminScreen } from "@/components/AdminScreen";
import { AdminLogin } from "@/components/AdminLogin";

export default function App() {
  const [examState, setExamState] = useState<ExamState>("register");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showNav, setShowNav] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [finalTimeUsed, setFinalTimeUsed] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<ExamSettings>({ duration_minutes: 90, passing_score: 70 });
  const [loadingExam, setLoadingExam] = useState(true);
  const secondsLeftRef = useRef(0);
  const markedStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [q, s] = await Promise.all([fetchQuestions(), fetchExamSettings()]);
        if (cancelled) return;
        setQuestions(q);
        setSettings(s);
      } catch {
        // keep defaults if DB unavailable
      } finally {
        if (!cancelled) setLoadingExam(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const TOTAL_SECONDS = settings.duration_minutes * 60;

  useEffect(() => {
    function checkHash() {
      const isAdmin = window.location.hash === "#admin";
      setShowAdmin(isAdmin);
      if (isAdmin) {
        setAdminAuthed(sessionStorage.getItem("admin_auth") === "true");
      } else {
        setAdminAuthed(false);
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const shuffledQuestions = useMemo(() => {
    if (!participant) return questions;
    return shuffleQuestions(questions, participant.code);
  }, [participant, questions]);

  const finishExam = () => {
    setFinalTimeUsed(TOTAL_SECONDS - secondsLeftRef.current);
    setShowConfirm(false);
    setExamState("result");
  };

  const { secondsLeft } = useCountdownTimer({
    totalSeconds: TOTAL_SECONDS,
    running: examState === "exam",
    onExpire: finishExam,
  });

  secondsLeftRef.current = secondsLeft;

  const handleViolation = (reason: string) => {
    setViolationMsg(reason);
    finishExam();
  };

  useAntiCheat({
    enabled: examState === "exam",
    onViolate: handleViolation,
  });

  useEffect(() => {
    const lock = showNav || showConfirm;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showNav, showConfirm]);

  const handleStart = (name: string, school: string, code: string, cls: string) => {
    setParticipant({ name, school, code, class: cls });
    setExamState("exam");
    setCurrentIndex(0);
    setAnswers({});
    setFinalTimeUsed(0);
    setViolationMsg("");

    if (!markedStartedRef.current) {
      markedStartedRef.current = true;
      markExamStarted(code).catch(() => {});
    }
  };

  const handleAnswer = (questionId: number, choice: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const goNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const jumpTo = (index: number) => {
    setCurrentIndex(index);
    setShowNav(false);
  };

  if (showAdmin) {
    if (!adminAuthed) {
      return (
        <AdminLogin
          onLogin={() => setAdminAuthed(true)}
          onBack={() => { window.location.hash = ""; setShowAdmin(false); }}
        />
      );
    }
    return (
      <AdminScreen
        onBack={() => {
          sessionStorage.removeItem("admin_auth");
          window.location.hash = "";
          setAdminAuthed(false);
          setShowAdmin(false);
        }}
      />
    );
  }

  if (loadingExam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat soal ujian...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/60">
          <p className="text-base font-bold text-slate-800">Belum ada soal</p>
          <p className="mt-1 text-sm text-slate-500">
            Admin belum menambahkan soal ujian. Hubungi panitia untuk menambahkan soal melalui panel admin.
          </p>
        </div>
      </div>
    );
  }

  if (examState === "register") {
    return (
      <RegisterScreen
        totalQuestions={questions.length}
        durationMinutes={settings.duration_minutes}
        passingScore={settings.passing_score}
        onStart={handleStart}
      />
    );
  }

  if (examState === "result") {
    return (
      <ResultScreen
        questions={shuffledQuestions}
        answers={answers}
        timeUsed={finalTimeUsed}
        passingScore={settings.passing_score}
        participant={participant!}
        violationMsg={violationMsg}
      />
    );
  }

  const q = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[Number(k)];
    return v && v.length > 0;
  }).length;
  const isLast = currentIndex === shuffledQuestions.length - 1;

  return (
    <div className="min-h-screen bg-slate-100 exam-protected">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 to-blue-800 shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 flex-shrink-0 text-blue-300" />
              <span className="truncate text-xs font-medium text-blue-200">
                {participant?.name} — {participant?.code}
              </span>
            </div>
            <Timer secondsLeft={secondsLeft} totalSeconds={TOTAL_SECONDS} />
          </div>
          <button
            onClick={() => setShowNav(true)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors active:scale-95 hover:bg-white/25"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Peta Soal</span>
            <span className="rounded-md bg-white/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">
              {answeredCount}/{shuffledQuestions.length}
            </span>
          </button>
        </div>
      </header>

      <div className="bg-amber-500/10 border-b border-amber-300/30 px-4 py-2 text-center">
        <p className="text-xs font-medium text-amber-700">
          Dilarang berpindah tab, screenshot, atau membuka aplikasi lain. Ujian akan otomatis selesai.
        </p>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}
          />
        </div>
        <QuestionCard
          question={q}
          index={currentIndex}
          total={shuffledQuestions.length}
          answers={answers}
          onAnswer={handleAnswer}
        />
      </main>

      <nav className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all active:scale-95 disabled:opacity-40 enabled:hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-red-600"
          >
            <Flag className="h-4 w-4" />
            Selesai
          </button>
          {isLast ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all active:scale-95 hover:bg-slate-50"
            >
              <span className="hidden sm:inline">Selesai</span>
              <Flag className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-blue-700"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </nav>

      {showNav && (
        <NavMap
          questions={shuffledQuestions}
          currentIndex={currentIndex}
          answers={answers}
          onJump={jumpTo}
          onClose={() => setShowNav(false)}
        />
      )}
      {showConfirm && (
        <ConfirmDialog
          answeredCount={answeredCount}
          total={shuffledQuestions.length}
          onConfirm={finishExam}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
