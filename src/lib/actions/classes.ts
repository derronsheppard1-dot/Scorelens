"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function buildRedirectError(message: string) {
  return `/dashboard/classes/new?error=${encodeURIComponent(message)}`;
}

export async function createClassFromForm(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const gradeLevel = String(formData.get("grade_level") || "").trim();
  const schoolYear = String(formData.get("school_year") || "").trim();

  if (!name) {
    redirect(buildRedirectError("Class name is required."));
  }

  const { data, error } = await supabase.rpc("create_class", {
    p_name: name,
    p_subject: subject || null,
    p_grade_level: gradeLevel || null,
    p_school_year: schoolYear || null,
  });

  if (error || !data) {
    redirect(
      buildRedirectError(error?.message || "Failed to create class.")
    );
  }

  redirect(
    `/dashboard/classes/${data.id}?success=${encodeURIComponent(
      "Class created successfully."
    )}`
  );
}