"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Create Question (Standalone)
 */
export async function createQuestion(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const question_text = (formData.get("question_text") as string)?.trim();
  const option_a = (formData.get("option_a") as string)?.trim();
  const option_b = (formData.get("option_b") as string)?.trim();
  const option_c = (formData.get("option_c") as string)?.trim();
  const option_d = (formData.get("option_d") as string)?.trim();
  const correct_option = (
    (formData.get("correct_option") as string) || ""
  ).toUpperCase();
  const topic = (formData.get("topic") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const level = (formData.get("level") as string)?.trim();
  const marks = Number(formData.get("marks"));

  if (
    !question_text ||
    !option_a ||
    !option_b ||
    !option_c ||
    !option_d ||
    !correct_option
  ) {
    redirect(
      `/dashboard/questions/new?error=${encodeURIComponent(
        "Please complete all required fields"
      )}`
    );
  }

  if (!["A", "B", "C", "D"].includes(correct_option)) {
    redirect(
      `/dashboard/questions/new?error=${encodeURIComponent(
        "Correct option must be A, B, C or D"
      )}`
    );
  }

  if (!marks || marks <= 0) {
    redirect(
      `/dashboard/questions/new?error=${encodeURIComponent(
        "Marks must be greater than zero"
      )}`
    );
  }

  const { error } = await supabase.from("questions").insert({
    teacher_id: user.id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    marks,
    topic: topic || null,
    subject: subject || null,
    level: level || null,
  });

  if (error) {
    console.error(error);
    redirect(
      `/dashboard/questions/new?error=${encodeURIComponent(
        "Failed to create question"
      )}`
    );
  }

  revalidatePath("/dashboard/questions");
  redirect("/dashboard/questions");
}

/**
 * Update Question (Standalone)
 */
export async function updateQuestion(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const id = (formData.get("id") as string)?.trim();
  const question_text = (formData.get("question_text") as string)?.trim();
  const option_a = (formData.get("option_a") as string)?.trim();
  const option_b = (formData.get("option_b") as string)?.trim();
  const option_c = (formData.get("option_c") as string)?.trim();
  const option_d = (formData.get("option_d") as string)?.trim();
  const correct_option = (
    (formData.get("correct_option") as string) || ""
  ).toUpperCase();
  const topic = (formData.get("topic") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const level = (formData.get("level") as string)?.trim();
  const marks = Number(formData.get("marks"));

  if (
    !id ||
    !question_text ||
    !option_a ||
    !option_b ||
    !option_c ||
    !option_d ||
    !correct_option
  ) {
    redirect(
      `/dashboard/questions/${id}/edit?error=${encodeURIComponent(
        "Please complete all required fields"
      )}`
    );
  }

  if (!["A", "B", "C", "D"].includes(correct_option)) {
    redirect(
      `/dashboard/questions/${id}/edit?error=${encodeURIComponent(
        "Correct option must be A, B, C or D"
      )}`
    );
  }

  if (!marks || marks <= 0) {
    redirect(
      `/dashboard/questions/${id}/edit?error=${encodeURIComponent(
        "Marks must be greater than zero"
      )}`
    );
  }

  const { error } = await supabase
    .from("questions")
    .update({
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      topic: topic || null,
      subject: subject || null,
      level: level || null,
      marks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("teacher_id", user.id);

  if (error) {
    console.error(error);
    redirect(
      `/dashboard/questions/${id}/edit?error=${encodeURIComponent(
        "Failed to update question"
      )}`
    );
  }

  revalidatePath("/dashboard/questions");
  revalidatePath(`/dashboard/questions/${id}/edit`);
  redirect("/dashboard/questions");
}

/**
 * Delete Question (Standalone)
 */
export async function deleteQuestionStandalone(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const questionId = (formData.get("questionId") as string)?.trim();

  if (!questionId) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent("Missing question ID")}`
    );
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("teacher_id", user.id);

  if (error) {
    console.error(error);
    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "Failed to delete question"
      )}`
    );
  }

  revalidatePath("/dashboard/questions");
  redirect("/dashboard/questions");
}