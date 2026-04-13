"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CreateSittingInput = {
  assessmentId: string;
  classId: string;
  pin: string;
  openTime: string;
  closeTime: string;
  durationMinutes: number;
  preloadEnabled?: boolean;
  preloadAvailableFrom?: string | null;
};

function buildRedirectError(message: string) {
  return `/dashboard/sittings/new?error=${encodeURIComponent(message)}`;
}

export async function createSitting(input: CreateSittingInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const assessmentId = input.assessmentId?.trim();
  const classId = input.classId?.trim();
  const pin = input.pin?.trim();
  const openTime = input.openTime?.trim();
  const closeTime = input.closeTime?.trim();
  const durationMinutes = Number(input.durationMinutes);
  const preloadEnabled = input.preloadEnabled ?? true;
  const preloadAvailableFrom = input.preloadAvailableFrom?.trim() || null;

  if (!assessmentId) {
    redirect(buildRedirectError("Please select an assessment."));
  }

  if (!classId) {
    redirect(buildRedirectError("Please select a class."));
  }

  if (!pin || pin.length < 4) {
    redirect(buildRedirectError("PIN must be at least 4 characters."));
  }

  if (!openTime || !closeTime) {
    redirect(buildRedirectError("Open time and close time are required."));
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    redirect(buildRedirectError("Duration must be greater than 0."));
  }

  const { data, error } = await supabase.rpc("create_assessment_sitting", {
    p_assessment_id: assessmentId,
    p_class_id: classId,
    p_pin: pin,
    p_open_time: openTime,
    p_close_time: closeTime,
    p_duration_minutes: durationMinutes,
    p_preload_enabled: preloadEnabled,
    p_preload_available_from: preloadAvailableFrom,
  });

  if (error || !data) {
    redirect(
      buildRedirectError(error?.message || "Failed to create sitting.")
    );
  }

  redirect(
    `/dashboard/sittings/${data.id}?success=${encodeURIComponent(
      "Sitting created successfully."
    )}`
  );
}

export async function createSittingFromForm(formData: FormData) {
  const preloadValue = formData.get("preload_enabled");
  const preloadEnabled =
    preloadValue === "on" || preloadValue === "true" || preloadValue === "1";

  await createSitting({
    assessmentId: String(formData.get("assessment_id") || ""),
    classId: String(formData.get("class_id") || ""),
    pin: String(formData.get("pin") || ""),
    openTime: String(formData.get("open_time") || ""),
    closeTime: String(formData.get("close_time") || ""),
    durationMinutes: Number(formData.get("duration_minutes") || 0),
    preloadEnabled,
    preloadAvailableFrom: String(formData.get("preload_available_from") || ""),
  });
}