"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateQuestion(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const stem = formData.get("stem") as string;
  const correct_answer = formData.get("correct_answer") as string;
  const topic = formData.get("topic") as string;
  const marks = Number(formData.get("marks"));

  const { error } = await supabase
    .from("questions")
    .update({
      stem,
      correct_answer,
      topic,
      marks,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { success: false, error: "Failed to update question" };
  }

  return { success: true };
}