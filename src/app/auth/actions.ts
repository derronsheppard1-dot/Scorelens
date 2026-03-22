"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!fullName || !email || !password) {
    redirect("/signup?error=Missing required fields");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account created successfully");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Email and password are required");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const fullName = getString(formData, "fullName");
  const schoolName = getString(formData, "schoolName");
  const subject = getString(formData, "subject");
  const preferredWorkflow = getString(formData, "preferredWorkflow");
  const gradeLevels = getStringArray(formData, "gradeLevels");

  if (!fullName || !schoolName || !subject || !preferredWorkflow) {
    redirect("/onboarding?error=Please complete all required fields");
  }

  if (!["manual", "ai", "both"].includes(preferredWorkflow)) {
    redirect("/onboarding?error=Invalid workflow selection");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      school_name: schoolName,
      subject,
      grade_levels: gradeLevels,
      preferred_workflow: preferredWorkflow,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}