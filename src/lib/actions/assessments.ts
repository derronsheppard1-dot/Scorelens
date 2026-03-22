"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalInt(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createAssessment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const classId = getString(formData, "classId");
  const timeLimitMinutes = getOptionalInt(formData, "timeLimitMinutes");

  if (!title) {
    redirect("/dashboard/assessments/create?error=Title is required");
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      teacher_id: user.id,
      title,
      description: description || null,
      class_id: classId || null,
      time_limit_minutes: timeLimitMinutes,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/dashboard/assessments/create?error=${encodeURIComponent(
        error?.message || "Failed to create assessment"
      )}`
    );
  }

  redirect(`/dashboard/assessments/${data.id}`);
}

export async function addQuestion(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const assessmentId = getString(formData, "assessmentId");
  const questionText = getString(formData, "questionText");
  const optionA = getString(formData, "optionA");
  const optionB = getString(formData, "optionB");
  const optionC = getString(formData, "optionC");
  const optionD = getString(formData, "optionD");
  const correctOption = getString(formData, "correctOption").toUpperCase();
  const marks = getOptionalInt(formData, "marks") ?? 1;

  if (!assessmentId) {
    redirect("/dashboard/assessments?error=Missing assessment id");
  }

  if (!questionText || !optionA || !optionB || !optionC || !optionD) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=Please complete all question fields`
    );
  }

  if (!["A", "B", "C", "D"].includes(correctOption)) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=Correct option must be A, B, C, or D`
    );
  }

  if (marks <= 0) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=Marks must be greater than zero`
    );
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("teacher_id", user.id)
    .single();

  if (assessmentError || !assessment) {
    redirect("/dashboard/assessments?error=Assessment not found");
  }

  const { data: existingQuestions, error: existingQuestionsError } =
    await supabase
      .from("assessment_questions")
      .select("position")
      .eq("assessment_id", assessmentId)
      .eq("teacher_id", user.id)
      .order("position", { ascending: true });

  if (existingQuestionsError) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        existingQuestionsError.message
      )}`
    );
  }

  const nextPosition = (existingQuestions?.length ?? 0) + 1;

  const { error } = await supabase.from("assessment_questions").insert({
    assessment_id: assessmentId,
    teacher_id: user.id,
    position: nextPosition,
    question_text: questionText,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_option: correctOption,
    marks,
  });

  if (error) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/dashboard/assessments/${assessmentId}`);
}