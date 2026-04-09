"use server";

import { revalidatePath } from "next/cache";
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

type JoinedMarksRow = {
  question_id: string;
  questions:
    | { marks: number | null }
    | { marks: number | null }[]
    | null;
};

type JoinedAssessmentTeacherRow = {
  id: string;
  teacher_id: string;
};

type AssessmentLinkRow = {
  id: string;
  position: number;
  question_id: string;
  assessments:
    | JoinedAssessmentTeacherRow
    | JoinedAssessmentTeacherRow[]
    | null;
};

function extractMarks(
  value: { marks: number | null } | { marks: number | null }[] | null
): number {
  if (!value) return 0;
  if (Array.isArray(value)) {
    return value[0]?.marks ?? 0;
  }
  return value.marks ?? 0;
}

function extractTeacherId(
  value:
    | JoinedAssessmentTeacherRow
    | JoinedAssessmentTeacherRow[]
    | null
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0]?.teacher_id ?? null;
  }
  return value.teacher_id ?? null;
}

async function recalculateAssessmentTotalMarks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assessmentId: string,
  teacherId: string
) {
  const { data, error } = await supabase
    .from("assessment_questions")
    .select(`
      question_id,
      questions (
        marks
      )
    `)
    .eq("assessment_id", assessmentId)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  const totalMarks = ((data ?? []) as JoinedMarksRow[]).reduce((sum, row) => {
    return sum + extractMarks(row.questions);
  }, 0);

  const { error: updateAssessmentError } = await supabase
    .from("assessments")
    .update({ total_marks: totalMarks })
    .eq("id", assessmentId)
    .eq("teacher_id", teacherId);

  if (updateAssessmentError) {
    return { error: updateAssessmentError.message };
  }

  return { error: null };
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
    redirect(
      `/dashboard/assessments/create?error=${encodeURIComponent(
        "Title is required"
      )}`
    );
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
  const subject = getString(formData, "subject");
  const topic = getString(formData, "topic");
  const level = getString(formData, "level");

  if (!assessmentId) {
    redirect("/dashboard/assessments?error=Missing%20assessment%20id");
  }

  if (!questionText || !optionA || !optionB || !optionC || !optionD) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        "Please complete all question fields"
      )}`
    );
  }

  if (!correctOption) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        "Please select the correct answer"
      )}`
    );
  }

  if (!["A", "B", "C", "D"].includes(correctOption)) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        "Correct option must be A, B, C, or D"
      )}`
    );
  }

  if (marks <= 0) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        "Marks must be greater than zero"
      )}`
    );
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("teacher_id", user.id)
    .single();

  if (assessmentError || !assessment) {
    redirect(
      `/dashboard/assessments?error=${encodeURIComponent(
        "Assessment not found"
      )}`
    );
  }

  const { data: existingQuestions, error: existingQuestionsError } =
    await supabase
      .from("assessment_questions")
      .select("position")
      .eq("assessment_id", assessmentId)
      .order("position", { ascending: true });

  if (existingQuestionsError) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        existingQuestionsError.message
      )}`
    );
  }

  const nextPosition = (existingQuestions?.length ?? 0) + 1;

  const { data: createdQuestion, error: insertQuestionError } = await supabase
    .from("questions")
    .insert({
      teacher_id: user.id,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      marks,
      subject: subject || null,
      topic: topic || null,
      level: level || null,
    })
    .select("id")
    .single();

  if (insertQuestionError || !createdQuestion) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        insertQuestionError?.message || "Failed to create question"
      )}`
    );
  }

  const { error: attachError } = await supabase
    .from("assessment_questions")
    .insert({
      assessment_id: assessmentId,
      question_id: createdQuestion.id,
      position: nextPosition,
    });

  if (attachError) {
    redirect(
      `/dashboard/assessments/${assessmentId}/questions/new?error=${encodeURIComponent(
        attachError.message
      )}`
    );
  }

  const recalcResult = await recalculateAssessmentTotalMarks(
    supabase,
    assessmentId,
    user.id
  );

  if (recalcResult.error) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        recalcResult.error
      )}`
    );
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard/questions");

  redirect(`/dashboard/assessments/${assessmentId}`);
}

export async function updateQuestion(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const assessmentId = getString(formData, "assessmentId");
  const questionId = getString(formData, "questionId");
  const questionText = getString(formData, "questionText");
  const optionA = getString(formData, "optionA");
  const optionB = getString(formData, "optionB");
  const optionC = getString(formData, "optionC");
  const optionD = getString(formData, "optionD");
  const correctOption = getString(formData, "correctOption").toUpperCase();
  const marks = getOptionalInt(formData, "marks") ?? 1;
  const subject = getString(formData, "subject");
  const topic = getString(formData, "topic");
  const level = getString(formData, "level");

  if (!assessmentId || !questionId) {
    redirect("/dashboard/assessments?error=Missing%20assessment%20or%20question%20id");
  }

  if (!questionText || !optionA || !optionB || !optionC || !optionD) {
    redirect(
      `/dashboard/assessments/${assessmentId}/edit?questionId=${questionId}&error=${encodeURIComponent(
        "Please complete all question fields"
      )}`
    );
  }

  if (!correctOption) {
    redirect(
      `/dashboard/assessments/${assessmentId}/edit?questionId=${questionId}&error=${encodeURIComponent(
        "Please select the correct answer"
      )}`
    );
  }

  if (!["A", "B", "C", "D"].includes(correctOption)) {
    redirect(
      `/dashboard/assessments/${assessmentId}/edit?questionId=${questionId}&error=${encodeURIComponent(
        "Correct option must be A, B, C, or D"
      )}`
    );
  }

  if (marks <= 0) {
    redirect(
      `/dashboard/assessments/${assessmentId}/edit?questionId=${questionId}&error=${encodeURIComponent(
        "Marks must be greater than zero"
      )}`
    );
  }

  const { data: existingLink, error: existingLinkError } = await supabase
    .from("assessment_questions")
    .select(`
      id,
      position,
      question_id,
      assessments!inner (
        id,
        teacher_id
      )
    `)
    .eq("id", questionId)
    .eq("assessment_id", assessmentId)
    .single();

  const typedExistingLink = existingLink as AssessmentLinkRow | null;

  if (existingLinkError || !typedExistingLink) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        "Question not found"
      )}`
    );
  }

  const assessmentTeacherId = extractTeacherId(typedExistingLink.assessments);

  if (assessmentTeacherId !== user.id) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        "You do not have permission to edit this question"
      )}`
    );
  }

  const { error: updateQuestionError } = await supabase
    .from("questions")
    .update({
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      marks,
      subject: subject || null,
      topic: topic || null,
      level: level || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", typedExistingLink.question_id)
    .eq("teacher_id", user.id);

  if (updateQuestionError) {
    redirect(
      `/dashboard/assessments/${assessmentId}/edit?questionId=${questionId}&error=${encodeURIComponent(
        updateQuestionError.message
      )}`
    );
  }

  const recalcResult = await recalculateAssessmentTotalMarks(
    supabase,
    assessmentId,
    user.id
  );

  if (recalcResult.error) {
    redirect(
      `/dashboard/assessments/${assessmentId}?error=${encodeURIComponent(
        recalcResult.error
      )}`
    );
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  revalidatePath(`/dashboard/assessments/${assessmentId}/edit`);
  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard/questions");

  redirect(`/dashboard/assessments/${assessmentId}`);
}

export async function deleteQuestion(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const assessmentId = getString(formData, "assessmentId");
  const questionId = getString(formData, "questionId");

  if (!assessmentId || !questionId) {
    return { ok: false, error: "Missing assessment or question id" };
  }

  const { data: targetQuestion, error: targetQuestionError } = await supabase
    .from("assessment_questions")
    .select(`
      id,
      position,
      question_id,
      assessments!inner (
        id,
        teacher_id
      )
    `)
    .eq("id", questionId)
    .eq("assessment_id", assessmentId)
    .single();

  const typedTargetQuestion = targetQuestion as AssessmentLinkRow | null;

  if (targetQuestionError || !typedTargetQuestion) {
    return { ok: false, error: "Question not found" };
  }

  const assessmentTeacherId = extractTeacherId(typedTargetQuestion.assessments);

  if (assessmentTeacherId !== user.id) {
    return {
      ok: false,
      error: "You do not have permission to delete this question",
    };
  }

  const deletedPosition = typedTargetQuestion.position;

  const { error: deleteError } = await supabase
    .from("assessment_questions")
    .delete()
    .eq("id", questionId)
    .eq("assessment_id", assessmentId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const { data: remainingQuestions, error: remainingQuestionsError } =
    await supabase
      .from("assessment_questions")
      .select("id, position")
      .eq("assessment_id", assessmentId)
      .order("position", { ascending: true });

  if (remainingQuestionsError) {
    return { ok: false, error: remainingQuestionsError.message };
  }

  const questionsToShift =
    (remainingQuestions ?? []).filter((q) => q.position > deletedPosition) ?? [];

  for (const question of questionsToShift) {
    const { error: updatePositionError } = await supabase
      .from("assessment_questions")
      .update({ position: question.position - 1 })
      .eq("id", question.id);

    if (updatePositionError) {
      return { ok: false, error: updatePositionError.message };
    }
  }

  const recalcResult = await recalculateAssessmentTotalMarks(
    supabase,
    assessmentId,
    user.id
  );

  if (recalcResult.error) {
    return { ok: false, error: recalcResult.error };
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard/questions");

  return { ok: true };
}