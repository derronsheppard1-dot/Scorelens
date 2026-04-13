"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function newStudentErrorRedirect(classId: string, message: string) {
  return `/dashboard/students/new?classId=${encodeURIComponent(
    classId
  )}&error=${encodeURIComponent(message)}`;
}

function bulkImportErrorRedirect(classId: string, message: string) {
  return `/dashboard/students/import?classId=${encodeURIComponent(
    classId
  )}&error=${encodeURIComponent(message)}`;
}

export async function createStudentFromForm(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const classId = String(formData.get("class_id") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();

  if (!classId) {
    redirect("/dashboard/classes?error=Missing class.");
  }

  if (!fullName) {
    redirect(newStudentErrorRedirect(classId, "Student name is required."));
  }

  const { data, error } = await supabase.rpc("create_student", {
    p_class_id: classId,
    p_full_name: fullName,
  });

  if (error || !data) {
    redirect(
      newStudentErrorRedirect(
        classId,
        error?.message || "Failed to create student."
      )
    );
  }

  redirect(
    `/dashboard/classes/${classId}?success=${encodeURIComponent(
      `Student added successfully. Code: ${data.student_code}`
    )}`
  );
}

export async function bulkImportStudentsFromForm(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const classId = String(formData.get("class_id") || "").trim();
  const namesText = String(formData.get("names_text") || "").trim();

  if (!classId) {
    redirect("/dashboard/classes?error=Missing class.");
  }

  if (!namesText) {
    redirect(
      bulkImportErrorRedirect(classId, "Please paste at least one student name.")
    );
  }

  const { data, error } = await supabase.rpc("bulk_create_students", {
    p_class_id: classId,
    p_names_text: namesText,
  });

  if (error) {
    redirect(
      bulkImportErrorRedirect(
        classId,
        error.message || "Failed to import students."
      )
    );
  }

  const importedCount = Array.isArray(data) ? data.length : 0;

  redirect(
    `/dashboard/classes/${classId}?success=${encodeURIComponent(
      `${importedCount} student${importedCount === 1 ? "" : "s"} imported successfully.`
    )}`
  );
}