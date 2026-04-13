"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type JoinedMarksRow = {
  question_id: string;
  questions:
    | { marks: number | null }
    | { marks: number | null }[]
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

export async function bulkAddQuestionsToAssessment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const rawQuestionIds = formData.getAll("questionIds");

  const uniqueQuestionIds = Array.from(
    new Set(
      rawQuestionIds
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    )
  );

  if (!assessmentId) {
    redirect(
      `/dashboard/assessments?error=${encodeURIComponent(
        "Missing assessment ID"
      )}`
    );
  }

  if (uniqueQuestionIds.length === 0) {
    if (source === "assessment-page") {
      redirect(
        `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
          "Select at least one question"
        )}`
      );
    }

    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "Select at least one question"
      )}`
    );
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, title")
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

  const { data: ownedQuestions, error: questionsError } = await supabase
    .from("questions")
    .select("id")
    .eq("teacher_id", user.id)
    .in("id", uniqueQuestionIds);

  if (questionsError) {
    if (source === "assessment-page") {
      redirect(
        `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
          questionsError.message
        )}`
      );
    }

    redirect(
      `/dashboard/questions?error=${encodeURIComponent(questionsError.message)}`
    );
  }

  const ownedQuestionIds = new Set((ownedQuestions ?? []).map((q) => q.id));
  const validQuestionIds = uniqueQuestionIds.filter((id) =>
    ownedQuestionIds.has(id)
  );

  if (validQuestionIds.length === 0) {
    if (source === "assessment-page") {
      redirect(
        `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
          "No valid questions selected"
        )}`
      );
    }

    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "No valid questions selected"
      )}`
    );
  }

  const { data: existingLinks, error: existingLinksError } = await supabase
    .from("assessment_questions")
    .select("question_id")
    .eq("assessment_id", assessmentId)
    .in("question_id", validQuestionIds);

  if (existingLinksError) {
    if (source === "assessment-page") {
      redirect(
        `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
          existingLinksError.message
        )}`
      );
    }

    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        existingLinksError.message
      )}`
    );
  }

  const existingQuestionIds = new Set(
    (existingLinks ?? []).map((row) => row.question_id)
  );

  const questionIdsToInsert = validQuestionIds.filter(
    (id) => !existingQuestionIds.has(id)
  );

  const skippedCount = validQuestionIds.length - questionIdsToInsert.length;

  if (questionIdsToInsert.length > 0) {
    const { data: currentLinks, error: currentLinksError } = await supabase
      .from("assessment_questions")
      .select("position")
      .eq("assessment_id", assessmentId)
      .order("position", { ascending: true });

    if (currentLinksError) {
      if (source === "assessment-page") {
        redirect(
          `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
            currentLinksError.message
          )}`
        );
      }

      redirect(
        `/dashboard/questions?error=${encodeURIComponent(
          currentLinksError.message
        )}`
      );
    }

    const currentCount = currentLinks?.length ?? 0;

    const rowsToInsert = questionIdsToInsert.map((questionId, index) => ({
      assessment_id: assessmentId,
      question_id: questionId,
      position: currentCount + index + 1,
    }));

    const { error: insertError } = await supabase
      .from("assessment_questions")
      .insert(rowsToInsert);

    if (insertError) {
      if (source === "assessment-page") {
        redirect(
          `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
            insertError.message
          )}`
        );
      }

      redirect(
        `/dashboard/questions?error=${encodeURIComponent(insertError.message)}`
      );
    }

    const recalcResult = await recalculateAssessmentTotalMarks(
      supabase,
      assessmentId,
      user.id
    );

    if (recalcResult.error) {
      if (source === "assessment-page") {
        redirect(
          `/dashboard/assessments/${assessmentId}/add-from-bank?error=${encodeURIComponent(
            recalcResult.error
          )}`
        );
      }

      redirect(
        `/dashboard/questions?error=${encodeURIComponent(recalcResult.error)}`
      );
    }
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  revalidatePath(`/dashboard/assessments/${assessmentId}/add-from-bank`);
  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard/questions");
  revalidatePath("/dashboard/questions/add-to-assessment");

  const successParams = new URLSearchParams();
  successParams.set("success", `Added ${questionIdsToInsert.length} question${questionIdsToInsert.length === 1 ? "" : "s"}, skipped ${skippedCount} duplicate${skippedCount === 1 ? "" : "s"}.`);

  redirect(`/dashboard/assessments/${assessmentId}?${successParams.toString()}`);
}