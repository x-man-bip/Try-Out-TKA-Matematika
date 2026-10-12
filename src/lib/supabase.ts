import { createClient } from "@supabase/supabase-js";
import type { Question, QuestionType } from "@/types";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const CLASS_OPTIONS = ["9A", "9B", "9C", "9D", "9E", "9F", "9G", "9H", "9I", "9J"];

// ─── Exam Session ───

export interface ExamSession {
  participant_code: string;
  name: string;
  school: string;
  class: string;
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  time_used_seconds: number;
  passed: boolean;
  answers?: Record<string, string>;
}

export async function saveExamSession(session: ExamSession): Promise<void> {
  const { error } = await supabase.from("exam_sessions").insert(session);
  if (error) throw error;
}

export interface ExamSessionRecord {
  id: string;
  participant_code: string;
  name: string;
  school: string;
  class: string | null;
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  time_used_seconds: number;
  passed: boolean;
  answers: Record<string, string> | null;
  created_at: string;
}

export async function fetchExamSessions(search?: string): Promise<ExamSessionRecord[]> {
  let query = supabase
    .from("exam_sessions")
    .select("id, participant_code, name, school, class, score, correct, wrong, unanswered, time_used_seconds, passed, answers, created_at")
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`participant_code.ilike.%${s}%,name.ilike.%${s}%,school.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ExamSessionRecord[];
}

// ─── Participants ───

export interface ParticipantRecord {
  code: string;
  name: string;
  school: string;
  class: string;
  exam_started_at: string | null;
}

export async function verifyParticipant(
  code: string,
  name: string,
  school: string,
  cls: string
): Promise<ParticipantRecord | null> {
  const { data, error } = await supabase
    .from("participants")
    .select("code, name, school, class, exam_started_at")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (
    data.name.toLowerCase().trim() !== name.toLowerCase().trim() ||
    data.school.toLowerCase().trim() !== school.toLowerCase().trim() ||
    (data.class && data.class.toLowerCase().trim() !== cls.toLowerCase().trim())
  ) {
    return null;
  }

  return {
    code: data.code,
    name: data.name,
    school: data.school,
    class: data.class || "",
    exam_started_at: data.exam_started_at,
  };
}

export async function markExamStarted(code: string): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({ exam_started_at: new Date().toISOString() })
    .eq("code", code.toUpperCase().trim());

  if (error) throw error;
}

export interface AdminParticipant {
  id: number;
  code: string;
  name: string;
  school: string;
  class: string | null;
  exam_started_at: string | null;
}

export async function fetchParticipants(search?: string): Promise<AdminParticipant[]> {
  let query = supabase
    .from("participants")
    .select("id, code, name, school, class, exam_started_at")
    .order("code", { ascending: true });

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`code.ilike.%${s}%,name.ilike.%${s}%,school.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AdminParticipant[];
}

export async function addParticipant(
  code: string,
  name: string,
  school: string,
  cls: string
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .insert({ code: code.toUpperCase().trim(), name: name.trim(), school: school.trim(), class: cls });
  if (error) throw error;
}

export async function updateParticipant(
  id: number,
  updates: { name?: string; school?: string; code?: string; class?: string }
): Promise<void> {
  const payload: Record<string, string> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.school !== undefined) payload.school = updates.school.trim();
  if (updates.code !== undefined) payload.code = updates.code.toUpperCase().trim();
  if (updates.class !== undefined) payload.class = updates.class;

  const { error } = await supabase.from("participants").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteParticipant(id: number): Promise<void> {
  const { error } = await supabase.from("participants").delete().eq("id", id);
  if (error) throw error;
}

export async function generateNextParticipantCode(): Promise<string> {
  const { data, error } = await supabase
    .from("participants")
    .select("code")
    .like("code", "PES%")
    .order("code", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return "PES001";

  const match = data.code.match(/PES(\d+)/);
  if (!match) return "PES001";
  const nextNum = parseInt(match[1], 10) + 1;
  return "PES" + String(nextNum).padStart(3, "0");
}

// ─── Exam Questions (Admin CRUD) ───

export interface QuestionDB {
  id: number;
  question_type: QuestionType;
  subject: string;
  question: string;
  image_url: string | null;
  choices: Record<string, string>;
  answer: string;
  sort_order: number;
  created_at: string;
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("exam_questions")
    .select("id, question_type, subject, question, image_url, choices, answer, sort_order, created_at")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as QuestionDB[]).map((q) => ({
    id: q.id,
    question_type: q.question_type,
    subject: q.subject,
    question: q.question,
    image_url: q.image_url,
    choices: q.choices,
    answer: q.answer,
  }));
}

export async function insertQuestion(q: Omit<QuestionDB, "id" | "created_at">): Promise<void> {
  const { error } = await supabase.from("exam_questions").insert(q);
  if (error) throw error;
}

export async function updateQuestion(
  id: number,
  updates: Partial<Omit<QuestionDB, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase.from("exam_questions").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: number): Promise<void> {
  const { error } = await supabase.from("exam_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadQuestionImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("question-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("question-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteQuestionImage(url: string): Promise<void> {
  try {
    const path = url.split("/question-images/")[1];
    if (!path) return;
    await supabase.storage.from("question-images").remove([path]);
  } catch {
    // ignore
  }
}

// ─── Exam Settings ───

export interface ExamSettings {
  duration_minutes: number;
  passing_score: number;
}

export async function fetchExamSettings(): Promise<ExamSettings> {
  const { data, error } = await supabase
    .from("exam_settings")
    .select("duration_minutes, passing_score")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { duration_minutes: 90, passing_score: 70 };
  return data as ExamSettings;
}

export async function updateExamSettings(settings: ExamSettings): Promise<void> {
  const { error } = await supabase
    .from("exam_settings")
    .upsert({ id: 1, ...settings });
  if (error) throw error;
}
